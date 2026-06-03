import {
  buildSystemIndices,
  FACTOR_CONFIG,
  FACTOR_KEYS,
  getFactorPoleLabel,
} from '../data/questionnaire';

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
const FACTOR_META = Object.fromEntries(
  FACTOR_CONFIG.map((factor) => [factor.key, factor]),
);

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

function getPole(profile, factorKey) {
  return getFactorPoleLabel(FACTOR_META[factorKey], profile.factorScores[factorKey]);
}

function buildSupportPoint(firstProfile, secondProfile, metrics) {
  if (metrics.resonanceScore >= 74) {
    return 'У вас похожий ритм связи: проще держать общий темп, быстрее сверяться и реже цепляться за сам формат общения.';
  }

  if (metrics.pairReserveScore >= 70) {
    return 'Даже под нагрузкой у пары есть запас устойчивости: в напряжении вы скорее сохраните рабочий контакт, чем резко сорвётесь в разнос.';
  }

  if (metrics.distanceScore >= 72) {
    return 'Базовые рабочие привычки у вас достаточно близки, поэтому на старте будет легче договориться о ролях и бытовом ритме.';
  }

  const firstCooperation = getPole(firstProfile, 'cooperation');
  const secondCooperation = getPole(secondProfile, 'cooperation');

  if (firstCooperation === secondCooperation) {
    return `У вас есть общая опора в том, как вы относитесь к общему делу: оба ближе к режиму «${firstCooperation}».`;
  }

  return 'Пара выглядит рабочей не за счёт идеального совпадения, а потому что в ней есть потенциал быстро настроить понятные договорённости.';
}

function buildFrictionPoint(firstProfile, secondProfile, metrics) {
  if (
    metrics.communicationGap >= metrics.structureGap &&
    metrics.communicationGap >= metrics.stressGap &&
    metrics.communicationGap > 3.5
  ) {
    return `Больше всего трение может идти через ритм связи: ${firstProfile.name} ближе к «${getPole(firstProfile, 'extraversion')}», а ${secondProfile.name} — к «${getPole(secondProfile, 'extraversion')}».`;
  }

  if (
    metrics.structureGap >= metrics.communicationGap &&
    metrics.structureGap >= metrics.stressGap &&
    metrics.structureGap > 3.5
  ) {
    return `Главное расхождение ожидается вокруг рамки и права вести: у вас по-разному устроены «${getPole(firstProfile, 'dominance')} / ${getPole(firstProfile, 'ruleAdaptation')}» и «${getPole(secondProfile, 'dominance')} / ${getPole(secondProfile, 'ruleAdaptation')}».`;
  }

  if (metrics.stressGap > 3.5) {
    return `Под нагрузкой вы входите в разные режимы: ${firstProfile.name} чаще уходит в «${getPole(firstProfile, 'neuroticism')} / ${getPole(firstProfile, 'stressResponse')}», а ${secondProfile.name} — в «${getPole(secondProfile, 'neuroticism')} / ${getPole(secondProfile, 'stressResponse')}».`;
  }

  return 'Резкой зоны трения не видно, но без базовых договорённостей даже хорошая стыковка быстро начинает терять форму.';
}

function buildPairSummary(
  compatibility,
  conflictRisk,
  resonanceScore,
  pairReserveScore,
) {
  if (compatibility >= 80 && conflictRisk === 'Низкий') {
    return 'Пара выглядит лёгкой для совместной работы: контакт и бытовой ритм стыкуются без лишнего усилия.';
  }

  if (pairReserveScore >= 68 && resonanceScore >= 65) {
    return 'Стыковка хорошая, но держится не на магии, а на том, что вы умеете не разваливаться при первой же нагрузке.';
  }

  if (conflictRisk === 'Высокий') {
    return 'Связка может работать только через заранее оговорённые правила, иначе трение быстро пойдёт в открытую.';
  }

  return 'Связка скорее управляемая: она может быть сильной, если заранее собрать правила общения, ролей и реакции на давление.';
}

function buildTeamFitLabel(verdict, pairReserveScore) {
  if (verdict === 'Да') {
    return 'Можно быстро стыковать';
  }

  if (verdict === 'Условно' && pairReserveScore >= 55) {
    return 'Потребуются явные договорённости';
  }

  return 'Лучше не без рамки';
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

  const metrics = {
    communicationGap,
    structureGap,
    stressGap,
    pairReserveScore,
    reliabilityScore,
    distanceScore,
    resonanceScore,
  };

  const explanation = buildManagementRecommendation(
    firstProfile,
    secondProfile,
    conflictRisk,
    metrics,
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
    teamFitLabel: buildTeamFitLabel(verdict, pairReserveScore),
    pairSummary: buildPairSummary(
      compatibility,
      conflictRisk,
      resonanceScore,
      pairReserveScore,
    ),
    supportPoint: buildSupportPoint(firstProfile, secondProfile, metrics),
    frictionPoint: buildFrictionPoint(firstProfile, secondProfile, metrics),
    explanation,
  };
}

export function buildManagementRecommendation(
  firstProfile,
  secondProfile,
  conflictRisk,
  metrics = {},
) {
  const pair = `${firstProfile.name} и ${secondProfile.name}`;
  const notes = [];
  const firstContact = getPole(firstProfile, 'extraversion');
  const secondContact = getPole(secondProfile, 'extraversion');
  const firstRules = getPole(firstProfile, 'ruleAdaptation');
  const secondRules = getPole(secondProfile, 'ruleAdaptation');
  const firstStability = getPole(firstProfile, 'neuroticism');
  const secondStability = getPole(secondProfile, 'neuroticism');

  if (
    firstProfile.egoState === 'Родитель' &&
    secondProfile.egoState === 'Ребёнок'
  ) {
    notes.push(
      `${pair} легко попадают в цикл «давление -> сопротивление». Лучше заранее отделить заботу от контроля, а свободу — от ухода из договорённостей.`,
    );
  } else if (
    firstProfile.egoState === 'Ребёнок' &&
    secondProfile.egoState === 'Родитель'
  ) {
    notes.push(
      `${pair} полезно сразу проговорить зоны автономии: одному будет тесно от лишней рамки, второму — тревожно без видимого порядка.`,
    );
  } else if (
    firstProfile.egoState === 'Родитель' &&
    secondProfile.egoState === 'Родитель'
  ) {
    notes.push(
      `${pair} могут быстро начать спорить не о задаче, а о праве задавать рамку. Здесь особенно важно заранее развести решения по зонам ответственности.`,
    );
  } else if (
    firstProfile.egoState === 'Взрослый' ||
    secondProfile.egoState === 'Взрослый'
  ) {
    notes.push(
      `${pair} легче удерживать в рабочем контуре через факты, роли и короткие фиксации договорённостей.`,
    );
  }

  if (
    firstProfile.factorScores.feedbackNeed > 7 ||
    secondProfile.factorScores.feedbackNeed > 7
  ) {
    notes.push(
      'Здесь полезны короткие регулярные сверки: молчание или затяжной ответ слишком легко читаются как отдаление, а не как нейтральная пауза.',
    );
  }

  if (metrics.communicationGap > 3.5) {
    notes.push(
      `Ритм связи у вас разный: один ближе к «${firstContact}», другой — к «${secondContact}». Лучше сразу договориться, как быстро отвечать, когда писать, а когда лучше созваниваться.`,
    );
  }

  if (metrics.structureGap > 3.5) {
    notes.push(
      `Структура ощущается по-разному: одному ближе «${firstRules}», другому — «${secondRules}». Снимите это заранее через роли, границы решений и понятный способ финального выбора.`,
    );
  }

  if (metrics.stressGap > 3.5) {
    notes.push(
      `Под давлением вы входите в разные режимы устойчивости — «${firstStability}» и «${secondStability}». Поэтому полезны правило паузы, буферы по срокам и понятная эскалация вместо импульсивной перепалки.`,
    );
  }

  if (metrics.pairReserveScore < 55) {
    notes.push(
      'У пары небольшой запас устойчивости. Здесь особенно важно не надеяться на «само наладится», а сознательно собирать ритм, обратную связь и рамку взаимодействия.',
    );
  }

  if (metrics.reliabilityScore < 55) {
    notes.push(
      'Профили лучше читать как рабочую гипотезу, а не как приговор: ответы местами неоднородные, поэтому полезно сверять выводы с реальным поведением.',
    );
  }

  if (conflictRisk === 'Высокий') {
    notes.push(
      'Без заранее оговорённых правил трение здесь будет расти быстрее обычного. В такой связке особенно важны границы, сроки реакции и понятный способ остановить эскалацию.',
    );
  }

  if (notes.length === 0) {
    notes.push(
      'Связка выглядит управляемой: вам достаточно зафиксировать базовый ритм общения и не мешать естественному распределению ролей.',
    );
  }

  return notes.join(' ');
}
