import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

/**
 * Firebase web configuration.
 *
 * Replace the placeholders below with the values from your own Firebase / Google
 * Cloud Identity Platform project (Project settings → your web app). A Firebase
 * `apiKey` is a public identifier rather than a secret — real security is
 * enforced by Firestore Security Rules and Identity Platform. Even so, restrict
 * your key by HTTP referrer (to your own domains) in the Google Cloud console,
 * and consider loading these values from environment variables (import.meta.env).
 *
 * This project uses Google Cloud Identity Platform (the GCP-native form of
 * Firebase Auth) rather than the Firebase project wrapper, so there is no
 * `appId`/`storageBucket` — none are needed for Auth + Firestore.
 */
const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
 * Firestore with a persistent local cache (IndexedDB). This is what keeps the
 * app fast and fully usable offline: reads/writes hit the local cache
 * immediately and sync to the cloud when a connection is available.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

/**
 * The single admin account. The admin can approve pending users and is always
 * allowed by the security rules.
 *
 * IMPORTANT: This value is duplicated in `firestore.rules` (rules cannot import
 * TS). If you change it, update BOTH places.
 */
export const ADMIN_EMAIL = 'admin@example.com';
