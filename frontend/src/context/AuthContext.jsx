import { createContext, useState, useEffect, useContext } from "react";
import { apiFetch } from "../utils/api";

// IMPORTANT: Import the Firebase auth instance from the correct file
// If your firebase.js is in /frontend/lib/firebase.js → change "../firebase" to "../lib/firebase"
import { auth } from "../firebase";

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

  // Expose Firebase auth globally (optional)
  window.firebaseAuth = auth;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);

          const res = await apiFetch(
            `/api/users/by-email?email=${encodeURIComponent(firebaseUser.email)}`,
            { method: "GET" }
          );

          if (res.ok) {
            const profile = res.data;
            setUser({
              id: profile._id || firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || profile.name || "",
              branch: profile.branch || "",
              year: profile.year || "",
              contactNumber: profile.contactNumber || "",
              gender: profile.gender || "",
              role: profile.role || "student",
            });
          } else {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || "",
              role: "student",
            });
          }
        } catch (err) {
          console.error("AuthContext error:", err);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || "",
            role: "student",
          });
        }
      } else {
        setUser(null);
        setToken("");
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Login function
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  // Logout function
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken("");
    localStorage.removeItem("user");
  };

  // Refresh profile from backend
  const refreshProfile = async () => {
    const current = auth.currentUser;
    if (!current) return;

    const res = await apiFetch(
      `/api/users/by-email?email=${encodeURIComponent(current.email)}`,
      { method: "GET" }
    );

    if (res.ok) {
      const profile = res.data;

      setUser({
        id: profile._id || current.uid,
        email: current.email,
        name: current.displayName || profile.fullName,
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
