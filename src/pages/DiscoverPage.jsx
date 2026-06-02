import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfiles } from '../hooks/useProfiles';
import {
  getMatchDecision,
  saveMatchDecision,
  subscribeOwnMatchDecisions,
} from '../services/firestore';
import { calculateCompatibility } from '../utils/compatibility';
import SectionCard from '../components/SectionCard';
import SwipeDeck from '../components/SwipeDeck';

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { profiles, loading } = useProfiles(profile.userId, { excludeCurrent: true });
  const [decisions, setDecisions] = useState([]);
  const [decisionError, setDecisionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchMessage, setMatchMessage] = useState('');
  const [mutualMatches, setMutualMatches] = useState([]);

  useEffect(() => {
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
  }, [profile.userId]);

  useEffect(() => {
    const likedDecisions = decisions.filter((item) => item.decision === 'like');

    Promise.all(
      likedDecisions.map(async (item) => {
        const reciprocal = await getMatchDecision(item.toUid, profile.userId);
        if (reciprocal?.decision === 'like') {
          return profiles.find((candidate) => candidate.userId === item.toUid) || null;
        }
        return null;
      }),
    ).then((items) => {
      setMutualMatches(items.filter(Boolean));
    });
  }, [decisions, profile.userId, profiles]);

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

      if (decision === 'like') {
        const reciprocal = await getMatchDecision(candidate.userId, profile.userId);
        if (reciprocal?.decision === 'like') {
          setMatchMessage(
            `Взаимный выбор! Вы и ${candidate.name} отметили друг друга как подходящих. Можно сразу собрать команду.`,
          );
        }
      }

      setCurrentIndex((index) => index + 1);
    } catch (requestError) {
      setDecisionError('Не удалось сохранить решение. Проверьте Firestore rules.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Режим знакомств"
        subtitle="Здесь можно подбирать рабочих или личных партнёров по совместимости. На телефоне поддерживается свайп карточек."
      >
        {matchMessage ? (
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {matchMessage}
          </div>
        ) : null}

        {decisionError ? (
          <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {decisionError}
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
                <p className="font-display text-xl text-white">Почему система так считает</p>
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
                  Столько профилей ещё не получили от вас решение.
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
              Вы уже просмотрели всех доступных пользователей. Когда в системе появятся новые профили, они попадут сюда автоматически.
            </p>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Взаимные совпадения"
        subtitle="Если оба пользователя нажали «Подходит», совпадение появляется здесь и можно сразу собрать совместную команду."
      >
        {mutualMatches.length === 0 ? (
          <p className="text-sm leading-7 text-slate-400">
            Пока нет взаимных совпадений. Но логика уже работает: как только симпатия станет обоюдной, вы увидите уведомление и карточку ниже.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mutualMatches.map((match) => (
              <div
                key={match.userId}
                className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5"
              >
                <p className="font-medium text-white">{match.name}</p>
                <p className="mt-1 text-sm text-slate-400">{match.egoState}</p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  С этим человеком можно перейти в формат команды и уже там посмотреть роли и конфликтную пару.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    navigate('/teams', {
                      state: { suggestedMemberIds: [match.userId] },
                    })
                  }
                  className="mt-4 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-100 transition hover:bg-blue-500/20"
                >
                  Создать команду с этим человеком
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
