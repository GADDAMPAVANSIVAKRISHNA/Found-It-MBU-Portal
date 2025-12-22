import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 bg-[#050B14] text-slate-300 w-full font-sans border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* 1. Brand Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png"
                alt="MBU Logo"
                className="h-10 w-auto object-contain"
              />

              {/* Divider */}
              <div className="h-8 w-[1.5px] bg-slate-700 mx-1"></div>

              {/* Logo Text Implementation */}
              <div className="flex items-center select-none">
                <span className="text-2xl font-extrabold text-[#3b5998] tracking-tight">F</span>
                <div className="relative flex items-center justify-center mx-[1px]">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#70dbcd] fill-current">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <svg viewBox="0 0 24 24" className="absolute w-3 h-3 text-[#3b5998] stroke-current stroke-[4] fill-none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-2xl font-extrabold text-[#3b5998] tracking-tight">und</span>
                <span className="text-2xl font-extrabold text-[#70dbcd] tracking-tight">-It</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              Found-It is a student-built Lost & Found platform helping the campus community report, locate and recover lost belongings quickly and safely.
            </p>
          </div>

          {/* 2. Explore Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Explore</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link to="/gallery" className="hover:text-blue-500 transition-colors duration-200">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-blue-500 transition-colors duration-200">
                  Report Lost
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-blue-500 transition-colors duration-200">
                  Report Found
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-blue-500 transition-colors duration-200">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Social Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Social</h3>
            <div className="flex items-center gap-4">
              {/* Instagram */}
              <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468 4.9c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </div>
              {/* LinkedIn */}
              <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </div>
              {/* Twitter X */}
              <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 4. Contact Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>foundit.mbu@gmail.com</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span>Admin Block 102</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 text-center sm:text-left">
            &copy; {currentYear} Found-It. All rights reserved.
          </p>
          <p className="text-sm text-slate-500 text-center sm:text-right">
            Built with <span className="text-red-500">❤️</span> by student, for students.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
