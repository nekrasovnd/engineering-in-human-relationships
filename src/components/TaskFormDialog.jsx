import { X } from 'lucide-react';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  formatDateLabel,
} from '../utils/teamPlanning';
import { compareMembersByRole } from '../utils/teamRoles';

const INPUT_CLASS =
  'w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-blue-400 disabled:opacity-70';

/**
 * Модальное окно задачи: создание/редактирование для планирующих ролей,
 * просмотр для остальных.
 */
export default function TaskFormDialog({ team, planning }) {
  const {
    can,
    editingTaskId,
    taskForm,
    iterations,
    iterationsById,
    membersById,
    tasks,
    busyAction,
    closeTaskForm,
    updateTaskField,
    toggleTaskAssignee,
    saveTask,
    removeTask,
  } = planning;

  if (!editingTaskId) {
    return null;
  }

  const isNew = editingTaskId === 'new';
  const editingTask = tasks.find((item) => item.id === editingTaskId);
  const readOnly = !can.manageTasks;
  const members = [...team.memberSnapshots].sort(compareMembersByRole(team));
  // Исполнители, которые уже вышли из команды, всё равно видны в форме.
  const formerAssignees = taskForm.assigneeIds.filter((userId) => !membersById[userId]);
  const selectedIteration = iterationsById[taskForm.iterationId];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur-sm"
      onClick={closeTaskForm}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'Новая задача' : 'Задача'}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          saveTask();
        }}
        className="w-full max-w-2xl space-y-4 rounded-[28px] border border-slate-800 bg-slate-900 p-5 shadow-glow sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl text-white">
            {isNew ? 'Новая задача' : readOnly ? 'Задача' : 'Редактирование задачи'}
          </h2>
          <button
            type="button"
            onClick={closeTaskForm}
            aria-label="Закрыть"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <fieldset disabled={readOnly} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Название</span>
            <input
              type="text"
              value={taskForm.title}
              onChange={(event) => updateTaskField('title', event.target.value)}
              maxLength={200}
              autoFocus={!readOnly}
              className={INPUT_CLASS}
              placeholder="Например, собрать прототип экрана команды"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Описание</span>
            <textarea
              value={taskForm.description}
              onChange={(event) => updateTaskField('description', event.target.value)}
              rows="3"
              maxLength={2000}
              className={INPUT_CLASS}
              placeholder="Что именно нужно сделать и как понять, что готово."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Статус</span>
              <select
                value={taskForm.status}
                onChange={(event) => updateTaskField('status', event.target.value)}
                className={INPUT_CLASS}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Приоритет</span>
              <select
                value={taskForm.priority}
                onChange={(event) => updateTaskField('priority', event.target.value)}
                className={INPUT_CLASS}
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority.key} value={priority.key}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Итерация</span>
              <select
                value={taskForm.iterationId}
                onChange={(event) => updateTaskField('iterationId', event.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">Без итерации</option>
                {iterations.map((iteration) => (
                  <option key={iteration.id} value={iteration.id}>
                    {iteration.title}
                    {iteration.status === 'closed' ? ' (закрыта)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Свой дедлайн</span>
              <input
                type="date"
                value={taskForm.deadline}
                onChange={(event) => updateTaskField('deadline', event.target.value)}
                className={INPUT_CLASS}
              />
              <span className="mt-1 block text-xs text-slate-500">
                {selectedIteration?.deadline
                  ? `Если не задан — дедлайн итерации (${formatDateLabel(selectedIteration.deadline)})`
                  : 'Можно оставить пустым.'}
              </span>
            </label>
          </div>

          <div>
            <span className="mb-2 block text-sm text-slate-300">Исполнители</span>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const selected = taskForm.assigneeIds.includes(member.userId);
                return (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => toggleTaskAssignee(member.userId)}
                    aria-pressed={selected}
                    className={`rounded-full border px-3 py-1.5 text-sm transition disabled:cursor-default ${
                      selected
                        ? 'border-blue-400 bg-blue-500/15 text-blue-200'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {member.name}
                  </button>
                );
              })}
              {formerAssignees.map((userId) => (
                <button
                  key={userId}
                  type="button"
                  onClick={() => toggleTaskAssignee(userId)}
                  title="Больше не в команде — нажмите, чтобы снять"
                  className="rounded-full border border-dashed border-slate-600 px-3 py-1.5 text-sm text-slate-400 line-through"
                >
                  Бывший участник
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        {!readOnly ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              disabled={busyAction === 'task-save'}
              className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === 'task-save'
                ? 'Сохраняем...'
                : isNew
                  ? 'Создать задачу'
                  : 'Сохранить'}
            </button>
            {editingTask ? (
              <button
                type="button"
                onClick={() => removeTask(editingTask)}
                disabled={busyAction === `task-delete:${editingTask.id}`}
                className="rounded-2xl border border-rose-500/40 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-60"
              >
                Удалить задачу
              </button>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}
