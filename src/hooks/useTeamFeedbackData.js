import { collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirestoreList } from './useFirestoreList';
import {
  sanitizePeerReview,
  sanitizePulseSurvey,
} from '../utils/firestoreDocuments';

/**
 * Пульс-опросы и оценки коллег команды.
 * Владелец и админы (canViewAll) получают все ответы для сводок,
 * остальные — только свои: правила Firestore требуют фильтр по автору.
 */
export function useTeamFeedbackData(teamId, userId, { enabled = true, canViewAll = false } = {}) {
  const active = enabled && Boolean(teamId) && Boolean(userId);

  const pulsesState = useFirestoreList({
    enabled: active,
    dependencies: [teamId, userId, canViewAll],
    createQuery: () => {
      const pulsesRef = collection(db, 'teams', teamId, 'pulseSurveys');
      return canViewAll ? pulsesRef : query(pulsesRef, where('userId', '==', userId));
    },
    mapSnapshot: (snapshot) =>
      snapshot.docs
        .map((item) => sanitizePulseSurvey(item.data(), item.id))
        .filter(Boolean),
  });
  const reviewsState = useFirestoreList({
    enabled: active,
    dependencies: [teamId, userId, canViewAll],
    createQuery: () => {
      const reviewsRef = collection(db, 'teams', teamId, 'peerReviews');
      return canViewAll ? reviewsRef : query(reviewsRef, where('reviewerId', '==', userId));
    },
    mapSnapshot: (snapshot) =>
      snapshot.docs
        .map((item) => sanitizePeerReview(item.data(), item.id))
        .filter(Boolean),
  });

  return {
    pulses: pulsesState.items,
    reviews: reviewsState.items,
    loading: pulsesState.loading || reviewsState.loading,
  };
}
