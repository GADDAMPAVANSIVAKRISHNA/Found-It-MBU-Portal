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
      try {
        if (u) {
          await u.reload();
          const idToken = await u.getIdToken();
          setToken(idToken);

          try {
            const response = await apiFetch(`/api/users/by-email?email=${encodeURIComponent(u.email)}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`,
              },
            });

            // Prevent race condition: checks if user is still logged in to Firebase
            if (!auth.currentUser || auth.currentUser.uid !== u.uid) {
              return;
            }

            if (response.ok) {
              const userData = response.data;
              if (userData && userData.isVerified === false) {
                await signOut(auth);
                setUser(null);
                setToken(null);
                setLoading(false);
                return;
              }
              setUser({ ...u, ...userData });
            } else {
              await signOut(auth);
              setUser(null);
            }
          } catch (error) {
            if (auth.currentUser?.uid === u.uid) {
              setUser(u);
            }
          }
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        setToken(null);
      } finally {
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

      // 🚨 STEP-9 ENFORCE VERIFIED BEFORE LOGIN
      await userCredential.user.reload();
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        const err = new Error('Email not verified');
        err.code = 'email-not-verified';
        throw err;
      }

      const idToken = await userCredential.user.getIdToken();

      const profileRes = await apiFetch(`/api/users/by-email?email=${encodeURIComponent(userCredential.user.email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (profileRes.ok) {
        const userData = profileRes.data;
        if (userData && userData.isVerified === false) {
          await signOut(auth);
          const err = new Error('Email not verified');
          err.code = 'email-not-verified';
          throw err;
        }
      }

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
