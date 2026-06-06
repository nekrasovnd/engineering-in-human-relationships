import { onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useFirestoreList({
  enabled = true,
  dependencies = [],
  createQuery,
  mapSnapshot,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    setLoading(true);
    setError('');

    const unsubscribe = onSnapshot(
      createQuery(),
      (snapshot) => {
        setItems(mapSnapshot(snapshot));
        setLoading(false);
        setError('');
      },
      (snapshotError) => {
        setItems([]);
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [enabled, ...dependencies]);

  return { items, loading, error };
}
