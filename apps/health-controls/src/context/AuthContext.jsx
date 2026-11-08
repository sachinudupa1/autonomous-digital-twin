import { createContext, useContext, useState } from 'react';

/**
 * AuthContext
 *
 * Provides authentication state to the application.
 *
 * INTEGRATION POINT:
 *   Replace the local isAuthenticated/user state with Firebase Auth's
 *   onAuthStateChanged listener (or equivalent backend session check)
 *   once authentication is fully implemented via authService.js.
 *
 *   The login() function here must NOT verify credentials on the client side.
 *   All credential verification must happen server-side (Firebase Auth or backend).
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // TODO: Replace with Firebase Auth state listener (onAuthStateChanged)
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Signs the operator in.
   * INTEGRATION POINT: Call authService.login(userId, password) here.
   * On success, update user and isAuthenticated from the returned session.
   *
   * @param {string} _userId
   * @param {string} _password
   */
  // eslint-disable-next-line no-unused-vars
  const login = async (_userId, _password) => {
    // TODO: Implement via authService.login()
    // Example:
    //   const session = await authService.login(userId, password);
    //   setUser(session.user);
    //   setIsAuthenticated(true);
    throw new Error(
      'Authentication not yet implemented. Wire login() to authService.login().'
    );
  };

  /**
   * Signs the operator out.
   * INTEGRATION POINT: Call authService.logout() here.
   */
  const logout = async () => {
    // TODO: Implement via authService.logout()
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}

export default AuthContext;
