/**
 * Обратная связь в команде — контур обратной связи из ТАУ:
 * руководитель (управляющее устройство) раздаёт задачи и сроки (управляющий
 * сигнал), команда (объект управления) работает, а опросы измеряют
 * «уровень сигнала» — трение — и возвращают его руководителю.
 *
 * - Пульс недели: teams/{teamId}/pulseSurveys/{weekKey}_{uid}
 * - Оценка коллег после итерации: teams/{teamId}/peerReviews/{iterationId}_{uid}
 */
import { calculateCompatibility } from './compatibility';

export const PULSE_QUESTIONS = [
  {
    key: 'tension',
    text: 'Насколько напряжённой была атмосфера в команде на этой неделе?',
    lowLabel: 'спокойно',
    highLabel: 'очень напряжённо',
    // Для индекса трения: true — высокий ответ означает больше трения.
    frictionDirect: true,
  },
  {
    key: 'workload',
    text: 'Насколько вы перегружены?',
    lowLabel: 'нагрузка комфортная',
    highLabel: 'сильно перегружен',
    frictionDirect: true,
  },
  {
    key: 'clarity',
    text: 'Насколько понятно, что от вас ждут?',
    lowLabel: 'непонятно',
    highLabel: 'полностью понятно',
    frictionDirect: false,
  },
  {
    key: 'support',
    text: 'Получали ли вы помощь от коллег, когда она была нужна?',
    lowLabel: 'нет',
    highLabel: 'всегда',
    frictionDirect: false,
  },
  {
    key: 'mood',
    text: 'Как вы оцениваете своё рабочее состояние?',
    lowLabel: 'плохо',
    highLabel: 'отлично',
    frictionDirect: false,
  },
];

export const PULSE_KEYS = PULSE_QUESTIONS.map((item) => item.key);

export const PEER_CRITERIA = [
  { key: 'contribution', label: 'Вклад в результат' },
  { key: 'quality', label: 'Качество работы' },
  { key: 'communication', label: 'Коммуникация' },
  { key: 'reliability', label: 'Соблюдение сроков' },
];

export const PEER_CRITERIA_KEYS = PEER_CRITERIA.map((item) => item.key);

export const RATING_VALUES = [1, 2, 3, 4, 5];

/** Порог индекса трения (0–10), выше которого нужен разговор 1:1. */
export const FRICTION_ALERT_THRESHOLD = 6;

/** Сколько дней после закрытия итерации предлагать оценить коллег. */
export const PEER_REVIEW_WINDOW_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO-неделя: '2026-W44'. Пульс-опрос — один раз в неделю. */
export function getWeekKey(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target - yearStart) / DAY_MS + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Понедельник ISO-недели в виде даты для подписи: '27 окт.' */
export function formatWeekLabel(weekKey) {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey || '');

  if (!match) {
    return weekKey || '';
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(januaryFourth);
  monday.setUTCDate(januaryFourth.getUTCDate() - ((januaryFourth.getUTCDay() || 7) - 1) + (week - 1) * 7);

  return monday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function likertToTen(value) {
  return ((value - 1) / 4) * 10;
}

function average(values) {
  return values.length ? values.reduce((sum, item) => sum + item, 0) / values.length : null;
}

/** Индекс трения одного ответа: 0 — всё спокойно, 10 — сильное трение. */
export function getPulseFrictionIndex(answers) {
  const parts = PULSE_QUESTIONS.map((question) => {
    const value = Number(answers?.[question.key]);
    if (!RATING_VALUES.includes(value)) {
      return null;
    }
    return likertToTen(question.frictionDirect ? value : 6 - value);
  }).filter((item) => item !== null);

  const result = average(parts);
  return result === null ? null : Number(result.toFixed(1));
}

/**
 * Сводка пульса по неделям: средние по вопросам, индекс трения, число ответов.
 * @returns {Array<{ weekKey, responses, frictionIndex, averages }>} от старых к новым
 */
export function buildPulseTimeline(pulses) {
  const byWeek = new Map();

  pulses.forEach((pulse) => {
    if (!byWeek.has(pulse.weekKey)) {
      byWeek.set(pulse.weekKey, []);
    }
    byWeek.get(pulse.weekKey).push(pulse);
  });

  return [...byWeek.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([weekKey, items]) => ({
      weekKey,
      responses: items.length,
      frictionIndex: Number(
        (average(items.map((item) => getPulseFrictionIndex(item.answers)).filter((v) => v !== null)) ?? 0).toFixed(1),
      ),
      averages: Object.fromEntries(
        PULSE_KEYS.map((key) => [
          key,
          Number((average(items.map((item) => item.answers[key])) ?? 0).toFixed(1)),
        ]),
      ),
    }));
}

/** С кем чаще всего «сложно»: счётчик упоминаний за последние недели. */
export function buildFrictionMentions(pulses, membersById, { lastWeeks = 4 } = {}) {
  const recentWeeks = [...new Set(pulses.map((item) => item.weekKey))]
    .sort()
    .slice(-lastWeeks);
  const counts = new Map();

  pulses
    .filter((pulse) => recentWeeks.includes(pulse.weekKey))
    .forEach((pulse) => {
      pulse.frictionWith.forEach((userId) => {
        counts.set(userId, (counts.get(userId) || 0) + 1);
      });
    });

  return [...counts.entries()]
    .map(([userId, count]) => ({
      userId,
      name: membersById[userId]?.name || 'Бывший участник',
      count,
    }))
    .sort((left, right) => right.count - left.count);
}

function getReviewScore(rating) {
  return average(
    PEER_CRITERIA_KEYS.map((key) => Number(rating?.[key])).filter((value) =>
      RATING_VALUES.includes(value),
    ),
  );
}

/**
 * Итоги оценки коллег за итерацию: по каждому участнику средние по критериям.
 * @returns {Array<{ userId, name, reviewers, overall, criteria }>}
 */
export function buildPeerReviewSummary(reviews, membersById) {
  const received = new Map();

  reviews.forEach((review) => {
    Object.entries(review.ratings).forEach(([userId, rating]) => {
      if (!received.has(userId)) {
        received.set(userId, []);
      }
      received.get(userId).push(rating);
    });
  });

  return [...received.entries()]
    .map(([userId, ratings]) => ({
      userId,
      name: membersById[userId]?.name || 'Бывший участник',
      reviewers: ratings.length,
      overall: Number((average(ratings.map(getReviewScore).filter((v) => v !== null)) ?? 0).toFixed(1)),
      criteria: Object.fromEntries(
        PEER_CRITERIA_KEYS.map((key) => [
          key,
          Number((average(ratings.map((rating) => Number(rating[key])).filter((v) => RATING_VALUES.includes(v))) ?? 0).toFixed(1)),
        ]),
      ),
    }))
    .sort((left, right) => right.overall - left.overall);
}

/**
 * Прогноз против факта: совместимость пары по профилям (модель)
 * и взаимные оценки после работы (обратная связь). Большой разрыв — сигнал,
 * что модель для этой пары ошибается или в паре есть скрытое трение.
 */
export function buildForecastVsFact(reviews, members) {
  const membersById = Object.fromEntries(members.map((item) => [item.userId, item]));
  const pairScores = new Map();

  reviews.forEach((review) => {
    Object.entries(review.ratings).forEach(([userId, rating]) => {
      if (!membersById[review.reviewerId] || !membersById[userId]) {
        return;
      }
      const pairKey = [review.reviewerId, userId].sort().join('|');
      const score = getReviewScore(rating);
      if (score === null) {
        return;
      }
      if (!pairScores.has(pairKey)) {
        pairScores.set(pairKey, []);
      }
      pairScores.get(pairKey).push(score);
    });
  });

  return [...pairScores.entries()]
    .map(([pairKey, scores]) => {
      const [leftId, rightId] = pairKey.split('|');
      const forecast = calculateCompatibility(membersById[leftId], membersById[rightId]).compatibility;
      const fact = Math.round(((average(scores) - 1) / 4) * 100);
      return {
        pairKey,
        leftName: membersById[leftId].name,
        rightName: membersById[rightId].name,
        forecast,
        fact,
        gap: fact - forecast,
        samples: scores.length,
      };
    })
    .sort((left, right) => Math.abs(right.gap) - Math.abs(left.gap));
}

/** Закрытые недавно итерации, по которым пользователь ещё не оценил коллег. */
export function getPendingPeerReviewIterations(iterations, myReviews, now = new Date()) {
  const reviewedIds = new Set(myReviews.map((item) => item.iterationId));

  return iterations.filter((iteration) => {
    if (iteration.status !== 'closed' || reviewedIds.has(iteration.id)) {
      return false;
    }

    const closedAt = Date.parse(iteration.closedAt);
    return Number.isFinite(closedAt) && now - closedAt <= PEER_REVIEW_WINDOW_DAYS * DAY_MS;
  });
}
