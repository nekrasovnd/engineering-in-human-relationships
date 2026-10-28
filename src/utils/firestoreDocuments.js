import { FACTOR_KEYS, buildSystemIndices } from '../data/questionnaire';
import {
  ITERATION_STATUSES,
  TASK_PRIORITY_KEYS,
  TASK_STATUS_KEYS,
  isDateString,
} from './teamPlanning';
import { PEER_CRITERIA_KEYS, PULSE_KEYS, RATING_VALUES } from './teamFeedback';
import { FUNCTIONAL_ROLE_KEYS, QUALIFICATION_KEYS } from './teamFunctions';

const SYSTEM_INDEX_KEYS = [
  'conflictLoad',
  'teamStabilityReserve',
  'communicationClarity',
  'autonomyBalance',
  'profileIntegrity',
];

function sanitizeRequiredText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeOptionalText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeOptionalNumber(value, min, max) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const clampedValue = Math.min(max, Math.max(min, numericValue));
  return Number(clampedValue.toFixed(1));
}

export function sanitizeFactorScores(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const nextScores = {};

  for (const key of FACTOR_KEYS) {
    const value = sanitizeOptionalNumber(input[key], 0, 10);

    if (value === null) {
      return null;
    }

    nextScores[key] = value;
  }

  return nextScores;
}

export function sanitizeFactorReliability(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const nextReliability = {};
  let hasDefinedValues = false;

  for (const key of FACTOR_KEYS) {
    const value = sanitizeOptionalNumber(input[key], 0, 10);

    if (value !== null) {
      nextReliability[key] = value;
      hasDefinedValues = true;
    }
  }

  return hasDefinedValues ? nextReliability : null;
}

export function sanitizeSystemIndices(input, factorScores, factorReliability) {
  if (!input || typeof input !== 'object') {
    return factorScores
      ? buildSystemIndices(factorScores, factorReliability || {})
      : null;
  }

  const nextIndices = {};

  for (const key of SYSTEM_INDEX_KEYS) {
    const value = sanitizeOptionalNumber(input[key], 0, 10);

    if (value === null) {
      return factorScores
        ? buildSystemIndices(factorScores, factorReliability || {})
        : null;
    }

    nextIndices[key] = value;
  }

  return nextIndices;
}

export function sanitizeComparableProfile(profile) {
  const userId = sanitizeRequiredText(profile?.userId);
  const name = sanitizeRequiredText(profile?.name);
  const factorScores = sanitizeFactorScores(profile?.factorScores);

  if (!userId || !name || !factorScores) {
    return null;
  }

  const factorReliability = sanitizeFactorReliability(profile?.factorReliability);
  const systemIndices = sanitizeSystemIndices(
    profile?.systemIndices,
    factorScores,
    factorReliability,
  );
  const profileIntegrity = sanitizeOptionalNumber(
    profile?.profileIntegrity,
    0,
    10,
  );
  const age = sanitizeOptionalNumber(profile?.age, 16, 90);

  return {
    userId,
    name,
    age: age === null ? null : Math.round(age),
    gender: sanitizeOptionalText(profile?.gender),
    avatarInitials: sanitizeRequiredText(profile?.avatarInitials),
    avatarUrl: sanitizeOptionalText(profile?.avatarUrl),
    egoState: sanitizeOptionalText(profile?.egoState),
    factorScores,
    factorReliability,
    systemIndices,
    profileIntegrity:
      profileIntegrity ??
      systemIndices?.profileIntegrity ??
      buildSystemIndices(factorScores, factorReliability || {}).profileIntegrity,
    questionnaireCompleted: profile?.questionnaireCompleted === true,
    discoverVisible: profile?.discoverVisible === true,
  };
}

export function sanitizeDiscoverProfile(profile) {
  const normalizedProfile = sanitizeComparableProfile(profile);

  if (
    !normalizedProfile ||
    normalizedProfile.questionnaireCompleted !== true ||
    normalizedProfile.discoverVisible !== true ||
    !normalizedProfile.egoState
  ) {
    return null;
  }

  return normalizedProfile;
}

/** Заявка или дружба: снапшоты профилей приводятся к сравнимому виду. */
export function sanitizeFriendship(friendship, friendshipId = '') {
  const id = sanitizeRequiredText(friendshipId);
  const userIds = Array.isArray(friendship?.userIds)
    ? friendship.userIds.map((item) => sanitizeRequiredText(item)).filter(Boolean)
    : [];
  const status = ['pending', 'accepted'].includes(friendship?.status)
    ? friendship.status
    : '';

  if (!id || userIds.length !== 2 || !status) {
    return null;
  }

  const storedSnapshots =
    friendship?.snapshots && typeof friendship.snapshots === 'object'
      ? friendship.snapshots
      : {};

  return {
    id,
    userIds,
    requesterId: sanitizeRequiredText(friendship?.requesterId),
    addresseeId: sanitizeRequiredText(friendship?.addresseeId),
    status,
    code: sanitizeOptionalText(friendship?.code),
    snapshots: Object.fromEntries(
      userIds
        .map((userId) => [userId, sanitizeComparableProfile(storedSnapshots[userId])])
        .filter(([userId, snapshot]) => snapshot?.userId === userId),
    ),
    createdAt: sanitizeOptionalText(friendship?.createdAt),
    acceptedAt: sanitizeOptionalText(friendship?.acceptedAt),
  };
}

export function sanitizeMatchAction(action) {
  const fromUid = sanitizeRequiredText(action?.fromUid);
  const toUid = sanitizeRequiredText(action?.toUid);

  if (!fromUid || !toUid || fromUid === toUid) {
    return null;
  }

  return {
    id: sanitizeRequiredText(action?.id),
    fromUid,
    toUid,
    decision: action?.decision === 'like' ? 'like' : 'pass',
    compatibility: sanitizeOptionalNumber(action?.compatibility, 0, 100) ?? 0,
    conflictRisk: sanitizeOptionalText(action?.conflictRisk) || 'unknown',
    createdAt: sanitizeOptionalText(action?.createdAt),
    updatedAt: sanitizeOptionalText(action?.updatedAt),
  };
}

export function sanitizeTeamInvite(invite, inviteId = '') {
  const teamId = sanitizeRequiredText(invite?.teamId);
  const toUid = sanitizeRequiredText(invite?.toUid);
  const fromUid = sanitizeRequiredText(invite?.fromUid);

  if (!teamId || !toUid || !fromUid) {
    return null;
  }

  const status = ['pending', 'accepted', 'declined'].includes(invite?.status)
    ? invite.status
    : 'pending';
  const source = ['direct', 'code'].includes(invite?.source)
    ? invite.source
    : 'direct';

  return {
    id: sanitizeRequiredText(inviteId),
    teamId,
    teamName: sanitizeRequiredText(invite?.teamName),
    teamDescription: sanitizeOptionalText(invite?.teamDescription),
    teamGoal: sanitizeOptionalText(invite?.teamGoal),
    fromUid,
    fromName: sanitizeRequiredText(invite?.fromName),
    fromAvatarInitials: sanitizeOptionalText(invite?.fromAvatarInitials),
    toUid,
    toName: sanitizeRequiredText(invite?.toName),
    toAvatarInitials: sanitizeOptionalText(invite?.toAvatarInitials),
    status,
    source,
    joinCode: invite?.joinCode === null ? null : sanitizeOptionalText(invite?.joinCode),
    createdAt: sanitizeOptionalText(invite?.createdAt),
    updatedAt: sanitizeOptionalText(invite?.updatedAt),
  };
}

export function sanitizeTeam(team, teamId = '') {
  const memberIds = Array.isArray(team?.memberIds)
    ? Array.from(
        new Set(
          team.memberIds
            .map((item) => sanitizeRequiredText(item))
            .filter(Boolean),
        ),
      )
    : [];
  const memberSnapshots = Array.isArray(team?.memberSnapshots)
    ? team.memberSnapshots
        .map((item) => sanitizeComparableProfile(item))
        .filter(Boolean)
    : [];
  const createdBy = sanitizeRequiredText(team?.createdBy);
  // Старые команды без ownerId: владельцем считается создатель.
  const ownerId = sanitizeRequiredText(team?.ownerId) || createdBy;
  const storedRoles =
    team?.roles && typeof team.roles === 'object' ? team.roles : {};
  const roles = Object.fromEntries(
    memberIds.map((userId) => [
      userId,
      userId === ownerId
        ? 'owner'
        : ['admin', 'lead'].includes(storedRoles[userId])
          ? storedRoles[userId]
          : 'member',
    ]),
  );
  const pickMemberValues = (stored, allowed) =>
    Object.fromEntries(
      memberIds
        .filter((userId) => allowed.includes(stored?.[userId]))
        .map((userId) => [userId, stored[userId]]),
    );

  return {
    id: sanitizeRequiredText(teamId),
    name: sanitizeRequiredText(team?.name),
    description: sanitizeOptionalText(team?.description),
    goal: sanitizeOptionalText(team?.goal),
    joinCode: sanitizeOptionalText(team?.joinCode),
    createdBy,
    ownerId,
    roles,
    functionalRoles: pickMemberValues(team?.functionalRoles, FUNCTIONAL_ROLE_KEYS),
    qualifications: pickMemberValues(team?.qualifications, QUALIFICATION_KEYS),
    memberIds,
    memberSnapshots,
    analysis:
      team?.analysis && typeof team.analysis === 'object' ? team.analysis : null,
    createdAt: sanitizeOptionalText(team?.createdAt),
    updatedAt: sanitizeOptionalText(team?.updatedAt),
  };
}

export function sanitizeTeamIteration(iteration, iterationId = '') {
  const id = sanitizeRequiredText(iterationId);
  const title = sanitizeRequiredText(iteration?.title);

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    goal: sanitizeOptionalText(iteration?.goal),
    startDate: isDateString(iteration?.startDate) ? iteration.startDate : '',
    deadline: isDateString(iteration?.deadline) ? iteration.deadline : '',
    status: ITERATION_STATUSES.includes(iteration?.status) ? iteration.status : 'active',
    createdBy: sanitizeOptionalText(iteration?.createdBy),
    createdAt: sanitizeOptionalText(iteration?.createdAt),
    updatedAt: sanitizeOptionalText(iteration?.updatedAt),
    closedAt: sanitizeOptionalText(iteration?.closedAt),
  };
}

export function sanitizeTeamTask(task, taskId = '') {
  const id = sanitizeRequiredText(taskId);
  const title = sanitizeRequiredText(task?.title);

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    description: sanitizeOptionalText(task?.description),
    status: TASK_STATUS_KEYS.includes(task?.status) ? task.status : 'todo',
    priority: TASK_PRIORITY_KEYS.includes(task?.priority) ? task.priority : 'medium',
    assigneeIds: Array.isArray(task?.assigneeIds)
      ? Array.from(
          new Set(task.assigneeIds.map((item) => sanitizeRequiredText(item)).filter(Boolean)),
        )
      : [],
    iterationId: sanitizeOptionalText(task?.iterationId),
    deadline: isDateString(task?.deadline) ? task.deadline : '',
    createdBy: sanitizeOptionalText(task?.createdBy),
    createdAt: sanitizeOptionalText(task?.createdAt),
    updatedAt: sanitizeOptionalText(task?.updatedAt),
    completedAt: sanitizeOptionalText(task?.completedAt),
  };
}

function sanitizeRating(value) {
  const numericValue = Number(value);
  return RATING_VALUES.includes(numericValue) ? numericValue : null;
}

export function sanitizePulseSurvey(pulse, pulseId = '') {
  const userId = sanitizeRequiredText(pulse?.userId);
  const weekKey = sanitizeRequiredText(pulse?.weekKey);
  const answers = Object.fromEntries(
    PULSE_KEYS.map((key) => [key, sanitizeRating(pulse?.answers?.[key])]),
  );

  if (!userId || !weekKey || Object.values(answers).some((value) => value === null)) {
    return null;
  }

  return {
    id: sanitizeRequiredText(pulseId),
    userId,
    weekKey,
    answers,
    frictionWith: Array.isArray(pulse?.frictionWith)
      ? pulse.frictionWith.map((item) => sanitizeRequiredText(item)).filter(Boolean)
      : [],
    comment: sanitizeOptionalText(pulse?.comment),
    createdAt: sanitizeOptionalText(pulse?.createdAt),
  };
}

export function sanitizePeerReview(review, reviewId = '') {
  const reviewerId = sanitizeRequiredText(review?.reviewerId);
  const iterationId = sanitizeRequiredText(review?.iterationId);

  if (!reviewerId || !iterationId || !review?.ratings || typeof review.ratings !== 'object') {
    return null;
  }

  const ratings = Object.fromEntries(
    Object.entries(review.ratings)
      .filter(([userId]) => userId && userId !== reviewerId)
      .map(([userId, rating]) => [
        userId,
        Object.fromEntries(
          PEER_CRITERIA_KEYS.map((key) => [key, sanitizeRating(rating?.[key])]),
        ),
      ])
      .filter(([, rating]) => Object.values(rating).every((value) => value !== null)),
  );
  const comments =
    review?.comments && typeof review.comments === 'object'
      ? Object.fromEntries(
          Object.entries(review.comments)
            .map(([userId, text]) => [userId, sanitizeOptionalText(text)])
            .filter(([, text]) => text),
        )
      : {};

  return {
    id: sanitizeRequiredText(reviewId),
    reviewerId,
    iterationId,
    ratings,
    comments,
    createdAt: sanitizeOptionalText(review?.createdAt),
  };
}
