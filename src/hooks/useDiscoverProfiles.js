import { collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirestoreList } from './useFirestoreList';
import { sanitizeDiscoverProfile } from '../utils/firestoreDocuments';

export function useDiscoverProfiles(currentUserId, options = {}) {
  const { excludeCurrent = false, enabled = true } = options;
  const {
    items: profiles,
    loading,
    error,
  } = useFirestoreList({
    enabled: Boolean(currentUserId) && enabled,
    dependencies: [currentUserId, excludeCurrent, enabled],
    createQuery: () =>
      query(
      collection(db, 'discoverProfiles'),
      where('discoverVisible', '==', true),
      ),
    mapSnapshot: (snapshot) =>
      snapshot.docs
          .map((item) => sanitizeDiscoverProfile(item.data()))
          .filter(Boolean)
          .filter((item) => (excludeCurrent ? item.userId !== currentUserId : true))
          .sort((left, right) => (left.name || '').localeCompare(right.name || '', 'ru')),
  });

  return { profiles, loading, error };
}
