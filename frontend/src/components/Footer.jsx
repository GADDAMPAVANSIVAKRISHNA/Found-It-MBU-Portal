import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 bg-[#0f1724] text-slate-300">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-10 w-10" />
              <Link to="/" className="text-blue-400 font-extrabold text-lg">Found-It</Link>
            </div>
            <p className="text-sm leading-relaxed">
              Found-It is a student-built Lost & Found platform helping the campus community report, locate and recover lost belongings quickly and safely.
            </p>
          </div>
          <div>
            <h3 className="text-slate-100 font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/gallery" className="hover:text-white">Gallery</Link></li>
              <li><Link to="/report-lost" className="hover:text-white">Report Lost</Link></li>
              <li><Link to="/report-found" className="hover:text-white">Report Found</Link></li>
              <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-100 font-bold mb-4">Social Media</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span>📷</span><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a></li>
              <li className="flex items-center gap-2"><span>🧑‍💼</span><span>LinkedIn (Coming Soon)</span></li>
              <li className="flex items-center gap-2"><span>🐦</span><span>Twitter (Coming Soon)</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-100 font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span>✉️</span><span>email@mbu.asia (demo)</span></li>
              <li className="flex items-center gap-2"><span>📞</span><span>+91 123 456 7890</span></li>
              <li className="flex items-center gap-2"><span>📍</span><span>Lost & Found Office — Admin Block, Room 102</span></li>
            </ul>
          </div>
        </div>
        <hr className="border-slate-800 mb-4" />
        <div className="flex items-center justify-between text-sm">
          <p>&copy; {currentYear} Found-It. All rights reserved.</p>
          <p className="text-slate-400">Built with ❤️ by student, for students.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
