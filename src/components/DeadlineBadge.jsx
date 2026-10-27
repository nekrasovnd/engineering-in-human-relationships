import { CalendarClock } from 'lucide-react';
import { getDeadlineState } from '../utils/teamPlanning';

const TONE_STYLES = {
  none: 'border-slate-800 text-slate-500',
  done: 'border-emerald-500/30 text-emerald-200',
  ok: 'border-slate-700 text-slate-300',
  soon: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  overdue: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
};

export default function DeadlineBadge({ deadline, done = false, inherited = false }) {
  const state = getDeadlineState(deadline, { done });

  return (
    <span
      title={inherited ? 'Дедлайн итерации' : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
        TONE_STYLES[state.tone]
      }`}
    >
      <CalendarClock className="h-3.5 w-3.5" />
      {state.label}
    </span>
  );
}
