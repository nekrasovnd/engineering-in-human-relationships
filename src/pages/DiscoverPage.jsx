import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDiscoverProfiles } from '../hooks/useDiscoverProfiles';
import { useMutualMatches } from '../hooks/useMutualMatches';
import {
  saveMatchDecision,
  saveProfile,
  subscribeOwnMatchDecisions,
} from '../services/firestore';
import { calculateCompatibility } from '../utils/compatibility';
import { formatEgoStateLabel } from '../utils/egoState';
import SectionCard from '../components/SectionCard';
import SwipeDeck from '../components/SwipeDeck';

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isEnablingDiscover, setIsEnablingDiscover] = useState(false);
  const discoverEnabled = Boolean(profile.discoverVisible) && !isEnablingDiscover;
  const {
    profiles,
    loading,
    error: discoverError,
  } = useDiscoverProfiles(profile.userId, {
    excludeCurrent: true,
    enabled: discoverEnabled,
  });
  const {
    mutualMatches,
    loading: mutualMatchesLoading,
    error: mutualMatchesError,
  } = useMutualMatches(profile.userId, {
    enabled: discoverEnabled,
  });
  const [decisions, setDecisions] = useState([]);
  const [decisionError, setDecisionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchMessage, setMatchMessage] = useState('');
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  const displayError = useMemo(() => {
    const rawError = decisionError || discoverError || mutualMatchesError;

    if (!rawError) {
      return '';
    }

    if (rawError.includes('Missing or insufficient permissions')) {
      return 'Лента ещё синхронизируется после включения видимости. Подождите пару секунд и попробуйте снова.';
    }

    return rawError;
  }, [decisionError, discoverError, mutualMatchesError]);

  useEffect(() => {
    if (!discoverEnabled) {
      setDecisions([]);
      setDecisionError('');
      return undefined;
    }

    const unsubscribe = subscribeOwnMatchDecisions(
      profile.userId,
      (items) => {
        setDecisions(items);
      },
      () => {
        setDecisionError('Не удалось загрузить решения по кандидатам.');
      },
    );

    return unsubscribe;
  }, [discoverEnabled, profile.userId]);

  const undecidedProfiles = useMemo(() => {
    const decidedMap = decisions.reduce(
      (accumulator, item) => ({
        ...accumulator,
        [item.toUid]: item.decision,
      }),
      {},
    );

    return profiles.filter((candidate) => !decidedMap[candidate.userId]);
  }, [decisions, profiles]);

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

  const handleEnableDiscover = async () => {
    setDecisionError('');

    try {
      setIsEnablingDiscover(true);
      setVisibilitySaving(true);
      await saveProfile(profile.userId, {
        discoverVisible: true,
      });
    } catch {
      setDecisionError('Не удалось включить видимость профиля.');
    } finally {
      setVisibilitySaving(false);
      window.setTimeout(() => {
        setIsEnablingDiscover(false);
      }, 1200);
    }
  };

  if (!discoverEnabled) {
    return (
      <div className="space-y-6">
        <SectionCard
          title="Режим знакомств"
          subtitle="Лента работает только по взаимному согласию: сначала вы сами решаете, хотите ли быть видимым для других."
        >
          <div className="rounded-[28px] border border-slate-800 bg-slate-950/40 p-5">
            <p className="font-display text-2xl text-white">
              Профиль сейчас скрыт
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Пока вы не включите видимость, другие люди не увидят вас в знакомствах, а вы не увидите их ленту. Это сделано специально, чтобы раздел работал только по явному opt-in.
            </p>
            <button
              type="button"
              onClick={handleEnableDiscover}
              disabled={visibilitySaving}
              className="mt-5 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {visibilitySaving
                ? 'Включаем видимость...'
                : 'Показывать мой профиль'}
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Режим знакомств"
        subtitle="Здесь видны только те люди, которые тоже сами включили видимость в знакомствах."
      >
        {matchMessage ? (
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {matchMessage}
          </div>
        ) : null}

        {displayError ? (
          <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {displayError}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-400">Загружаем кандидатов...</p>
        ) : candidate && comparison ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SwipeDeck
              candidate={candidate}
              comparison={comparison}
              busy={busyId === candidate.userId}
              onLike={() => storeDecision('like')}
              onPass={() => storeDecision('pass')}
            />

            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-800 bg-slate-950/40 p-5">
                <p className="font-display text-xl text-white">
                  Что может сработать между вами
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {comparison.explanation}
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-800 bg-slate-950/40 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Очередь кандидатов
                </p>
                <p className="mt-2 text-3xl font-display text-white">
                  {undecidedProfiles.length}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Столько людей вы ещё не посмотрели.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-slate-800 bg-slate-950/40 p-5">
            <p className="font-display text-2xl text-white">
              Новых карточек пока нет
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Сейчас нет новых людей, которые одновременно включили видимость и ещё не получили от вас решение.
            </p>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Взаимные совпадения"
        subtitle="Когда интерес совпадает с обеих сторон, вы можете перейти к сравнению или сразу собрать команду."
      >
        {mutualMatchesLoading ? (
          <p className="text-sm text-slate-400">Сверяем взаимные совпадения...</p>
        ) : mutualMatches.length === 0 ? (
          <p className="text-sm leading-7 text-slate-400">
            Пока тут пусто. Как только выбор совпадёт с обеих сторон, здесь появится карточка.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mutualMatches.map((match) => (
              <div
                key={match.userId}
                className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5"
              >
                <p className="font-medium text-white">{match.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {formatEgoStateLabel(match.egoState)}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  С этим человеком можно перейти в формат команды или сравнить ваши профили без общего каталога всех пользователей.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/teams', {
                        state: { suggestedMemberIds: [match.userId] },
                      })
                    }
                    className="rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-100 transition hover:bg-blue-500/20"
                  >
                    Пригласить в команду
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/compare', {
                        state: { selectedUserId: match.userId },
                      })
                    }
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-blue-400 hover:text-white"
                  >
                    Сравнить профили
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
