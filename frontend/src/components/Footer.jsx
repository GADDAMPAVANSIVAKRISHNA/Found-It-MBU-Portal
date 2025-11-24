const Footer = () => {
  return (
    <footer className="border-t mt-12 bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 items-center">
          <div className="text-sm text-gray-700">
            <div className="font-bold mb-2">About</div>
            <p>Student‑run Lost & Found portal at Mohan Babu University, helping reunite items quickly and safely.</p>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-20 w-20 object-contain" />
            <div className="mt-2 font-bold text-gray-800">Mohan Babu University</div>
          </div>
          <div className="text-sm text-gray-700">
            <div className="font-bold mb-2">Contact</div>
            <p>Email: support@mbu.asia</p>
            <p>Lost & Found Office: Admin Block, Ground Floor</p>
          </div>
        </div>
        <div className="mt-6 text-center text-sm text-gray-600">© {new Date().getFullYear()} Found‑It • Built for MBU students</div>
      </div>
    </footer>
  );
};

export default Footer;