import { buildSystemIndices, FACTOR_KEYS } from '../data/questionnaire';

const WEIGHTS = {
  neuroticism: 2,
  extraversion: 1,
  dominance: 2,
  ruleAdaptation: 1,
  empathy: 1,
  stressResponse: 1,
  feedbackNeed: 1,
  cooperation: 1,
};

const FACTOR_ORDER = Object.keys(WEIGHTS);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getProfileIntegrity(profile) {
  if (typeof profile.profileIntegrity === 'number') {
    return profile.profileIntegrity;
  }

  if (profile.factorReliability) {
    return Number(
      (
        FACTOR_KEYS.reduce(
          (sum, key) => sum + (profile.factorReliability[key] ?? 7),
          0,
        ) / FACTOR_KEYS.length
      ).toFixed(1),
    );
  }

  return 7;
}

function getSystemIndices(profile) {
  if (profile.systemIndices) {
    return profile.systemIndices;
  }

  return buildSystemIndices(profile.factorScores, profile.factorReliability);
}

function getGap(firstValue, secondValue) {
  return Math.abs(firstValue - secondValue);
}

export function calculateCompatibility(firstProfile, secondProfile) {
  const weightedDistance = Math.sqrt(
    FACTOR_ORDER.reduce((sum, key) => {
      const difference =
        firstProfile.factorScores[key] - secondProfile.factorScores[key];
      return sum + difference * difference * WEIGHTS[key];
    }, 0),
  );

  const maxDistance = Math.sqrt(
    FACTOR_ORDER.reduce((sum, key) => sum + 100 * WEIGHTS[key], 0),
  );

  const distanceScore = clamp((1 - weightedDistance / maxDistance) * 100, 0, 100);
  const firstIndices = getSystemIndices(firstProfile);
  const secondIndices = getSystemIndices(secondProfile);
  const communicationGap =
    (getGap(
      firstProfile.factorScores.extraversion,
      secondProfile.factorScores.extraversion,
    ) +
      getGap(
        firstProfile.factorScores.feedbackNeed,
        secondProfile.factorScores.feedbackNeed,
      ) +
      getGap(
        firstProfile.factorScores.empathy,
        secondProfile.factorScores.empathy,
      )) /
    3;
  const structureGap =
    (getGap(
      firstProfile.factorScores.dominance,
      secondProfile.factorScores.dominance,
    ) +
      getGap(
        firstProfile.factorScores.ruleAdaptation,
        secondProfile.factorScores.ruleAdaptation,
      )) /
    2;
  const stressGap =
    (getGap(
      firstProfile.factorScores.neuroticism,
      secondProfile.factorScores.neuroticism,
    ) +
      getGap(
        firstProfile.factorScores.stressResponse,
        secondProfile.factorScores.stressResponse,
      ) +
      getGap(
        firstProfile.factorScores.cooperation,
        secondProfile.factorScores.cooperation,
      )) /
    3;
  const resonanceScore = clamp(
    100 - communicationGap * 3.5 - structureGap * 3 - stressGap * 3.5,
    0,
    100,
  );
  const pairReserveScore = clamp(
    ((firstIndices.teamStabilityReserve + secondIndices.teamStabilityReserve) /
      2) *
      5 +
      ((firstIndices.communicationClarity + secondIndices.communicationClarity) /
        2) *
        3 +
      ((firstIndices.autonomyBalance + secondIndices.autonomyBalance) / 2) *
        2,
    0,
    100,
  );
  const reliabilityScore =
    ((getProfileIntegrity(firstProfile) + getProfileIntegrity(secondProfile)) /
      20) *
    100;
  const compatibility = Math.round(
    clamp(
      distanceScore * 0.55 +
        resonanceScore * 0.25 +
        pairReserveScore * 0.15 +
        reliabilityScore * 0.05,
      0,
      100,
    ),
  );

  const highConflict =
    getGap(
      firstProfile.factorScores.neuroticism,
      secondProfile.factorScores.neuroticism,
    ) > 4 ||
    (firstProfile.factorScores.dominance > 7 &&
      secondProfile.factorScores.dominance > 7) ||
    stressGap > 5.8;

  const mediumConflict =
    !highConflict &&
    (compatibility < 60 ||
      getGap(
        firstProfile.factorScores.stressResponse,
        secondProfile.factorScores.stressResponse,
      ) > 4 ||
      getGap(
        firstProfile.factorScores.cooperation,
        secondProfile.factorScores.cooperation,
      ) > 4 ||
      structureGap > 4 ||
      pairReserveScore < 58);

  const conflictRisk = highConflict
    ? 'Высокий'
    : mediumConflict
      ? 'Средний'
      : 'Низкий';

  const verdict =
    conflictRisk === 'Высокий' || compatibility < 50
      ? 'Нет'
      : conflictRisk === 'Средний' || compatibility < 75
        ? 'Условно'
        : 'Да';

  const explanation = buildManagementRecommendation(
    firstProfile,
    secondProfile,
    conflictRisk,
    {
      communicationGap,
      structureGap,
      stressGap,
      pairReserveScore,
      reliabilityScore,
      distanceScore,
      resonanceScore,
    },
  );

  return {
    compatibility,
    weightedDistance: Number(weightedDistance.toFixed(2)),
    distanceScore: Number(distanceScore.toFixed(1)),
    resonanceScore: Number(resonanceScore.toFixed(1)),
    pairReserveScore: Number(pairReserveScore.toFixed(1)),
    reliabilityScore: Number(reliabilityScore.toFixed(1)),
    communicationGap: Number(communicationGap.toFixed(2)),
    structureGap: Number(structureGap.toFixed(2)),
    stressGap: Number(stressGap.toFixed(2)),
    conflictRisk,
    verdict,
    explanation,
  };
}

export function buildManagementRecommendation(
  firstProfile,
  secondProfile,
  conflictRisk,
  metrics = {},
) {
  const pair = `${firstProfile.name} (${firstProfile.egoState}) и ${secondProfile.name} (${secondProfile.egoState})`;
  const notes = [];

  if (
    firstProfile.egoState === 'Родитель' &&
    secondProfile.egoState === 'Ребёнок'
  ) {
    notes.push(
      `${pair} дают связку опеки и бунта. ${secondProfile.name} полезны чёткие сроки и короткие задачи, а ${firstProfile.name} лучше не перегружать тотальным контролем.`,
    );
  } else if (
    firstProfile.egoState === 'Ребёнок' &&
    secondProfile.egoState === 'Родитель'
  ) {
    notes.push(
      `${pair} часто попадают в цикл “давление -> сопротивление”. Помогает заранее обозначить зоны автономии и критерии результата.`,
    );
  } else if (
    firstProfile.egoState === 'Родитель' &&
    secondProfile.egoState === 'Родитель'
  ) {
    notes.push(
      `${pair} может бороться за право определять правила. Разделите ответственность и назначьте отдельные контуры принятия решений.`,
    );
  } else if (
    firstProfile.egoState === 'Взрослый' ||
    secondProfile.egoState === 'Взрослый'
  ) {
    notes.push(
      `${pair} легче стабилизируется через факты, роли и письменные договорённости.`,
    );
  }

  if (
    firstProfile.factorScores.feedbackNeed > 7 ||
    secondProfile.factorScores.feedbackNeed > 7
  ) {
    notes.push(
      'Полезны короткие регулярные синки: отсутствие обратной связи здесь быстро читается как холодность или недоверие.',
    );
  }

  if (conflictRisk === 'Высокий') {
    notes.push(
      'Рабочее взаимодействие возможно только при заранее прописанных правилах эскалации, буферах времени и понятных границах решений.',
    );
  }

  if (
    metrics.communicationGap >= metrics.structureGap &&
    metrics.communicationGap >= metrics.stressGap &&
    metrics.communicationGap > 3.5
  ) {
    notes.push(
      'Главный риск здесь не в ценностях, а в контуре связи: заранее задайте ритм коротких синков, формат обратной связи и допустимую задержку ответа.',
    );
  } else if (
    metrics.structureGap >= metrics.communicationGap &&
    metrics.structureGap >= metrics.stressGap &&
    metrics.structureGap > 3.5
  ) {
    notes.push(
      'Главное трение ожидается вокруг правил и права принимать решения. Лучше сразу развести роли, границы полномочий и способ финального выбора.',
    );
  } else if (metrics.stressGap > 3.5) {
    notes.push(
      'Под нагрузкой вы можете расходиться сильнее, чем в обычной работе. Полезны буферы по срокам, явные точки эскалации и правило паузы перед жёстким ответом.',
    );
  }

  if (metrics.pairReserveScore < 55) {
    notes.push(
      'У пары низкий запас устойчивости: без внешней структуры и договорённостей даже обычная неопределённость будет быстро накапливать напряжение.',
    );
  }

  if (notes.length === 0) {
    notes.push(
      'Пара выглядит управляемой: дайте общую цель, проговорите правила обратной связи и не мешайте естественному распределению ролей.',
    );
  }

  return notes.join(' ');
}
