/**
 * Роли участников команды и матрица прав.
 *
 * Хранение в документе 'teams/{teamId}':
 * - ownerId — владелец (у старых команд отсутствует, тогда владелец = createdBy)
 * - roles   — { [uid]: 'owner' | 'admin' | 'lead' | 'member' }; кого нет в карте — 'member'
 *
 * Та же логика продублирована в firebase/firestore.rules (teamRoleOf) —
 * менять нужно синхронно.
 */

export const TEAM_ROLE_KEYS = ['owner', 'admin', 'lead', 'member'];

/** Роли, которые можно выдать через setMemberRole (владелец — только передачей). */
export const ASSIGNABLE_TEAM_ROLES = ['admin', 'lead', 'member'];

export const TEAM_ROLES = {
  owner: {
    key: 'owner',
    label: 'Владелец',
    rank: 3,
    description: 'Может всё: управляет составом, ролями, настройками и удалением команды.',
  },
  admin: {
    key: 'admin',
    label: 'Администратор',
    rank: 2,
    description: 'Может всё то же, что владелец, но не управляет владельцем и не удаляет команду.',
  },
  lead: {
    key: 'lead',
    label: 'Тимлид',
    rank: 1,
    description: 'Ведёт итерации, ставит дедлайны и раздаёт задачи, но не меняет описание команды и не назначает роли.',
  },
  member: {
    key: 'member',
    label: 'Участник',
    rank: 0,
    description: 'Обычный участник: выполняет свои задачи и двигает их по статусам.',
  },
};

/**
 * Действие → роли, которым оно разрешено.
 * manageMembers дополнительно ограничено canManageMember (нельзя трогать владельца и себя).
 */
export const TEAM_PERMISSIONS = {
  editInfo: ['owner', 'admin'],
  invite: ['owner', 'admin'],
  manageMembers: ['owner', 'admin'],
  setDeadlines: ['owner', 'admin', 'lead'],
  manageTasks: ['owner', 'admin', 'lead'],
  updateOwnTasks: ['owner', 'admin', 'lead', 'member'],
  giveFeedback: ['owner', 'admin', 'lead', 'member'],
  viewFeedback: ['owner', 'admin'],
  transferOwnership: ['owner'],
  deleteTeam: ['owner'],
  leave: ['admin', 'lead', 'member'],
};

export const TEAM_PERMISSION_LABELS = [
  { action: 'editInfo', label: 'Менять название и описание' },
  { action: 'invite', label: 'Приглашать участников, код команды' },
  { action: 'manageMembers', label: 'Назначать роли и исключать' },
  { action: 'setDeadlines', label: 'Вести итерации и дедлайны' },
  { action: 'manageTasks', label: 'Создавать и назначать задачи' },
  { action: 'updateOwnTasks', label: 'Менять статус своих задач' },
  { action: 'giveFeedback', label: 'Проходить опросы и оценивать коллег' },
  { action: 'viewFeedback', label: 'Видеть результаты опросов и оценок' },
  { action: 'transferOwnership', label: 'Передавать владение' },
  { action: 'deleteTeam', label: 'Удалить команду' },
];

export function getTeamOwnerId(team) {
  return team?.ownerId || team?.createdBy || '';
}

export function getTeamRole(team, userId) {
  if (!userId || !team?.memberIds?.includes(userId)) {
    return null;
  }

  if (userId === getTeamOwnerId(team)) {
    return 'owner';
  }

  const storedRole = team.roles?.[userId];
  return ASSIGNABLE_TEAM_ROLES.includes(storedRole) ? storedRole : 'member';
}

export function getTeamRoleLabel(role) {
  return TEAM_ROLES[role]?.label || TEAM_ROLES.member.label;
}

export function hasTeamPermission(role, action) {
  return Boolean(role) && (TEAM_PERMISSIONS[action] || []).includes(role);
}

export function canTeamMember(team, userId, action) {
  return hasTeamPermission(getTeamRole(team, userId), action);
}

/** Может ли actor менять роль или исключить target. Себя и владельца — нельзя. */
export function canManageMember(team, actorId, targetId) {
  if (!actorId || !targetId || actorId === targetId) {
    return false;
  }

  const targetRole = getTeamRole(team, targetId);

  return (
    targetRole !== null &&
    targetRole !== 'owner' &&
    canTeamMember(team, actorId, 'manageMembers')
  );
}

/** Сортировка участников: владелец → админы → тимлиды → участники, затем по имени. */
export function compareMembersByRole(team) {
  return (left, right) => {
    const rankDiff =
      TEAM_ROLES[getTeamRole(team, right.userId) || 'member'].rank -
      TEAM_ROLES[getTeamRole(team, left.userId) || 'member'].rank;

    return rankDiff || (left.name || '').localeCompare(right.name || '', 'ru');
  };
}
