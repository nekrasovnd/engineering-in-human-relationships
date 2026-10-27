import { ChevronRight, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import TeamRoleBadge from './TeamRoleBadge';

export default function TeamListItem({ team, role }) {
  return (
    <Link
      to={`/teams/${team.id}`}
      className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/40 p-5 transition hover:border-blue-400/60"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-xl text-white">{team.name}</p>
          <TeamRoleBadge role={role} />
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
          {team.description}
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
          <UsersRound className="h-3.5 w-3.5" />
          {team.memberIds.length} · {team.goal}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:text-blue-300" />
    </Link>
  );
}
