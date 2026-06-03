import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  buildTeamSummary,
  findMostConflictPair,
  getRecommendedRoles,
} from '../utils/teamAnalysis';

const nowIso = () => new Date().toISOString();
const TEAM_JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TEAM_JOIN_CODE_LENGTH = 8;
const DISCOVER_PROFILE_FIELDS = [
  'userId',
  'name',
  'age',
  'gender',
  'avatarInitials',
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

function buildMemberSnapshot(profile) {
  return {
    userId: profile.userId,
    name: profile.name,
    avatarInitials: profile.avatarInitials,
    egoState: profile.egoState,
    factorScores: profile.factorScores,
    factorReliability: profile.factorReliability,
    systemIndices: profile.systemIndices,
    profileIntegrity: profile.profileIntegrity,
  };
}

function buildTeamAnalysis(memberProfiles) {
  const roles = getRecommendedRoles(memberProfiles);
  const conflictPair = findMostConflictPair(memberProfiles);

  return {
    summary: buildTeamSummary(memberProfiles),
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

function buildDiscoverProfile(profile, createdAt, updatedAt) {
  return {
    ...pickProfileFields(profile, DISCOVER_PROFILE_FIELDS),
    discoverVisible: true,
    createdAt,
    updatedAt,
  };
}

export async function saveProfile(userId, payload) {
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
  const nextPrivateProfile = {
    ...(privateSnapshot.data() || {}),
    userId,
    discoverVisible:
      payload.discoverVisible ??
      privateSnapshot.data()?.discoverVisible ??
      false,
    ...payload,
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

    batch.set(
      discoverRef,
      buildDiscoverProfile(
        nextPrivateProfile,
        discoverCreatedAt,
        updatedAt,
      ),
      { merge: true },
    );
  } else {
    batch.delete(discoverRef);
  }

  await batch.commit();
}

export async function saveQuestionnaireDraft(userId, payload) {
  const privateRef = doc(db, 'profiles', userId);
  const privateSnapshot = await getDoc(privateRef);
  const currentProfile = privateSnapshot.data() || {};
  const createdAt = currentProfile.createdAt || nowIso();
  const updatedAt = nowIso();

  await setDoc(
    privateRef,
    {
      ...currentProfile,
      userId,
      ...payload,
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
  const timestamp = nowIso();
  const teamRef = doc(collection(db, 'teams'));
  const joinCode = await reserveUniqueTeamJoinCode();
  const joinCodeRef = doc(db, 'teamJoinCodes', joinCode);
  const creatorSnapshot = buildMemberSnapshot(creatorProfile);
  const uniqueInvitedProfiles = invitedProfiles.filter(
    (item, index, items) =>
      item.userId !== creatorProfile.userId &&
      items.findIndex((candidate) => candidate.userId === item.userId) === index,
  );

  const batch = writeBatch(db);
  batch.set(teamRef, {
    name,
    description,
    goal,
    joinCode,
    createdBy: creatorProfile.userId,
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

  if (currentInvite?.status === 'accepted') {
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
  const inviteRef = doc(db, 'teamInvites', inviteId);
  const inviteSnapshot = await getDoc(inviteRef);

  if (!inviteSnapshot.exists()) {
    throw new Error('Invite not found');
  }

  const invite = inviteSnapshot.data();
  const teamRef = doc(db, 'teams', invite.teamId);
  const teamSnapshot = await getDoc(teamRef);

  if (!teamSnapshot.exists()) {
    throw new Error('Team not found');
  }

  const team = teamSnapshot.data();
  const currentMemberSnapshots = team.memberSnapshots || [];
  const ownSnapshot = buildMemberSnapshot(profile);
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

export async function saveMatchDecision(payload) {
  const actionId = `${payload.fromUid}_${payload.toUid}`;
  const actionRef = doc(db, 'matchActions', actionId);
  const existingSnapshot = await getDoc(actionRef);
  const createdAt = existingSnapshot.data()?.createdAt || nowIso();

  await setDoc(
    actionRef,
    {
      id: actionId,
      ...payload,
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
      callback(snapshot.docs.map((item) => item.data()));
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
      callback(snapshot.docs.map((item) => item.data()));
    },
    onError,
  );
}
