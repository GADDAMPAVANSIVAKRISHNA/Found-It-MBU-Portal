import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      setUser(u ? { id: u.id, email: u.email, name: u.user_metadata?.name, branch: u.user_metadata?.branch, year: u.user_metadata?.year, contactNumber: u.user_metadata?.contactNumber } : null);
      setLoading(false);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email, name: u.user_metadata?.name, branch: u.user_metadata?.branch, year: u.user_metadata?.year, contactNumber: u.user_metadata?.contactNumber } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const u = data.user;
    setUser({ id: u.id, email: u.email, name: u.user_metadata?.name, branch: u.user_metadata?.branch, year: u.user_metadata?.year, contactNumber: u.user_metadata?.contactNumber });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
