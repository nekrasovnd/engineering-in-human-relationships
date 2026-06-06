import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

export function useTeams(userId) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setTeams([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    setLoading(true);
    setError('');

    const teamsQuery = query(
      collection(db, 'teams'),
      where('memberIds', 'array-contains', userId),
    );

    const unsubscribe = onSnapshot(
      teamsQuery,
      (snapshot) => {
        const nextTeams = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((left, right) =>
            (right.createdAt || '').localeCompare(left.createdAt || ''),
          );

        setTeams(nextTeams);
        setLoading(false);
        setError('');
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userId]);

  return { teams, loading, error };
}
