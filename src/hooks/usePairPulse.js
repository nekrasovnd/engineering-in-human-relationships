import { collection } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { db } from '../lib/firebase';
import { useFirestoreList } from './useFirestoreList';
import { useFriendsData } from './useFriendsData';
import { submitPairPulse } from '../services/firestore';
import { sanitizePairPulse } from '../utils/firestoreDocuments';
import {
  PAIR_ALERT_THRESHOLD,
  PAIR_QUESTION_KEYS,
  buildPairTimeline,
  getPairPrompt,
} from '../utils/pairPulse';
import { getWeekKey } from '../utils/teamFeedback';

/**
 * Страница пары: опрос недели, ответы партнёра после своего, график напряжения.
 * Пара — это подтверждённая дружба по коду.
 */
export function usePairPulse(friendshipId, profile) {
  const { friendships, loading: friendsLoading } = useFriendsData(profile.userId);
  const friendship = useMemo(
    () =>
      friendships.find((item) => item.id === friendshipId && item.status === 'accepted') || null,
    [friendshipId, friendships],
  );
  const partnerId = friendship?.userIds.find((userId) => userId !== profile.userId) || '';
  const { items: pulses, loading: pulsesLoading } = useFirestoreList({
    enabled: Boolean(friendship),
    dependencies: [friendship?.id],
    createQuery: () => collection(db, 'friendships', friendship.id, 'pulses'),
    mapSnapshot: (snapshot) =>
      snapshot.docs.map((item) => sanitizePairPulse(item.data(), item.id)).filter(Boolean),
  });

  const weekKey = getWeekKey();
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const timeline = useMemo(() => buildPairTimeline(pulses), [pulses]);
  const thisWeek = pulses.filter((item) => item.weekKey === weekKey);

  const send = async () => {
    setError('');

    try {
      setSaving(true);
      await submitPairPulse(friendship.id, profile.userId, answers);
    } catch {
      setError('Не удалось отправить ответ. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  return {
    loading: friendsLoading || (Boolean(friendship) && pulsesLoading),
    friendship,
    partner: friendship?.snapshots[partnerId] || null,
    weekKey,
    prompt: getPairPrompt(weekKey),
    answers,
    complete: PAIR_QUESTION_KEYS.every((key) => answers[key]),
    saving,
    error,
    myPulse: thisWeek.find((item) => item.userId === profile.userId) || null,
    partnerPulse: thisWeek.find((item) => item.userId === partnerId) || null,
    timeline,
    alert: (timeline.at(-1)?.frictionIndex ?? 0) > PAIR_ALERT_THRESHOLD,
    setAnswer: (key, value) => setAnswers((current) => ({ ...current, [key]: value })),
    send,
  };
}
