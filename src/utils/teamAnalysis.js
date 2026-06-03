import {
  buildSystemIndices,
  getDisplayFactorScore,
} from '../data/questionnaire';
import { calculateCompatibility } from './compatibility';

const TEAM_FUNCTIONS = [
  {
    key: 'Собирает людей',
    score: (profile) =>
      profile.factorScores.extraversion * 0.35 +
      profile.factorScores.empathy * 0.25 +
      profile.factorScores.feedbackNeed * 0.2 +
      profile.factorScores.cooperation * 0.2,
    reason: (profile) =>
      `${profile.name} легче всего запускает общий контакт, держит обмен живым и замечает, когда разговор начинает выпадать из связи.`,
  },
  {
    key: 'Держит рамку',
    score: (profile) =>
      profile.factorScores.ruleAdaptation * 0.4 +
      profile.factorScores.dominance * 0.35 +
      profile.factorScores.stressResponse * 0.25,
    reason: (profile) =>
      `${profile.name} естественнее других собирает сроки, роли и точки контроля, когда команда начинает расползаться.`,
  },
  {
    key: 'Снижает трение',
    score: (profile) =>
      profile.factorScores.empathy * 0.4 +
      profile.factorScores.cooperation * 0.35 +
      getDisplayFactorScore('neuroticism', profile.factorScores.neuroticism) * 0.25,
    reason: (profile) =>
      `${profile.name} лучше других чувствует перегрев и может вернуть разговор в рабочий формат без лишнего давления.`,
  },
  {
    key: 'Тянет в нагрузке',
    score: (profile) =>
      profile.factorScores.stressResponse * 0.45 +
      getDisplayFactorScore('neuroticism', profile.factorScores.neuroticism) * 0.3 +
      profile.factorScores.ruleAdaptation * 0.25,
    reason: (profile) =>
      `${profile.name} надёжнее держится в неопределённости и не так быстро выпадает из темпа, когда ситуация становится жёстче.`,
  },
  {
    key: 'Продвигает решение',
    score: (profile) =>
      profile.factorScores.dominance * 0.35 +
      profile.factorScores.stressResponse * 0.25 +
      profile.factorScores.cooperation * 0.15 +
      (10 - profile.factorScores.ruleAdaptation) * 0.25,
    reason: (profile) =>
      `${profile.name} чаще других способен двинуть решение вперёд, когда команда зависла между вариантами и ждёт импульса.`,
  },
];

export function findMostConflictPair(memberProfiles) {
  if (memberProfiles.length < 2) {
    return null;
  }

  let pair = null;

  for (let index = 0; index < memberProfiles.length; index += 1) {
    for (let inner = index + 1; inner < memberProfiles.length; inner += 1) {
      const left = memberProfiles[index];
      const right = memberProfiles[inner];
      const comparison = calculateCompatibility(left, right);

      if (!pair || comparison.compatibility < pair.compatibility) {
        pair = {
          left,
          right,
          ...comparison,
        };
      }
    }
  }

  return pair;
}

export function getRecommendedRoles(memberProfiles) {
  const unassigned = [...memberProfiles];
  const assignments = [];

  TEAM_FUNCTIONS.forEach((role) => {
    if (unassigned.length === 0) {
      return;
    }

    const bestProfile = [...unassigned].sort(
      (left, right) => role.score(right) - role.score(left),
    )[0];

    assignments.push({
      role: role.key,
      userId: bestProfile.userId,
      name: bestProfile.name,
      fitScore: Number(role.score(bestProfile).toFixed(1)),
      reason: role.reason(bestProfile),
    });

    const removeIndex = unassigned.findIndex(
      (item) => item.userId === bestProfile.userId,
    );
    unassigned.splice(removeIndex, 1);
  });

  unassigned.forEach((profile) => {
    assignments.push({
      role: 'Гибкий участник',
      userId: profile.userId,
      name: profile.name,
      fitScore: Number(
        (
          profile.factorScores.cooperation * 0.35 +
          profile.factorScores.stressResponse * 0.35 +
          profile.factorScores.empathy * 0.3
        ).toFixed(1),
      ),
      reason: `${profile.name} можно подключать как связующий ресурс там, где важны подстройка, подхват задачи и поддержание общего темпа.`,
    });
  });

  return assignments;
}

export function buildTeamSummary(memberProfiles) {
  if (memberProfiles.length === 0) {
    return {
      summary: 'Команда пока пуста.',
      strength: 'Пока не из чего считывать рабочий контур.',
      caution: 'Добавьте участников, чтобы появились выводы по динамике.',
    };
  }

  const average = memberProfiles.reduce(
    (accumulator, profile) => {
      const indices = profile.systemIndices || buildSystemIndices(profile.factorScores);

      return {
        teamStabilityReserve:
          accumulator.teamStabilityReserve + indices.teamStabilityReserve,
        communicationClarity:
          accumulator.communicationClarity + indices.communicationClarity,
        autonomyBalance: accumulator.autonomyBalance + indices.autonomyBalance,
        dominance: accumulator.dominance + profile.factorScores.dominance,
        ruleAdaptation:
          accumulator.ruleAdaptation + profile.factorScores.ruleAdaptation,
        stressResponse:
          accumulator.stressResponse + profile.factorScores.stressResponse,
        stability:
          accumulator.stability +
          getDisplayFactorScore('neuroticism', profile.factorScores.neuroticism),
      };
    },
    {
      teamStabilityReserve: 0,
      communicationClarity: 0,
      autonomyBalance: 0,
      dominance: 0,
      ruleAdaptation: 0,
      stressResponse: 0,
      stability: 0,
    },
  );

  const count = memberProfiles.length;
  const teamReserve = average.teamStabilityReserve / count;
  const communicationClarity = average.communicationClarity / count;
  const autonomyBalance = average.autonomyBalance / count;
  const avgDominance = average.dominance / count;
  const avgRules = average.ruleAdaptation / count;
  const avgStress = average.stressResponse / count;
  const avgStability = average.stability / count;
  const strongLeaders = memberProfiles.filter(
    (profile) => profile.factorScores.dominance >= 7,
  ).length;

  let summary =
    'Команда выглядит умеренно управляемой: ей подойдут понятные роли, короткие синки и прозрачные ожидания.';
  let strength =
    'Главная сильная сторона пока не выделяется резко: команда скорее держится на балансе, чем на одном ярком преимуществе.';
  let caution =
    'Следите, чтобы роли и право финального решения не оставались размытыми дольше, чем нужно.';

  if (teamReserve >= 7 && communicationClarity >= 6.7) {
    summary =
      'Команда выглядит устойчивой: ей проще держать контакт, не разваливаться под нагрузкой и быстрее возвращаться в рабочий ритм.';
    strength =
      'Сильнее всего здесь работает общий запас устойчивости: участники легче переживают неопределённость и реже уходят в хаотичное трение.';
  } else if (strongLeaders >= 2 && avgDominance >= 6.8) {
    summary =
      'В команде много импульса к ведению. Это может сильно ускорять движение, но без разведения зон решений быстро начнётся борьба за рамку.';
    strength =
      'Плюс такой команды в том, что она не зависает без движения: кто-то почти всегда готов взять курс на себя.';
    caution =
      'Слабое место — конкуренция за право определять правила. Лучше заранее закрепить, кто за что отвечает и где проходит граница финального слова.';
  } else if (avgStability <= 5 || avgStress <= 5.5) {
    summary =
      'Команда чувствительна к перегрузке: в обычной работе всё может идти нормально, но под жёстким давлением ей нужна внешняя опора.';
    strength =
      'Хорошая новость в том, что даже такая команда может быть сильной, если у неё есть заранее оговорённый ритм, буферы и понятная эскалация.';
    caution =
      'Не стоит держать всё на импровизации. Чем выше неопределённость, тем важнее сроки, паузы перед жёсткой обратной связью и быстрые сверки.';
  } else if (communicationClarity >= 6.8 && autonomyBalance >= 6.3) {
    summary =
      'Команда выглядит собранной: ей легче говорить на одном языке, быстро замечать перекосы и не проваливаться в лишние недоговорённости.';
    strength =
      'Сильная сторона здесь — в контуре связи: люди проще считывают темп, договорённости и ожидания друг друга.';
  }

  if (avgRules <= 4.5) {
    caution =
      'Команда может сопротивляться слишком жёсткой рамке, поэтому структура здесь должна помогать, а не душить. Лучше короткие понятные правила, чем тяжёлый регламент.';
  }

  return {
    summary,
    strength,
    caution,
  };
}
