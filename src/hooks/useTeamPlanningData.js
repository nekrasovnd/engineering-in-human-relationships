import { collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirestoreList } from './useFirestoreList';
import {
  sanitizeTeamIteration,
  sanitizeTeamTask,
} from '../utils/firestoreDocuments';
import { compareIterations } from '../utils/teamPlanning';

/** Подписка на итерации и задачи команды (подколлекции teams/{teamId}). */
export function useTeamPlanningData(teamId, { enabled = true } = {}) {
  const iterationsState = useFirestoreList({
    enabled: enabled && Boolean(teamId),
    dependencies: [teamId],
    createQuery: () => collection(db, 'teams', teamId, 'iterations'),
    mapSnapshot: (snapshot) =>
      snapshot.docs
        .map((item) => sanitizeTeamIteration(item.data(), item.id))
        .filter(Boolean)
        .sort(compareIterations),
  });
  const tasksState = useFirestoreList({
    enabled: enabled && Boolean(teamId),
    dependencies: [teamId],
    createQuery: () => collection(db, 'teams', teamId, 'tasks'),
    mapSnapshot: (snapshot) =>
      snapshot.docs
        .map((item) => sanitizeTeamTask(item.data(), item.id))
        .filter(Boolean),
  });

  return {
    iterations: iterationsState.items,
    tasks: tasksState.items,
    loading: iterationsState.loading || tasksState.loading,
    error: iterationsState.error || tasksState.error,
  };
}
