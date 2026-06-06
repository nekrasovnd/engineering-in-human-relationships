import { useEffect, useMemo, useState } from 'react';
import { useDiscoverProfiles } from './useDiscoverProfiles';
import { useMutualMatches } from './useMutualMatches';
import {
  saveMatchDecision,
  saveProfile,
  subscribeOwnMatchDecisions,
} from '../services/firestore';
import { calculateCompatibility } from '../utils/compatibility';
import { buildUndecidedProfiles } from '../utils/comparisonCandidates';
import { canUseDiscover, isDiscoverVisible } from '../utils/profileState';
import { sanitizeMatchAction } from '../utils/firestoreDocuments';

function formatDiscoverError(rawError) {
  if (!rawError) {
    return '';
  }

  if (rawError.includes('Missing or insufficient permissions')) {
    return 'Не удалось загрузить ленту знакомств. Обновите страницу и попробуйте ещё раз.';
  }

  return rawError;
}

export function useDiscoverWorkspace(profile) {
  const [visibilityOverride, setVisibilityOverride] = useState(null);
  const [visibilityError, setVisibilityError] = useState('');
  const [visibilityCommitPending, setVisibilityCommitPending] = useState(false);
  const [decisions, setDecisions] = useState([]);
  const [decisionError, setDecisionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchMessage, setMatchMessage] = useState('');

  const profileDiscoverVisible = isDiscoverVisible(profile);
  const discoverVisible = visibilityOverride ?? profileDiscoverVisible;
  const isVisibilitySyncingToProfile =
    visibilityOverride !== null &&
    visibilityOverride !== profileDiscoverVisible;
  const isVisibilityPending =
    visibilityCommitPending || isVisibilitySyncingToProfile;
  const discoverEnabled = discoverVisible && !isVisibilityPending;
  const discoverAccessEnabled = canUseDiscover({
    ...profile,
    discoverVisible,
  });

  const {
    profiles,
    loading,
    error: discoverError,
  } = useDiscoverProfiles(profile.userId, {
    excludeCurrent: true,
    enabled: discoverAccessEnabled && discoverEnabled,
  });
  const {
    mutualMatches,
    loading: mutualMatchesLoading,
    error: mutualMatchesError,
  } = useMutualMatches(profile.userId, {
    enabled: discoverAccessEnabled && discoverEnabled,
  });

  const displayError = useMemo(
    () =>
      formatDiscoverError(
        visibilityError || decisionError || discoverError || mutualMatchesError,
      ),
    [decisionError, discoverError, mutualMatchesError, visibilityError],
  );

  useEffect(() => {
    if (
      !visibilityCommitPending &&
      visibilityOverride !== null &&
      visibilityOverride === profileDiscoverVisible
    ) {
      setVisibilityOverride(null);
      setVisibilityError('');
    }
  }, [profileDiscoverVisible, visibilityCommitPending, visibilityOverride]);

  useEffect(() => {
    if (!discoverAccessEnabled || !discoverEnabled) {
      setDecisions([]);
      setDecisionError('');
      return undefined;
    }

    const unsubscribe = subscribeOwnMatchDecisions(
      profile.userId,
      (items) => {
        setDecisions(items.map(sanitizeMatchAction).filter(Boolean));
      },
      () => {
        setDecisionError('Не удалось загрузить решения по кандидатам.');
      },
    );

    return unsubscribe;
  }, [discoverAccessEnabled, discoverEnabled, profile.userId]);

  const undecidedProfiles = useMemo(
    () => buildUndecidedProfiles(profiles, decisions),
    [decisions, profiles],
  );

  useEffect(() => {
    if (currentIndex > Math.max(undecidedProfiles.length - 1, 0)) {
      setCurrentIndex(0);
    }
  }, [currentIndex, undecidedProfiles.length]);

  const candidate = undecidedProfiles[currentIndex] || null;
  const comparison = candidate ? calculateCompatibility(profile, candidate) : null;

  const storeDecision = async (decision) => {
    if (!candidate || !comparison) {
      return;
    }

    try {
      setBusyId(candidate.userId);
      setDecisionError('');
      setMatchMessage('');

      await saveMatchDecision({
        fromUid: profile.userId,
        toUid: candidate.userId,
        decision,
        compatibility: comparison.compatibility,
        conflictRisk: comparison.conflictRisk,
      });

      if (
        decision === 'like' &&
        mutualMatches.some((item) => item.userId === candidate.userId)
      ) {
        setMatchMessage(
          `Взаимный выбор! Вы и ${candidate.name} уже отметили друг друга. Можно сразу перейти к команде.`,
        );
      }

      setCurrentIndex((index) => index + 1);
    } catch {
      setDecisionError('Не удалось сохранить решение. Попробуйте ещё раз.');
    } finally {
      setBusyId('');
    }
  };

  const setDiscoverVisibility = async (nextValue) => {
    setDecisionError('');
    setVisibilityError('');
    setVisibilityOverride(nextValue);
    setVisibilityCommitPending(true);

    try {
      await saveProfile(profile.userId, {
        discoverVisible: nextValue,
      });
    } catch {
      setVisibilityOverride(null);
      setVisibilityError(
        nextValue
          ? 'Не удалось включить видимость профиля.'
          : 'Не удалось скрыть профиль из знакомств.',
      );
    } finally {
      setVisibilityCommitPending(false);
    }
  };

  return {
    discoverVisible,
    isVisibilityPending,
    displayError,
    loading,
    mutualMatches,
    mutualMatchesLoading,
    busyId,
    matchMessage,
    undecidedProfiles,
    candidate,
    comparison,
    storeDecision,
    setDiscoverVisibility,
  };
}
