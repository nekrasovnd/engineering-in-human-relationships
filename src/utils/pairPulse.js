/**
 * Опрос недели для пары: friendships/{a_b}/pulses/{weekKey}_{uid}.
 * Вопросы — про то, что в исследовании Joel et al. (2020) оказалось среди сильнейших
 * предикторов качества отношений: признательность, ощущение преданности партнёра,
 * конфликт. Формулировки наши, шкала не валидирована.
 *
 * Файл без импортов: проверяется в Node (tests/unit).
 */

export const PAIR_QUESTIONS = [
  {
    key: 'appreciation',
    text: 'Чувствовали ли вы на этой неделе, что вас ценят?',
    lowLabel: 'нет',
    highLabel: 'очень',
    tensionDirect: false,
  },
  {
    key: 'commitment',
    text: 'Чувствуете ли вы, что партнёр настроен на ваши отношения?',
    lowLabel: 'нет',
    highLabel: 'полностью',
    tensionDirect: false,
  },
  {
    key: 'closeness',
    text: 'Насколько вам было хорошо вместе?',
    lowLabel: 'плохо',
    highLabel: 'отлично',
    tensionDirect: false,
  },
  {
    key: 'conflict',
    text: 'Остались ли ссоры или обиды, которые вы не закрыли?',
    lowLabel: 'нет',
    highLabel: 'много',
    tensionDirect: true,
  },
];

export const PAIR_QUESTION_KEYS = PAIR_QUESTIONS.map((question) => question.key);

/** Выше этого индекса напряжения (0–10) стоит поговорить, а не ждать. */
export const PAIR_ALERT_THRESHOLD = 6;

// Языки любви здесь — повод для разговора. В оценку совместимости они не входят:
// обзор Impett et al. (2024) не нашёл пользы от совпадения «языков».
export const PAIR_CONVERSATION_PROMPTS = [
  'Что на этой неделе партнёр сделал такого, за что хочется сказать спасибо?',
  'Какие слова от партнёра вам было бы приятно слышать чаще?',
  'Какое время вместе вам больше всего запомнилось и почему?',
  'Какая помощь в делах сейчас сняла бы с вас больше всего нагрузки?',
  'Какой небольшой знак внимания обрадовал вас за последнее время?',
  'Когда вам хочется объятий или прикосновения, а когда нужно побыть в одиночестве?',
  'О чём вы на этой неделе хотели сказать, но промолчали?',
  'Какой спор давно ждёт спокойного разговора и что поможет его начать?',
];

export function getPairPrompt(weekKey) {
  const hash = [...String(weekKey || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PAIR_CONVERSATION_PROMPTS[hash % PAIR_CONVERSATION_PROMPTS.length];
}

/** Индекс напряжения одного ответа: 0 — всё спокойно, 10 — сильное напряжение. */
export function getPairTensionIndex(answers) {
  const total = PAIR_QUESTIONS.reduce((sum, question) => {
    const value = Number(answers?.[question.key]);
    return sum + (((question.tensionDirect ? value : 6 - value) - 1) / 4) * 10;
  }, 0);

  return Number((total / PAIR_QUESTIONS.length).toFixed(1));
}

/**
 * Недели, на которые ответили оба. Неделя с одним ответом не показывается:
 * ответы партнёра открываются только после своего.
 * @returns {Array<{ weekKey, responses, frictionIndex }>} от старых к новым
 */
export function buildPairTimeline(pulses) {
  const byWeek = new Map();

  pulses.forEach((pulse) => {
    byWeek.set(pulse.weekKey, [...(byWeek.get(pulse.weekKey) || []), pulse]);
  });

  return [...byWeek.entries()]
    .filter(([, items]) => items.length >= 2)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([weekKey, items]) => ({
      weekKey,
      responses: items.length,
      frictionIndex: Number(
        (
          items.reduce((sum, item) => sum + getPairTensionIndex(item.answers), 0) / items.length
        ).toFixed(1),
      ),
    }));
}
