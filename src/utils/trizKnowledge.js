import { TRIZ_KNOWLEDGE } from '../data/trizKnowledge';

export { TRIZ_KNOWLEDGE };

/**
 * Фильтрует TRIZ_KNOWLEDGE по поисковому запросу.
 * Возвращает полный объект если запрос пуст.
 *
 * @param {string} query - Поисковая строка
 * @returns {{ laws: Array, principles: Array, analogies: string[], teamExamples: string[] }}
 */
export function searchKnowledge(query) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return TRIZ_KNOWLEDGE;
  }

  const includesQuery = (text) => text.toLowerCase().includes(normalized);

  return {
    laws: TRIZ_KNOWLEDGE.laws.filter(
      (item) => includesQuery(item.title) || includesQuery(item.summary),
    ),
    principles: TRIZ_KNOWLEDGE.principles.filter(
      (item) =>
        includesQuery(item.title) ||
        includesQuery(item.summary) ||
        includesQuery(item.teamExample) ||
        item.keywords.some(includesQuery),
    ),
    analogies: TRIZ_KNOWLEDGE.analogies.filter(includesQuery),
    teamExamples: TRIZ_KNOWLEDGE.teamExamples.filter(includesQuery),
  };
}

function getPrincipleById(id) {
  return TRIZ_KNOWLEDGE.principles.find((item) => item.id === id);
}

/**
 * Генерирует до 2 подсказок по принципам ТРИЗ для разрешения конфликта между двумя профилями.
 * Выбор принципов зависит от конкретных метрик сравнения (dominance, neuroticism, empathy и т.д.).
 *
 * @param {Object} firstProfile
 * @param {Object} secondProfile
 * @param {{ conflictRisk: string }} comparison - Результат calculateCompatibility
 * @returns {Array<{ id: number, title: string, summary: string, teamExample: string, reason: string }>}
 */
export function getConflictResolutionHints(firstProfile, secondProfile, comparison) {
  const suggestions = [];
  const diffEmpathy = Math.abs(
    firstProfile.factorScores.empathy - secondProfile.factorScores.empathy,
  );
  const diffRules = Math.abs(
    firstProfile.factorScores.ruleAdaptation -
      secondProfile.factorScores.ruleAdaptation,
  );

  if (comparison.conflictRisk === 'Высокий') {
    suggestions.push({
      principle: getPrincipleById(10),
      reason:
        'Высокий риск конфликта лучше не лечить постфактум: договоритесь о правилах эскалации и сроках заранее.',
    });
  }

  if (
    firstProfile.factorScores.dominance > 7 &&
    secondProfile.factorScores.dominance > 7
  ) {
    suggestions.push({
      principle: getPrincipleById(1),
      reason:
        'Два сильных лидера лучше работают при разделении зон ответственности, а не при борьбе за одну и ту же территорию.',
    });
  }

  if (Math.abs(firstProfile.factorScores.neuroticism - secondProfile.factorScores.neuroticism) > 4) {
    suggestions.push({
      principle: getPrincipleById(23),
      reason:
        'Большой разрыв по нейротизму требует более частой и прозрачной обратной связи, чтобы не рождались догадки и обиды.',
    });
  }

  if (diffEmpathy > 4 || diffRules > 4) {
    suggestions.push({
      principle: getPrincipleById(3),
      reason:
        'Люди с разной чувствительностью и потребностью в структуре выигрывают от локальной настройки правил взаимодействия.',
    });
  }

  if (suggestions.length < 2) {
    suggestions.push({
      principle: getPrincipleById(26),
      reason:
        'Шаблон чек-листа или формат сообщения помогает убрать лишнюю импровизацию из конфликтного общения.',
    });
  }

  return suggestions
    .filter((item) => item.principle)
    .slice(0, 2)
    .map((item) => ({
      ...item.principle,
      reason: item.reason,
    }));
}
