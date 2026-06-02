import { calculateCompatibility } from './compatibility';

const TEAM_ROLES = [
  {
    key: 'Идеолог',
    score: (profile) =>
      profile.factorScores.extraversion * 0.3 +
      profile.factorScores.feedbackNeed * 0.25 +
      profile.factorScores.cooperation * 0.2 +
      profile.factorScores.empathy * 0.25,
  },
  {
    key: 'Исполнитель',
    score: (profile) =>
      profile.factorScores.ruleAdaptation * 0.35 +
      profile.factorScores.stressResponse * 0.35 +
      (10 - profile.factorScores.neuroticism) * 0.3,
  },
  {
    key: 'Миротворец',
    score: (profile) =>
      profile.factorScores.empathy * 0.4 +
      profile.factorScores.cooperation * 0.35 +
      (10 - profile.factorScores.neuroticism) * 0.25,
  },
  {
    key: 'Контролёр',
    score: (profile) =>
      profile.factorScores.dominance * 0.4 +
      profile.factorScores.ruleAdaptation * 0.4 +
      profile.factorScores.stressResponse * 0.2,
  },
  {
    key: 'Креативщик',
    score: (profile) =>
      (10 - profile.factorScores.ruleAdaptation) * 0.2 +
      profile.factorScores.empathy * 0.2 +
      profile.factorScores.extraversion * 0.2 +
      profile.factorScores.feedbackNeed * 0.15 +
      (10 - profile.factorScores.dominance) * 0.25,
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

  TEAM_ROLES.forEach((role) => {
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
    });

    const removeIndex = unassigned.findIndex(
      (item) => item.userId === bestProfile.userId,
    );
    unassigned.splice(removeIndex, 1);
  });

  unassigned.forEach((profile) => {
    assignments.push({
      role: 'Универсал',
      userId: profile.userId,
      name: profile.name,
      fitScore: Number(
        (
          profile.factorScores.cooperation * 0.4 +
          profile.factorScores.stressResponse * 0.3 +
          profile.factorScores.empathy * 0.3
        ).toFixed(1),
      ),
    });
  });

  return assignments;
}

export function buildTeamSummary(memberProfiles) {
  if (memberProfiles.length === 0) {
    return 'Команда пока пуста.';
  }

  const average = memberProfiles.reduce(
    (accumulator, profile) => ({
      neuroticism: accumulator.neuroticism + profile.factorScores.neuroticism,
      cooperation: accumulator.cooperation + profile.factorScores.cooperation,
      dominance: accumulator.dominance + profile.factorScores.dominance,
    }),
    { neuroticism: 0, cooperation: 0, dominance: 0 },
  );

  const count = memberProfiles.length;
  const avgNeuroticism = average.neuroticism / count;
  const avgCooperation = average.cooperation / count;
  const avgDominance = average.dominance / count;

  if (avgCooperation >= 7 && avgNeuroticism <= 4.5) {
    return 'Команда выглядит устойчивой: высокий шанс на кооперацию без лишней эмоциональной турбулентности.';
  }

  if (avgDominance >= 7) {
    return 'В команде много лидерского импульса. Нужно заранее развести зоны решений, иначе возникнет борьба за влияние.';
  }

  if (avgNeuroticism >= 6) {
    return 'Команда чувствительна к неопределённости. Ей особенно важны ясные процессы, буферы и частый фидбек.';
  }

  return 'Команда умеренно сбалансирована: ей подойдут понятные роли, короткие синхронизации и прозрачные ожидания.';
}
