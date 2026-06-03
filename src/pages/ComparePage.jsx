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
        title="Сравнение пользователей"
        subtitle="Здесь доступны только взаимные совпадения и участники ваших команд. Общего каталога всех профилей больше нет."
      >
        <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Кандидат для сравнения
          </p>

          {matchesLoading || teamsLoading ? (
            <p className="mt-4 text-sm text-slate-400">Собираем доступные профили...</p>
          ) : candidates.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-400">
              Сравнение станет доступно, когда у вас появятся взаимные совпадения в знакомствах или команды с другими участниками.
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
                            {formatEgoStateLabel(item.egoState)}
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
            title="Если интересно, как читать результат"
            subtitle="Без формул: вот на что стоит смотреть в первую очередь."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
                Высокая совместимость обычно означает, что вам будет легче держать общий темп и договариваться без лишнего трения.
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
                Риск конфликта показывает не “плохую пару”, а места, где лучше заранее договориться о границах и формате общения.
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
                Итоговый прогноз полезно читать вместе с объяснением и подсказками, а не только по одному проценту.
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
