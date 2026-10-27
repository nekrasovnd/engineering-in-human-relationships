import { formatDateLabel, getIterationProgress } from '../utils/teamPlanning';
import DeadlineBadge from './DeadlineBadge';

/** Шапка итерации: даты, дедлайн и полоса выполнения задач. */
export default function IterationProgress({ iteration, tasks }) {
  const progress = getIterationProgress(iteration, tasks);
  const closed = iteration.status === 'closed';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <span>
          {formatDateLabel(iteration.startDate)} — {formatDateLabel(iteration.deadline)}
        </span>
        <DeadlineBadge deadline={iteration.deadline} done={closed} />
        {closed ? (
          <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
            Закрыта
          </span>
        ) : null}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Готово {progress.done} из {progress.total} задач · {progress.percent}%
      </p>
    </div>
  );
}
