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

  // Make firebase user available globally for apiFetch to use
  window.firebaseAuth = auth;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          // Check if email is verified
          await u.reload();
          if (!u.emailVerified) {
            // Email not verified - set user but don't fully authenticate
            setUser(u);
            setToken(null);
            setLoading(false);
            return;
          }

          // Get Firebase ID token
          const idToken = await u.getIdToken();
          setToken(idToken);

          // Load user profile from backend
          try {
            const response = await apiFetch(`/api/users/by-email?email=${encodeURIComponent(u.email)}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`,
              },
            });
            if (response.ok) {
              const userData = await response.json();
              setUser({ ...u, ...userData });
            } else {
              // User not found in backend, set basic Firebase user
              setUser(u);
            }
          } catch (error) {
            console.error('Error loading user profile:', error);
            setUser(u);
          }
        } else {
          // User logged out
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await userCredential.user.reload();
      
      if (!userCredential.user.emailVerified) {
        throw new Error('Email not verified');
      }

      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
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
          const userData = await response.json();
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