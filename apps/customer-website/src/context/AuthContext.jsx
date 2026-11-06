import { useState, useEffect } from 'react';
import { AuthContext } from './authContextInstance';
import { customerService } from '../services/interfaces';

export function AuthProvider({ children }) {
  const [currentGuest, setCurrentGuest] = useState(() => customerService.getCurrentSession());

  const refreshGuest = () => {
    if (currentGuest?.guestId) {
      const updated = customerService.getGuest(currentGuest.guestId);
      if (updated) {
        setCurrentGuest({ ...updated });
      }
    }
  };

  useEffect(() => {
    // Subscribe to live background updates
    const unsubscribe = customerService.subscribe((event) => {
      if (event?.type === 'GUEST_UPDATED' && currentGuest?.guestId === event.guestId) {
        const fresh = customerService.getGuest(event.guestId);
        if (fresh) {
          setCurrentGuest({ ...fresh });
        }
      } else if (event?.type === 'LOGOUT' || event?.type === 'RESET_DATA') {
        setCurrentGuest(null);
      }
    });

    return () => unsubscribe();
  }, [currentGuest?.guestId]);

  const register = async (guestId) => {
    const guest = customerService.registerGuest(guestId);
    setCurrentGuest(guest);
    return guest;
  };

  const login = async (guestId) => {
    const guest = customerService.loginGuest(guestId);
    setCurrentGuest(guest);
    return guest;
  };

  const logout = () => {
    customerService.logoutGuest();
    setCurrentGuest(null);
  };

  const resetDemoData = () => {
    customerService.resetDemoData();
    setCurrentGuest(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentGuest,
        isLoggedIn: Boolean(currentGuest),
        loading: false,
        register,
        login,
        logout,
        resetDemoData,
        refreshGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
