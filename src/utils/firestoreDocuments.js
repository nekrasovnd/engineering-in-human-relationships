import { FACTOR_KEYS, buildSystemIndices } from '../data/questionnaire';

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

  return {
    id: sanitizeRequiredText(teamId),
    name: sanitizeRequiredText(team?.name),
    description: sanitizeOptionalText(team?.description),
    goal: sanitizeOptionalText(team?.goal),
    joinCode: sanitizeOptionalText(team?.joinCode),
    createdBy: sanitizeRequiredText(team?.createdBy),
    memberIds,
    memberSnapshots,
    analysis:
      team?.analysis && typeof team.analysis === 'object' ? team.analysis : null,
    createdAt: sanitizeOptionalText(team?.createdAt),
    updatedAt: sanitizeOptionalText(team?.updatedAt),
  };
}
