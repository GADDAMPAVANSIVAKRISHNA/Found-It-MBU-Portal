import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-12">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* About */}
          <div>
            <h3 className="font-bold mb-4">About Found-It</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Found-It is a student-built Lost & Found platform helping the campus
              community report, locate, and recover lost belongings quickly and safely.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/gallery" className="text-gray-400 hover:text-white">Gallery</Link></li>
              <li><Link to="/report-lost" className="text-gray-400 hover:text-white">Report Lost</Link></li>
              <li><Link to="/report-found" className="text-gray-400 hover:text-white">Report Found</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link></li>
              <li><Link to="/contact-office" className="text-gray-400 hover:text-white">Contact Office</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold mb-4">Social Media</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                >
                  Instagram
                </a>
              </li>
              <li className="text-gray-600">LinkedIn (Coming Soon)</li>
              <li className="text-gray-600">Twitter (Coming Soon)</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold mb-4">Contact Us</h3>

            <p className="text-gray-400 text-sm mb-2">
              📧 Email:{' '}
              <span className="text-blue-400">(demo email – not monitored)</span>
            </p>

            <p className="text-gray-400 text-sm mb-2">
              📞 Phone:{' '}
              <span className="text-blue-400">(demo phone – not active)</span>
            </p>

            <p className="text-gray-400 text-sm">
              🏢 Office: Lost & Found Office — Admin Block, Room 102
            </p>
          </div>

        </div>

        <hr className="border-gray-700 mb-6" />

        <div className="flex items-center justify-between text-sm text-gray-400">
          <p>&copy; {currentYear} Found-It. All rights reserved.</p>
          <p>Built with ❤️ by student, for students.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
