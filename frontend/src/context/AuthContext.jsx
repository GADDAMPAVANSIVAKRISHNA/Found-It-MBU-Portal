import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { auth } from '../lib/firebase';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  window.firebaseAuth = auth;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Optimistic UI: Set user immediately to resolve "Checking login..." faster
        setUser(u);
        setLoading(false);

        try {
          // Background: Fetch latest token & profile details
          await u.reload();

          /* 
             NOTE: We don't await the backend fetch to block the UI.
             We let the user see the app while we verify/enrich their profile.
          */
          const idToken = await u.getIdToken();
          setToken(idToken);

          const response = await apiFetch(`/api/users/by-email?email=${encodeURIComponent(u.email)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });

          // Prevent race condition: check if user didn't logout during fetch
          if (!auth.currentUser || auth.currentUser.uid !== u.uid) {
            return;
          }

          if (response.ok) {
            const userData = response.data;
            if (userData && userData.isVerified === false) {
              // Late validation: If backend says "ban" or "unverified", kick them out.
              // This might cause a UI flash, but prioritizes speed for valid users.
              await signOut(auth);
              setUser(null);
              setToken(null);
              return;
            }
            // Merge backend data (like role, custom fields)
            setUser(prev => ({ ...prev, ...userData }));
          } else {
            // If backend fails (e.g. 404), maybe just keep firebase user or force logout?
            // For now, we trust Firebase auth unless backend explicitly denies.
            console.warn("Backend profile fetch failed, using basic Firebase auth");
          }
        } catch (error) {
          console.error("Background auth validation error:", error);
          // If critical error, maybe don't kick user out immediately if they have valid Firebase session
        }
      } else {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      // ✅ Set loading while login is in progress
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        const err = new Error('Email not verified');
        err.code = 'email-not-verified';
        throw err;
      }

      // Remove blocking reload and profile fetch to speed up login
      // Verification rules are enforced in onAuthStateChanged and backend calls

      const idToken = await userCredential.user.getIdToken();

      setToken(idToken);
      setUser(userCredential.user);
      setLoading(false); // ✅ Explicitly set loading to false after successful login
      return userCredential.user;
    } catch (error) {
      setLoading(false); // ✅ Also set loading to false on error
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
        const response = await apiFetch(`/api/users/by-email?email=${encodeURIComponent(user.email)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        if (response.ok) {
          const userData = response.data;
          setUser({ ...user, ...userData });
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshProfile,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
