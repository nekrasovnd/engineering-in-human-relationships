import {
  FACTOR_CONFIG,
  getDisplayFactorScore,
  getFactorPoleLabel,
} from '../data/questionnaire';

const HIGH = 6.5;
const LOW = 3.5;

function getFactorMeta(factorKey) {
  return FACTOR_CONFIG.find((factor) => factor.key === factorKey);
}

function pickHighlights(scores) {
  const strengths = [];
  const risks = [];
  const stabilityMeta = getFactorMeta('neuroticism');
  const extraversionMeta = getFactorMeta('extraversion');
  const dominanceMeta = getFactorMeta('dominance');
  const rulesMeta = getFactorMeta('ruleAdaptation');
  const empathyMeta = getFactorMeta('empathy');
  const stressMeta = getFactorMeta('stressResponse');
  const feedbackMeta = getFactorMeta('feedbackNeed');
  const cooperationMeta = getFactorMeta('cooperation');

  const stabilityScore = getDisplayFactorScore('neuroticism', scores.neuroticism);
  const stabilityPole = getFactorPoleLabel(stabilityMeta, scores.neuroticism);
  const extraversionPole = getFactorPoleLabel(
    extraversionMeta,
    scores.extraversion,
  );
  const dominancePole = getFactorPoleLabel(dominanceMeta, scores.dominance);
  const rulesPole = getFactorPoleLabel(rulesMeta, scores.ruleAdaptation);
  const empathyPole = getFactorPoleLabel(empathyMeta, scores.empathy);
  const stressPole = getFactorPoleLabel(stressMeta, scores.stressResponse);
  const feedbackPole = getFactorPoleLabel(feedbackMeta, scores.feedbackNeed);
  const cooperationPole = getFactorPoleLabel(
    cooperationMeta,
    scores.cooperation,
  );

  if (stabilityScore >= HIGH) {
    strengths.push(
      `в напряжении чаще держится в режиме «${stabilityPole}», чем уходит в эмоциональный разгон`,
    );
  }
  if (scores.cooperation >= HIGH) {
    strengths.push(
      `в совместной работе тянется к режиму «${cooperationPole}» и удерживает общий результат`,
    );
  }
  if (scores.empathy >= HIGH) {
    strengths.push(
      `в общении хорошо попадает в режим «${empathyPole}» и считывает состояние других`,
    );
  }
  if (scores.ruleAdaptation >= HIGH) {
    strengths.push(
      `умеет опираться на «${rulesPole}», когда нужно собрать людей вокруг процесса и сроков`,
    );
  }
  if (scores.stressResponse >= HIGH) {
    strengths.push(
      `под давлением скорее включает «${stressPole}», чем выпадает из процесса`,
    );
  }

  if (stabilityScore <= LOW) {
    risks.push(
      `в тяжёлых ситуациях может застревать в режиме «${stabilityPole}» и усиливать напряжение реакцией`,
    );
  }
  if (scores.dominance >= HIGH) {
    risks.push(
      `может слишком жёстко уходить в «${dominancePole}» и оставлять мало места для встречного влияния`,
    );
  }
  if (scores.feedbackNeed >= HIGH) {
    risks.push(
      `без внешней сверки может проседать, потому что сильно опирается на режим «${feedbackPole}»`,
    );
  }
  if (scores.cooperation <= LOW) {
    risks.push(
      `в напряжении может смещаться к «${cooperationPole}» и защищать личную позицию сильнее общего дела`,
    );
  }
  if (scores.ruleAdaptation <= LOW) {
    risks.push(
      `жёсткая структура может вызывать сопротивление, потому что человеку ближе режим «${rulesPole}»`,
    );
  }
  if (scores.extraversion <= LOW) {
    strengths.push(
      `умеет продуктивно работать через «${extraversionPole}», когда нужен спокойный автономный контур`,
    );
  }
  if (scores.extraversion >= HIGH) {
    strengths.push(
      `хорошо оживает в режиме «${extraversionPole}», когда нужна энергия группы и быстрый обмен`,
    );
  }

  return {
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 3),
  };
}

export function buildProfileNarrative(profile) {
  const scores = profile.factorScores;
  const { strengths, risks } = pickHighlights(scores);
  const profileIntegrity = profile.profileIntegrity ?? 7;
  const extraversionMeta = getFactorMeta('extraversion');
  const feedbackMeta = getFactorMeta('feedbackNeed');
  const rulesMeta = getFactorMeta('ruleAdaptation');
  const dominanceMeta = getFactorMeta('dominance');
  const stabilityMeta = getFactorMeta('neuroticism');
  const extraversionPole = getFactorPoleLabel(
    extraversionMeta,
    scores.extraversion,
  );
  const feedbackPole = getFactorPoleLabel(
    feedbackMeta,
    scores.feedbackNeed,
  );
  const rulesPole = getFactorPoleLabel(rulesMeta, scores.ruleAdaptation);
  const dominancePole = getFactorPoleLabel(dominanceMeta, scores.dominance);
  const stabilityPole = getFactorPoleLabel(stabilityMeta, scores.neuroticism);

  const teamPredictionParts = [];

  if (profile.egoState === 'Взрослый') {
    teamPredictionParts.push(
      'В команде чаще выступает стабилизатором: возвращает разговор к фактам, ролям и рабочему контуру.',
    );
  }
  if (profile.egoState === 'Родитель') {
    teamPredictionParts.push(
      'С высокой вероятностью берёт на себя стандарт, темп и внешний контроль, но может перегружать других своим способом держать рамку.',
    );
  }
  if (profile.egoState === 'Ребёнок') {
    teamPredictionParts.push(
      'Привносит живость, импульс и чувствительность к атмосфере, но лучше раскрывается там, где рамка уже достаточно понятна.',
    );
  }

  if (scores.extraversion >= HIGH) {
    teamPredictionParts.push(
      `Лучше раскрывается через режим «${extraversionPole}»: живые обсуждения, быстрый обмен и заметное присутствие внутри группы.`,
    );
  } else if (scores.extraversion <= LOW) {
    teamPredictionParts.push(
      `Эффективнее работает через режим «${extraversionPole}»: спокойную концентрацию и обдумывание до общего обсуждения.`,
    );
  }

  if (scores.feedbackNeed >= HIGH) {
    teamPredictionParts.push(
      `Для устойчивости полезны короткие регулярные сверки, потому что человек сильно опирается на «${feedbackPole}».`,
    );
  }
  if (scores.ruleAdaptation >= HIGH) {
    teamPredictionParts.push(
      `Лучше всего собирается, когда у команды есть «${rulesPole}»: понятные роли, критерии и точки сверки.`,
    );
  } else if (scores.ruleAdaptation <= LOW) {
    teamPredictionParts.push(
      `Если среда слишком жёсткая, человек может уходить в сопротивление, потому что ему ближе «${rulesPole}».`,
    );
  }
  if (scores.dominance >= HIGH) {
    teamPredictionParts.push(
      `В точках неопределённости может быстро забирать на себя «${dominancePole}», поэтому важно заранее развести зоны решений.`,
    );
  }
  if (getDisplayFactorScore('neuroticism', scores.neuroticism) <= LOW) {
    teamPredictionParts.push(
      `Под сильным давлением полезно беречь ресурс, иначе человек может застревать в режиме «${stabilityPole}».`,
    );
  }

  if (profileIntegrity <= 5.5) {
    teamPredictionParts.push(
      'Ответы внутри нескольких шкал выглядят неоднородно, поэтому этот профиль лучше читать как рабочую гипотезу, а не как жёсткий ярлык.',
    );
  }

  return {
    summary:
      `Профиль ${profile.name} показывает, как человек обычно распределяет контроль, устойчивость, контакт и способ кооперации в совместной работе.`,
    strengths:
      strengths.length > 0
        ? strengths
        : ['обладает сбалансированным профилем без ярко выраженных перегибов'],
    risks:
      risks.length > 0
        ? risks
        : ['резких зон риска не видно, но эффективность всё равно зависит от контекста команды'],
    teamPrediction: teamPredictionParts.join(' '),
  };
}

export function getFactorTone(score) {
  if (score >= HIGH) {
    return 'Высокий';
  }
  if (score <= LOW) {
    return 'Низкий';
  }
  return 'Средний';
}

export function buildInstructionLines() {
  return [
    'Опросник достаточно пройти один раз, а потом уже возвращаться только к результатам и сравнению.',
    'В сравнении важнее смотреть на совпадения и возможное трение, а не искать “идеального” человека.',
    'Для команды полезнее учитывать не только процент совместимости, но и роли, стресс и манеру давить на решения.',
  ];
}
