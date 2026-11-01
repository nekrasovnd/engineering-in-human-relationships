/**
 * Психокарта R/F/A и модель из методички «Человек как динамическое звено
 * системы управления» (ТАУ, Екатеринбург, 2024):
 *
 *   R·Y'' + (2F√(RA) / (Q·F0))·Y' + (A/Q²)·Y = X
 *
 * R — ригидность, F — фрустрация, A — агрессия, X — сила воздействия,
 * Y — уровень реакции. Это колебательное звено T²Y'' + 2ξTY' + Y = kX, где
 * T = Q√(R/A), ξ = F/F0, k = Q²/A.
 *
 * Шкалы 0–20 с порогом F0 = 10: при F выше порога ξ > 1, как и допускает методичка.
 * Отдельного теста нет: баллы оцениваются по 8 факторам анкеты.
 * Файл без импортов, чтобы математику можно было проверять в Node (tests/unit).
 */

export const PSYCH_SCALE_MAX = 20;
export const FRUSTRATION_NORM = 10;
export const DEFAULT_TIME_PARAMETER = 1;
export const DEFAULT_SIGNAL = { type: 'step', duration: 3, amplitude: 10 };

// Нули дают деление на ноль в T и k и незатухающие колебания при ξ = 0.
const MIN_SCORE = 1;
// Доля от размаха, внутри которой реакция считается успокоившейся.
const SETTLING_BAND = 0.05;
const MAX_CHART_TIME = 60;

export const PSYCH_SCALES = {
  R: {
    key: 'R',
    label: 'Ригидность',
    description: 'Инерционность: насколько трудно перестроиться, когда условия изменились.',
  },
  F: {
    key: 'F',
    label: 'Фрустрация',
    description: 'Отчаяние и отказ от усилий, когда на пути к цели встают препятствия.',
  },
  A: {
    key: 'A',
    label: 'Агрессия',
    description: 'Склонность к противодействию: возражать и спорить по любому поводу.',
  },
};

export const REACTION_SIGNALS = [
  { key: 'step', label: 'Постоянная нагрузка', hint: 'Давление появилось и не уходит' },
  { key: 'pulse', label: 'Разовое событие', hint: 'Конфликт или аврал заданной длительности' },
];

const REGIMES = {
  oscillating: {
    key: 'oscillating',
    label: 'Колебательная реакция',
    summary:
      'Отвечает быстро, но с перехлёстом: эмоция ещё какое-то время раскачивается, прежде чем улечься.',
  },
  balanced: {
    key: 'balanced',
    label: 'Сбалансированная реакция',
    summary: 'Отвечает достаточно быстро и успокаивается почти без раскачки.',
  },
  aperiodic: {
    key: 'aperiodic',
    label: 'Вязкая реакция',
    summary:
      'Колебаний нет, но отклик набирает силу медленно: под давлением человек скорее замедляется, чем раскачивается.',
  },
};

function clampScore(value) {
  return Number(Math.min(PSYCH_SCALE_MAX, Math.max(MIN_SCORE, value)).toFixed(1));
}

/** R, F, A (0–20) по факторам анкеты; neuroticism здесь сырой: выше — реактивнее. */
export function getPsychMap(factorScores) {
  const { neuroticism, dominance, ruleAdaptation, empathy, stressResponse, feedbackNeed, cooperation } =
    factorScores;

  return {
    R: clampScore(
      2 *
        (ruleAdaptation * 0.5 +
          dominance * 0.2 +
          (10 - empathy) * 0.15 +
          (10 - cooperation) * 0.15),
    ),
    F: clampScore(2 * (neuroticism * 0.5 + (10 - stressResponse) * 0.35 + feedbackNeed * 0.15)),
    A: clampScore(
      2 *
        (dominance * 0.45 +
          (10 - cooperation) * 0.35 +
          (10 - empathy) * 0.1 +
          neuroticism * 0.1),
    ),
  };
}

export function getPsychLevel(score) {
  if (score <= 7) {
    return 'низкий';
  }

  return score <= 14 ? 'средний' : 'высокий';
}

/** Коэффициенты уравнения и параметры колебательного звена. */
export function getDynamicsParameters({ R, F, A }, Q = DEFAULT_TIME_PARAMETER) {
  return {
    Q,
    xi: F / FRUSTRATION_NORM,
    T: Q * Math.sqrt(R / A),
    k: (Q * Q) / A,
    a2: R,
    a1: (2 * F * Math.sqrt(R * A)) / (Q * FRUSTRATION_NORM),
    a0: A / (Q * Q),
  };
}

export function getDynamicsRegime(xi) {
  if (xi < 0.5) {
    return REGIMES.oscillating;
  }

  return xi < 1 ? REGIMES.balanced : REGIMES.aperiodic;
}

/** Переходная функция звена с k = 1 (реакция на единичный скачок). */
export function unitStepResponse(time, { T, xi }) {
  if (time <= 0) {
    return 0;
  }

  const omega = 1 / T;

  if (Math.abs(xi - 1) < 1e-6) {
    return 1 - Math.exp(-omega * time) * (1 + omega * time);
  }

  if (xi < 1) {
    const root = Math.sqrt(1 - xi * xi);
    const damped = omega * root;
    return (
      1 -
      Math.exp(-xi * omega * time) *
        (Math.cos(damped * time) + (xi / root) * Math.sin(damped * time))
    );
  }

  const root = Math.sqrt(xi * xi - 1);
  const slow = omega * (xi - root);
  const fast = omega * (xi + root);
  return 1 - (fast * Math.exp(-slow * time) - slow * Math.exp(-fast * time)) / (fast - slow);
}

/** Реакция в момент времени: импульс — это скачок вверх и скачок вниз через duration. */
export function getReactionAt(time, parameters, signal) {
  const pulseEnd =
    signal.type === 'pulse' ? unitStepResponse(time - signal.duration, parameters) : 0;

  return parameters.k * signal.amplitude * (unitStepResponse(time, parameters) - pulseEnd);
}

function estimateHorizon({ T, xi }, signal) {
  const decay = xi < 1 ? T / xi : T * (xi + Math.sqrt(xi * xi - 1));
  return (signal.type === 'pulse' ? signal.duration : 0) + 4 * decay;
}

/**
 * Показатели переходного процесса из методички:
 * продолжительность, колебательность и перехлёст.
 */
export function analyzeReaction(parameters, signal) {
  const horizon = estimateHorizon(parameters, signal) * 3;
  const steps = 4000;
  const dt = horizon / steps;
  const target = signal.type === 'step' ? parameters.k * signal.amplitude : 0;
  const values = Array.from({ length: steps + 1 }, (_, index) =>
    getReactionAt(index * dt, parameters, signal),
  );
  const peak = values.reduce((max, value) => (Math.abs(value) > Math.abs(max) ? value : max), 0);
  const band = SETTLING_BAND * (signal.type === 'step' ? target : Math.abs(peak));

  let settlingTime = 0;
  for (let index = steps; index >= 0; index -= 1) {
    if (Math.abs(values[index] - target) > band) {
      settlingTime = (index + 1) * dt;
      break;
    }
  }

  let swings = 0;
  for (let index = 1; index < steps; index += 1) {
    const isExtremum =
      (values[index] - values[index - 1]) * (values[index + 1] - values[index]) < 0;
    if (isExtremum && Math.abs(values[index] - target) > band) {
      swings += 1;
    }
  }

  // У импульса главный пик — сам отклик, а не колебание.
  const oscillations = signal.type === 'pulse' ? Math.max(0, swings - 1) : swings;
  const overshoot =
    signal.type === 'step'
      ? Math.max(0, Math.max(...values) - target) / target
      : Math.abs(Math.min(0, Math.min(...values))) / Math.abs(peak);

  return {
    settlingTime: Number(settlingTime.toFixed(1)),
    oscillations,
    overshootPercent: Math.round(overshoot * 100),
    peak: Number(peak.toFixed(2)),
  };
}

export function buildPersonDynamics(person, signal = DEFAULT_SIGNAL) {
  const map = getPsychMap(person.factorScores);
  const parameters = getDynamicsParameters(map);

  return {
    userId: person.userId,
    name: person.name,
    map,
    parameters,
    regime: getDynamicsRegime(parameters.xi),
    analysis: analyzeReaction(parameters, signal),
  };
}

/** Кривые на общей сетке времени: так подсказка на графике показывает всех сразу. */
export function buildReactionSeries(rows, signal, points = 240) {
  // Целая граница — чтобы последняя отметка оси была без длинной дроби.
  const end = Math.ceil(
    Math.min(
      MAX_CHART_TIME,
      Math.max(...rows.map((row) => estimateHorizon(row.parameters, signal))) * 1.1,
    ),
  );
  const times = Array.from({ length: points + 1 }, (_, index) =>
    Number(((end * index) / points).toFixed(3)),
  );

  return {
    times,
    series: rows.map((row) => ({
      userId: row.userId,
      name: row.name,
      values: times.map((time) => Number(getReactionAt(time, row.parameters, signal).toFixed(3))),
    })),
  };
}

/** Советы человеку о нём самом (психокарта в профиле) — по R, F, A и режиму реакции. */
export function buildDynamicsAdvice({ map, regime }) {
  const advice = [];

  if (regime.key === 'oscillating') {
    advice.push('После острого разговора возьмите паузу: решения, принятые на пике раскачки, стоит перепроверить.');
  }

  if (map.F > FRUSTRATION_NORM) {
    advice.push('Фрустрация выше порога: упираясь в препятствие, разбейте цель на короткие шаги и просите помощи раньше, чем накопится усталость.');
  }

  if (map.R > 14) {
    advice.push('Высокая инерционность: просите предупреждать об изменениях заранее и объяснять, зачем они нужны.');
  }

  if (map.A > 14) {
    advice.push('Высокая склонность к противодействию: разделяйте спор о задаче и отношение к человеку, заранее договаривайтесь о зонах решений.');
  }

  if (advice.length === 0) {
    advice.push('Выраженных рисков модель не показывает: достаточно обычного ритма сверок.');
  }

  return advice;
}

/** Замечания по группе: кого беречь и где разводить зоны решений. */
export function buildGroupDynamicsNotes(rows) {
  if (rows.length < 2) {
    return [];
  }

  const notes = [];
  const names = (items) => items.map((row) => row.name).join(', ');
  // Порог F0 — это середина шкалы, поэтому тревожимся только на высоком уровне.
  const frustrated = rows.filter((row) => row.map.F > 14);
  const combative = rows.filter((row) => row.map.A > 14);
  const slowest = rows.reduce((top, row) =>
    row.analysis.settlingTime > top.analysis.settlingTime ? row : top,
  );
  const swinging = rows.reduce((top, row) =>
    row.analysis.overshootPercent > top.analysis.overshootPercent ? row : top,
  );

  if (frustrated.length > 0) {
    notes.push({
      tone: 'warning',
      text: `Высокая фрустрация: ${names(frustrated)}. Начните с разговора 1:1 и снятия препятствий.`,
    });
  }

  if (combative.length >= 2) {
    notes.push({
      tone: 'warning',
      text: `Сразу несколько человек склонны к противодействию (${names(combative)}): закрепите зоны решений заранее.`,
    });
  }

  if (swinging.analysis.overshootPercent >= 25) {
    notes.push({
      tone: 'info',
      text: `Сильнее всего раскачивается ${swinging.name} (перехлёст ${swinging.analysis.overshootPercent}%): не принимайте решения сразу после острого момента.`,
    });
  }

  notes.push({
    tone: 'info',
    text: `Дольше всех приходит в норму ${slowest.name} (${slowest.analysis.settlingTime} усл. с): закладывайте запас после резких изменений.`,
  });

  return notes;
}
