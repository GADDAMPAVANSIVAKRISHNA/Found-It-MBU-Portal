import { createContext, useState, useEffect, useContext } from "react";
import { apiFetch } from "../utils/api";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";

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
            setUser({ id: u.uid, email: u.email, name: u.displayName || '', role: 'student' });
          }
        } catch (err) {
          setUser({ id: u.uid, email: u.email, name: u.displayName || '', role: 'student' });
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
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
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
