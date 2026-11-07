import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import { auth } from '../lib/firebase';

const AuthContext = createContext(null);

const ADMIN_EMAIL = String(
  import.meta.env.VITE_DASHBOARD_ADMIN_EMAIL || ''
).trim().toLowerCase();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Restore only the authorised administrator session.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setIsAuthLoading(false);
          return;
        }

        const isAdministrator =
          ADMIN_EMAIL !== '' &&
          firebaseUser.email?.trim().toLowerCase() === ADMIN_EMAIL;

        if (!isAdministrator) {
          try {
            await signOut(auth);
          } catch (error) {
            console.error(
              '[AuthContext] Unable to sign out unauthorised account:',
              error
            );
          }

          setUser(null);
          setIsAuthLoading(false);
          return;
        }

        setUser(firebaseUser);
        setIsAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    if (!ADMIN_EMAIL) {
      const error = new Error(
        'Dashboard administrator email is not configured.'
      );

      error.code = 'auth/admin-not-configured';
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== ADMIN_EMAIL) {
      const error = new Error(
        'This account is not authorised to access the Dashboard.'
      );

      error.code = 'auth/unauthorized-admin';
      throw error;
    }

    const credential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    if (
      credential.user.email?.trim().toLowerCase() !== ADMIN_EMAIL
    ) {
      await signOut(auth);

      const error = new Error(
        'Administrator verification failed.'
      );

      error.code = 'auth/unauthorized-admin';
      throw error;
    }

    return credential.user;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, isAuthLoading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider.'
    );
  }

  return context;
}

export default AuthContext;