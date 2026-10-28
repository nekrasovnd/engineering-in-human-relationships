import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { db } from '../lib/firebase';
import { useFirestoreList } from './useFirestoreList';
import { sanitizeFriendship } from '../utils/firestoreDocuments';

/**
 * Друзья по коду: мой код, заявки и подтверждённые друзья.
 * friends — снапшоты профилей друзей (для приглашений и подбора команды).
 */
export function useFriendsData(userId) {
  const friendshipsState = useFirestoreList({
    enabled: Boolean(userId),
    dependencies: [userId],
    createQuery: () =>
      query(collection(db, 'friendships'), where('userIds', 'array-contains', userId)),
    mapSnapshot: (snapshot) =>
      snapshot.docs
        .map((item) => sanitizeFriendship(item.data(), item.id))
        .filter(Boolean),
  });
  const codesState = useFirestoreList({
    enabled: Boolean(userId),
    dependencies: [userId],
    createQuery: () =>
      query(collection(db, 'friendCodes'), where('userId', '==', userId)),
    mapSnapshot: (snapshot) =>
      snapshot.docs
        .map((item) => item.data())
        .sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || '')),
  });

  const friendships = friendshipsState.items;
  const grouped = useMemo(() => {
    const otherSnapshot = (item) => {
      const otherId = item.userIds.find((id) => id !== userId);
      return item.snapshots[otherId] || null;
    };

    return {
      friends: friendships
        .filter((item) => item.status === 'accepted')
        .map((item) => ({ friendshipId: item.id, profile: otherSnapshot(item) }))
        .filter((item) => item.profile)
        .sort((left, right) => left.profile.name.localeCompare(right.profile.name, 'ru')),
      incoming: friendships
        .filter((item) => item.status === 'pending' && item.addresseeId === userId)
        .map((item) => ({ friendshipId: item.id, profile: otherSnapshot(item) }))
        .filter((item) => item.profile),
      outgoing: friendships.filter(
        (item) => item.status === 'pending' && item.requesterId === userId,
      ),
    };
  }, [friendships, userId]);

  return {
    friendships,
    ...grouped,
    friendCode: codesState.items[0]?.code || '',
    loading: friendshipsState.loading || codesState.loading,
    error: friendshipsState.error || codesState.error,
  };
}
