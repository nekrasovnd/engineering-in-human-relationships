import { buildTeamSummary, findMostConflictPair, getRecommendedRoles } from '../utils/teamAnalysis';
import { formatEgoStateLabel } from '../utils/egoState';
import AvatarBadge from './AvatarBadge';
import RadarProfileChart from './RadarProfileChart';
import SectionCard from './SectionCard';

export default function TeamCard({ team, memberProfiles }) {
  const conflictPair = findMostConflictPair(memberProfiles);
  const roles = getRecommendedRoles(memberProfiles);
  const summary = buildTeamSummary(memberProfiles);

  return (
    <SectionCard
      title={team.name}
      subtitle={`${team.goal} · ${team.description}`}
      className="bg-slate-900/80"
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm leading-7 text-slate-300">{summary}</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {memberProfiles.map((member) => (
              <div
                key={member.userId}
                className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="mb-4 flex items-center gap-3">
                  <AvatarBadge initials={member.avatarInitials} size="sm" />
                  <div>
                    <p className="font-medium text-white">{member.name}</p>
                    <p className="text-sm text-slate-400">
                      {formatEgoStateLabel(member.egoState)}
                    </p>
                  </div>
                </div>
                <RadarProfileChart scores={member.factorScores} compact />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-rose-300">
              Самая конфликтная пара
            </p>
            {conflictPair ? (
              <>
                <p className="mt-3 text-lg font-semibold text-white">
                  {conflictPair.left.name} × {conflictPair.right.name}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Совместимость: {conflictPair.compatibility}% · риск:{' '}
                  {conflictPair.conflictRisk}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {conflictPair.explanation}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                Добавьте минимум двух участников.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-blue-300">
              Рекомендуемые роли
            </p>
            <div className="mt-3 space-y-3">
              {roles.map((role) => (
                <div
                  key={`${role.userId}-${role.role}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{role.name}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {role.role}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                    fit {role.fitScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
