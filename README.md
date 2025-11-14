# 🔍 Found-It - MBU Lost & Found Portal

> A complete Lost & Found management system exclusively for Mohan Babu University students

![MERN Stack](https://img.shields.io/badge/MERN-Stack-green)
![Free Hosting](https://img.shields.io/badge/Hosting-100%25%20Free-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Overview

**Found-It** is a full-stack web application designed specifically for Mohan Babu University to help students report lost items, register found items, and reconnect belongings with their rightful owners.

### ✨ Key Features

- 🔐 **Secure Authentication** - Login only with @mbu.asia email addresses
- 📝 **Report Lost Items** - Submit lost item details (image optional)
- 📸 **Report Found Items** - Register found items (image mandatory, stored as Base64)
- 🖼️ **Items Gallery** - Browse and search all unclaimed found items
- 🎯 **Claim System** - Easy item claiming with verification
- 🆘 **Help Us Find** - View lost items and help locate them
- 📧 **Email Notifications** - Account verification & password reset
- 📱 **Responsive Design** - Works on all devices
- 🌓 **Dark Mode** - Modern UI with theme toggle

---

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI Library
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Framer Motion** - Animations
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database (Atlas Free)
- **JWT** - Authentication
- **Nodemailer** - Email service
- **bcryptjs** - Password hashing

### Deployment (100% FREE)
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas Free Tier

---

## 📦 Project Structure

```
Found-It-MBU-Portal/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Item.js
│   │   └── ClaimedItem.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── items.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── email.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   ├── utils/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (free)
- Gmail account (for email service)

### 1. Clone Repository
```bash
git clone https://github.com/GADDAMPAVANSIVAKRISHNA/Found-It-MBU-Portal.git
cd Found-It-MBU-Portal
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key_here
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:5173
PORT=5000
```

Start backend:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

---

## 📋 Item Categories

### 1. Cards
- College ID Card
- ATM Card
- Driver's License
- Aadhar Card
- Others

### 2. Electronic Devices
- Mobile Phones
- Laptops
- Smart Watches
- Chargers
- Others

### 3. Books
- Notebooks/Registers
- Textbooks
- Novels
- Others

### 4. Others
- Bottles
- Wallets
- Bags
- Miscellaneous

---

## 🌐 Deployment Guide

### Deploy Backend (Render - Free)

1. Create account on [Render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Environment:** Node
5. Add environment variables (from `.env`)
6. Deploy!

### Deploy Frontend (Vercel - Free)

1. Create account on [Vercel.com](https://vercel.com)
2. Import GitHub repository
3. Configure:
   - **Framework:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:
   - `VITE_API_URL=https://your-backend-url.onrender.com`
5. Deploy!

### MongoDB Atlas Setup

1. Create free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster (Free M0)
3. Add database user
4. Whitelist IP: `0.0.0.0/0` (allow all)
5. Get connection string
6. Add to backend `.env`

---

## 📧 Gmail App Password Setup

1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security
3. Search "App passwords"
4. Generate password for "Mail"
5. Copy 16-character password
6. Add to `.env` as `GMAIL_PASS`

---

## 🎨 Features Walkthrough

### User Registration
- Only `@mbu.asia` emails allowed
- Email verification required
- User details: Name, SAP ID, Branch, Year, Contact

### Report Lost Item
- Item details form
- Category selection
- Image upload (optional)
- Location & date
- Automatic entry in Lost Items DB

### Report Found Item
- Item details form
- **Image required** (Base64 storage)
- Category selection
- Submit to Lost & Found Department

### Items Gallery
- Filter by category
- Search functionality
- Claim items
- View full details

### Claim Process
1. User clicks "CLAIM NOW"
2. Fills verification details
3. Item moved to Collected Items DB
4. Removed from Found Items
5. Visit L&F office to collect

---

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Email verification
- @mbu.asia domain restriction
- Secure password reset

---

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify/:token` - Email verification
- `POST /api/auth/forgot` - Forgot password
- `POST /api/auth/reset/:token` - Reset password

### Items
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user profile

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use this project for your college!

---

## 👨‍💻 Author

**Pavan Siva Krishna Gaddampa**
- GitHub: [@GADDAMPAVANSIVAKRISHNA](https://github.com/GADDAMPAVANSIVAKRISHNA)

---

## 🙏 Acknowledgments

- Mohan Babu University
- MERN Stack Community
- All contributors

---

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Contact via university email

---

**⭐ If you find this project helpful, please give it a star!**
