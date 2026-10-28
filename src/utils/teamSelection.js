import { calculateCompatibility } from './compatibility';
import {
  FUNCTIONAL_ROLE_KEYS,
  getFunctionFit,
  suggestFunctionAssignment,
} from './teamFunctions';

/**
 * Подбор команды: из выбранных кандидатов перебором ищутся составы,
 * которые лучше всего совпадают.
 *
 * Оценка состава (0–100):
 * - «химия» — 70% средней совместимости пар + 30% самой слабой пары
 *   (одна конфликтная пара тянет вниз всю команду);
 * - роли — закрыты ли роли в работе и насколько люди подходят под свои
 *   (teamFunctions.js). Итог: 75% химии + 25% ролей.
 */

export const GROUP_SIZE_OPTIONS = [2, 3, 4, 5, 6];
export const MAX_SELECTION_CANDIDATES = 20;

// Роли считаются дороже пар, поэтому сначала отбор по химии, потом пересчёт лучших.
const ROLE_RERANK_LIMIT = 60;
const RESULT_LIMIT = 5;

function pairKey(firstId, secondId) {
  return firstId < secondId ? `${firstId}|${secondId}` : `${secondId}|${firstId}`;
}

function buildPairTable(profiles) {
  const table = new Map();

  profiles.forEach((left, index) => {
    profiles.slice(index + 1).forEach((right) => {
      table.set(pairKey(left.userId, right.userId), calculateCompatibility(left, right).compatibility);
    });
  });

  return table;
}

function forEachCombination(items, size, callback, start = 0, prefix = []) {
  if (prefix.length === size) {
    callback(prefix);
    return;
  }

  for (let index = start; index <= items.length - (size - prefix.length); index += 1) {
    prefix.push(items[index]);
    forEachCombination(items, size, callback, index + 1, prefix);
    prefix.pop();
  }
}

function measureChemistry(members, pairTable) {
  let sum = 0;
  let count = 0;
  let weakest = null;

  members.forEach((left, index) => {
    members.slice(index + 1).forEach((right) => {
      const compatibility = pairTable.get(pairKey(left.userId, right.userId));
      sum += compatibility;
      count += 1;

      if (!weakest || compatibility < weakest.compatibility) {
        weakest = { left, right, compatibility };
      }
    });
  });

  const average = count > 0 ? sum / count : 0;

  return {
    average,
    weakest,
    chemistry: average * 0.7 + (weakest?.compatibility ?? average) * 0.3,
  };
}

function measureRoles(members) {
  const roles = suggestFunctionAssignment(members);
  const covered = new Set(Object.values(roles));
  const needed = Math.min(members.length, FUNCTIONAL_ROLE_KEYS.length);
  const averageFit =
    members.reduce((sum, member) => sum + getFunctionFit(member, roles[member.userId]), 0) /
    members.length;

  return {
    roles,
    missingRoles: FUNCTIONAL_ROLE_KEYS.filter((roleKey) => !covered.has(roleKey)),
    roleScore: (Math.min(covered.size, needed) / needed) * 50 + averageFit * 5,
  };
}

export function getGroupVerdict(score) {
  if (score >= 75) {
    return { label: 'Сильный состав', tone: 'good' };
  }

  if (score >= 60) {
    return { label: 'Рабочий состав', tone: 'ok' };
  }

  return { label: 'Рискованный состав', tone: 'risk' };
}

/**
 * @param {Object[]} candidates - профили кандидатов (с factorScores)
 * @param {{ size: number, anchor?: Object }} options - anchor всегда в составе (например, сам HR)
 * @returns {Array<{ members, score, averageCompatibility, weakestPair, roles, missingRoles }>}
 */
export function findBestGroups(candidates, { size, anchor = null }) {
  const pool = candidates.filter((item) => item.userId !== anchor?.userId);
  const pickCount = anchor ? size - 1 : size;

  if (pickCount < 1 || pool.length < pickCount) {
    return [];
  }

  const pairTable = buildPairTable(anchor ? [anchor, ...pool] : pool);
  const shortlist = [];

  forEachCombination(pool, pickCount, (picked) => {
    const members = anchor ? [anchor, ...picked] : [...picked];
    shortlist.push({ members, ...measureChemistry(members, pairTable) });
  });

  return shortlist
    .sort((left, right) => right.chemistry - left.chemistry)
    .slice(0, ROLE_RERANK_LIMIT)
    .map((group) => {
      const { roles, missingRoles, roleScore } = measureRoles(group.members);

      return {
        members: group.members,
        score: Math.round(group.chemistry * 0.75 + roleScore * 0.25),
        averageCompatibility: Math.round(group.average),
        weakestPair: group.weakest,
        roles,
        missingRoles,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, RESULT_LIMIT);
}

/**
 * Кандидаты в команду: друзья и взаимные совпадения без повторов.
 * У каждого sources — откуда человек: 'friend' и/или 'match'.
 */
export function mergeInviteCandidates(mutualMatches, friendProfiles) {
  const byId = new Map();

  friendProfiles.forEach((profile) => {
    byId.set(profile.userId, { ...profile, sources: ['friend'] });
  });
  mutualMatches.forEach((profile) => {
    const existing = byId.get(profile.userId);
    byId.set(
      profile.userId,
      existing ? { ...existing, sources: ['friend', 'match'] } : { ...profile, sources: ['match'] },
    );
  });

  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name, 'ru'));
}
