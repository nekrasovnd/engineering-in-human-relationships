import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const nowIso = () => new Date().toISOString();

export async function saveProfile(userId, payload) {
  await setDoc(
    doc(db, 'profiles', userId),
    {
      userId,
      ...payload,
      updatedAt: nowIso(),
      createdAt: payload.createdAt || nowIso(),
    },
    { merge: true },
  );
}

export async function createTeam(payload) {
  return addDoc(collection(db, 'teams'), {
    ...payload,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export async function saveMatchDecision(payload) {
  const actionId = `${payload.fromUid}_${payload.toUid}`;

  await setDoc(
    doc(db, 'matchActions', actionId),
    {
      id: actionId,
      ...payload,
      updatedAt: nowIso(),
      createdAt: payload.createdAt || nowIso(),
    },
    { merge: true },
  );

  return actionId;
}

export async function getMatchDecision(fromUid, toUid) {
  const snapshot = await getDoc(doc(db, 'matchActions', `${fromUid}_${toUid}`));
  return snapshot.exists() ? snapshot.data() : null;
}

export function subscribeOwnMatchDecisions(userId, callback, onError) {
  const matchQuery = query(
    collection(db, 'matchActions'),
    where('fromUid', '==', userId),
  );

  return onSnapshot(
    matchQuery,
    (snapshot) => {
      callback(snapshot.docs.map((item) => item.data()));
    },
    onError,
  );
}
