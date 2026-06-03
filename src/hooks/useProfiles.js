import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

export function useProfiles(currentUserId, options = {}) {
  const { excludeCurrent = false, includeIncomplete = false } = options;
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUserId) {
      setProfiles([]);
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'publicProfiles'),
      (snapshot) => {
        const nextProfiles = snapshot.docs
          .map((item) => item.data())
          .filter(Boolean)
          .filter((item) =>
            includeIncomplete
              ? true
              : Boolean(
                  item.questionnaireCompleted &&
                    item.factorScores &&
                    item.egoState,
                ),
          )
          .filter((item) => (excludeCurrent ? item.userId !== currentUserId : true))
          .sort((left, right) =>
            (left.name || '').localeCompare(right.name || '', 'ru'),
          );

        setProfiles(nextProfiles);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [currentUserId, excludeCurrent, includeIncomplete]);

  return { profiles, loading, error };
}
