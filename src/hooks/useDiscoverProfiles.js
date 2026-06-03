import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

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

    const unsubscribe = onSnapshot(
      collection(db, 'discoverProfiles'),
      (snapshot) => {
        const nextProfiles = snapshot.docs
          .map((item) => item.data())
          .filter(Boolean)
          .filter(
            (item) =>
              item.discoverVisible &&
              item.questionnaireCompleted &&
              item.factorScores &&
              item.egoState,
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
