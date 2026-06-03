import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  calculateQuestionnaireResult,
  enrichProfileScoring,
} from '../data/questionnaire';
import { saveProfile } from '../services/firestore';
import { buildProfileNarrative } from '../utils/profileAnalysis';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setProfile(null);

      unsubscribeProfile = onSnapshot(
        doc(db, 'profiles', nextUser.uid),
        (snapshot) => {
          setProfile(
            snapshot.exists() ? enrichProfileScoring(snapshot.data()) : null,
          );
          setLoading(false);
        },
        () => {
          setProfile(null);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  useEffect(() => {
    if (
      !user ||
      !profile?.questionnaireCompleted ||
      !profile?.discoverVisible
    ) {
      return;
    }

    let cancelled = false;

    const ensureDiscoverProfile = async () => {
      const discoverSnapshot = await getDoc(doc(db, 'discoverProfiles', user.uid));

      if (!cancelled && !discoverSnapshot.exists()) {
        await saveProfile(user.uid, {});
      }
    };

    ensureDiscoverProfile().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [profile?.discoverVisible, profile?.questionnaireCompleted, user]);

  useEffect(() => {
    if (
      !user ||
      !profile?.questionnaireCompleted ||
      !profile?.answers ||
      (profile.factorReliability &&
        profile.systemIndices &&
        typeof profile.profileIntegrity === 'number')
    ) {
      return;
    }

    const migrateProfileModel = async () => {
      const result = calculateQuestionnaireResult(profile.answers);
      const nextProfile = {
        ...profile,
        factorScores: result.factorScores,
        factorReliability: result.factorReliability,
        egoState: result.egoState,
        systemIndices: result.systemIndices,
        profileIntegrity: result.profileIntegrity,
        psychologicalVector50: result.psychologicalVector50,
      };

      await saveProfile(user.uid, {
        factorScores: result.factorScores,
        factorReliability: result.factorReliability,
        egoState: result.egoState,
        systemIndices: result.systemIndices,
        profileIntegrity: result.profileIntegrity,
        psychologicalVector50: result.psychologicalVector50,
        profileNarrative: buildProfileNarrative(nextProfile),
      });
    };

    migrateProfileModel().catch(() => {});
    return undefined;
  }, [profile, user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn: (email, password) =>
        signInWithEmailAndPassword(auth, email, password),
      signUp: (email, password) =>
        createUserWithEmailAndPassword(auth, email, password),
      resetPassword: (email) => sendPasswordResetEmail(auth, email),
      signOutUser: () => signOut(auth),
    }),
    [loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
