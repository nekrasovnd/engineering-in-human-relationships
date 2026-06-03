const likertToTen = (value) => ((Number(value) - 1) / 4) * 10;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const FACTOR_CONFIG = [
  {
    key: 'neuroticism',
    label: 'Эмоциональная реактивность / устойчивость',
    shortLabel: 'Стабильность',
    lowPoleLabel: 'реактивность',
    highPoleLabel: 'устойчивость',
    balancedLabel: 'гибкая регуляция',
    description:
      'Показывает, насколько человек сохраняет внутреннее равновесие в неопределённости, напряжении и критике.',
    questions: [
      {
        id: 'q01',
        text: 'Когда исход ситуации неясен, я быстро начинаю прокручивать в голове тревожные сценарии.',
      },
      {
        id: 'q02',
        text: 'После напряжённого разговора я обычно довольно быстро возвращаю себе спокойствие.',
        reverse: true,
      },
      {
        id: 'q03',
        text: 'После тяжёлого дня мне бывает сложно остановить тревожные мысли перед сном.',
      },
      {
        id: 'q04',
        text: 'Когда что-то идёт не по плану, я скорее ищу следующий шаг, чем срываюсь на раздражение.',
        reverse: true,
      },
      {
        id: 'q05',
        text: 'Даже справедливая, но резкая критика надолго выбивает меня из равновесия.',
      },
    ],
  },
  {
    key: 'extraversion',
    label: 'Экстраверсия / коммуникативная энергия',
    shortLabel: 'Экстраверсия',
    lowPoleLabel: 'автономный режим',
    highPoleLabel: 'внешний обмен',
    balancedLabel: 'переключаемый режим',
    description:
      'Оценивает, насколько человеку нужен внешний контакт, живой обмен и заметность в коммуникации.',
    questions: [
      {
        id: 'q06',
        text: 'После насыщенного взаимодействия с людьми я чаще чувствую подъём, чем усталость.',
      },
      {
        id: 'q07',
        text: 'Перед обсуждением мне обычно важнее сначала спокойно подумать одному.',
        reverse: true,
      },
      {
        id: 'q08',
        text: 'В новой группе или на встрече я нередко первым начинаю разговор и задаю тон общения.',
      },
      {
        id: 'q09',
        text: 'Несколько дней почти без общения обычно мало влияют на моё внутреннее состояние.',
        reverse: true,
      },
      {
        id: 'q10',
        text: 'Мне подходит режим частого обмена сообщениями, быстрых обсуждений и постоянного контакта.',
      },
    ],
  },
  {
    key: 'dominance',
    label: 'Доминантность / склонность брать управление',
    shortLabel: 'Доминантность',
    lowPoleLabel: 'следование',
    highPoleLabel: 'ведение',
    balancedLabel: 'паритетное влияние',
    description:
      'Фиксирует стремление влиять на направление, брать контроль на себя и удерживать право последнего слова.',
    questions: [
      {
        id: 'q11',
        text: 'Если в группе никто не берёт лидерство, я обычно сам начинаю координировать остальных.',
      },
      {
        id: 'q12',
        text: 'Мне чаще проще подстроиться под чужое решение, чем добиваться своего варианта.',
        reverse: true,
      },
      {
        id: 'q13',
        text: 'Если я уверен в своей правоте, в споре мне трудно быстро отступить.',
      },
      {
        id: 'q14',
        text: 'Мне комфортно, когда другой человек задаёт рамку, а финальная ответственность не на мне.',
        reverse: true,
      },
      {
        id: 'q15',
        text: 'В неясной ситуации я легко начинаю распределять задачи и ожидать, что за мной пойдут.',
      },
    ],
  },
  {
    key: 'ruleAdaptation',
    label: 'Отношение к правилам / структурность',
    shortLabel: 'Правила',
    lowPoleLabel: 'гибкая импровизация',
    highPoleLabel: 'структурная опора',
    balancedLabel: 'адаптивная структура',
    description:
      'Показывает, насколько человеку нужны процессы, договорённости, сроки и формальная рамка работы.',
    questions: [
      {
        id: 'q16',
        text: 'Когда роли, сроки и правила заранее определены, мне обычно спокойнее и легче работать.',
      },
      {
        id: 'q17',
        text: 'Если формальный регламент мешает делу, я без большого сопротивления обхожу его.',
        reverse: true,
      },
      {
        id: 'q18',
        text: 'В совместной работе я быстро замечаю, когда начинают нарушаться договорённости или сроки.',
      },
      {
        id: 'q19',
        text: 'Я могу долго и продуктивно работать без чётких процессов, контрольных точек и дедлайнов.',
        reverse: true,
      },
      {
        id: 'q20',
        text: 'Понятная инструкция или чек-лист обычно заметно улучшают мой результат.',
      },
    ],
  },
  {
    key: 'empathy',
    label: 'Эмпатия / чувствительность к состоянию другого',
    shortLabel: 'Эмпатия',
    lowPoleLabel: 'логическая прямота',
    highPoleLabel: 'считывание состояния',
    balancedLabel: 'точная калибровка',
    description:
      'Оценивает, насколько человек замечает эмоциональный контекст и умеет подстраивать под него общение.',
    questions: [
      {
        id: 'q21',
        text: 'Я обычно замечаю усталость, напряжение или закрытость человека ещё до того, как он скажет об этом прямо.',
      },
      {
        id: 'q22',
        text: 'В сложном обсуждении мне естественнее держаться за логику решения, чем за чувства участников.',
        reverse: true,
      },
      {
        id: 'q23',
        text: 'Даже в жёстком разговоре я стараюсь подобрать формулировки так, чтобы не ломать контакт без необходимости.',
      },
      {
        id: 'q24',
        text: 'Если человек эмоционально реагирует, это редко меняет мой способ говорить с ним.',
        reverse: true,
      },
      {
        id: 'q25',
        text: 'Если человеку явно тяжело, я чаще сначала пытаюсь понять его состояние, а уже потом перехожу к фактам.',
      },
    ],
  },
  {
    key: 'stressResponse',
    label: 'Реакция на стресс / собранность под нагрузкой',
    shortLabel: 'Стресс',
    lowPoleLabel: 'остановка под давлением',
    highPoleLabel: 'сборка под нагрузкой',
    balancedLabel: 'управляемый отклик',
    description:
      'Отражает, насколько человек под давлением остаётся собранным, активным и способным удерживать ход действий.',
    questions: [
      {
        id: 'q26',
        text: 'В критической ситуации я скорее начинаю действовать, чем впадаю в ступор.',
      },
      {
        id: 'q27',
        text: 'Когда давление слишком высокое, я чаще теряю темп и откладываю следующий шаг.',
        reverse: true,
      },
      {
        id: 'q28',
        text: 'Под жёстким дедлайном я умею собраться и навести порядок даже в хаотичной ситуации.',
      },
      {
        id: 'q29',
        text: 'Когда напряжение резко возрастает, мне проще уйти в сторону, чем удерживаться внутри процесса.',
        reverse: true,
      },
      {
        id: 'q30',
        text: 'Мне знакомо состояние, когда в кризисе я становлюсь точнее и собраннее, чем обычно.',
      },
    ],
  },
  {
    key: 'feedbackNeed',
    label: 'Потребность в обратной связи',
    shortLabel: 'Фидбек',
    lowPoleLabel: 'самодостаточный контур',
    highPoleLabel: 'частая внешняя сверка',
    balancedLabel: 'умеренная синхронизация',
    description:
      'Показывает, насколько человеку для устойчивой работы нужны отклик, подтверждение и регулярная сверка курса.',
    questions: [
      {
        id: 'q31',
        text: 'Если мне долго не дают обратную связь, мне сложнее понимать, двигаюсь ли я в правильную сторону.',
      },
      {
        id: 'q32',
        text: 'Я могу неделями двигаться по задаче без промежуточных комментариев и не терять внутреннюю ясность.',
        reverse: true,
      },
      {
        id: 'q33',
        text: 'Мне важно понимать, как мои решения, тон и вклад считываются другими людьми.',
      },
      {
        id: 'q34',
        text: 'Редкая обратная связь почти не влияет ни на мою мотивацию, ни на ощущение устойчивости в задаче.',
        reverse: true,
      },
      {
        id: 'q35',
        text: 'Мне обычно лучше подходят короткие регулярные сверки, чем редкие большие разборы.',
      },
    ],
  },
  {
    key: 'cooperation',
    label: 'Сотрудничество / конкуренция',
    shortLabel: 'Кооперация',
    lowPoleLabel: 'конкурентный режим',
    highPoleLabel: 'кооперативный режим',
    balancedLabel: 'сдержанное партнёрство',
    description:
      'Показывает готовность делиться ресурсом, договариваться и усиливать общий результат, а не только личную позицию.',
    questions: [
      {
        id: 'q36',
        text: 'Если общий результат выигрывает, я готов уступить часть личного признания или удобства.',
      },
      {
        id: 'q37',
        text: 'Внутренняя конкуренция внутри команды чаще помогает делу, чем совместная поддержка.',
        reverse: true,
      },
      {
        id: 'q38',
        text: 'Я могу делиться идеями и наработками, даже если за часть результата похвалят не меня.',
      },
      {
        id: 'q39',
        text: 'Мне трудно искренне радоваться успеху другого, если на его фоне мой результат выглядит слабее.',
        reverse: true,
      },
      {
        id: 'q40',
        text: 'В спорной ситуации я чаще ищу рабочий взаимовыгодный вариант, чем пытаюсь доказать, кто прав.',
      },
    ],
  },
];

export const LIKERT_OPTIONS = [
  { value: 1, label: 'Совсем не про меня' },
  { value: 2, label: 'Скорее нет' },
  { value: 3, label: 'Иногда так' },
  { value: 4, label: 'Скорее да' },
  { value: 5, label: 'Очень похоже на меня' },
];

export const FACTOR_KEYS = FACTOR_CONFIG.map((factor) => factor.key);

const DISPLAY_SCORE_TRANSFORMS = {
  neuroticism: (score) => 10 - score,
};

export function getInitialAnswers() {
  return FACTOR_CONFIG.flatMap((factor) => factor.questions).reduce(
    (accumulator, question) => ({
      ...accumulator,
      [question.id]: '',
    }),
    {},
  );
}

export function getDisplayFactorScore(factorKey, score) {
  if (typeof score !== 'number') {
    return 0;
  }

  const transform = DISPLAY_SCORE_TRANSFORMS[factorKey];
  const nextScore = transform ? transform(score) : score;

  return Number(nextScore.toFixed(1));
}

export function getFactorPoleLabel(factor, rawScore) {
  const score = getDisplayFactorScore(factor.key, rawScore);

  if (score >= 6.5) {
    return factor.highPoleLabel;
  }

  if (score <= 3.5) {
    return factor.lowPoleLabel;
  }

  return factor.balancedLabel;
}

export function getQuestionAgreementPoleLabel(factor, question) {
  const displayReversed = Object.hasOwn(DISPLAY_SCORE_TRANSFORMS, factor.key);
  const agreementTargetsHighPole = displayReversed
    ? Boolean(question.reverse)
    : !question.reverse;

  return agreementTargetsHighPole
    ? factor.highPoleLabel
    : factor.lowPoleLabel;
}

function getAlignedQuestionScore(question, answerValue) {
  const rawScore = likertToTen(answerValue || 3);
  return question.reverse ? 10 - rawScore : rawScore;
}

function calculateFactorReliability(alignedScores) {
  const average =
    alignedScores.reduce((sum, score) => sum + score, 0) / alignedScores.length;
  const variance =
    alignedScores.reduce((sum, score) => sum + (score - average) ** 2, 0) /
    alignedScores.length;
  const spread = Math.sqrt(variance);

  return Number(clamp(10 - spread * 2, 0, 10).toFixed(1));
}

export function buildSystemIndices(factorScores, factorReliability = {}) {
  const conflictLoad = Number(
    (
      factorScores.neuroticism * 0.45 +
      factorScores.dominance * 0.25 +
      (10 - factorScores.cooperation) * 0.3
    ).toFixed(1),
  );
  const teamStabilityReserve = Number(
    (
      (10 - factorScores.neuroticism) * 0.35 +
      factorScores.ruleAdaptation * 0.25 +
      factorScores.stressResponse * 0.2 +
      factorScores.cooperation * 0.2
    ).toFixed(1),
  );
  const communicationClarity = Number(
    (
      factorScores.empathy * 0.3 +
      factorScores.cooperation * 0.2 +
      (10 - Math.abs(factorScores.extraversion - factorScores.feedbackNeed)) *
        0.25 +
      (10 - factorScores.neuroticism) * 0.25
    ).toFixed(1),
  );
  const autonomyBalance = Number(
    (
      (10 - Math.abs(factorScores.dominance - 5)) * 0.35 +
      factorScores.ruleAdaptation * 0.35 +
      factorScores.stressResponse * 0.2 +
      factorScores.cooperation * 0.1
    ).toFixed(1),
  );
  const profileIntegrity = Number(
    (
      FACTOR_KEYS.reduce(
        (sum, key) => sum + (factorReliability[key] ?? 7),
        0,
      ) / FACTOR_KEYS.length
    ).toFixed(1),
  );

  return {
    conflictLoad,
    teamStabilityReserve,
    communicationClarity,
    autonomyBalance,
    profileIntegrity,
  };
}

export function buildPsychologicalVector50(answers, factorScores) {
  const normalizedAnswers = FACTOR_CONFIG.flatMap((factor) => factor.questions).map(
    (question) => {
      return Number(
        getAlignedQuestionScore(question, answers[question.id]).toFixed(1),
      );
    },
  );

  const factorVector = FACTOR_KEYS.map((key) => Number(factorScores[key].toFixed(1)));
  const { conflictLoad, teamStabilityReserve } = buildSystemIndices(factorScores);

  return [...normalizedAnswers, ...factorVector, conflictLoad, teamStabilityReserve];
}

export function deriveEgoState(factorScores) {
  const parentScore =
    factorScores.dominance * 0.4 +
    factorScores.ruleAdaptation * 0.45 +
    (10 - factorScores.empathy) * 0.15;
  const adultScore =
    factorScores.ruleAdaptation * 0.35 +
    factorScores.empathy * 0.3 +
    (10 - Math.abs(factorScores.dominance - 5)) * 0.35;
  const childScore =
    (10 - factorScores.ruleAdaptation) * 0.4 +
    (10 - factorScores.dominance) * 0.25 +
    factorScores.empathy * 0.35;

  const scoreMap = {
    Родитель: parentScore,
    Взрослый: adultScore,
    Ребёнок: childScore,
  };

  return Object.entries(scoreMap).sort((left, right) => right[1] - left[1])[0][0];
}

export function calculateQuestionnaireResult(answers) {
  const factorScores = {};
  const factorReliability = {};

  FACTOR_CONFIG.forEach((factor) => {
    const alignedScores = factor.questions.map((question) =>
      getAlignedQuestionScore(question, answers[question.id]),
    );
    const average =
      alignedScores.reduce((sum, score) => sum + score, 0) / alignedScores.length;

    factorScores[factor.key] = Number(average.toFixed(1));
    factorReliability[factor.key] = calculateFactorReliability(alignedScores);
  });

  const egoState = deriveEgoState(factorScores);
  const psychologicalVector50 = buildPsychologicalVector50(answers, factorScores);
  const systemIndices = buildSystemIndices(factorScores, factorReliability);

  return {
    factorScores,
    factorReliability,
    egoState,
    systemIndices,
    profileIntegrity: systemIndices.profileIntegrity,
    psychologicalVector50,
  };
}

export function enrichProfileScoring(profile) {
  if (!profile?.factorScores) {
    return profile;
  }

  if (
    profile.factorReliability &&
    profile.systemIndices &&
    typeof profile.profileIntegrity === 'number'
  ) {
    return profile;
  }

  if (profile.answers) {
    const result = calculateQuestionnaireResult(profile.answers);

    return {
      ...profile,
      factorScores: profile.factorScores || result.factorScores,
      factorReliability: result.factorReliability,
      egoState: profile.egoState || result.egoState,
      systemIndices: result.systemIndices,
      profileIntegrity: result.profileIntegrity,
      psychologicalVector50:
        profile.psychologicalVector50 || result.psychologicalVector50,
    };
  }

  const systemIndices = buildSystemIndices(
    profile.factorScores,
    profile.factorReliability,
  );

  return {
    ...profile,
    factorReliability: profile.factorReliability || null,
    systemIndices,
    profileIntegrity:
      typeof profile.profileIntegrity === 'number'
        ? profile.profileIntegrity
        : systemIndices.profileIntegrity,
  };
}
