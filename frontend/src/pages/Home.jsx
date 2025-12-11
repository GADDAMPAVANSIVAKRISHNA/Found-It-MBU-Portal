import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  return (
    <div className="w-screen overflow-x-hidden max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 leading-tight">
          Found-It — MBU Lost & Found
        </h1>
        <div className="mb-6 sm:mb-8 lg:mb-10 flex justify-center px-2 sm:px-4">
          <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow backdrop-blur-sm bg-white/40 border border-white/30 inline-block max-w-full">
            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 break-words">
              Reuniting students with their belongings at Mohan Babu University
            </p>
          </div>
        </div>
        {/* Action buttons shown only when logged in */}
        {/* Action buttons removed as requested - moved to Navbar */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-10 sm:mt-14 lg:mt-16">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4">📝</div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3">Report Items</h3>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base">Easily report lost or found items with details and images</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4">🔍</div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3">Search Gallery</h3>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base">Browse through all unclaimed items by category</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4">🎯</div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3">Claim Items</h3>
          <p className="text-gray-600 text-xs sm:text-sm lg:text-base">Found your item? Claim it and collect from L&F office</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
