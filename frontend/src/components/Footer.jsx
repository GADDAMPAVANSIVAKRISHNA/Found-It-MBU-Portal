const Footer = () => {
  return (
    <footer className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="font-bold mb-2">About</div>
            <p className="text-sm text-gray-700">Found‑It is MBU's student‑built Lost & Found portal helping reunite items quickly and safely across campus.</p>
          </div>
          <div>
            <div className="font-bold mb-2">Quick Links</div>
            <ul className="space-y-2 text-sm">
              <li><a href="/report-lost" className="hover:text-primary">Report Lost</a></li>
              <li><a href="/report-found" className="hover:text-primary">Report Found</a></li>
              <li><a href="/dashboard" className="hover:text-primary">Dashboard</a></li>
              <li><a href="/gallery" className="hover:text-primary">Gallery</a></li>
              <li><a href="#" className="hover:text-primary">Contact Office</a></li>
            </ul>
          </div>
          <div>
            <div className="font-bold mb-2">Social</div>
            <div className="flex gap-3 text-sm">
              <a href="#" className="hover:text-primary">Instagram</a>
              <a href="#" className="hover:text-primary">LinkedIn</a>
              <a href="https://www.mbu.asia" className="hover:text-primary">Official Website</a>
            </div>
          </div>
          <div>
            <div className="font-bold mb-2">Contact Info</div>
            <p className="text-sm">support@mbu.asia</p>
            <p className="text-sm">Lost & Found Office</p>
            <p className="text-sm">+91-XXXXXXXXXX</p>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-gray-600">© 2025 Found‑It • Built for MBU students</div>
      </div>
    </footer>
  );
};

export default Footer;