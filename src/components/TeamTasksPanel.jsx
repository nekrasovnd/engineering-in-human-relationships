import { Plus } from 'lucide-react';
import {
  TASK_FILTER_ALL,
  TASK_FILTER_NO_ITERATION,
} from '../hooks/useTeamPlanning';
import { TASK_STATUSES } from '../utils/teamPlanning';
import SectionCard from './SectionCard';
import TaskCard from './TaskCard';

export default function TeamTasksPanel({ planning, currentUserId }) {
  const {
    loading,
    can,
    iterations,
    tasks,
    visibleTasks,
    myOpenTasksCount,
    iterationFilter,
    setIterationFilter,
    onlyMine,
    setOnlyMine,
    openNewTask,
  } = planning;

  return (
    <SectionCard
      title="Задачи"
      subtitle={
        can.manageTasks
          ? 'Создавайте задачи, назначайте исполнителей и сроки. Исполнители сами двигают свои задачи по статусам.'
          : `Двигайте свои задачи по статусам. Открытых задач на вас: ${myOpenTasksCount}.`
      }
      action={
        can.manageTasks ? (
          <button
            type="button"
            onClick={openNewTask}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400"
          >
            <Plus className="h-4 w-4" />
            Новая задача
          </button>
        ) : null
      }
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={iterationFilter}
          onChange={(event) => setIterationFilter(event.target.value)}
          aria-label="Фильтр по итерации"
          className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
        >
          <option value={TASK_FILTER_ALL}>Все итерации</option>
          {iterations.map((iteration) => (
            <option key={iteration.id} value={iteration.id}>
              {iteration.title}
              {iteration.status === 'closed' ? ' (закрыта)' : ''}
            </option>
          ))}
          <option value={TASK_FILTER_NO_ITERATION}>Без итерации</option>
        </select>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(event) => setOnlyMine(event.target.checked)}
            className="h-4 w-4 accent-blue-500"
          />
          Только мои задачи
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Загружаем задачи...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm leading-7 text-slate-400">
          {can.manageTasks
            ? 'Задач пока нет. Начните с итерации и разбейте её цель на задачи.'
            : 'Задач пока нет — их добавят владелец, админы или тимлид.'}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((status) => {
            const columnTasks = visibleTasks.filter((task) => task.status === status.key);
            return (
              <div
                key={status.key}
                className="rounded-3xl border border-slate-800 bg-slate-950/20 p-3"
              >
                <p className="mb-3 flex items-center justify-between px-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {status.label}
                  <span className="rounded-full bg-slate-900/70 px-2 py-0.5 text-slate-300">
                    {columnTasks.length}
                  </span>
                </p>
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      planning={planning}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
