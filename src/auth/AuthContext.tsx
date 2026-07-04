import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ADMIN_EMAIL, auth, db } from '../firebase/config';

/**
 * Real authentication backed by Google Cloud Identity Platform (Firebase Auth),
 * with an admin-approval gate on top:
 *
 * - Anyone may register (email + password). A `users/{uid}` profile is created
 *   with `approved: false`.
 * - The admin (ADMIN_EMAIL) is implicitly approved and can approve others.
 * - Until approved, a user is signed in but sees the "pending" screen and has
 *   no access to habit data (also enforced by Firestore security rules).
 */

interface AuthUser {
  uid: string;
  email: string;
  /** Display name derived from the email local-part. */
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True once the initial auth + profile state has resolved. */
  ready: boolean;
  /** Whether this user is the admin. */
  isAdmin: boolean;
  /** Whether this user's profile has been approved. */
  approved: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthUser(u: User): AuthUser {
  const email = u.email ?? '';
  return { uid: u.uid, email, name: email.split('@')[0] || 'User' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [approved, setApproved] = useState(false);
  const [ready, setReady] = useState(false);

  // Track the signed-in user.
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (!u) {
        setApproved(false);
        setReady(true);
      }
    });
  }, []);

  // Subscribe to this user's profile doc for the `approved` flag.
  useEffect(() => {
    if (!firebaseUser) return;
    const isAdmin = firebaseUser.email === ADMIN_EMAIL;
    const ref = doc(db, 'users', firebaseUser.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as { approved?: boolean } | undefined;
        setApproved(isAdmin || data?.approved === true);
        setReady(true);
      },
      () => {
        // On error (e.g. offline before first sync), fall back to admin-only.
        setApproved(isAdmin);
        setReady(true);
      },
    );
    return unsub;
  }, [firebaseUser]);

  const isAdmin = firebaseUser?.email === ADMIN_EMAIL;

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async function register(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    const isAdmin = cred.user.email === ADMIN_EMAIL;
    // Create the profile. Admin is auto-approved; everyone else waits.
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: cred.user.email,
      approved: isAdmin,
      createdAt: new Date().toISOString(),
    });
  }

  async function logout() {
    await signOut(auth);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user: firebaseUser ? toAuthUser(firebaseUser) : null,
      isAuthenticated: firebaseUser !== null,
      ready,
      isAdmin: Boolean(isAdmin),
      approved,
      login,
      register,
      logout,
    }),
    [firebaseUser, ready, isAdmin, approved],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
