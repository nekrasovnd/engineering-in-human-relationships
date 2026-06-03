import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const nowIso = () => new Date().toISOString();
const PUBLIC_PROFILE_FIELDS = [
  'userId',
  'name',
  'age',
  'gender',
  'avatarInitials',
  'factorScores',
  'egoState',
  'questionnaireCompleted',
];

function pickProfileFields(profile, keys) {
  return keys.reduce((result, key) => {
    if (Object.hasOwn(profile, key)) {
      result[key] = profile[key];
    }

    return result;
  }, {});
}

export async function saveProfile(userId, payload) {
  const privateRef = doc(db, 'profiles', userId);
  const publicRef = doc(db, 'publicProfiles', userId);
  const [privateSnapshot, publicSnapshot] = await Promise.all([
    getDoc(privateRef),
    getDoc(publicRef),
  ]);

  const createdAt =
    privateSnapshot.data()?.createdAt ||
    publicSnapshot.data()?.createdAt ||
    nowIso();
  const updatedAt = nowIso();
  const nextPrivateProfile = {
    ...(privateSnapshot.data() || {}),
    userId,
    ...payload,
    createdAt,
    updatedAt,
  };
  const nextPublicProfile = {
    ...pickProfileFields(nextPrivateProfile, PUBLIC_PROFILE_FIELDS),
    createdAt,
    updatedAt,
  };

  const batch = writeBatch(db);
  batch.set(privateRef, nextPrivateProfile, { merge: true });
  batch.set(publicRef, nextPublicProfile, { merge: true });
  await batch.commit();
}

export async function saveQuestionnaireDraft(userId, payload) {
  const privateRef = doc(db, 'profiles', userId);
  const privateSnapshot = await getDoc(privateRef);
  const currentProfile = privateSnapshot.data() || {};
  const createdAt = currentProfile.createdAt || nowIso();
  const updatedAt = nowIso();

  await setDoc(
    privateRef,
    {
      ...currentProfile,
      userId,
      ...payload,
      questionnaireCompleted: currentProfile.questionnaireCompleted || false,
      createdAt,
      updatedAt,
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
  const actionRef = doc(db, 'matchActions', actionId);
  const existingSnapshot = await getDoc(actionRef);
  const createdAt = existingSnapshot.data()?.createdAt || nowIso();

  await setDoc(
    actionRef,
    {
      id: actionId,
      ...payload,
      updatedAt: nowIso(),
      createdAt,
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
