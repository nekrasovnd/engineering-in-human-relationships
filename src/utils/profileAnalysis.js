const HIGH = 7;
const LOW = 4;

function pickHighlights(scores) {
  const strengths = [];
  const risks = [];

  if (scores.neuroticism <= LOW) {
    strengths.push('сохраняет хладнокровие и не разгоняет лишнюю тревогу');
  }
  if (scores.cooperation >= HIGH) {
    strengths.push('умеет играть в общую цель и не зацикливается на личной победе');
  }
  if (scores.empathy >= HIGH) {
    strengths.push('считывает состояние людей и хорошо калибрует тон общения');
  }
  if (scores.ruleAdaptation >= HIGH) {
    strengths.push('любит ясные процессы, дедлайны и понятную зону ответственности');
  }
  if (scores.stressResponse >= HIGH) {
    strengths.push('не теряется под давлением и умеет собирать кризис в план');
  }

  if (scores.neuroticism >= HIGH) {
    risks.push('может усиливать конфликт через тревогу, обиду или резкую реакцию');
  }
  if (scores.dominance >= HIGH) {
    risks.push('способен слишком жёстко продавливать свою позицию');
  }
  if (scores.feedbackNeed >= HIGH) {
    risks.push('может проседать без частой обратной связи и коротких синхронизаций');
  }
  if (scores.cooperation <= LOW) {
    risks.push('может уходить в внутреннюю конкуренцию и защищать свой вклад отдельно от команды');
  }
  if (scores.ruleAdaptation <= LOW) {
    risks.push('хуже переносит жёсткие рамки и может спонтанно ломать договорённости');
  }

  return {
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 3),
  };
}

export function buildProfileNarrative(profile) {
  const scores = profile.factorScores;
  const { strengths, risks } = pickHighlights(scores);

  const teamPredictionParts = [];

  if (profile.egoState === 'Взрослый') {
    teamPredictionParts.push(
      'В команде чаще выступает стабилизатором: переводит эмоции в задачу и помогает договариваться через факты.',
    );
  }
  if (profile.egoState === 'Родитель') {
    teamPredictionParts.push(
      'С высокой вероятностью берёт на себя контроль, стандарты и темп, но может утомлять окружающих избыточной опекой.',
    );
  }
  if (profile.egoState === 'Ребёнок') {
    teamPredictionParts.push(
      'Привносит живость, импульс и чувствительность к атмосфере, но нуждается в понятных рамках и поддержке.',
    );
  }

  if (scores.extraversion >= HIGH) {
    teamPredictionParts.push(
      'Лучше раскрывается в живом взаимодействии, быстрых обсуждениях и заметной роли внутри группы.',
    );
  } else if (scores.extraversion <= LOW) {
    teamPredictionParts.push(
      'Эффективнее работает через спокойную концентрацию и асинхронное обдумывание перед обсуждением.',
    );
  }

  if (scores.feedbackNeed >= HIGH) {
    teamPredictionParts.push(
      'Для устойчивой продуктивности полезны короткие регулярные чек-ины и конкретная обратная связь по ходу работы.',
    );
  }

  return {
    summary:
      `Профиль ${profile.name} показывает сочетание ${profile.egoState.toLowerCase()}-позиции ` +
      `с выраженностью факторов, важных для командной совместимости.`,
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
    'Пройдите опросник один раз полностью: это разблокирует остальные разделы.',
    'Сравнение показывает не “хороших” и “плохих”, а зоны совпадения и потенциального трения.',
    'Для команд ориентируйтесь не только на процент совместимости, но и на роли, стресс и доминантность.',
  ];
}
