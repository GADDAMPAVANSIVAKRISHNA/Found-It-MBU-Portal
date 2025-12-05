# Found-It Portal - Full Stack Setup Guide

## Overview
This is a complete Lost & Found management system for Mohan Babu University. The application is now fully wired end-to-end with:
- **Frontend**: React with Vite (at `http://localhost:3000` or dev server port)
- **Backend**: Express.js with MongoDB (at `http://localhost:5000`)
- **Authentication**: Firebase Auth with JWT fallback
- **Database**: MongoDB (local or cloud via MONGO_URI)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB running locally (`mongod`) or connection string to cloud MongoDB (Atlas)
- Firebase project setup with credentials in `backend/config/firebaseAdmin.js`

### 1. Backend Setup
```bash
cd backend
npm install

# Configure environment
# Edit TextDocument.env and set:
# - MONGO_URI (MongoDB connection string)
# - PORT (default: 5000)
# - JWT_SECRET (random string)
# - EMAIL credentials (for password reset, optional)

# Start server (watches for changes with nodemon)
npm run dev
```

**Expected Output:**
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Configure environment
# Create .env file (copy from .env.example):
VITE_API_URL=http://localhost:5000

# Start dev server
npm run dev
```

**Expected Output:**
```
Local:   http://localhost:5173/
```

---

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - Firebase + backend login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/reset-password/:token` - Reset password

### Users (Protected routes require Firebase ID token)
- `GET /api/users/me` - Get current user profile (**protected**)
- `PUT /api/users/me` - Update current user profile (**protected**)
- `GET /api/users/by-email?email=...` - Get user by email
- `POST /api/users/upsert-by-email` - Create/update user by email

### Dashboard (Protected)
- `GET /api/dashboard` - Get user stats + profile + their items (**protected**)

### Items
- `POST /api/items/lost` - Report lost item (**protected**)
- `POST /api/items/found` - Report found item (**protected**)
- `GET /api/items` - List all items (with pagination, filters)
- `GET /api/items/:id` - Get single item details
- `POST /api/items/:id/claim` - Claim a found item (**protected**)

### Claims
- `POST /api/claims` - Create claim for found item (**protected**)

---

## 🔗 Frontend Pages & API Usage

### Home `/`
- Displays welcome message with user name (fetched from AuthContext)
- No new API calls; uses cached user data from login

### Login `/login`
- `POST /api/auth/login` on submit
- Stores Firebase ID token, then navigates to dashboard

### Register `/register`
- `POST /api/auth/register` via Firebase
- `POST /api/users/upsert-by-email` to sync user profile

### Dashboard `/dashboard`
- `GET /api/dashboard` on mount
- Displays user stats (lost count, found count)
- Shows "My Lost Items" and "My Found Items" lists
- `PUT /api/users/me` to update profile

### Report Lost `/report-lost`
- Form fields: title, description, category, location, date, image (optional), contact info
- `POST /api/items/lost` on submit
- Redirects to dashboard on success

### Report Found `/report-found`
- Form fields: title, description, category, location, date, **image (REQUIRED)**, contact info
- `POST /api/items/found` on submit with image compression
- Redirects to dashboard on success

### Gallery `/gallery`
- `GET /api/items?page=...&limit=...&category=...&q=...` on load/filter change
- Displays combined lost + found items
- "Claim" button on found items that are not claimed
- `POST /api/items/:id/claim` on claim submission

### Item Details `/item/:id`
- `GET /api/items/:id` on mount
- Shows full item details
- "Claim Item" modal for found items
- `POST /api/claims` on claim submission

---

## 🛠️ Key Implementation Details

### apiFetch Helper
Located in `frontend/src/utils/api.js`:
- Automatically adds Firebase ID token to `Authorization: Bearer {token}` header
- Prepends API base URL (`http://localhost:5000`) to relative paths
- Handles JSON serialization (except FormData)
- Returns `{ ok, status, data }` format

**Example:**
```javascript
const res = await apiFetch("/api/items", {
  method: "POST",
  body: JSON.stringify({ title: "Lost Laptop" })
});
if (res.ok) { /* success */ }
```

### Auth Middleware
Backend `middleware/auth.js`:
- Verifies Firebase ID token (priority 1)
- Falls back to JWT verification (priority 2)
- Sets `req.user` and `req.userId` for protected routes
- Auto-creates user document on first login

### Database Models
- `User` - Email, name, branch, year, Firebase UID
- `LostItem` - Lost item reports with user contact
- `FoundItem` - Found item reports with user contact + image
- `ClaimedItem` - Claims/matches for found items

---

## ✅ Testing Checklist

### 1. Backend Health
```bash
curl http://localhost:5000/
# Expected: {"message": "Found-It API Running!", "status": "active"}
```

### 2. User Registration → Login → Dashboard
- [ ] Go to `/register`, fill form with @mbu.asia email
- [ ] Check email for verification link
- [ ] Go to `/login` with credentials
- [ ] Dashboard loads with user greeting + stats

### 3. Report Lost Item
- [ ] Go to `/report-lost`
- [ ] Fill form (title, description, category, location, date, contact)
- [ ] Submit
- [ ] Confirm redirect to dashboard
- [ ] Check browser network tab: `POST /api/items/lost` → 201 response

### 4. Report Found Item
- [ ] Go to `/report-found`
- [ ] Fill form **including image** (required)
- [ ] Submit
- [ ] Check browser network tab: `POST /api/items/found` with FormData

### 5. View in Gallery
- [ ] Go to `/gallery`
- [ ] Check both lost & found items are displayed
- [ ] Filter by category/search
- [ ] Pagination works (page 2, 3, etc.)
- [ ] Found items show "Claim" button

### 6. Claim Item
- [ ] Click "Claim" on a found item
- [ ] Fill claim form (student ID, proof description, optional image)
- [ ] Submit
- [ ] Check browser network tab: `POST /api/claims` → success

### 7. Edit Profile
- [ ] Go to `/dashboard`
- [ ] Click "Edit Profile"
- [ ] Change name/branch/year
- [ ] Save
- [ ] Check browser network tab: `PUT /api/users/me` → 200 response

---

## 🐛 Troubleshooting

### "Network error" or 404 responses
**Issue**: Frontend can't reach backend
**Solution**:
1. Confirm backend is running: `curl http://localhost:5000/`
2. Check `VITE_API_URL` in `frontend/.env` matches backend port
3. Verify CORS is enabled in `backend/server.js` (should allow `http://localhost:3000` and `http://localhost:5173`)

### "Invalid or expired token" (401)
**Issue**: Firebase token verification failed
**Solution**:
1. Confirm you're logged in (check browser localStorage for `firebaseAuth`)
2. Check Firebase Admin credentials in `backend/config/firebaseAdmin.js`
3. Ensure `Authorization: Bearer {token}` header is being sent (check Network tab)

### MongoDB connection errors
**Issue**: "MongoDB Connection Warning"
**Solution**:
1. Confirm MongoDB is running: `mongod` on Windows or `brew services start mongodb-community` on Mac
2. Or set `MONGO_URI` to cloud MongoDB (Atlas): `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

### Image upload fails
**Issue**: 400 error on `/api/items/found`
**Solution**:
1. Image is required for found items (checked on frontend validation)
2. Ensure image file is < 2MB
3. Check backend logs for specific error

---

## 📁 Project Structure

```
Found-It-MBU-Portal/
├── backend/
│   ├── config/
│   │   └── firebaseAdmin.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── user.js
│   │   ├── lostItem.js
│   │   ├── foundItem.js
│   │   └── ClaimedItem.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── items.js
│   │   ├── dashboard.js
│   │   └── claims.js
│   ├── server.js
│   ├── TextDocument.env (edit this)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ReportLost.jsx
│   │   │   ├── ReportFound.jsx
│   │   │   ├── Gallery.jsx
│   │   │   └── ItemDetails.jsx
│   │   ├── utils/
│   │   │   └── api.js (apiFetch helper)
│   │   └── main.jsx
│   ├── .env (set VITE_API_URL)
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🚢 Deployment Notes

### Vercel (Frontend)
1. Connect GitHub repo to Vercel
2. Set `VITE_API_URL` to production backend URL (e.g., `https://api.example.com`)
3. Deploy

### Heroku/Railway (Backend)
1. Set `MONGO_URI` to production MongoDB (Atlas)
2. Set `JWT_SECRET` to strong random string
3. Set `CLIENT_URL` to production frontend URL
4. Deploy

---

## 📞 Support

For issues or questions:
1. Check backend logs: `npm run dev` in backend folder
2. Check browser console (F12 → Console)
3. Check network requests (F12 → Network) for API calls
4. Verify environment variables are correctly set

Happy coding! 🎉
