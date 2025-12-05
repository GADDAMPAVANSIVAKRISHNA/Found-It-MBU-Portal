import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 sm:mt-12 bg-[#0f1724] text-slate-300 w-full overflow-x-hidden">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-8 sm:h-10 w-auto" />
              <Link to="/" className="text-blue-400 font-extrabold text-sm sm:text-lg">Found-It</Link>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed break-words">
              Found-It is a student-built Lost & Found platform helping the campus community report, locate and recover lost belongings quickly and safely.
            </p>
          </div>
          <div>
            <h3 className="text-slate-100 font-bold mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">Quick Links</h3>
            <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
              <li><Link to="/gallery" className="hover:text-white">Gallery</Link></li>
              <li><Link to="/report-lost" className="hover:text-white">Report Lost</Link></li>
              <li><Link to="/report-found" className="hover:text-white">Report Found</Link></li>
              <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-100 font-bold mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">Social Media</h3>
            <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
              <li className="flex items-center gap-2"><span>📷</span><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a></li>
              <li className="flex items-center gap-2"><span>🧑‍💼</span><span>LinkedIn (Coming)</span></li>
              <li className="flex items-center gap-2"><span>🐦</span><span>Twitter (Coming)</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-100 font-bold mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">Contact Us</h3>
            <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm break-words">
              <li className="flex items-center gap-2"><span>✉️</span><span>email@mbu.asia</span></li>
              <li className="flex items-center gap-2"><span>📞</span><span>+91 123 456 7890</span></li>
              <li className="flex items-center gap-2"><span>📍</span><span>Admin Block, Room 102</span></li>
            </ul>
          </div>
        </div>
        <hr className="border-slate-800 mb-3 sm:mb-4" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
          <p className="break-words">&copy; {currentYear} Found-It. All rights reserved.</p>
          <p className="text-slate-400">Built with ❤️ by students, for students.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
