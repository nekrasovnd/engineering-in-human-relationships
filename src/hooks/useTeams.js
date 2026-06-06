import { collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirestoreList } from './useFirestoreList';
import { sanitizeTeam } from '../utils/firestoreDocuments';

export function useTeams(userId) {
  const {
    items: teams,
    loading,
    error,
  } = useFirestoreList({
    enabled: Boolean(userId),
    dependencies: [userId],
    createQuery: () =>
      query(
      collection(db, 'teams'),
      where('memberIds', 'array-contains', userId),
      ),
    mapSnapshot: (snapshot) =>
      snapshot.docs
          .map((item) => sanitizeTeam(item.data(), item.id))
          .filter((item) => item.id && item.createdBy)
          .sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || '')),
  });

  return { teams, loading, error };
}
