import { getTeamRoleLabel } from '../utils/teamRoles';

const ROLE_STYLES = {
  owner: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  admin: 'border-violet-400/40 bg-violet-500/10 text-violet-200',
  lead: 'border-sky-400/40 bg-sky-500/10 text-sky-200',
  member: 'border-slate-700 bg-slate-900/70 text-slate-300',
};

export default function TeamRoleBadge({ role }) {
  if (!role) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
        ROLE_STYLES[role] || ROLE_STYLES.member
      }`}
    >
      {getTeamRoleLabel(role)}
    </span>
  );
}
