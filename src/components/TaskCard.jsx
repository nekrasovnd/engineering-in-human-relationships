import { getTaskDeadline, getTaskPriority, TASK_STATUSES } from '../utils/teamPlanning';
import AvatarBadge from './AvatarBadge';
import DeadlineBadge from './DeadlineBadge';

const PRIORITY_STYLES = {
  high: 'text-rose-200',
  medium: 'text-amber-200',
  low: 'text-slate-400',
};

export default function TaskCard({ task, planning, currentUserId }) {
  const {
    iterationsById,
    membersById,
    busyAction,
    canChangeTaskStatus,
    changeTaskStatus,
    openTask,
  } = planning;
  const deadline = getTaskDeadline(task, iterationsById);
  const priority = getTaskPriority(task.priority);
  const iteration = iterationsById[task.iterationId];
  const isMine = task.assigneeIds.includes(currentUserId);

  return (
    <div
      className={`rounded-2xl border bg-slate-950/50 p-3 ${
        isMine ? 'border-blue-500/40' : 'border-slate-800'
      }`}
    >
      <button
        type="button"
        onClick={() => openTask(task)}
        className="block w-full text-left"
      >
        <p className="text-sm font-medium leading-5 text-white">{task.title}</p>
        {task.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
            {task.description}
          </p>
        ) : null}
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DeadlineBadge
          deadline={deadline}
          done={task.status === 'done'}
          inherited={!task.deadline && Boolean(deadline)}
        />
        <span className={`text-xs ${PRIORITY_STYLES[priority.key]}`}>
          {priority.label}
        </span>
        {iteration ? (
          <span className="truncate text-xs text-slate-500">{iteration.title}</span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex -space-x-2">
          {task.assigneeIds.length === 0 ? (
            <span className="text-xs text-slate-500">Без исполнителя</span>
          ) : (
            task.assigneeIds.slice(0, 4).map((userId) => {
              const member = membersById[userId];
              return (
                <div
                  key={userId}
                  title={member?.name || 'Бывший участник'}
                  className="scale-75"
                >
                  <AvatarBadge
                    initials={member?.avatarInitials || '?'}
                    imageUrl={member?.avatarUrl}
                    size="sm"
                  />
                </div>
              );
            })
          )}
        </div>

        {canChangeTaskStatus(task) ? (
          <select
            value={task.status}
            disabled={busyAction === `task-status:${task.id}`}
            onChange={(event) => changeTaskStatus(task, event.target.value)}
            aria-label={`Статус задачи «${task.title}»`}
            className="rounded-xl border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-white outline-none focus:border-blue-400 disabled:opacity-60"
          >
            {TASK_STATUSES.map((status) => (
              <option key={status.key} value={status.key}>
                {status.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}
