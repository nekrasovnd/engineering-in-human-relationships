import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { sanitizeDiscoverProfile } from '../utils/firestoreDocuments';

export function useDiscoverProfiles(currentUserId, options = {}) {
  const { excludeCurrent = false, enabled = true } = options;
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUserId || !enabled) {
      setProfiles([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    setLoading(true);
    setError('');

    const discoverQuery = query(
      collection(db, 'discoverProfiles'),
      where('discoverVisible', '==', true),
    );

    const unsubscribe = onSnapshot(
      discoverQuery,
      (snapshot) => {
        const nextProfiles = snapshot.docs
          .map((item) => sanitizeDiscoverProfile(item.data()))
          .filter(Boolean)
          .filter((item) => (excludeCurrent ? item.userId !== currentUserId : true))
          .sort((left, right) =>
            (left.name || '').localeCompare(right.name || '', 'ru'),
          );

        setProfiles(nextProfiles);
        setLoading(false);
        setError('');
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [currentUserId, enabled, excludeCurrent]);

  return { profiles, loading, error };
}
