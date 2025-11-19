import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          🔍 Found-It - MBU Lost & Found
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Reuniting students with their belongings at Mohan Babu University
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/report-lost" className="bg-gray-200 px-6 py-3 rounded-lg text-lg font-semibold">
            Report Lost Item
          </Link>
          <Link to="/report-found" className="bg-primary text-white px-6 py-3 rounded-lg text-lg font-semibold">
            Report Found Item
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-16">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-bold mb-2">Report Items</h3>
          <p className="text-gray-600">Easily report lost or found items with details and images</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Search Gallery</h3>
          <p className="text-gray-600">Browse through all unclaimed items by category</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-bold mb-2">Claim Items</h3>
          <p className="text-gray-600">Found your item? Claim it and collect from L&F office</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
