import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

export function useTeamInvites(userId) {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setInvites([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    const invitesQuery = query(
      collection(db, 'teamInvites'),
      where('toUid', '==', userId),
    );

    const unsubscribe = onSnapshot(
      invitesQuery,
      (snapshot) => {
        const nextInvites = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

        setInvites(nextInvites);
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

  return { invites, loading, error };
}
