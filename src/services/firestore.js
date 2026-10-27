import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  buildTeamSummary,
  findMostConflictPair,
  getRecommendedRoles,
} from '../utils/teamAnalysis';
import { hasComparableProfileData } from '../utils/compatibility';
import {
  sanitizeComparableProfile,
  sanitizeDiscoverProfile,
  sanitizeFactorReliability,
  sanitizeFactorScores,
  sanitizeMatchAction,
  sanitizeSystemIndices,
  sanitizeTeam,
} from '../utils/firestoreDocuments';
import {
  ASSIGNABLE_TEAM_ROLES,
  canManageMember,
  canTeamMember,
  getTeamOwnerId,
  getTeamRole,
} from '../utils/teamRoles';

const nowIso = () => new Date().toISOString();
const TEAM_JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TEAM_JOIN_CODE_LENGTH = 8;
const DISCOVER_PROFILE_FIELDS = [
  'userId',
  'name',
  'age',
  'gender',
  'avatarInitials',
  'avatarUrl',
  'factorScores',
  'factorReliability',
  'egoState',
  'systemIndices',
  'profileIntegrity',
  'questionnaireCompleted',
  'discoverVisible',
];

function pickProfileFields(profile, keys) {
  return keys.reduce((result, key) => {
    if (Object.hasOwn(profile, key)) {
      result[key] = profile[key];
    }

    return result;
  }, {});
}

function assertCurrentUser(expectedUserId) {
  const currentUserId = auth.currentUser?.uid;

  if (!currentUserId || currentUserId !== expectedUserId) {
    throw new Error('auth-user-mismatch');
  }
}

function sanitizeProfilePatch(payload = {}) {
  const nextPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );

  if (Object.hasOwn(nextPayload, 'name')) {
    nextPayload.name = String(nextPayload.name || '').trim();
  }

  if (Object.hasOwn(nextPayload, 'gender')) {
    nextPayload.gender = String(nextPayload.gender || '').trim();
  }

  if (Object.hasOwn(nextPayload, 'avatarInitials')) {
    nextPayload.avatarInitials = String(nextPayload.avatarInitials || '').trim();
  }

  if (Object.hasOwn(nextPayload, 'avatarUrl')) {
    nextPayload.avatarUrl = String(nextPayload.avatarUrl || '').trim();
  }

  if (Object.hasOwn(nextPayload, 'age')) {
    const normalizedAge = Number(nextPayload.age);

    if (Number.isInteger(normalizedAge) && normalizedAge >= 16 && normalizedAge <= 90) {
      nextPayload.age = normalizedAge;
    } else {
      delete nextPayload.age;
    }
  }

  if (Object.hasOwn(nextPayload, 'discoverVisible')) {
    nextPayload.discoverVisible = nextPayload.discoverVisible === true;
  }

  if (Object.hasOwn(nextPayload, 'questionnaireCompleted')) {
    nextPayload.questionnaireCompleted = nextPayload.questionnaireCompleted === true;
  }

  if (Object.hasOwn(nextPayload, 'factorScores')) {
    const normalizedScores = sanitizeFactorScores(nextPayload.factorScores);

    if (normalizedScores) {
      nextPayload.factorScores = normalizedScores;
    } else {
      delete nextPayload.factorScores;
    }
  }

  if (Object.hasOwn(nextPayload, 'factorReliability')) {
    const normalizedReliability = sanitizeFactorReliability(
      nextPayload.factorReliability,
    );

    if (normalizedReliability) {
      nextPayload.factorReliability = normalizedReliability;
    } else {
      delete nextPayload.factorReliability;
    }
  }

  if (Object.hasOwn(nextPayload, 'systemIndices')) {
    const normalizedIndices = sanitizeSystemIndices(
      nextPayload.systemIndices,
      nextPayload.factorScores,
      nextPayload.factorReliability,
    );

    if (normalizedIndices) {
      nextPayload.systemIndices = normalizedIndices;
    } else {
      delete nextPayload.systemIndices;
    }
  }

  if (Object.hasOwn(nextPayload, 'answers')) {
    if (!nextPayload.answers || typeof nextPayload.answers !== 'object') {
      delete nextPayload.answers;
    } else {
      nextPayload.answers = Object.fromEntries(
        Object.entries(nextPayload.answers).filter(([, value]) =>
          Number.isFinite(Number(value)),
        ),
      );
    }
  }

  return nextPayload;
}

function buildMemberSnapshot(profile) {
  const normalizedProfile = sanitizeComparableProfile(profile);

  if (!normalizedProfile) {
    return null;
  }

  return {
    userId: normalizedProfile.userId,
    name: normalizedProfile.name,
    avatarInitials: normalizedProfile.avatarInitials,
    avatarUrl: normalizedProfile.avatarUrl || '',
    egoState: normalizedProfile.egoState,
    factorScores: normalizedProfile.factorScores,
    factorReliability: normalizedProfile.factorReliability,
    systemIndices: normalizedProfile.systemIndices,
    profileIntegrity: normalizedProfile.profileIntegrity,
  };
}

function buildTeamAnalysis(memberProfiles) {
  const comparableProfiles = memberProfiles
    .map((item) => sanitizeComparableProfile(item))
    .filter(Boolean);
  const roles = getRecommendedRoles(comparableProfiles);
  const conflictPair = findMostConflictPair(comparableProfiles);

  return {
    summary: buildTeamSummary(comparableProfiles),
    roles,
    conflictPair: conflictPair
      ? {
          leftName: conflictPair.left.name,
          rightName: conflictPair.right.name,
          compatibility: conflictPair.compatibility,
          conflictRisk: conflictPair.conflictRisk,
        }
      : null,
  };
}

function normalizeTeamJoinCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function generateTeamJoinCode() {
  const bytes = new Uint32Array(TEAM_JOIN_CODE_LENGTH);
  globalThis.crypto.getRandomValues(bytes);

  return Array.from(bytes, (value) =>
    TEAM_JOIN_CODE_ALPHABET[value % TEAM_JOIN_CODE_ALPHABET.length],
  ).join('');
}

async function reserveUniqueTeamJoinCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateTeamJoinCode();
    const snapshot = await getDoc(doc(db, 'teamJoinCodes', code));

    if (!snapshot.exists()) {
      return code;
    }
  }

  throw new Error('Unable to reserve team join code');
}

function buildTeamJoinCodeDoc({
  code,
  teamId,
  name,
  description,
  goal,
  creatorProfile,
  createdAt,
  updatedAt,
}) {
  return {
    code,
    teamId,
    teamName: name,
    teamDescription: description,
    teamGoal: goal,
    createdBy: creatorProfile.userId,
    createdByName: creatorProfile.name,
    createdByAvatarInitials: creatorProfile.avatarInitials,
    active: true,
    createdAt,
    updatedAt,
  };
}

// Команду может прочитать только участник: если чтение запрещено,
// значит пользователь уже вышел или был исключён и может вступить снова.
async function isTeamMember(teamId) {
  try {
    const snapshot = await getDoc(doc(db, 'teams', teamId));
    return snapshot.exists();
  } catch {
    return false;
  }
}

function buildDiscoverProfile(profile, createdAt, updatedAt) {
  return {
    ...pickProfileFields(profile, DISCOVER_PROFILE_FIELDS),
    discoverVisible: true,
    createdAt,
    updatedAt,
  };
}

function normalizeMatchDecisionPayload(payload) {
  const decision = payload?.decision === 'like' ? 'like' : 'pass';
  const compatibility = Number(payload?.compatibility);

  return {
    fromUid: String(payload?.fromUid || ''),
    toUid: String(payload?.toUid || ''),
    decision,
    compatibility: Number.isFinite(compatibility)
      ? Math.min(100, Math.max(0, Math.round(compatibility)))
      : 0,
    conflictRisk:
      typeof payload?.conflictRisk === 'string' && payload.conflictRisk.trim()
        ? payload.conflictRisk.trim()
        : 'unknown',
  };
}

async function syncProfileAcrossTeams(userId, profile, updatedAt) {
  const ownSnapshot = buildMemberSnapshot(profile);

  if (!ownSnapshot || !profile.questionnaireCompleted) {
    return;
  }

  const teamsSnapshot = await getDocs(
    query(
      collection(db, 'teams'),
      where('memberIds', 'array-contains', userId),
    ),
  );

  if (teamsSnapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  teamsSnapshot.docs.forEach((teamDocument) => {
    const team = sanitizeTeam(teamDocument.data(), teamDocument.id);
    const nextMemberSnapshots = [
      ...(team.memberSnapshots || []).filter((item) => item.userId !== userId),
      ownSnapshot,
    ];

    batch.set(
      doc(db, 'teams', teamDocument.id),
      {
        memberSnapshots: nextMemberSnapshots,
        analysis: buildTeamAnalysis(nextMemberSnapshots),
        updatedAt,
      },
      { merge: true },
    );
  });

  await batch.commit();
}

/**
 * Сохраняет (merge) профиль пользователя в 'profiles/{userId}'.
 *
 * В зависимости от состояния профиля:
 * - Если discoverVisible && questionnaireCompleted → обновляет 'discoverProfiles/{userId}'
 * - Иначе → удаляет документ из 'discoverProfiles'
 * - Затем синхронизирует снапшот профиля во всех командах пользователя
 *
 * @param {string} userId - ID пользователя (должен совпадать с auth.currentUser.uid)
 * @param {Object} payload - Частичные данные профиля (пройдут через sanitizeProfilePatch)
 * @throws {Error} 'auth-user-mismatch' если userId не совпадает с текущим пользователем
 */
export async function saveProfile(userId, payload) {
  assertCurrentUser(userId);

  const privateRef = doc(db, 'profiles', userId);
  const discoverRef = doc(db, 'discoverProfiles', userId);
  const [privateSnapshot, discoverSnapshot] = await Promise.all([
    getDoc(privateRef),
    getDoc(discoverRef),
  ]);

  const createdAt =
    privateSnapshot.data()?.createdAt ||
    discoverSnapshot.data()?.createdAt ||
    nowIso();
  const updatedAt = nowIso();
  const nextPayload = sanitizeProfilePatch(payload);
  const nextPrivateProfile = {
    ...(privateSnapshot.data() || {}),
    userId,
    discoverVisible:
      nextPayload.discoverVisible ??
      privateSnapshot.data()?.discoverVisible ??
      false,
    ...nextPayload,
    createdAt,
    updatedAt,
  };

  const batch = writeBatch(db);
  batch.set(privateRef, nextPrivateProfile, { merge: true });

  if (
    nextPrivateProfile.questionnaireCompleted &&
    nextPrivateProfile.discoverVisible
  ) {
    const discoverCreatedAt =
      discoverSnapshot.data()?.createdAt || createdAt;
    const discoverProfile = sanitizeDiscoverProfile(nextPrivateProfile);

    if (discoverProfile) {
      batch.set(
        discoverRef,
        buildDiscoverProfile(
          discoverProfile,
          discoverCreatedAt,
          updatedAt,
        ),
        { merge: true },
      );
    } else {
      batch.delete(discoverRef);
    }
  } else {
    batch.delete(discoverRef);
  }

  await batch.commit();
  await syncProfileAcrossTeams(userId, nextPrivateProfile, updatedAt);
}

/**
 * Сохраняет черновик опросника в 'profiles/{userId}' без сброса questionnaireCompleted.
 * Вызывается автоматически через debounce из useQuestionnaireForm.
 * Не обновляет discoverProfiles — только черновик.
 *
 * @param {string} userId
 * @param {Object} payload
 */
export async function saveQuestionnaireDraft(userId, payload) {
  assertCurrentUser(userId);

  const privateRef = doc(db, 'profiles', userId);
  const privateSnapshot = await getDoc(privateRef);
  const currentProfile = privateSnapshot.data() || {};
  const createdAt = currentProfile.createdAt || nowIso();
  const updatedAt = nowIso();
  const nextPayload = sanitizeProfilePatch(payload);

  await setDoc(
    privateRef,
    {
      ...currentProfile,
      userId,
      ...nextPayload,
      questionnaireCompleted: currentProfile.questionnaireCompleted || false,
      createdAt,
      updatedAt,
    },
    { merge: true },
  );
}

export async function createTeamWithInvites({
  name,
  description,
  goal,
  creatorProfile,
  invitedProfiles = [],
}) {
  assertCurrentUser(creatorProfile.userId);

  if (!hasComparableProfileData(creatorProfile)) {
    throw new Error('invalid-profile-data');
  }

  const timestamp = nowIso();
  const teamRef = doc(collection(db, 'teams'));
  const joinCode = await reserveUniqueTeamJoinCode();
  const joinCodeRef = doc(db, 'teamJoinCodes', joinCode);
  const creatorSnapshot = buildMemberSnapshot(creatorProfile);
  if (!creatorSnapshot) {
    throw new Error('invalid-profile-data');
  }
  const uniqueInvitedProfiles = invitedProfiles.filter(
    (item, index, items) =>
      item.userId !== creatorProfile.userId &&
      hasComparableProfileData(item) &&
      items.findIndex((candidate) => candidate.userId === item.userId) === index,
  );

  const batch = writeBatch(db);
  batch.set(teamRef, {
    name,
    description,
    goal,
    joinCode,
    createdBy: creatorProfile.userId,
    ownerId: creatorProfile.userId,
    roles: { [creatorProfile.userId]: 'owner' },
    memberIds: [creatorProfile.userId],
    memberSnapshots: [creatorSnapshot],
    analysis: buildTeamAnalysis([creatorSnapshot]),
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  batch.set(
    joinCodeRef,
    buildTeamJoinCodeDoc({
      code: joinCode,
      teamId: teamRef.id,
      name,
      description,
      goal,
      creatorProfile,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  );

  uniqueInvitedProfiles.forEach((profile) => {
    const inviteRef = doc(db, 'teamInvites', `${teamRef.id}_${profile.userId}`);
    batch.set(inviteRef, {
      teamId: teamRef.id,
      teamName: name,
      teamDescription: description,
      teamGoal: goal,
      fromUid: creatorProfile.userId,
      fromName: creatorProfile.name,
      fromAvatarInitials: creatorProfile.avatarInitials,
      toUid: profile.userId,
      toName: profile.name,
      toAvatarInitials: profile.avatarInitials,
      status: 'pending',
      source: 'direct',
      joinCode: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  await batch.commit();
  return teamRef.id;
}

export async function ensureTeamJoinCode(team, creatorProfile) {
  assertCurrentUser(creatorProfile.userId);

  if (!canTeamMember(team, creatorProfile.userId, 'invite')) {
    throw new Error('team-permission-denied');
  }

  if (team.joinCode) {
    return team.joinCode;
  }

  const code = await reserveUniqueTeamJoinCode();
  const updatedAt = nowIso();
  const teamRef = doc(db, 'teams', team.id);
  const joinCodeRef = doc(db, 'teamJoinCodes', code);
  const batch = writeBatch(db);

  batch.set(
    teamRef,
    {
      joinCode: code,
      updatedAt,
    },
    { merge: true },
  );
  batch.set(
    joinCodeRef,
    buildTeamJoinCodeDoc({
      code,
      teamId: team.id,
      name: team.name,
      description: team.description,
      goal: team.goal,
      creatorProfile,
      createdAt: team.createdAt || updatedAt,
      updatedAt,
    }),
  );

  await batch.commit();
  return code;
}

export async function requestTeamInviteByCode(code, profile) {
  assertCurrentUser(profile.userId);

  if (!hasComparableProfileData(profile)) {
    throw new Error('invalid-profile-data');
  }

  const normalizedCode = normalizeTeamJoinCode(code);

  if (normalizedCode.length < 6) {
    throw new Error('invalid-code');
  }

  const joinCodeRef = doc(db, 'teamJoinCodes', normalizedCode);
  const joinCodeSnapshot = await getDoc(joinCodeRef);

  if (!joinCodeSnapshot.exists() || joinCodeSnapshot.data()?.active !== true) {
    throw new Error('code-not-found');
  }

  const joinCodeData = joinCodeSnapshot.data();

  if (joinCodeData.createdBy === profile.userId) {
    throw new Error('own-team');
  }

  const existingInvitesSnapshot = await getDocs(
    query(
      collection(db, 'teamInvites'),
      where('teamId', '==', joinCodeData.teamId),
      where('toUid', '==', profile.userId),
      limit(1),
    ),
  );
  const currentInvite = existingInvitesSnapshot.docs[0]?.data();
  const inviteRef = doc(
    db,
    'teamInvites',
    `${joinCodeData.teamId}_${profile.userId}`,
  );

  if (
    currentInvite?.status === 'accepted' &&
    (await isTeamMember(joinCodeData.teamId))
  ) {
    throw new Error('already-joined');
  }

  if (currentInvite?.status === 'pending') {
    throw new Error('invite-already-pending');
  }

  const timestamp = nowIso();

  await setDoc(inviteRef, {
    teamId: joinCodeData.teamId,
    teamName: joinCodeData.teamName,
    teamDescription: joinCodeData.teamDescription,
    teamGoal: joinCodeData.teamGoal,
    fromUid: joinCodeData.createdBy,
    fromName: joinCodeData.createdByName,
    fromAvatarInitials: joinCodeData.createdByAvatarInitials,
    toUid: profile.userId,
    toName: profile.name,
    toAvatarInitials: profile.avatarInitials,
    status: 'pending',
    source: 'code',
    joinCode: normalizedCode,
    createdAt: currentInvite?.createdAt || timestamp,
    updatedAt: timestamp,
  });

  return {
    teamId: joinCodeData.teamId,
    teamName: joinCodeData.teamName,
  };
}

export async function acceptTeamInvite(inviteId, profile) {
  assertCurrentUser(profile.userId);

  if (!hasComparableProfileData(profile)) {
    throw new Error('invalid-profile-data');
  }

  const inviteRef = doc(db, 'teamInvites', inviteId);
  const inviteSnapshot = await getDoc(inviteRef);

  if (!inviteSnapshot.exists()) {
    throw new Error('Invite not found');
  }

  const invite = inviteSnapshot.data();
  if (invite.toUid !== profile.userId || invite.status !== 'pending') {
    throw new Error('invalid-invite-state');
  }

  const teamRef = doc(db, 'teams', invite.teamId);
  const teamSnapshot = await getDoc(teamRef);

  if (!teamSnapshot.exists()) {
    throw new Error('Team not found');
  }

  const team = sanitizeTeam(teamSnapshot.data(), teamSnapshot.id);
  const currentMemberSnapshots = team.memberSnapshots || [];
  const ownSnapshot = buildMemberSnapshot(profile);
  if (!ownSnapshot) {
    throw new Error('invalid-profile-data');
  }
  const nextMemberSnapshots = [
    ...currentMemberSnapshots.filter((item) => item.userId !== profile.userId),
    ownSnapshot,
  ];
  const nextMemberIds = Array.from(
    new Set([...(team.memberIds || []), profile.userId]),
  );
  const updatedAt = nowIso();
  const batch = writeBatch(db);

  batch.set(
    teamRef,
    {
      memberIds: nextMemberIds,
      memberSnapshots: nextMemberSnapshots,
      analysis: buildTeamAnalysis(nextMemberSnapshots),
      updatedAt,
    },
    { merge: true },
  );
  batch.set(
    inviteRef,
    {
      status: 'accepted',
      respondedAt: updatedAt,
      updatedAt,
    },
    { merge: true },
  );

  await batch.commit();
}

export async function declineTeamInvite(inviteId) {
  const inviteRef = doc(db, 'teamInvites', inviteId);
  const inviteSnapshot = await getDoc(inviteRef);

  if (!inviteSnapshot.exists()) {
    throw new Error('Invite not found');
  }

  const invite = inviteSnapshot.data();

  if (
    invite.toUid !== auth.currentUser?.uid ||
    invite.status !== 'pending'
  ) {
    throw new Error('invalid-invite-state');
  }

  await setDoc(
    inviteRef,
    {
      status: 'declined',
      respondedAt: nowIso(),
      updatedAt: nowIso(),
    },
    { merge: true },
  );
}

function assertTeamPermission(team, userId, action) {
  if (!canTeamMember(team, userId, action)) {
    throw new Error('team-permission-denied');
  }
}

async function readTeamInTransaction(transaction, teamId) {
  const teamRef = doc(db, 'teams', teamId);
  const snapshot = await transaction.get(teamRef);

  if (!snapshot.exists()) {
    throw new Error('team-not-found');
  }

  return {
    teamRef,
    rawTeam: snapshot.data(),
    team: sanitizeTeam(snapshot.data(), snapshot.id),
  };
}

function normalizeTeamInfo({ name, description, goal }) {
  const nextInfo = {
    name: String(name || '').trim(),
    description: String(description || '').trim(),
    goal: String(goal || '').trim(),
  };

  if (!nextInfo.name || !nextInfo.description) {
    throw new Error('invalid-team-info');
  }

  return nextInfo;
}

/**
 * Меняет название, описание и цель команды (владелец и админы).
 * Синхронно обновляет карточку кода приглашения, чтобы новые заявки по коду
 * показывали актуальное название.
 */
export async function updateTeamInfo(team, actorId, info) {
  assertCurrentUser(actorId);
  assertTeamPermission(team, actorId, 'editInfo');

  const nextInfo = normalizeTeamInfo(info);
  const updatedAt = nowIso();
  const batch = writeBatch(db);

  batch.update(doc(db, 'teams', team.id), { ...nextInfo, updatedAt });

  if (team.joinCode) {
    batch.update(doc(db, 'teamJoinCodes', team.joinCode), {
      teamName: nextInfo.name,
      teamDescription: nextInfo.description,
      teamGoal: nextInfo.goal,
      updatedAt,
    });
  }

  await batch.commit();
}

/**
 * Отправляет прямые приглашения в существующую команду (владелец и админы).
 * Повторное приглашение перезаписывает старое отклонённое/закрытое.
 */
export async function inviteMembersToTeam(team, actorProfile, invitedProfiles = []) {
  assertCurrentUser(actorProfile.userId);
  assertTeamPermission(team, actorProfile.userId, 'invite');

  const targets = invitedProfiles.filter(
    (item, index, items) =>
      item?.userId &&
      !team.memberIds.includes(item.userId) &&
      items.findIndex((candidate) => candidate.userId === item.userId) === index,
  );

  if (targets.length === 0) {
    return 0;
  }

  const timestamp = nowIso();
  const batch = writeBatch(db);

  targets.forEach((profile) => {
    batch.set(doc(db, 'teamInvites', `${team.id}_${profile.userId}`), {
      teamId: team.id,
      teamName: team.name,
      teamDescription: team.description,
      teamGoal: team.goal,
      fromUid: actorProfile.userId,
      fromName: actorProfile.name,
      fromAvatarInitials: actorProfile.avatarInitials,
      toUid: profile.userId,
      toName: profile.name,
      toAvatarInitials: profile.avatarInitials,
      status: 'pending',
      source: 'direct',
      joinCode: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  await batch.commit();
  return targets.length;
}

/**
 * Назначает участнику роль admin / lead / member.
 * Владельца менять нельзя (только передачей владения), себя — тоже.
 * Роль 'member' хранится как отсутствие ключа в карте roles.
 */
export async function setTeamMemberRole(teamId, actorId, targetId, role) {
  assertCurrentUser(actorId);

  if (!ASSIGNABLE_TEAM_ROLES.includes(role)) {
    throw new Error('invalid-team-role');
  }

  await runTransaction(db, async (transaction) => {
    const { teamRef, team } = await readTeamInTransaction(transaction, teamId);

    if (!canManageMember(team, actorId, targetId)) {
      throw new Error('team-permission-denied');
    }

    if (getTeamRole(team, targetId) === role) {
      return;
    }

    transaction.update(teamRef, {
      [`roles.${targetId}`]: role === 'member' ? deleteField() : role,
      updatedAt: nowIso(),
    });
  });
}

async function removeUserFromTeam(teamId, actorId, targetId) {
  await runTransaction(db, async (transaction) => {
    const { teamRef, rawTeam, team } = await readTeamInTransaction(
      transaction,
      teamId,
    );
    const isSelf = actorId === targetId;

    if (isSelf ? !canTeamMember(team, actorId, 'leave') : !canManageMember(team, actorId, targetId)) {
      throw new Error('team-permission-denied');
    }

    // Фильтруем сырые массивы: правила сверяют размеры со старым документом.
    const nextMemberSnapshots = (rawTeam.memberSnapshots || []).filter(
      (item) => item?.userId !== targetId,
    );
    const patch = {
      memberIds: (rawTeam.memberIds || []).filter((item) => item !== targetId),
      memberSnapshots: nextMemberSnapshots,
      analysis: buildTeamAnalysis(nextMemberSnapshots),
      updatedAt: nowIso(),
    };

    if (rawTeam.roles && Object.hasOwn(rawTeam.roles, targetId)) {
      patch[`roles.${targetId}`] = deleteField();
    }

    transaction.update(teamRef, patch);
  });
}

/** Исключает участника из команды (владелец и админы; владельца исключить нельзя). */
export async function removeTeamMember(teamId, actorId, targetId) {
  assertCurrentUser(actorId);
  await removeUserFromTeam(teamId, actorId, targetId);
}

/** Выход из команды. Владельцу сначала нужно передать владение или удалить команду. */
export async function leaveTeam(teamId, userId) {
  assertCurrentUser(userId);
  await removeUserFromTeam(teamId, userId, userId);
}

/** Передаёт владение другому участнику; прежний владелец становится админом. */
export async function transferTeamOwnership(teamId, actorId, nextOwnerId) {
  assertCurrentUser(actorId);

  await runTransaction(db, async (transaction) => {
    const { teamRef, team } = await readTeamInTransaction(transaction, teamId);

    if (
      getTeamOwnerId(team) !== actorId ||
      nextOwnerId === actorId ||
      !team.memberIds.includes(nextOwnerId)
    ) {
      throw new Error('team-permission-denied');
    }

    transaction.update(teamRef, {
      ownerId: nextOwnerId,
      [`roles.${nextOwnerId}`]: 'owner',
      [`roles.${actorId}`]: 'admin',
      updatedAt: nowIso(),
    });
  });
}

/** Удаляет команду (только владелец) и выключает её код приглашения. */
export async function deleteTeam(team, actorId) {
  assertCurrentUser(actorId);
  assertTeamPermission(team, actorId, 'deleteTeam');

  const batch = writeBatch(db);
  batch.delete(doc(db, 'teams', team.id));

  if (team.joinCode) {
    batch.update(doc(db, 'teamJoinCodes', team.joinCode), {
      active: false,
      updatedAt: nowIso(),
    });
  }

  await batch.commit();
}

export async function saveMatchDecision(payload) {
  assertCurrentUser(payload?.fromUid);

  const normalizedPayload = normalizeMatchDecisionPayload(payload);

  if (
    !normalizedPayload.fromUid ||
    !normalizedPayload.toUid ||
    normalizedPayload.fromUid === normalizedPayload.toUid
  ) {
    throw new Error('invalid-match-action');
  }

  const actionId = `${normalizedPayload.fromUid}_${normalizedPayload.toUid}`;
  const actionRef = doc(db, 'matchActions', actionId);
  const existingSnapshot = await getDoc(actionRef);
  const createdAt = existingSnapshot.data()?.createdAt || nowIso();

  await setDoc(
    actionRef,
    {
      id: actionId,
      ...normalizedPayload,
      updatedAt: nowIso(),
      createdAt,
    },
    { merge: true },
  );

  return actionId;
}

export async function getMatchDecision(fromUid, toUid) {
  const snapshot = await getDoc(doc(db, 'matchActions', `${fromUid}_${toUid}`));
  return snapshot.exists() ? snapshot.data() : null;
}

export function subscribeOwnMatchDecisions(userId, callback, onError) {
  const matchQuery = query(
    collection(db, 'matchActions'),
    where('fromUid', '==', userId),
  );

  return onSnapshot(
    matchQuery,
    (snapshot) => {
      callback(snapshot.docs.map((item) => sanitizeMatchAction(item.data())).filter(Boolean));
    },
    onError,
  );
}

export function subscribeIncomingMatchDecisions(userId, callback, onError) {
  const matchQuery = query(
    collection(db, 'matchActions'),
    where('toUid', '==', userId),
  );

  return onSnapshot(
    matchQuery,
    (snapshot) => {
      callback(snapshot.docs.map((item) => sanitizeMatchAction(item.data())).filter(Boolean));
    },
    onError,
  );
}
