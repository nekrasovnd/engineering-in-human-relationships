import { collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirestoreList } from './useFirestoreList';
import { sanitizeTeamInvite } from '../utils/firestoreDocuments';

export function useTeamInvites(userId) {
  const {
    items: invites,
    loading,
    error,
  } = useFirestoreList({
    enabled: Boolean(userId),
    dependencies: [userId],
    createQuery: () =>
      query(
      collection(db, 'teamInvites'),
      where('toUid', '==', userId),
      ),
    mapSnapshot: (snapshot) =>
      snapshot.docs
          .map((item) => sanitizeTeamInvite(item.data(), item.id))
          .filter(Boolean)
          .sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || '')),
  });

  return { invites, loading, error };
}
