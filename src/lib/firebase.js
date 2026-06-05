import { initializeApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
} from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const appCheckProviderName =
  import.meta.env.VITE_FIREBASE_APPCHECK_PROVIDER || 'enterprise';
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
const appCheckDebugToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;

const app = initializeApp(firebaseConfig);

function createAppCheckProvider(siteKey) {
  if (appCheckProviderName === 'recaptcha-v3') {
    return new ReCaptchaV3Provider(siteKey);
  }

  return new ReCaptchaEnterpriseProvider(siteKey);
}

function initializeFirebaseAppCheck() {
  if (!appCheckSiteKey || typeof window === 'undefined') {
    return null;
  }

  if (appCheckDebugToken) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN =
      appCheckDebugToken === 'true' ? true : appCheckDebugToken;
  }

  return initializeAppCheck(app, {
    provider: createAppCheckProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const appCheck = initializeFirebaseAppCheck();
export const auth = getAuth(app);
export const db = getFirestore(app);
