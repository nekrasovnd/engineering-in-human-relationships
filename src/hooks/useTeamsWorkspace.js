import { useEffect, useMemo, useState } from 'react';
import { useMutualMatches } from './useMutualMatches';
import { useTeamInvites } from './useTeamInvites';
import { useTeams } from './useTeams';
import {
  acceptTeamInvite,
  createTeamWithInvites,
  declineTeamInvite,
  requestTeamInviteByCode,
} from '../services/firestore';
import { canUseDiscover } from '../utils/profileState';

export const GOAL_OPTIONS = ['Работа', 'Семья', 'Личные отношения'];

function buildInitialTeamForm() {
  return {
    name: '',
    description: '',
    goal: GOAL_OPTIONS[0],
    inviteeIds: [],
  };
}

function getCodeInviteErrorMessage(requestError) {
  if (requestError.message === 'code-not-found') {
    return 'Такой код не найден или уже выключен.';
  }

  if (requestError.message === 'invalid-code') {
    return 'Код выглядит слишком коротким или неполным.';
  }

  if (requestError.message === 'invite-already-pending') {
    return 'По этому коду у вас уже есть ожидающее приглашение.';
  }

  if (requestError.message === 'already-joined') {
    return 'Вы уже состоите в этой команде.';
  }

  if (requestError.message === 'own-team') {
    return 'Это код вашей собственной команды.';
  }

  return 'Не удалось использовать код приглашения.';
}

export function useTeamsWorkspace(profile, locationState) {
  const { mutualMatches, loading: matchesLoading } = useMutualMatches(
    profile.userId,
    {
      enabled: canUseDiscover(profile),
    },
  );
  const { invites, loading: invitesLoading } = useTeamInvites(profile.userId);
  const { teams, loading: teamsLoading } = useTeams(profile.userId);
  const [form, setForm] = useState(buildInitialTeamForm);
  const [saving, setSaving] = useState(false);
  const [respondingInviteId, setRespondingInviteId] = useState('');
  const [codeInviteValue, setCodeInviteValue] = useState('');
  const [codeInviteLoading, setCodeInviteLoading] = useState(false);
  const [codeInviteError, setCodeInviteError] = useState('');
  const [codeInviteSuccess, setCodeInviteSuccess] = useState('');
  const [inviteActionError, setInviteActionError] = useState({
    inviteId: '',
    message: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const suggestedMemberIds = locationState?.suggestedMemberIds || [];
    if (suggestedMemberIds.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      inviteeIds: Array.from(
        new Set([...current.inviteeIds, ...suggestedMemberIds]),
      ),
    }));
  }, [locationState]);

  const pendingInvites = useMemo(
    () => invites.filter((item) => item.status === 'pending'),
    [invites],
  );

  const resetFeedback = () => {
    setError('');
    setCodeInviteError('');
    setCodeInviteSuccess('');
    setInviteActionError({ inviteId: '', message: '' });
  };

  const updateFormField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleInvitee = (userId) => {
    setForm((current) => {
      const exists = current.inviteeIds.includes(userId);
      return {
        ...current,
        inviteeIds: exists
          ? current.inviteeIds.filter((item) => item !== userId)
          : [...current.inviteeIds, userId],
      };
    });
  };

  const updateCodeInviteValue = (value) => {
    setCodeInviteValue(value.toUpperCase());

    if (codeInviteError) {
      setCodeInviteError('');
    }

    if (codeInviteSuccess) {
      setCodeInviteSuccess('');
    }
  };

  const createTeam = async () => {
    resetFeedback();

    if (!form.name.trim() || !form.description.trim()) {
      setError('Укажите название и описание команды.');
      return null;
    }

    try {
      setSaving(true);
      const invitedProfiles = mutualMatches.filter((item) =>
        form.inviteeIds.includes(item.userId),
      );

      return await createTeamWithInvites({
        name: form.name.trim(),
        description: form.description.trim(),
        goal: form.goal,
        creatorProfile: profile,
        invitedProfiles,
      }).then((teamId) => {
        setForm(buildInitialTeamForm());
        return teamId;
      });
    } catch {
      setError('Не удалось создать команду или отправить приглашения.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const acceptInvite = async (inviteId) => {
    resetFeedback();

    try {
      setRespondingInviteId(inviteId);
      await acceptTeamInvite(inviteId, profile);
    } catch {
      setInviteActionError({
        inviteId,
        message: 'Не удалось принять приглашение.',
      });
    } finally {
      setRespondingInviteId('');
    }
  };

  const declineInvite = async (inviteId) => {
    resetFeedback();

    try {
      setRespondingInviteId(inviteId);
      await declineTeamInvite(inviteId);
    } catch {
      setInviteActionError({
        inviteId,
        message: 'Не удалось отклонить приглашение.',
      });
    } finally {
      setRespondingInviteId('');
    }
  };

  const requestInviteByCode = async () => {
    resetFeedback();

    if (!codeInviteValue.trim()) {
      setCodeInviteError('Введите код приглашения.');
      return;
    }

    try {
      setCodeInviteLoading(true);
      const result = await requestTeamInviteByCode(codeInviteValue, profile);
      setCodeInviteValue('');
      setCodeInviteSuccess(
        `Приглашение в команду «${result.teamName}» появилось ниже в разделе «Приглашения».`,
      );
    } catch (requestError) {
      setCodeInviteError(getCodeInviteErrorMessage(requestError));
    } finally {
      setCodeInviteLoading(false);
    }
  };

  return {
    mutualMatches,
    matchesLoading,
    invitesLoading,
    teamsLoading,
    form,
    saving,
    respondingInviteId,
    codeInviteValue,
    codeInviteLoading,
    codeInviteError,
    codeInviteSuccess,
    inviteActionError,
    error,
    pendingInvites,
    teams,
    updateFormField,
    toggleInvitee,
    updateCodeInviteValue,
    createTeam,
    acceptInvite,
    declineInvite,
    requestInviteByCode,
  };
}
