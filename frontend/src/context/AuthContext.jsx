import { createContext, useState, useEffect, useContext } from "react";
import api from "../utils/api";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { auth } from "../lib/firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  // Listen for Firebase login state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const idToken = await u.getIdToken();
          setToken(idToken);

          // Get user details from backend
          const { data: profile } = await api.get("/users/by-email", {
            params: { email: u.email },
          });

          setUser({
            id: profile._id || u.uid,
            email: u.email,
            name: u.displayName || profile.name,
            branch: profile.branch,
            year: profile.year,
            contactNumber: profile.contactNumber,
            gender: profile.gender,
            role: profile.role || "student",
          });
        } catch (err) {
          // If backend fails, use Firebase only
          setUser({
            id: u.uid,
            email: u.email,
            name: u.displayName || "",
            gender: "",
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

  // login function used by pages (not required if pages use signInWithEmailAndPassword directly)
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken('');
  };

  const refreshProfile = async () => {
    try {
      const u = auth.currentUser;
      if (!u) return;
      const { data: profile } = await api.get('/users/by-email', { params: { email: u.email } });
      setUser({
        id: profile._id || u.uid,
        email: u.email,
        name: u.displayName || profile.name,
        branch: profile.branch,
        year: profile.year,
        contactNumber: profile.contactNumber,
        gender: profile.gender,
        role: profile.role || 'student'
      });
    } catch (_) {}
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
