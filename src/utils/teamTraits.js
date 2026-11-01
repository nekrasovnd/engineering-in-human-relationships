/**
 * Черты состава команды по Большой пятёрке. В метаанализе Bell (2007) в реальных
 * командах результат предсказывали средняя добросовестность, средняя открытость
 * и минимальная доброжелательность: один резкий человек тянет вниз всю команду.
 * Равные веса трёх показателей — наш выбор, в метаанализе их нет.
 *
 * Файл без импортов: проверяется в Node (tests/unit).
 */

function readScores(member) {
  return member?.bigFive?.scores || null;
}

/** @returns {{ conscientiousness, openness, minAgreeableness, score } | null} null, если тест прошли не все */
export function getGroupTraits(members) {
  if (members.length === 0 || !members.every((member) => readScores(member))) {
    return null;
  }

  const scores = members.map(readScores);
  const mean = (key) => scores.reduce((sum, item) => sum + item[key], 0) / scores.length;
  const conscientiousness = mean('conscientiousness');
  const openness = mean('openness');
  const minAgreeableness = Math.min(...scores.map((item) => item.agreeableness));

  return {
    conscientiousness: Number(conscientiousness.toFixed(1)),
    openness: Number(openness.toFixed(1)),
    minAgreeableness: Number(minAgreeableness.toFixed(1)),
    // Шкала 0–100, как у остальных частей оценки состава.
    score: ((conscientiousness + openness + minAgreeableness) / 3) * 10,
  };
}
