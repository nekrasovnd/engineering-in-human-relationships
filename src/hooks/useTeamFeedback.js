import { useMemo, useState } from 'react';
import { useTeamFeedbackData } from './useTeamFeedbackData';
import { submitPeerReview, submitPulseSurvey } from '../services/firestore';
import {
  PEER_CRITERIA_KEYS,
  PULSE_KEYS,
  buildForecastVsFact,
  buildFrictionMentions,
  buildPeerReviewSummary,
  buildPulseTimeline,
  getPendingPeerReviewIterations,
  getWeekKey,
} from '../utils/teamFeedback';
import { canTeamMember } from '../utils/teamRoles';

function buildEmptyPulseForm() {
  return { answers: {}, frictionWith: [], comment: '' };
}

function getFeedbackErrorMessage(feedbackError, fallback) {
  switch (feedbackError?.message) {
    case 'incomplete-survey':
      return 'Ответьте на все вопросы, прежде чем отправить.';
    case 'iteration-not-closed':
      return 'Оценивать коллег можно только после закрытия итерации.';
    case 'team-permission-denied':
      return 'У вашей роли нет прав на это действие.';
    default:
      return fallback;
  }
}

/**
 * Вкладка «Обратная связь»: пульс недели, оценка коллег после итерации
 * и сводки для владельца/админов (индекс трения, прогноз против факта).
 */
export function useTeamFeedback(team, profile, iterations, { onError, onNotice }) {
  const canView = canTeamMember(team, profile.userId, 'viewFeedback');
  const canGive = canTeamMember(team, profile.userId, 'giveFeedback');
  const { pulses, reviews, loading } = useTeamFeedbackData(team?.id, profile.userId, {
    enabled: Boolean(team) && canGive,
    canViewAll: canView,
  });

  const weekKey = getWeekKey();
  const [pulseForm, setPulseForm] = useState(buildEmptyPulseForm);
  const [reviewIterationId, setReviewIterationId] = useState('');
  const [reviewRatings, setReviewRatings] = useState({});
  const [reviewComments, setReviewComments] = useState({});
  const [busyAction, setBusyAction] = useState('');
  const [resultsIterationId, setResultsIterationId] = useState('');

  const membersById = useMemo(
    () => Object.fromEntries((team?.memberSnapshots || []).map((item) => [item.userId, item])),
    [team],
  );
  const colleagues = useMemo(
    () => (team?.memberSnapshots || []).filter((item) => item.userId !== profile.userId),
    [profile.userId, team],
  );
  const myPulseThisWeek = pulses.find(
    (item) => item.userId === profile.userId && item.weekKey === weekKey,
  );
  const myReviews = useMemo(
    () => reviews.filter((item) => item.reviewerId === profile.userId),
    [profile.userId, reviews],
  );
  const pendingReviewIterations = useMemo(
    () => (colleagues.length ? getPendingPeerReviewIterations(iterations, myReviews) : []),
    [colleagues.length, iterations, myReviews],
  );
  const pulseDue = canGive && !loading && !myPulseThisWeek && colleagues.length > 0;
  const pendingCount = (pulseDue ? 1 : 0) + pendingReviewIterations.length;
  const reviewIteration =
    pendingReviewIterations.find((item) => item.id === reviewIterationId) || null;

  // ─── Сводки для владельца/админов ─────────────────────────────────────
  const closedIterations = useMemo(
    () => iterations.filter((item) => item.status === 'closed'),
    [iterations],
  );
  const selectedResultsIterationId = resultsIterationId || closedIterations[0]?.id || '';
  const results = useMemo(() => {
    if (!canView) {
      return null;
    }

    const iterationReviews = reviews.filter(
      (item) => item.iterationId === selectedResultsIterationId,
    );

    return {
      timeline: buildPulseTimeline(pulses),
      thisWeekResponses: pulses.filter((item) => item.weekKey === weekKey).length,
      frictionMentions: buildFrictionMentions(pulses, membersById),
      peerSummary: buildPeerReviewSummary(iterationReviews, membersById),
      peerReviewers: iterationReviews.length,
      forecastVsFact: buildForecastVsFact(reviews, team?.memberSnapshots || []).slice(0, 6),
    };
  }, [canView, membersById, pulses, reviews, selectedResultsIterationId, team, weekKey]);

  const run = async (actionKey, action, fallbackError) => {
    try {
      setBusyAction(actionKey);
      await action();
      return true;
    } catch (feedbackError) {
      onError(getFeedbackErrorMessage(feedbackError, fallbackError));
      return false;
    } finally {
      setBusyAction('');
    }
  };

  // ─── Пульс недели ──────────────────────────────────────────────────────
  const setPulseAnswer = (key, value) => {
    setPulseForm((current) => ({
      ...current,
      answers: { ...current.answers, [key]: value },
    }));
  };

  const togglePulseFriction = (userId) => {
    setPulseForm((current) => ({
      ...current,
      frictionWith: current.frictionWith.includes(userId)
        ? current.frictionWith.filter((item) => item !== userId)
        : [...current.frictionWith, userId],
    }));
  };

  const setPulseComment = (comment) => {
    setPulseForm((current) => ({ ...current, comment }));
  };

  const pulseComplete = PULSE_KEYS.every((key) => pulseForm.answers[key]);

  const sendPulse = async () => {
    const sent = await run(
      'pulse',
      () => submitPulseSurvey(team, profile.userId, pulseForm),
      'Не удалось отправить опрос.',
    );

    if (sent) {
      setPulseForm(buildEmptyPulseForm());
      onNotice('Спасибо! Ответ на опрос недели сохранён.');
    }
  };

  // ─── Оценка коллег ─────────────────────────────────────────────────────
  const startReview = (iterationId) => {
    setReviewIterationId(iterationId);
    setReviewRatings({});
    setReviewComments({});
  };

  const cancelReview = () => setReviewIterationId('');

  const setReviewRating = (userId, criterion, value) => {
    setReviewRatings((current) => ({
      ...current,
      [userId]: { ...current[userId], [criterion]: value },
    }));
  };

  const setReviewComment = (userId, text) => {
    setReviewComments((current) => ({ ...current, [userId]: text }));
  };

  const reviewComplete = colleagues.every((member) =>
    PEER_CRITERIA_KEYS.every((key) => reviewRatings[member.userId]?.[key]),
  );

  const sendReview = async () => {
    const sent = await run(
      'review',
      () =>
        submitPeerReview(team, reviewIteration, profile.userId, {
          ratings: reviewRatings,
          comments: reviewComments,
        }),
      'Не удалось отправить оценку.',
    );

    if (sent) {
      setReviewIterationId('');
      onNotice('Спасибо! Оценка коллег сохранена.');
    }
  };

  return {
    loading,
    canView,
    canGive,
    weekKey,
    colleagues,
    membersById,
    pendingCount,
    busyAction,
    // пульс
    pulseDue,
    myPulseThisWeek,
    pulseForm,
    pulseComplete,
    setPulseAnswer,
    togglePulseFriction,
    setPulseComment,
    sendPulse,
    // оценка коллег
    pendingReviewIterations,
    reviewIteration,
    reviewRatings,
    reviewComments,
    reviewComplete,
    startReview,
    cancelReview,
    setReviewRating,
    setReviewComment,
    sendReview,
    // сводки
    closedIterations,
    selectedResultsIterationId,
    setResultsIterationId,
    results,
  };
}
