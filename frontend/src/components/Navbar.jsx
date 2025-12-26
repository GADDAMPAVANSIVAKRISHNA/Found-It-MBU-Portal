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

  // Strict check: User must be present AND verified to see auth UI
  const isVerifiedUser = user && (user.isVerified === true || user.emailVerified === true);

  return (
    <nav className="bg-white shadow-lg w-full relative z-50">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img
              src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png"
              alt="MBU Logo"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            {/* Divider */}
            <div className="h-8 w-[1.5px] bg-gray-300 mx-1"></div>

            {/* Logo Text Implementation */}
            <div className="flex items-center select-none">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#3b5998] tracking-tight">F</span>
              <div className="relative flex items-center justify-center mx-[1px]">
                <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8 text-[#70dbcd] fill-current">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <svg viewBox="0 0 24 24" className="absolute w-3 h-3 sm:w-4 sm:h-4 text-[#3b5998] stroke-current stroke-[4] fill-none" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#3b5998] tracking-tight">und</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#70dbcd] tracking-tight">-It</span>
            </div>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {isVerifiedUser && (
                <>
                  <Link to="/gallery" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition">Browse</Link>
                  <Link to="/report" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition shadow-md btn-float font-bold text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-purple-200">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Report
                  </Link>
                  <Link to="/messages" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition">Messages</Link>
                  <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition">Dashboard</Link>
                  <NotificationsBell />
                </>
              )}

              {isVerifiedUser ? (
                <>
                  <span className="text-sm font-medium text-gray-500 truncate max-w-[150px]">
                    {`Hello, ${(user?.email || '').split('@')[0] || ''}`}
                  </span>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
                    onClick={() => { logout(); navigate('/'); }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm transition">Login</Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden items-center gap-3">
              {user && <NotificationsBell />}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl py-2 px-4 flex flex-col gap-2 z-50 animate-fade-in-down">
          {isVerifiedUser ? (
            <>
              <div className="px-3 py-2 text-sm text-gray-500 font-semibold border-b border-gray-100 mb-2">
                {`Hello, ${(user?.email || '').split('@')[0] || ''}`}
              </div>
              <Link
                to="/gallery"
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setMenuOpen(false)}
              >
                Browse Items
              </Link>
              <Link
                to="/report"
                className="block px-3 py-2 rounded-lg text-base font-medium text-white bg-red-600 hover:bg-red-700 shadow-md text-center mx-3 my-2"
                onClick={() => setMenuOpen(false)}
              >
                + Report Items
              </Link>
              <Link
                to="/messages"
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setMenuOpen(false)}
              >
                Messages
              </Link>
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
                onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
