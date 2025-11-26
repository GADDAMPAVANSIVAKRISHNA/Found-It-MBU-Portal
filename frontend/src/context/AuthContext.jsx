import { createContext, useState, useEffect, useContext } from "react";
import api from '../utils/api';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const idToken = await u.getIdToken();
          setToken(idToken);
        } catch (_) { setToken(''); }
        try {
          const { data: profile } = await api.get('/users/by-email', { params: { email: u.email } });
          setUser({
            id: profile._id || u.uid,
            email: u.email,
            name: u.displayName || profile.name,
            branch: profile.branch,
            year: profile.year,
            contactNumber: profile.contactNumber,
            role: profile.role || 'student'
          });
        } catch (_) {
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

  const login = async () => {};

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
