import { getDisplayFactorScore } from '../data/questionnaire';
import { hasComparableProfileData } from './compatibility';

/**
 * Функциональные роли в работе (кто чем занимается) и уровень квалификации.
 * Не путать с ролями прав (teamRoles.js): тимлид может быть аналитиком,
 * владелец — разработчиком.
 *
 * Хранение в документе 'teams/{teamId}':
 * - functionalRoles — { [uid]: 'hr' | 'researcher' | 'analyst' | 'developer' }
 * - qualifications  — { [uid]: 'junior' | 'middle' | 'senior' }
 * Назначают владелец и админы. Значения продублированы в firebase/firestore.rules.
 *
 * Подсказки считаются по анкете без нейросети: у каждой роли есть веса
 * факторов, у руководителя дополнительно учитывается квалификация.
 */

export const FUNCTIONAL_ROLE_KEYS = ['hr', 'researcher', 'analyst', 'developer'];
export const QUALIFICATION_KEYS = ['junior', 'middle', 'senior'];

// Слагаемые оценки: значение 0–10 из анкеты и как его назвать в подсказке.
const DRIVERS = {
  dominance: {
    value: (scores) => scores.dominance,
    label: 'берёт управление на себя',
  },
  empathy: {
    value: (scores) => scores.empathy,
    label: 'чувствует состояние людей',
  },
  extraversion: {
    value: (scores) => scores.extraversion,
    label: 'легко заходит в контакт',
  },
  cooperation: {
    value: (scores) => scores.cooperation,
    label: 'настроен на сотрудничество',
  },
  stability: {
    value: (scores) => getDisplayFactorScore('neuroticism', scores.neuroticism),
    label: 'сохраняет спокойствие',
  },
  flexibility: {
    value: (scores) => 10 - scores.ruleAdaptation,
    label: 'не боится выходить за рамки',
  },
  structure: {
    value: (scores) => scores.ruleAdaptation,
    label: 'любит структуру и порядок',
  },
  focus: {
    value: (scores) => 10 - scores.extraversion,
    label: 'может долго работать сосредоточенно',
  },
  stress: {
    value: (scores) => scores.stressResponse,
    label: 'держится под нагрузкой',
  },
  autonomy: {
    value: (scores) => 10 - scores.feedbackNeed,
    label: 'работает автономно',
  },
};

export const FUNCTIONAL_ROLES = {
  hr: {
    key: 'hr',
    label: 'HR / руководитель',
    shortLabel: 'Руководитель',
    description: 'Собирает состав, распределяет роли, держит сроки и климат в команде.',
    weights: { dominance: 0.3, empathy: 0.25, extraversion: 0.2, cooperation: 0.15, stability: 0.1 },
    // Ведёт людей — опыт важнее всего здесь.
    qualificationBonus: { junior: -1.5, middle: 0, senior: 1 },
    priority: 1,
  },
  researcher: {
    key: 'researcher',
    label: 'Исследователь',
    shortLabel: 'Исследователь',
    description: 'Ищет новое: интервью, гипотезы, разведка вариантов решения.',
    weights: { flexibility: 0.35, empathy: 0.25, extraversion: 0.2, stability: 0.2 },
    priority: 0,
  },
  analyst: {
    key: 'analyst',
    label: 'Аналитик',
    shortLabel: 'Аналитик',
    description: 'Структурирует данные и требования, проверяет гипотезы цифрами.',
    weights: { structure: 0.35, stability: 0.25, focus: 0.2, stress: 0.2 },
    priority: 0.25,
  },
  developer: {
    key: 'developer',
    label: 'Разработчик',
    shortLabel: 'Разработчик',
    description: 'Доводит решение до результата: делает, тестирует, выпускает.',
    weights: { stress: 0.3, autonomy: 0.25, stability: 0.25, structure: 0.2 },
    priority: 0.5,
  },
};

export const QUALIFICATIONS = {
  junior: { key: 'junior', label: 'Junior', description: 'Начинающий, нужен наставник' },
  middle: { key: 'middle', label: 'Middle', description: 'Самостоятельный специалист' },
  senior: { key: 'senior', label: 'Senior', description: 'Опытный, может вести других' },
};

// Если сильные стороны подходят к другой роли настолько лучше — подсказываем.
const MISMATCH_GAP = 1.5;
// Бонус за закрытие пустой роли (в баллах соответствия 0–10).
const COVERAGE_BONUS = 2;
// Полный перебор назначений — до этого размера, дальше жадно.
const EXHAUSTIVE_LIMIT = 12;

export function getFunctionalRoleLabel(roleKey) {
  return FUNCTIONAL_ROLES[roleKey]?.label || '';
}

export function getQualificationLabel(levelKey) {
  return QUALIFICATIONS[levelKey]?.label || '';
}

function round(value) {
  return Number(value.toFixed(1));
}

/** Насколько роль подходит по анкете (0–10) с учётом квалификации. */
export function getFunctionFit(profile, roleKey, qualification = '') {
  const role = FUNCTIONAL_ROLES[roleKey];
  const base = Object.entries(role.weights).reduce(
    (sum, [driver, weight]) => sum + DRIVERS[driver].value(profile.factorScores) * weight,
    0,
  );
  const bonus = role.qualificationBonus?.[qualification] || 0;

  return round(Math.min(10, Math.max(0, base + bonus)));
}

/** Сильные стороны под роль: две самые выраженные черты из её формулы. */
export function getFunctionReason(profile, roleKey) {
  const drivers = Object.keys(FUNCTIONAL_ROLES[roleKey].weights)
    .map((driver) => ({
      label: DRIVERS[driver].label,
      value: DRIVERS[driver].value(profile.factorScores),
    }))
    .filter((item) => item.value >= 6)
    .sort((left, right) => right.value - left.value)
    .slice(0, 2);

  return drivers.length > 0
    ? drivers.map((item) => item.label).join(', ')
    : 'ярко выраженных черт анкета не показала';
}

/** Все роли для человека, от самой подходящей. */
export function getMemberFunctionFits(profile, qualification = '') {
  return FUNCTIONAL_ROLE_KEYS.map((roleKey) => ({
    role: roleKey,
    fit: getFunctionFit(profile, roleKey, qualification),
  })).sort((left, right) => right.fit - left.fit);
}

function getBestRole(fits) {
  return FUNCTIONAL_ROLE_KEYS.reduce((top, roleKey) =>
    fits[roleKey] > fits[top] ? roleKey : top,
  );
}

/**
 * Подсказка для людей без роли. Каждую ещё не занятую роль может закрыть
 * один человек (за это бонус COVERAGE_BONUS), остальные получают свою
 * лучшую роль. Ищется вариант с максимальным суммарным соответствием —
 * компромисс между «у каждой роли есть хозяин» и «каждый на своём месте».
 *
 * @param {Object[]} profiles - профили людей без роли (с factorScores)
 * @param {Object} qualifications - { [uid]: уровень }
 * @param {string[]} coveredRoles - роли, которые уже кто-то занимает
 * @returns {Object} { [uid]: роль }
 */
export function suggestFunctionAssignment(profiles, qualifications = {}, coveredRoles = []) {
  const fitTable = Object.fromEntries(
    profiles.map((profile) => [
      profile.userId,
      Object.fromEntries(
        FUNCTIONAL_ROLE_KEYS.map((roleKey) => [
          roleKey,
          getFunctionFit(profile, roleKey, qualifications[profile.userId]),
        ]),
      ),
    ]),
  );
  const userIds = profiles.map((profile) => profile.userId);
  const bestRoles = Object.fromEntries(
    userIds.map((userId) => [userId, getBestRole(fitTable[userId])]),
  );
  const openRoles = FUNCTIONAL_ROLE_KEYS.filter((roleKey) => !coveredRoles.includes(roleKey));
  // Выигрыш, если человек закрывает пустую роль вместо своей лучшей.
  const gain = (userId, roleKey) =>
    fitTable[userId][roleKey] +
    COVERAGE_BONUS +
    FUNCTIONAL_ROLES[roleKey].priority -
    fitTable[userId][bestRoles[userId]];
  let picks = {};

  if (userIds.length <= EXHAUSTIVE_LIMIT) {
    let bestGain = 0;
    const walk = (roleIndex, used, current, total) => {
      if (roleIndex === openRoles.length) {
        if (total > bestGain) {
          bestGain = total;
          picks = { ...current };
        }
        return;
      }

      const roleKey = openRoles[roleIndex];
      walk(roleIndex + 1, used, current, total);
      userIds.forEach((userId) => {
        if (!used.has(userId)) {
          used.add(userId);
          walk(roleIndex + 1, used, { ...current, [userId]: roleKey }, total + gain(userId, roleKey));
          used.delete(userId);
        }
      });
    };
    walk(0, new Set(), {}, 0);
  } else {
    openRoles.forEach((roleKey) => {
      const [userId] = userIds
        .filter((item) => !picks[item])
        .sort((left, right) => gain(right, roleKey) - gain(left, roleKey));
      if (userId && gain(userId, roleKey) > 0) {
        picks[userId] = roleKey;
      }
    });
  }

  return Object.fromEntries(userIds.map((userId) => [userId, picks[userId] || bestRoles[userId]]));
}

function formatNames(members) {
  return members.map((member) => member.name).join(', ');
}

/**
 * Подсказки по распределению ролей для страницы команды.
 *
 * @returns {{
 *   members: Array<{ userId, name, role, qualification, hasProfile, fits, suggested, reason, hint, hintRole }>,
 *   warnings: Array<{ tone: 'warning' | 'info', text: string }>,
 *   unassignedSuggestions: Object
 * }}
 */
export function buildFunctionHints(team, members) {
  const functionalRoles = team?.functionalRoles || {};
  const qualifications = team?.qualifications || {};
  const profiled = members.filter(hasComparableProfileData);
  const suggestion = suggestFunctionAssignment(
    profiled.filter((member) => !functionalRoles[member.userId]),
    qualifications,
    Object.values(functionalRoles),
  );

  const rows = members.map((member) => {
    const role = functionalRoles[member.userId] || '';
    const qualification = qualifications[member.userId] || '';

    if (!hasComparableProfileData(member)) {
      return {
        userId: member.userId,
        name: member.name,
        role,
        qualification,
        hasProfile: false,
        fits: [],
        suggested: '',
        reason: '',
        hint: '',
        hintRole: '',
      };
    }

    const fits = getMemberFunctionFits(member, qualification);
    const fitByRole = Object.fromEntries(fits.map((item) => [item.role, item.fit]));
    const suggested = suggestion[member.userId] || '';
    let hint = '';
    let hintRole = '';

    if (!role) {
      hintRole = suggested;
      hint = `Предлагаем роль «${getFunctionalRoleLabel(suggested)}».`;
    } else if (fits[0].role !== role && fits[0].fit - fitByRole[role] >= MISMATCH_GAP) {
      hintRole = fits[0].role;
      hint = `Сильные стороны ближе к роли «${getFunctionalRoleLabel(fits[0].role)}» (${fits[0].fit} против ${fitByRole[role]}).`;
    }

    return {
      userId: member.userId,
      name: member.name,
      role,
      qualification,
      hasProfile: true,
      fits,
      suggested,
      reason: getFunctionReason(member, fits[0].role),
      hint,
      hintRole,
    };
  });

  const warnings = [];
  const byRole = (roleKey) => rows.filter((row) => row.role === roleKey);
  const leaders = byRole('hr');
  const assignedCount = rows.filter((row) => row.role).length;

  if (members.length > 1 && leaders.length === 0) {
    warnings.push({
      tone: 'warning',
      text: 'Нет руководителя (HR): некому держать состав, сроки и климат.',
    });
  }

  if (leaders.length > 1) {
    warnings.push({
      tone: 'info',
      text: `Руководителей несколько (${formatNames(leaders)}) — договоритесь, у кого финальное слово.`,
    });
  }

  if (leaders.length > 0 && leaders.every((row) => row.qualification === 'junior')) {
    warnings.push({
      tone: 'warning',
      text: 'Руководитель команды — Junior: стоит дать ему опору опытного коллеги.',
    });
  }

  if (assignedCount > 0 && members.length >= FUNCTIONAL_ROLE_KEYS.length) {
    FUNCTIONAL_ROLE_KEYS.filter(
      (roleKey) => roleKey !== 'hr' && byRole(roleKey).length === 0,
    ).forEach((roleKey) => {
      const [candidate] = rows
        .filter((row) => row.hasProfile)
        .map((row) => ({ row, fit: row.fits.find((item) => item.role === roleKey).fit }))
        .sort((left, right) => right.fit - left.fit);

      warnings.push({
        tone: 'info',
        text: candidate
          ? `Не закрыта роль «${getFunctionalRoleLabel(roleKey)}» — по анкете ближе всех ${candidate.row.name} (${candidate.fit}).`
          : `Не закрыта роль «${getFunctionalRoleLabel(roleKey)}».`,
      });
    });
  }

  FUNCTIONAL_ROLE_KEYS.filter((roleKey) => roleKey !== 'hr').forEach((roleKey) => {
    const holders = byRole(roleKey);
    if (holders.length > 0 && holders.every((row) => row.qualification === 'junior')) {
      warnings.push({
        tone: 'warning',
        text: `В роли «${getFunctionalRoleLabel(roleKey)}» только Junior — нужен наставник или ревью опытного коллеги.`,
      });
    }
  });

  const unassigned = rows.filter((row) => !row.role);
  if (assignedCount > 0 && unassigned.length > 0) {
    warnings.push({ tone: 'info', text: `Без роли: ${formatNames(unassigned)}.` });
  }

  const noProfile = rows.filter((row) => !row.hasProfile);
  if (noProfile.length > 0) {
    warnings.push({
      tone: 'info',
      text: `Нет анкеты, подсказки недоступны: ${formatNames(noProfile)}.`,
    });
  }

  return {
    members: rows,
    warnings,
    unassignedSuggestions: Object.fromEntries(
      unassigned.filter((row) => row.hasProfile).map((row) => [row.userId, row.suggested]),
    ),
  };
}
