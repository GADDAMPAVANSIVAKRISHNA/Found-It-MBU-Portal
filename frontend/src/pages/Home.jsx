import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const [animating, setAnimating] = useState(true);
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Found-It — MBU Lost & Found
        </h1>
        <div className="mb-8 flex justify-center">
          <div className="px-6 py-4 rounded-2xl shadow backdrop-blur-sm bg-white/40 border border-white/30 inline-block">
            <p className="text-2xl font-semibold text-gray-800">
              Reuniting students with their belongings at Mohan Babu University
            </p>
          </div>
        </div>
        {/* Action buttons shown only when logged in */}
        {user && (
          <div className="flex justify-center space-x-4">
            <Link 
              to="/report-lost" 
              onMouseEnter={() => setAnimating(false)}
              onMouseLeave={() => setAnimating(true)}
              className={`px-8 py-3 rounded-full text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-300 ${animating ? 'animate-pulse' : ''}`}
            >
              Report Lost Item
            </Link>
            <Link 
              to="/report-found" 
              onMouseEnter={() => setAnimating(false)}
              onMouseLeave={() => setAnimating(true)}
              className={`px-8 py-3 rounded-full text-lg font-bold bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 focus:ring-4 focus:ring-purple-300 ${animating ? 'animate-pulse' : ''}`}
            >
              Report Found Item
            </Link>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-16">
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-8 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center text-2xl mb-4">📝</div>
          <h3 className="text-xl font-bold mb-2">Report Items</h3>
          <p className="text-gray-600">Easily report lost or found items with details and images</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl px-6 py-8 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center text-2xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Search Gallery</h3>
          <p className="text-gray-600">Browse through all unclaimed items by category</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl px-6 py-8 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center text-2xl mb-4">🎯</div>
          <h3 className="text-xl font-bold mb-2">Claim Items</h3>
          <p className="text-gray-600">Found your item? Claim it and collect from L&F office</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
