import { useEffect, useMemo, useState } from 'react';
import {
  subscribeIncomingMatchDecisions,
  subscribeOwnMatchDecisions,
} from '../services/firestore';
import { useDiscoverProfiles } from './useDiscoverProfiles';

export function useMutualMatches(currentUserId, options = {}) {
  const { enabled = true } = options;
  const {
    profiles: discoverProfiles,
    loading: profilesLoading,
    error: profilesError,
  } = useDiscoverProfiles(currentUserId, {
    excludeCurrent: true,
    enabled,
  });
  const [outgoing, setOutgoing] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [matchLoading, setMatchLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUserId || !enabled) {
      setOutgoing([]);
      setIncoming([]);
      setMatchLoading(false);
      setError('');
      return undefined;
    }

    setMatchLoading(true);
    setError('');

    let outgoingLoaded = false;
    let incomingLoaded = false;
    const markLoaded = () => {
      if (outgoingLoaded && incomingLoaded) {
        setMatchLoading(false);
      }
    };

    const unsubscribeOutgoing = subscribeOwnMatchDecisions(
      currentUserId,
      (items) => {
        outgoingLoaded = true;
        setOutgoing(items);
        setError('');
        markLoaded();
      },
      (snapshotError) => {
        outgoingLoaded = true;
        setError(snapshotError.message);
        markLoaded();
      },
    );

    const unsubscribeIncoming = subscribeIncomingMatchDecisions(
      currentUserId,
      (items) => {
        incomingLoaded = true;
        setIncoming(items);
        setError('');
        markLoaded();
      },
      (snapshotError) => {
        incomingLoaded = true;
        setError(snapshotError.message);
        markLoaded();
      },
    );

    return () => {
      unsubscribeOutgoing();
      unsubscribeIncoming();
    };
  }, [currentUserId, enabled]);

  const mutualMatches = useMemo(() => {
    const outgoingLikes = outgoing.filter((item) => item.decision === 'like');
    const incomingLikeIds = new Set(
      incoming
        .filter((item) => item.decision === 'like')
        .map((item) => item.fromUid),
    );
    const mutualIds = new Set(
      outgoingLikes
        .map((item) => item.toUid)
        .filter((userId) => incomingLikeIds.has(userId)),
    );

    return discoverProfiles.filter((item) => mutualIds.has(item.userId));
  }, [discoverProfiles, incoming, outgoing]);

  return {
    mutualMatches,
    loading: enabled ? profilesLoading || matchLoading : false,
    error: error || profilesError,
  };
}
