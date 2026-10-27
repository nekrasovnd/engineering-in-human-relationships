/**
 * Задачи и итерации команды: справочники статусов, дедлайны, прогресс.
 *
 * Хранение (подколлекции команды):
 * - teams/{teamId}/iterations/{id} — { title, goal, startDate, deadline, status, ... }
 * - teams/{teamId}/tasks/{id}      — { title, description, status, priority,
 *                                      assigneeIds, iterationId, deadline, ... }
 * Даты хранятся строками 'YYYY-MM-DD' (как отдаёт <input type="date">).
 */

export const TASK_STATUSES = [
  { key: 'todo', label: 'К выполнению' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'review', label: 'На проверке' },
  { key: 'done', label: 'Готово' },
];

export const TASK_STATUS_KEYS = TASK_STATUSES.map((item) => item.key);

export const TASK_PRIORITIES = [
  { key: 'high', label: 'Высокий', rank: 2 },
  { key: 'medium', label: 'Средний', rank: 1 },
  { key: 'low', label: 'Низкий', rank: 0 },
];

export const TASK_PRIORITY_KEYS = TASK_PRIORITIES.map((item) => item.key);

export const ITERATION_STATUSES = ['active', 'closed'];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_DAYS = 2;

export function getTaskStatusLabel(status) {
  return TASK_STATUSES.find((item) => item.key === status)?.label || status;
}

export function getTaskPriority(priority) {
  return (
    TASK_PRIORITIES.find((item) => item.key === priority) ||
    TASK_PRIORITIES.find((item) => item.key === 'medium')
  );
}

export function isDateString(value) {
  return typeof value === 'string' && DATE_PATTERN.test(value);
}

/** Сегодняшняя дата в локальной зоне пользователя: 'YYYY-MM-DD'. */
export function getTodayDateString(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateStringToUtc(value) {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Сколько дней осталось до даты (отрицательное — просрочено). */
export function getDaysUntil(dateString, today = getTodayDateString()) {
  if (!isDateString(dateString)) {
    return null;
  }

  return Math.round((dateStringToUtc(dateString) - dateStringToUtc(today)) / DAY_MS);
}

export function formatDateLabel(dateString) {
  if (!isDateString(dateString)) {
    return '';
  }

  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

/** Дедлайн задачи: свой или, если не задан, дедлайн её итерации. */
export function getTaskDeadline(task, iterationsById = {}) {
  if (isDateString(task?.deadline)) {
    return task.deadline;
  }

  return iterationsById[task?.iterationId]?.deadline || '';
}

/**
 * Состояние дедлайна для бейджа.
 * @returns {{ tone: 'none'|'done'|'ok'|'soon'|'overdue', label: string }}
 */
export function getDeadlineState(deadline, { done = false, today } = {}) {
  const daysLeft = getDaysUntil(deadline, today);

  if (daysLeft === null) {
    return { tone: 'none', label: 'Без срока' };
  }

  const dateLabel = formatDateLabel(deadline);

  if (done) {
    return { tone: 'done', label: dateLabel };
  }

  if (daysLeft < 0) {
    return { tone: 'overdue', label: `Просрочено · ${dateLabel}` };
  }

  if (daysLeft === 0) {
    return { tone: 'soon', label: 'Сегодня' };
  }

  if (daysLeft <= SOON_DAYS) {
    return { tone: 'soon', label: `${daysLeft} дн. · ${dateLabel}` };
  }

  return { tone: 'ok', label: dateLabel };
}

export function buildIterationsById(iterations) {
  return Object.fromEntries(iterations.map((item) => [item.id, item]));
}

/** Прогресс итерации по её задачам. */
export function getIterationProgress(iteration, tasks) {
  const iterationTasks = tasks.filter((task) => task.iterationId === iteration.id);
  const done = iterationTasks.filter((task) => task.status === 'done').length;

  return {
    total: iterationTasks.length,
    done,
    percent: iterationTasks.length ? Math.round((done / iterationTasks.length) * 100) : 0,
  };
}

/** Текущая итерация: активная с ближайшим дедлайном. */
export function getCurrentIteration(iterations) {
  return (
    [...iterations]
      .filter((item) => item.status === 'active')
      .sort((left, right) => (left.deadline || '9999').localeCompare(right.deadline || '9999'))[0] ||
    null
  );
}

/** Активные выше закрытых, внутри — по дедлайну (закрытые — свежие сверху). */
export function compareIterations(left, right) {
  if (left.status !== right.status) {
    return left.status === 'active' ? -1 : 1;
  }

  return left.status === 'active'
    ? (left.deadline || '9999').localeCompare(right.deadline || '9999')
    : (right.deadline || '').localeCompare(left.deadline || '');
}

/** Внутри колонки: просроченные и срочные выше, затем по приоритету. */
export function compareTasks(iterationsById) {
  return (left, right) => {
    const leftDeadline = getTaskDeadline(left, iterationsById) || '9999-12-31';
    const rightDeadline = getTaskDeadline(right, iterationsById) || '9999-12-31';

    return (
      leftDeadline.localeCompare(rightDeadline) ||
      getTaskPriority(right.priority).rank - getTaskPriority(left.priority).rank ||
      (left.createdAt || '').localeCompare(right.createdAt || '')
    );
  };
}
