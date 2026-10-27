import { useMemo, useState } from 'react';
import { useTeamPlanningData } from './useTeamPlanningData';
import {
  createTeamIteration,
  createTeamTask,
  deleteTeamIteration,
  deleteTeamTask,
  setTeamIterationStatus,
  updateTeamIteration,
  updateTeamTask,
  updateTeamTaskStatus,
} from '../services/firestore';
import {
  buildIterationsById,
  compareTasks,
  getCurrentIteration,
  getTodayDateString,
} from '../utils/teamPlanning';
import { canTeamMember } from '../utils/teamRoles';

export const TASK_FILTER_ALL = 'all';
export const TASK_FILTER_NO_ITERATION = 'none';

function buildIterationForm(iteration) {
  return {
    title: iteration?.title || '',
    goal: iteration?.goal || '',
    startDate: iteration?.startDate || getTodayDateString(),
    deadline: iteration?.deadline || '',
  };
}

function buildTaskForm(task, defaults = {}) {
  return {
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assigneeIds: task?.assigneeIds || [],
    iterationId: task?.iterationId ?? defaults.iterationId ?? '',
    deadline: task?.deadline || '',
  };
}

function getPlanningErrorMessage(planningError, fallback) {
  switch (planningError?.message) {
    case 'team-permission-denied':
      return 'У вашей роли нет прав на это действие.';
    case 'invalid-iteration':
      return 'Укажите название и дедлайн итерации.';
    case 'iteration-dates-order':
      return 'Дата начала не может быть позже дедлайна.';
    case 'invalid-task':
      return 'Укажите название задачи.';
    default:
      return fallback;
  }
}

/**
 * Итерации и задачи одной команды: подписки, фильтры, формы и операции.
 * Ошибки и уведомления отдаются через onError / onNotice — тосты рисует страница.
 */
export function useTeamPlanning(team, profile, { onError, onNotice }) {
  const { iterations, tasks, loading } = useTeamPlanningData(team?.id, {
    enabled: Boolean(team),
  });
  const can = useMemo(
    () => ({
      manageTasks: canTeamMember(team, profile.userId, 'manageTasks'),
      setDeadlines: canTeamMember(team, profile.userId, 'setDeadlines'),
    }),
    [profile.userId, team],
  );

  const [iterationFilter, setIterationFilter] = useState(TASK_FILTER_ALL);
  const [onlyMine, setOnlyMine] = useState(false);
  // null — форма закрыта, 'new' — создание, иначе id редактируемого объекта.
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState(() => buildTaskForm());
  const [editingIterationId, setEditingIterationId] = useState(null);
  const [iterationForm, setIterationForm] = useState(() => buildIterationForm());
  const [busyAction, setBusyAction] = useState('');

  const iterationsById = useMemo(() => buildIterationsById(iterations), [iterations]);
  const currentIteration = useMemo(() => getCurrentIteration(iterations), [iterations]);
  const membersById = useMemo(
    () =>
      Object.fromEntries((team?.memberSnapshots || []).map((item) => [item.userId, item])),
    [team],
  );
  const visibleTasks = useMemo(
    () =>
      tasks
        .filter((task) => {
          if (iterationFilter === TASK_FILTER_NO_ITERATION) {
            return !iterationsById[task.iterationId];
          }

          return iterationFilter === TASK_FILTER_ALL || task.iterationId === iterationFilter;
        })
        .filter((task) => !onlyMine || task.assigneeIds.includes(profile.userId))
        .sort(compareTasks(iterationsById)),
    [iterationFilter, iterationsById, onlyMine, profile.userId, tasks],
  );
  const myOpenTasksCount = useMemo(
    () =>
      tasks.filter(
        (task) => task.status !== 'done' && task.assigneeIds.includes(profile.userId),
      ).length,
    [profile.userId, tasks],
  );

  const run = async (actionKey, action, fallbackError) => {
    try {
      setBusyAction(actionKey);
      await action();
      return true;
    } catch (planningError) {
      onError(getPlanningErrorMessage(planningError, fallbackError));
      return false;
    } finally {
      setBusyAction('');
    }
  };

  const canChangeTaskStatus = (task) =>
    can.manageTasks ||
    (task.assigneeIds.includes(profile.userId) &&
      canTeamMember(team, profile.userId, 'updateOwnTasks'));

  // ─── Задачи ────────────────────────────────────────────────────────────
  const openNewTask = () => {
    const defaultIterationId =
      iterationsById[iterationFilter]?.id || currentIteration?.id || '';
    setTaskForm(buildTaskForm(null, { iterationId: defaultIterationId }));
    setEditingTaskId('new');
  };

  const openTask = (task) => {
    setTaskForm(buildTaskForm(task));
    setEditingTaskId(task.id);
  };

  const closeTaskForm = () => setEditingTaskId(null);

  const updateTaskField = (key, value) => {
    setTaskForm((current) => ({ ...current, [key]: value }));
  };

  const toggleTaskAssignee = (userId) => {
    setTaskForm((current) => ({
      ...current,
      assigneeIds: current.assigneeIds.includes(userId)
        ? current.assigneeIds.filter((item) => item !== userId)
        : [...current.assigneeIds, userId],
    }));
  };

  const saveTask = async () => {
    const editingTask = tasks.find((item) => item.id === editingTaskId);
    const saved = await run(
      'task-save',
      () =>
        editingTask
          ? updateTeamTask(team, editingTask, profile.userId, taskForm)
          : createTeamTask(team, profile.userId, taskForm),
      'Не удалось сохранить задачу.',
    );

    if (saved) {
      setEditingTaskId(null);
      onNotice(editingTask ? 'Задача обновлена.' : 'Задача создана.');
    }
  };

  const removeTask = async (task) => {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) {
      return;
    }

    const removed = await run(
      `task-delete:${task.id}`,
      () => deleteTeamTask(team, task, profile.userId),
      'Не удалось удалить задачу.',
    );

    if (removed) {
      setEditingTaskId(null);
    }
  };

  const changeTaskStatus = (task, status) =>
    run(
      `task-status:${task.id}`,
      () => updateTeamTaskStatus(team, task, profile.userId, status),
      'Не удалось изменить статус задачи.',
    );

  // ─── Итерации ──────────────────────────────────────────────────────────
  const openNewIteration = () => {
    setIterationForm(buildIterationForm());
    setEditingIterationId('new');
  };

  const openIteration = (iteration) => {
    setIterationForm(buildIterationForm(iteration));
    setEditingIterationId(iteration.id);
  };

  const closeIterationForm = () => setEditingIterationId(null);

  const updateIterationField = (key, value) => {
    setIterationForm((current) => ({ ...current, [key]: value }));
  };

  const saveIteration = async () => {
    const editingIteration = iterationsById[editingIterationId];
    const saved = await run(
      'iteration-save',
      () =>
        editingIteration
          ? updateTeamIteration(team, editingIteration, profile.userId, iterationForm)
          : createTeamIteration(team, profile.userId, iterationForm),
      'Не удалось сохранить итерацию.',
    );

    if (saved) {
      setEditingIterationId(null);
      onNotice(editingIteration ? 'Итерация обновлена.' : 'Итерация создана.');
    }
  };

  const toggleIterationStatus = async (iteration) => {
    const nextStatus = iteration.status === 'active' ? 'closed' : 'active';
    const openTasksCount = tasks.filter(
      (task) => task.iterationId === iteration.id && task.status !== 'done',
    ).length;

    if (
      nextStatus === 'closed' &&
      openTasksCount > 0 &&
      !window.confirm(
        `В итерации «${iteration.title}» не закрыто задач: ${openTasksCount}. Всё равно закрыть итерацию?`,
      )
    ) {
      return;
    }

    const saved = await run(
      `iteration-status:${iteration.id}`,
      () => setTeamIterationStatus(team, iteration, profile.userId, nextStatus),
      'Не удалось изменить статус итерации.',
    );

    if (saved) {
      onNotice(nextStatus === 'closed' ? 'Итерация закрыта.' : 'Итерация снова открыта.');
    }
  };

  const removeIteration = async (iteration) => {
    if (
      !window.confirm(
        `Удалить итерацию «${iteration.title}»? Её задачи останутся без итерации.`,
      )
    ) {
      return;
    }

    const removed = await run(
      `iteration-delete:${iteration.id}`,
      () => deleteTeamIteration(team, iteration, profile.userId, tasks),
      'Не удалось удалить итерацию.',
    );

    if (removed) {
      if (iterationFilter === iteration.id) {
        setIterationFilter(TASK_FILTER_ALL);
      }
      setEditingIterationId(null);
    }
  };

  return {
    loading,
    can,
    iterations,
    tasks,
    iterationsById,
    currentIteration,
    membersById,
    visibleTasks,
    myOpenTasksCount,
    busyAction,
    canChangeTaskStatus,
    // фильтры
    iterationFilter,
    setIterationFilter,
    onlyMine,
    setOnlyMine,
    // задачи
    editingTaskId,
    taskForm,
    openNewTask,
    openTask,
    closeTaskForm,
    updateTaskField,
    toggleTaskAssignee,
    saveTask,
    removeTask,
    changeTaskStatus,
    // итерации
    editingIterationId,
    iterationForm,
    openNewIteration,
    openIteration,
    closeIterationForm,
    updateIterationField,
    saveIteration,
    toggleIterationStatus,
    removeIteration,
  };
}
