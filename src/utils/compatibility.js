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

  const compatibility = Math.round(
    clamp((1 - weightedDistance / maxDistance) * 100, 0, 100),
  );

  const highConflict =
    Math.abs(
      firstProfile.factorScores.neuroticism -
        secondProfile.factorScores.neuroticism,
    ) > 4 ||
    (firstProfile.factorScores.dominance > 7 &&
      secondProfile.factorScores.dominance > 7);

  const mediumConflict =
    !highConflict &&
    (compatibility < 60 ||
      Math.abs(
        firstProfile.factorScores.stressResponse -
          secondProfile.factorScores.stressResponse,
      ) > 4 ||
      Math.abs(
        firstProfile.factorScores.cooperation -
          secondProfile.factorScores.cooperation,
      ) > 4);

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
  );

  return {
    compatibility,
    weightedDistance: Number(weightedDistance.toFixed(2)),
    conflictRisk,
    verdict,
    explanation,
  };
}

export function buildManagementRecommendation(
  firstProfile,
  secondProfile,
  conflictRisk,
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

  if (notes.length === 0) {
    notes.push(
      'Пара выглядит управляемой: дайте общую цель, проговорите правила обратной связи и не мешайте естественному распределению ролей.',
    );
  }

  return notes.join(' ');
}
