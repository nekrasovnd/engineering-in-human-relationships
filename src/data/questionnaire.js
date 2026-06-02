const likertToTen = (value) => ((Number(value) - 1) / 4) * 10;

export const FACTOR_CONFIG = [
  {
    key: 'neuroticism',
    label: 'Нейротизм / эмоциональная чувствительность',
    shortLabel: 'Стабильность',
    description:
      'Показывает, насколько быстро человек теряет эмоциональное равновесие в неопределённости.',
    questions: [
      {
        id: 'q01',
        text: 'В условиях неопределённости я быстро начинаю внутренне накручиваться.',
      },
      {
        id: 'q02',
        text: 'Даже после напряжённого разговора я быстро возвращаю себе спокойствие.',
        reverse: true,
      },
      {
        id: 'q03',
        text: 'Мне сложно отключить тревожные мысли перед сном после тяжёлого дня.',
      },
      {
        id: 'q04',
        text: 'Когда что-то идёт не по плану, я чаще сохраняю устойчивость, чем раздражаюсь.',
        reverse: true,
      },
      {
        id: 'q05',
        text: 'Я болезненно реагирую на резкую критику, даже если она справедлива.',
      },
    ],
  },
  {
    key: 'extraversion',
    label: 'Экстраверсия / коммуникативная энергия',
    shortLabel: 'Экстраверсия',
    description:
      'Оценивает, насколько человеку важно внешнее взаимодействие, видимость и обмен энергией.',
    questions: [
      {
        id: 'q06',
        text: 'После долгой совместной работы с людьми я обычно чувствую прилив энергии.',
      },
      {
        id: 'q07',
        text: 'Мне комфортнее сначала подумать в одиночку, а потом обсуждать идеи.',
        reverse: true,
      },
      {
        id: 'q08',
        text: 'На встречах я часто первым начинаю разговор или задаю тон коммуникации.',
      },
      {
        id: 'q09',
        text: 'Длительное отсутствие общения обычно почти не влияет на моё состояние.',
        reverse: true,
      },
      {
        id: 'q10',
        text: 'Мне нравится работать в режиме постоянного обмена сообщениями, идеями и быстрым фидбеком.',
      },
    ],
  },
  {
    key: 'dominance',
    label: 'Доминантность / склонность задавать курс',
    shortLabel: 'Доминантность',
    description:
      'Фиксирует стремление влиять, направлять, спорить за приоритет и брать контроль на себя.',
    questions: [
      {
        id: 'q11',
        text: 'Если в группе нет лидера, я быстро начинаю координировать остальных.',
      },
      {
        id: 'q12',
        text: 'Мне проще подстроиться под чужое решение, чем продавливать своё.',
        reverse: true,
      },
      {
        id: 'q13',
        text: 'В споре я редко уступаю, если уверен в своей правоте.',
      },
      {
        id: 'q14',
        text: 'Мне комфортно, когда кто-то другой задаёт рамку и ответственность.',
        reverse: true,
      },
      {
        id: 'q15',
        text: 'Я легко беру на себя право говорить людям, что и как делать.',
      },
    ],
  },
  {
    key: 'ruleAdaptation',
    label: 'Адаптивность к правилам / структурность',
    shortLabel: 'Правила',
    description:
      'Показывает отношение к процедурам, срокам, регламенту, договорённостям и рациональной дисциплине.',
    questions: [
      {
        id: 'q16',
        text: 'Мне спокойнее и продуктивнее, когда правила и роли заранее определены.',
      },
      {
        id: 'q17',
        text: 'Если регламент мешает результату, я легко отказываюсь от него.',
        reverse: true,
      },
      {
        id: 'q18',
        text: 'Я чаще замечаю нарушения договорённостей, чем остальные в команде.',
      },
      {
        id: 'q19',
        text: 'Мне комфортно работать без чётких процессов и дедлайнов.',
        reverse: true,
      },
      {
        id: 'q20',
        text: 'Хорошая инструкция обычно снижает у меня тревогу и повышает качество работы.',
      },
    ],
  },
  {
    key: 'empathy',
    label: 'Эмпатия / чувствительность к чужому состоянию',
    shortLabel: 'Эмпатия',
    description:
      'Оценивает способность замечать эмоциональный контекст, слышать подтекст и подстраивать коммуникацию.',
    questions: [
      {
        id: 'q21',
        text: 'Я быстро замечаю, когда человек устал или напряжён, даже если он молчит.',
      },
      {
        id: 'q22',
        text: 'В рабочих обсуждениях мне важнее логика, чем переживания участников.',
        reverse: true,
      },
      {
        id: 'q23',
        text: 'Я часто подбираю слова так, чтобы не задеть собеседника без необходимости.',
      },
      {
        id: 'q24',
        text: 'Чужая эмоциональная реакция редко влияет на мой стиль общения.',
        reverse: true,
      },
      {
        id: 'q25',
        text: 'Если человеку тяжело, я обычно сначала стараюсь понять его состояние, а не спорить по фактам.',
      },
    ],
  },
  {
    key: 'stressResponse',
    label: 'Реакция на стресс / собранность под нагрузкой',
    shortLabel: 'Стресс',
    description:
      'Отражает, насколько человек в кризисе остаётся собранным и действует, а не замирает.',
    questions: [
      {
        id: 'q26',
        text: 'В критической ситуации я быстрее начинаю действовать, чем зависаю.',
      },
      {
        id: 'q27',
        text: 'Когда давление слишком высокое, я чаще теряю темп и откладываю решение.',
        reverse: true,
      },
      {
        id: 'q28',
        text: 'Под жёстким дедлайном я собираюсь и структурирую хаос вокруг себя.',
      },
      {
        id: 'q29',
        text: 'Если конфликт становится острым, мне проще уйти в тень и ничего не делать.',
        reverse: true,
      },
      {
        id: 'q30',
        text: 'Мне знакомо ощущение, что в кризисе я включаюсь точнее и собраннее обычного.',
      },
    ],
  },
  {
    key: 'feedbackNeed',
    label: 'Потребность в обратной связи',
    shortLabel: 'Фидбек',
    description:
      'Показывает, насколько человеку нужно видеть реакцию, оценку, подтверждение и уточнение хода работы.',
    questions: [
      {
        id: 'q31',
        text: 'Если я долго не получаю обратную связь, мне становится трудно оценить качество своей работы.',
      },
      {
        id: 'q32',
        text: 'Я спокойно двигаюсь в задаче неделями без промежуточных комментариев.',
        reverse: true,
      },
      {
        id: 'q33',
        text: 'Мне важно понимать, как мои действия воспринимаются командой и руководителем.',
      },
      {
        id: 'q34',
        text: 'Редкий фидбек почти не влияет на мою мотивацию и самоощущение.',
        reverse: true,
      },
      {
        id: 'q35',
        text: 'Я предпочитаю короткие регулярные уточнения вместо редких больших разборов.',
      },
    ],
  },
  {
    key: 'cooperation',
    label: 'Сотрудничество / конкуренция',
    shortLabel: 'Кооперация',
    description:
      'Показывает готовность делиться ресурсом, договариваться и выигрывать вместе, а не только лично.',
    questions: [
      {
        id: 'q36',
        text: 'Я предпочитаю общий результат личной победе, если проект от этого выигрывает.',
      },
      {
        id: 'q37',
        text: 'Внутренняя конкуренция внутри команды обычно делает людей сильнее.',
        reverse: true,
      },
      {
        id: 'q38',
        text: 'Я готов делиться идеями и наработками, даже если за них могут похвалить другого.',
      },
      {
        id: 'q39',
        text: 'Мне трудно радоваться успеху коллеги, если на его фоне мои результаты выглядят слабее.',
        reverse: true,
      },
      {
        id: 'q40',
        text: 'Мне проще искать взаимовыгодный вариант, чем доказывать, кто прав.',
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

export function getInitialAnswers() {
  return FACTOR_CONFIG.flatMap((factor) => factor.questions).reduce(
    (accumulator, question) => ({
      ...accumulator,
      [question.id]: '',
    }),
    {},
  );
}

export function buildPsychologicalVector50(answers, factorScores) {
  const normalizedAnswers = FACTOR_CONFIG.flatMap((factor) => factor.questions).map(
    (question) => {
      const raw = likertToTen(answers[question.id] || 3);
      return Number((question.reverse ? 10 - raw : raw).toFixed(1));
    },
  );

  const factorVector = FACTOR_KEYS.map((key) => Number(factorScores[key].toFixed(1)));
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
  const factorScores = FACTOR_CONFIG.reduce((accumulator, factor) => {
    const scores = factor.questions.map((question) => {
      const rawScore = likertToTen(answers[question.id] || 3);
      return question.reverse ? 10 - rawScore : rawScore;
    });
    const average = scores.reduce((sum, item) => sum + item, 0) / factor.questions.length;

    return {
      ...accumulator,
      [factor.key]: Number(average.toFixed(1)),
    };
  }, {});

  const egoState = deriveEgoState(factorScores);
  const psychologicalVector50 = buildPsychologicalVector50(answers, factorScores);

  return {
    factorScores,
    egoState,
    psychologicalVector50,
  };
}
