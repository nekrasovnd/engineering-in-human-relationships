import { sanitizeComparableProfile, sanitizeMatchAction } from './firestoreDocuments';

export function mergeComparisonCandidates(mutualMatches, teams, currentUserId) {
  const candidateMap = new Map();

  mutualMatches
    .map((item) => sanitizeComparableProfile(item))
    .filter(Boolean)
    .forEach((item) => {
      candidateMap.set(item.userId, item);
    });

  teams.forEach((team) => {
    (team.memberSnapshots || []).forEach((member) => {
      const normalizedMember = sanitizeComparableProfile(member);

      if (!normalizedMember || normalizedMember.userId === currentUserId) {
        return;
      }

      if (!candidateMap.has(normalizedMember.userId)) {
        candidateMap.set(normalizedMember.userId, normalizedMember);
      }
    });
  });

  return Array.from(candidateMap.values()).sort((left, right) =>
    (left.name || '').localeCompare(right.name || '', 'ru'),
  );
}

export function buildDecisionMap(decisions) {
  return decisions.reduce((result, item) => {
    const normalizedDecision = sanitizeMatchAction(item);

    if (normalizedDecision) {
      result[normalizedDecision.toUid] = normalizedDecision.decision;
    }

    return result;
  }, {});
}

export function buildUndecidedProfiles(profiles, decisions) {
  const decidedMap = buildDecisionMap(decisions);
  return profiles.filter((candidate) => !decidedMap[candidate.userId]);
}
