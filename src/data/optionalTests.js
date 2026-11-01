/**
 * Необязательные тесты профиля.
 *
 * Большая пятёрка — 50 вопросов IPIP (ipip.ori.org, общественное достояние).
 * Перевод наш и не проверен на выборке. Баллы переводятся в 0–10, как факторы анкеты.
 *
 * Привязанность — короткая самооценка с нашими формулировками по идее теории
 * привязанности (тревожность и избегание). Это не валидированная методика.
 * Её результат виден только самому человеку и в снапшоты не попадает.
 *
 * Файл без импортов: подсчёт проверяется в Node (tests/unit).
 */

export const BIG_FIVE_FACTOR_KEYS = [
  'extraversion',
  'agreeableness',
  'conscientiousness',
  'stability',
  'openness',
];

const item = (id, factor, text, reverse = false) => ({ id, factor, text, reverse });

export const OPTIONAL_TESTS = {
  bigFive: {
    key: 'bigFive',
    title: 'Большая пятёрка',
    summary: '50 вопросов, около 7 минут. Самая изученная модель личности.',
    intro:
      'Вопросы из открытого набора IPIP. Перевод наш и пока не проверен на выборке, поэтому результат — ориентир. Баллы увидят ваши команды и друзья, а подбор команды учтёт их в оценке составов.',
    lowLabel: 'совсем не про меня',
    highLabel: 'точно про меня',
    factors: {
      extraversion: {
        label: 'Экстраверсия',
        description: 'Сколько энергии вы получаете от общения и насколько заметны в группе.',
      },
      agreeableness: {
        label: 'Доброжелательность',
        description: 'Насколько вы внимательны к людям и готовы идти им навстречу.',
      },
      conscientiousness: {
        label: 'Добросовестность',
        description: 'Насколько вы организованны и доводите дела до конца.',
      },
      stability: {
        label: 'Эмоциональная устойчивость',
        description: 'Насколько спокойно вы переносите стресс и перемены настроения.',
      },
      openness: {
        label: 'Открытость опыту',
        description: 'Насколько вас привлекают идеи, воображение и новое.',
      },
    },
    items: [
      item('e1', 'extraversion', 'На встречах и вечеринках я душа компании.'),
      item('e2', 'extraversion', 'Мне комфортно среди людей.'),
      item('e3', 'extraversion', 'Разговор обычно начинаю я.'),
      item('e4', 'extraversion', 'На встречах я общаюсь со множеством разных людей.'),
      item('e5', 'extraversion', 'Я не против быть в центре внимания.'),
      item('e6', 'extraversion', 'Я говорю немного.', true),
      item('e7', 'extraversion', 'Я держусь в тени.', true),
      item('e8', 'extraversion', 'Мне обычно нечего сказать.', true),
      item('e9', 'extraversion', 'Я не люблю привлекать к себе внимание.', true),
      item('e10', 'extraversion', 'С незнакомыми людьми я обычно молчу.', true),
      item('a1', 'agreeableness', 'Мне интересны люди.'),
      item('a2', 'agreeableness', 'Я сочувствую чужим переживаниям.'),
      item('a3', 'agreeableness', 'У меня мягкое сердце.'),
      item('a4', 'agreeableness', 'Я нахожу время для других.'),
      item('a5', 'agreeableness', 'Я чувствую эмоции других людей.'),
      item('a6', 'agreeableness', 'Рядом со мной людям спокойно.'),
      item('a7', 'agreeableness', 'Другие люди мне не особо интересны.', true),
      item('a8', 'agreeableness', 'Я оскорбляю людей.', true),
      item('a9', 'agreeableness', 'Чужие проблемы мне неинтересны.', true),
      item('a10', 'agreeableness', 'Меня мало заботят другие.', true),
      item('c1', 'conscientiousness', 'Я всегда готовлюсь заранее.'),
      item('c2', 'conscientiousness', 'Я обращаю внимание на детали.'),
      item('c3', 'conscientiousness', 'Обычные дела я делаю сразу.'),
      item('c4', 'conscientiousness', 'Я люблю порядок.'),
      item('c5', 'conscientiousness', 'Я следую расписанию.'),
      item('c6', 'conscientiousness', 'В работе мне важна точность.'),
      item('c7', 'conscientiousness', 'Мои вещи часто лежат где попало.', true),
      item('c8', 'conscientiousness', 'Я часто всё запутываю и порчу.', true),
      item('c9', 'conscientiousness', 'Я часто забываю класть вещи на место.', true),
      item('c10', 'conscientiousness', 'Я уклоняюсь от своих обязанностей.', true),
      item('s1', 'stability', 'Большую часть времени мне спокойно.'),
      item('s2', 'stability', 'Мне редко бывает грустно.'),
      item('s3', 'stability', 'Я легко испытываю стресс.', true),
      item('s4', 'stability', 'Я часто беспокоюсь.', true),
      item('s5', 'stability', 'Меня легко выбить из колеи.', true),
      item('s6', 'stability', 'Я легко расстраиваюсь.', true),
      item('s7', 'stability', 'Моё настроение часто меняется.', true),
      item('s8', 'stability', 'У меня бывают резкие перепады настроения.', true),
      item('s9', 'stability', 'Я легко раздражаюсь.', true),
      item('s10', 'stability', 'Мне часто бывает грустно.', true),
      item('o1', 'openness', 'У меня богатый словарный запас.'),
      item('o2', 'openness', 'У меня живое воображение.'),
      item('o3', 'openness', 'Мне приходят отличные идеи.'),
      item('o4', 'openness', 'Я быстро всё схватываю.'),
      item('o5', 'openness', 'Я использую сложные слова.'),
      item('o6', 'openness', 'Я нахожу время поразмышлять.'),
      item('o7', 'openness', 'У меня много идей.'),
      item('o8', 'openness', 'Мне трудно понимать абстрактные идеи.', true),
      item('o9', 'openness', 'Абстрактные идеи мне неинтересны.', true),
      item('o10', 'openness', 'У меня плохое воображение.', true),
    ],
  },
  attachment: {
    key: 'attachment',
    title: 'Привязанность',
    summary: '6 вопросов, около минуты. Как вы ведёте себя с близкими людьми.',
    intro:
      'Короткая самооценка с нашими формулировками по идее теории привязанности. Это не диагноз и не проверенная методика. Результат видите только вы.',
    lowLabel: 'совсем не про меня',
    highLabel: 'точно про меня',
    factors: {
      anxiety: {
        label: 'Тревожность в близости',
        description: 'Насколько вы переживаете, что близкий человек отдалится.',
      },
      avoidance: {
        label: 'Избегание близости',
        description: 'Насколько вам хочется держать дистанцию и справляться самостоятельно.',
      },
    },
    items: [
      item('av1', 'avoidance', 'Мне трудно открываться близкому человеку.'),
      item('av2', 'avoidance', 'Мне неуютно, когда кто-то становится слишком близко.'),
      item('av3', 'avoidance', 'Я легко прошу близкого человека о поддержке.', true),
      item('an1', 'anxiety', 'Я часто боюсь, что близкий человек уйдёт.'),
      item('an2', 'anxiety', 'Я переживаю, что значу для близкого человека меньше, чем он для меня.'),
      item('an3', 'anxiety', 'Мне нужны частые подтверждения, что между нами всё в порядке.'),
    ],
  },
};

const LIKERT_VALUES = [1, 2, 3, 4, 5];

/**
 * Баллы теста по шкалам 0–10.
 * @returns {{ [factor]: number } | null} null, пока отвечено не на все вопросы
 */
export function calculateOptionalTest(test, answers) {
  const totals = {};

  for (const question of test.items) {
    const value = Number(answers?.[question.id]);

    if (!LIKERT_VALUES.includes(value)) {
      return null;
    }

    const aligned = question.reverse ? 6 - value : value;
    totals[question.factor] = totals[question.factor] || { sum: 0, count: 0 };
    totals[question.factor].sum += ((aligned - 1) / 4) * 10;
    totals[question.factor].count += 1;
  }

  return Object.fromEntries(
    Object.entries(totals).map(([factor, { sum, count }]) => [
      factor,
      Number((sum / count).toFixed(1)),
    ]),
  );
}

export function getOptionalTestLevel(score) {
  if (score <= 3.5) {
    return 'низкий';
  }

  return score < 6.5 ? 'средний' : 'высокий';
}
