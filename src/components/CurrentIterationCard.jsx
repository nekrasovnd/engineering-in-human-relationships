import IterationProgress from './IterationProgress';

/** Блок «Текущая итерация» на обзоре команды. */
export default function CurrentIterationCard({ planning, onOpenTasks, onOpenIterations }) {
  const { loading, currentIteration, tasks, myOpenTasksCount, can } = planning;

  if (loading) {
    return null;
  }

  return (
    <div className="rounded-[28px] border border-blue-500/20 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-300">
            Текущая итерация
          </p>
          {currentIteration ? (
            <>
              <p className="mt-2 font-display text-xl text-white">{currentIteration.title}</p>
              {currentIteration.goal ? (
                <p className="mt-1 text-sm leading-6 text-slate-300">{currentIteration.goal}</p>
              ) : null}
              <div className="mt-3 max-w-xl">
                <IterationProgress iteration={currentIteration} tasks={tasks} />
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {can.setDeadlines
                ? 'Активной итерации нет. Задайте команде цель и дедлайн.'
                : 'Активной итерации пока нет.'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenTasks}
            className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400"
          >
            Мои задачи · {myOpenTasksCount}
          </button>
          {!currentIteration && can.setDeadlines ? (
            <button
              type="button"
              onClick={onOpenIterations}
              className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-blue-400 hover:text-white"
            >
              Создать итерацию
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
