import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationsBell from './NotificationsBell';

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Prevent showing wrong UI before Firebase finishes loading
  if (loading) {
    return (
      <nav className="bg-white shadow-lg w-full overflow-x-hidden">
        <div className="w-full px-3 sm:px-4 h-14 sm:h-16 flex items-center">
          <span className="text-gray-500 text-xs sm:text-sm">Checking login...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg w-full overflow-x-hidden">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center">
          
          <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" 
              alt="MBU" 
              className="h-8 sm:h-10 lg:h-12 w-auto object-contain" 
            />
            <span className="font-bold text-primary whitespace-nowrap text-sm sm:text-lg lg:text-xl tracking-wide hidden sm:inline">
              Found-It
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {user && (
              <>
                <Link to="/gallery" className="nav-chip text-gray-700 text-xs sm:text-sm hidden md:inline">Browse</Link>
                <Link to="/dashboard" className="nav-chip text-gray-700 text-xs sm:text-sm hidden md:inline">Dashboard</Link>
                <NotificationsBell />
              </>
            )}

            {user ? (
              <>
                <span className="hello-pill text-xs sm:text-sm hidden sm:inline truncate max-w-[150px] lg:max-w-none">
                  {`Hello, ${(user?.email || '').split('@')[0] || ''}`}
                </span>
                <button
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-700 hover:text-red-600 hover:bg-gray-100 text-xs sm:text-sm transition"
                  onClick={() => { logout(); navigate('/'); }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gray-200 transition transform hover:-translate-y-0.5 active:scale-95 hover:bg-blue-600 hover:text-white active:bg-blue-700 text-xs sm:text-sm font-semibold">Login</Link>
                <Link to="/register" className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-white transition transform hover:-translate-y-0.5 active:scale-95 hover:bg-blue-600 active:bg-blue-700 text-xs sm:text-sm font-semibold">Register</Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
