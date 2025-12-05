import { createContext, useState, useEffect, useContext } from "react";
import { apiFetch } from "../utils/api";
import { auth } from "../lib/firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  // Make firebase user available globally for apiFetch tokens
  window.firebaseAuth = auth;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Always fetch MongoDB profile before setting user
        try {
          const idToken = await u.getIdToken();
          setToken(idToken);

          const res = await apiFetch(`/api/users/by-email?email=${encodeURIComponent(u.email)}`, { method: 'GET' });
          if (res.ok) {
            const profile = res.data;
            setUser({
              id: profile._id || u.uid,
              email: u.email,
              name: u.displayName || profile.name || '',
              branch: profile.branch || '',
              year: profile.year || '',
              contactNumber: profile.contactNumber || '',
              gender: profile.gender || '',
              role: profile.role || 'student'
            });
          } else {
            // Profile missing in backend -> treat as not authenticated for app profile purposes
            setUser(null);
          }
        } catch (err) {
          setUser(null);
        }
      } else {
        setUser(null);
        setToken('');
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    // Sign in with Firebase
    const result = await signInWithEmailAndPassword(auth, email, password);
    const u = result.user;

    // Check email verification
    if (!u.emailVerified) {
      await signOut(auth);
      const err = new Error('Please verify your email');
      err.code = 'email-not-verified';
      throw err;
    }

    // Fetch backend profile
    const res = await apiFetch(`/api/users/by-email?email=${encodeURIComponent(u.email)}`, { method: 'GET' });
    if (!res.ok && res.status === 404) {
      // Sign out since we won't set an app profile
      await signOut(auth);
      const err = new Error('User not registered');
      err.code = 'profile-missing';
      throw err;
    }

    if (res.ok) {
      const profile = res.data;
      setUser({
        id: profile._id || u.uid,
        email: u.email,
        name: u.displayName || profile.name || '',
        branch: profile.branch || '',
        year: profile.year || '',
        contactNumber: profile.contactNumber || '',
        gender: profile.gender || '',
        role: profile.role || 'student'
      });
      const idToken = await u.getIdToken();
      setToken(idToken);
    }

    return u;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken("");
    localStorage.removeItem('user');
  };

  const refreshProfile = async () => {
    const u = auth.currentUser;
    if (!u) return;

    const res = await apiFetch(
      `/api/users/by-email?email=${encodeURIComponent(u.email)}`,
      { method: "GET" }
    );

    if (res.ok) {
      const profile = res.data;

      setUser({
        id: profile._id || u.uid,
        email: u.email,
        name: u.displayName || profile.fullName,
        branch: profile.branch,
        year: profile.year,
        contactNumber: profile.contactNumber,
        gender: profile.gender,
        role: profile.role || "student",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
