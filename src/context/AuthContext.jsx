import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  canUseDiscover,
  hasCompletedQuestionnaire,
} from '../utils/profileState';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const discoverSyncRef = useRef('');
  const migrationSyncRef = useRef('');

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
    if (!user || !canUseDiscover(profile)) {
      return;
    }

    let cancelled = false;
    const syncKey = `${user.uid}:discover-profile`;

    if (discoverSyncRef.current === syncKey) {
      return undefined;
    }

    const ensureDiscoverProfile = async () => {
      discoverSyncRef.current = syncKey;

      try {
        const discoverSnapshot = await getDoc(doc(db, 'discoverProfiles', user.uid));

        if (!cancelled && !discoverSnapshot.exists()) {
          await saveProfile(user.uid, {});
        }
      } finally {
        if (discoverSyncRef.current === syncKey) {
          discoverSyncRef.current = '';
        }
      }
    };

    ensureDiscoverProfile().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [profile, user]);

  useEffect(() => {
    if (
      !user ||
      !hasCompletedQuestionnaire(profile) ||
      !profile?.answers ||
      (profile.factorReliability &&
        profile.systemIndices &&
        typeof profile.profileIntegrity === 'number')
    ) {
      return;
    }

    const migrationKey = `${user.uid}:profile-migration`;

    if (migrationSyncRef.current === migrationKey) {
      return;
    }

    const migrateProfileModel = async () => {
      migrationSyncRef.current = migrationKey;

      try {
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
      } finally {
        if (migrationSyncRef.current === migrationKey) {
          migrationSyncRef.current = '';
        }
      }
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
