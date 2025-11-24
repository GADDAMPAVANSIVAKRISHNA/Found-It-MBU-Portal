import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-3">
            <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-10 w-10 md:h-12 md:w-12 object-contain" />
            <span className="font-bold text-primary whitespace-nowrap text-lg md:text-xl tracking-wide">Found-It</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/gallery" className="text-gray-700 hover:text-primary">Gallery</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary">Dashboard</Link>
                <Link to="/report-lost" className="bg-gray-200 px-4 py-2 rounded-lg">Report Lost</Link>
                <Link to="/report-found" className="bg-primary text-white px-4 py-2 rounded-lg">Report Found</Link>
                <button onClick={() => { logout(); navigate('/'); }} className="text-red-500">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="bg-gray-200 px-4 py-2 rounded-lg">Login</Link>
                <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-lg">Register</Link>
                <Link to="/forgot-password" className="text-gray-700 hover:text-primary">Forgot Password</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
