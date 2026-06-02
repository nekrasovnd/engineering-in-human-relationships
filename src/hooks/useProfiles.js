import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

export function useProfiles(currentUserId, options = {}) {
  const { excludeCurrent = false } = options;
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'profiles'),
      (snapshot) => {
        const nextProfiles = snapshot.docs
          .map((item) => item.data())
          .filter(Boolean)
          .filter((item) => (excludeCurrent ? item.userId !== currentUserId : true))
          .sort((left, right) => left.name.localeCompare(right.name, 'ru'));

        setProfiles(nextProfiles);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [currentUserId, excludeCurrent]);

  return { profiles, loading, error };
}
