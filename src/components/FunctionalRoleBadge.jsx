import { BarChart3, Code2, Compass, Users } from 'lucide-react';
import { FUNCTIONAL_ROLES, getQualificationLabel } from '../utils/teamFunctions';

const ROLE_STYLES = {
  hr: { icon: Users, className: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' },
  researcher: { icon: Compass, className: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200' },
  analyst: { icon: BarChart3, className: 'border-violet-400/40 bg-violet-500/10 text-violet-200' },
  developer: { icon: Code2, className: 'border-amber-400/40 bg-amber-500/10 text-amber-200' },
};

/** Роль в работе и уровень: «Аналитик · Middle». */
export default function FunctionalRoleBadge({ role, qualification = '' }) {
  if (!FUNCTIONAL_ROLES[role]) {
    return null;
  }

  const { icon: Icon, className } = ROLE_STYLES[role];
  const level = getQualificationLabel(qualification);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {FUNCTIONAL_ROLES[role].shortLabel}
      {level ? ` · ${level}` : ''}
    </span>
  );
}
