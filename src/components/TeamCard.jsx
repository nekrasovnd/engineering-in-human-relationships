import {
  buildTeamSummary,
  findMostConflictPair,
  getRecommendedRoles,
} from '../utils/teamAnalysis';
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
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Общий режим
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                {summary.summary}
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">
                Что уже помогает
              </p>
              <p className="mt-3 text-sm leading-7 text-emerald-50">
                {summary.strength}
              </p>
            </div>

            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-200">
                Что держать под контролем
              </p>
              <p className="mt-3 text-sm leading-7 text-amber-50">
                {summary.caution}
              </p>
            </div>
          </div>

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
              Где раньше всего начнёт тереть
            </p>
            {conflictPair ? (
              <>
                <p className="mt-3 text-lg font-semibold text-white">
                  {conflictPair.left.name} × {conflictPair.right.name}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {conflictPair.teamFitLabel} · риск {conflictPair.conflictRisk.toLowerCase()}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {conflictPair.frictionPoint}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {conflictPair.supportPoint}
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
              Кому что естественнее даётся
            </p>
            <div className="mt-3 space-y-3">
              {roles.map((role) => (
                <div
                  key={`${role.userId}-${role.role}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{role.name}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {role.role}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {role.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
