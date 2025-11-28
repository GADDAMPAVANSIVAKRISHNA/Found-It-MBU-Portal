import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationsBell from './NotificationsBell';

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const showExtras = !!user && location.pathname === '/';
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Prevent showing wrong UI before Firebase finishes loading
  if (loading) {
    return (
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <span className="text-gray-500">Checking login...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" 
              alt="MBU" 
              className="h-10 w-10 md:h-12 md:w-12 object-contain" 
            />
            <span className="font-bold text-primary whitespace-nowrap text-lg md:text-xl tracking-wide">
              Found-It
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {showExtras && (
              <>
                <Link to="/gallery" className="text-gray-700 hover:text-primary">Browse</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-gray-700 hover:text-primary">Admin</Link>
                )}
                <NotificationsBell />
              </>
            )}

            {user ? (
              <>
                {/* Profile menu (top-right) */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-gray-700">Hello, {user.name}</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl shadow-xl z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <Link to="/dashboard" className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition" onClick={()=>setMenuOpen(false)}>Dashboard</Link>
                      <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition" onClick={()=>{setMenuOpen(false); logout(); navigate('/');}}>Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-lg bg-gray-200 transition transform hover:-translate-y-0.5 active:scale-95 hover:bg-blue-600 hover:text-white active:bg-blue-700">Login</Link>
                <Link to="/register" className="px-4 py-2 rounded-lg bg-primary text-white transition transform hover:-translate-y-0.5 active:scale-95 hover:bg-blue-600 active:bg-blue-700">Register</Link>
                {/* Forgot Password removed from top nav on all pages */}
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
