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
import { saveProfile } from '../services/firestore';

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

      unsubscribeProfile = onSnapshot(
        doc(db, 'profiles', nextUser.uid),
        (snapshot) => {
          setProfile(snapshot.exists() ? snapshot.data() : null);
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
    if (!user || !profile?.questionnaireCompleted) {
      return;
    }

    let cancelled = false;

    const ensurePublicProfile = async () => {
      const publicSnapshot = await getDoc(doc(db, 'publicProfiles', user.uid));

      if (!cancelled && !publicSnapshot.exists()) {
        await saveProfile(user.uid, {});
      }
    };

    ensurePublicProfile().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [profile?.questionnaireCompleted, user]);

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
