import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { hasComparableProfileData } from '../utils/compatibility';

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
          .map((item) => item.data())
          .filter(Boolean)
          .filter(
            (item) =>
              item.questionnaireCompleted &&
              item.egoState &&
              hasComparableProfileData(item),
          )
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
