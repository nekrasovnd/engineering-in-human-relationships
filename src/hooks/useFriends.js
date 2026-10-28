import { useEffect, useRef, useState } from 'react';
import { useFriendsData } from './useFriendsData';
import {
  acceptFriendRequest,
  createFriendCode,
  refreshFriendSnapshots,
  removeFriendship,
  sendFriendRequest,
} from '../services/firestore';
import { copyTextToClipboard } from '../utils/clipboard';
import { hasComparableProfileData } from '../utils/compatibility';

function getFriendErrorMessage(friendError) {
  switch (friendError?.message) {
    case 'invalid-code':
      return 'Код выглядит слишком коротким или неполным.';
    case 'code-not-found':
      return 'Такой код не найден. Возможно, его обновили.';
    case 'own-code':
      return 'Это ваш собственный код.';
    case 'already-friends':
      return 'Вы уже друзья.';
    case 'request-pending':
      return 'Заявка уже отправлена, ждём подтверждения.';
    case 'invalid-profile-data':
      return 'Сначала пройдите анкету: друзья видят ваш профиль для подбора команды.';
    default:
      return 'Не получилось. Попробуйте ещё раз.';
  }
}

/**
 * Блок «Друзья»: личный код, добавление по коду, заявки и список друзей.
 * Заодно держит актуальным мой снапшот профиля у друзей.
 */
export function useFriends(profile) {
  const data = useFriendsData(profile.userId);
  const [codeValue, setCodeValue] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [message, setMessage] = useState({ tone: '', text: '' });
  const [copyState, setCopyState] = useState('');
  const canUseFriends = hasComparableProfileData(profile);
  // Одна попытка на дружбу и версию профиля — без риска зациклить записи.
  const refreshedRef = useRef(new Set());

  useEffect(() => {
    const pending = data.friendships.filter(
      (item) =>
        item.status === 'accepted' &&
        !refreshedRef.current.has(`${item.id}:${profile.updatedAt}`),
    );

    if (data.loading || pending.length === 0) {
      return;
    }

    pending.forEach((item) => refreshedRef.current.add(`${item.id}:${profile.updatedAt}`));
    refreshFriendSnapshots(pending, profile).catch(() => {});
  }, [data.friendships, data.loading, profile]);

  useEffect(() => {
    if (!copyState) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopyState(''), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  const run = async (actionKey, action, successText = '') => {
    setMessage({ tone: '', text: '' });

    try {
      setBusyAction(actionKey);
      const result = await action();
      if (successText) {
        setMessage({ tone: 'success', text: successText });
      }
      return result;
    } catch (actionError) {
      setMessage({ tone: 'error', text: getFriendErrorMessage(actionError) });
      return undefined;
    } finally {
      setBusyAction('');
    }
  };

  const generateCode = () =>
    run('code', () => createFriendCode(profile.userId, data.friendCode));

  const copyCode = async () => {
    const copied = await copyTextToClipboard(data.friendCode).catch(() => false);
    setCopyState(copied ? 'copied' : 'failed');
  };

  const sendRequest = async () => {
    if (!codeValue.trim()) {
      setMessage({ tone: 'error', text: 'Введите код друга.' });
      return;
    }

    const result = await run('send', () => sendFriendRequest(profile, codeValue));
    if (result) {
      setCodeValue('');
      setMessage({
        tone: 'success',
        text:
          result === 'accepted'
            ? 'У вас уже была встречная заявка — теперь вы друзья.'
            : 'Заявка отправлена. Друг увидит её у себя на странице команд.',
      });
    }
  };

  const accept = (item) =>
    run(
      `accept:${item.friendshipId}`,
      () => acceptFriendRequest(item.friendshipId, profile),
      `${item.profile.name} теперь в друзьях.`,
    );

  const remove = (friendshipId, confirmText = '') => {
    if (confirmText && !window.confirm(confirmText)) {
      return undefined;
    }

    return run(`remove:${friendshipId}`, () => removeFriendship(friendshipId, profile.userId));
  };

  return {
    ...data,
    canUseFriends,
    codeValue,
    busyAction,
    message,
    copyState,
    updateCodeValue: (value) => setCodeValue(value.toUpperCase()),
    generateCode,
    copyCode,
    sendRequest,
    accept,
    decline: (item) => remove(item.friendshipId),
    cancel: (item) => remove(item.id),
    unfriend: (item) => remove(item.friendshipId, `Удалить ${item.profile.name} из друзей?`),
  };
}
