import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutualMatches } from '../hooks/useMutualMatches';
import { useTeams } from '../hooks/useTeams';
import { calculateCompatibility } from '../utils/compatibility';
import { formatEgoStateLabel } from '../utils/egoState';
import ComparisonResultCard from '../components/ComparisonResultCard';
import SectionCard from '../components/SectionCard';

function mergeCandidates(mutualMatches, teams, currentUserId) {
  const map = new Map();

  mutualMatches.forEach((item) => {
    map.set(item.userId, item);
  });

  teams.forEach((team) => {
    (team.memberSnapshots || []).forEach((member) => {
      if (!member?.userId || member.userId === currentUserId) {
        return;
      }

      if (!map.has(member.userId)) {
        map.set(member.userId, member);
      }
    });
  });

  return Array.from(map.values()).sort((left, right) =>
    (left.name || '').localeCompare(right.name || '', 'ru'),
  );
}

export default function ComparePage() {
  const location = useLocation();
  const { profile } = useAuth();
  const { mutualMatches, loading: matchesLoading } = useMutualMatches(
    profile.userId,
    {
      enabled: profile.discoverVisible,
    },
  );
  const { teams, loading: teamsLoading } = useTeams(profile.userId);
  const [selectedId, setSelectedId] = useState('');
  const candidates = useMemo(
    () => mergeCandidates(mutualMatches, teams, profile.userId),
    [mutualMatches, profile.userId, teams],
  );

  useEffect(() => {
    const preferredId = location.state?.selectedUserId || '';
    if (!preferredId) {
      return;
    }

    setSelectedId(preferredId);
  }, [location.state]);

  useEffect(() => {
    if (!selectedId && candidates.length > 0) {
      setSelectedId(candidates[0].userId);
    }
  }, [candidates, selectedId]);

  const selectedProfile = useMemo(
    () => candidates.find((item) => item.userId === selectedId) || null,
    [candidates, selectedId],
  );
  const comparison = selectedProfile
    ? calculateCompatibility(profile, selectedProfile)
    : null;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Сравнение"
        subtitle="Здесь можно спокойно посмотреть, как вы стыкуетесь по ритму связи, давлению и способу держать общий курс."
      >
        <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Кого можно сравнить
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Здесь доступны только взаимные совпадения и люди из ваших команд. Сравнение остаётся внутри уже подтверждённого контакта.
          </p>

          {matchesLoading || teamsLoading ? (
            <p className="mt-4 text-sm text-slate-400">
              Собираем доступные профили...
            </p>
          ) : candidates.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
              Сравнение откроется, когда у вас появятся взаимные совпадения в знакомствах или команды с другими участниками.
            </div>
          ) : (
            <>
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400"
              >
                {candidates.map((item) => (
                  <option key={item.userId} value={item.userId}>
                    {item.name} · {formatEgoStateLabel(item.egoState)}
                  </option>
                ))}
              </select>

              <div className="mt-5 space-y-3">
                {candidates.slice(0, 6).map((item) => {
                  const quick = calculateCompatibility(profile, item);

                  return (
                    <button
                      key={item.userId}
                      type="button"
                      onClick={() => setSelectedId(item.userId)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedId === item.userId
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {formatEgoStateLabel(item.egoState)} ·{' '}
                            {quick.teamFitLabel}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {quick.supportPoint}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs text-blue-200">
                          {quick.compatibility}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SectionCard>

      {selectedProfile && comparison ? (
        <>
          <ComparisonResultCard
            firstProfile={profile}
            secondProfile={selectedProfile}
            comparison={comparison}
          />

          <SectionCard
            title="Как читать результат"
            subtitle="Без формул: вот на что полезно смотреть в первую очередь."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
                Процент показывает общую стыковку, но не заменяет смысл. Его лучше читать вместе с пояснениями про связь, давление и роли.
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
                Контур связи отвечает за то, насколько вам легко держать один ритм общения и не путать молчание, резкость или задержку ответа с личным отношением.
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
                Резерв пары показывает, сколько у связки запаса на стресс. Чем он выше, тем меньше шанс, что обычная нагрузка быстро сорвёт вас в трение.
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
