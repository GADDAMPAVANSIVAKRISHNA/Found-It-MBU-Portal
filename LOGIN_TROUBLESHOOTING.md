# 🔐 Login Troubleshooting Guide

## Error: "Your email is not verified. Please check your inbox for the OTP code and verify first."

### Why This Happens
When you register a new account, the backend sends an **OTP (One-Time Password)** to your email. You must verify this OTP before you can login.

### How to Fix ✅

#### Step 1: Check Your Email
1. Go to your @mbu.asia email inbox
2. Look for an email with subject: **"Your Found-It Verification Code"**
3. **Important**: Check your SPAM/JUNK folder if not in inbox
4. Copy the **6-digit OTP code** from the email

#### Step 2: Verify Your Email
1. Go to **http://localhost:5173/verify-email**
2. Enter your **email address** (same as registration)
3. Paste the **OTP code** you received
4. Click **"Verify OTP"**
5. You should see: **"Email verified! Please login."**

#### Step 3: Login
1. Go back to **http://localhost:5173/login**
2. Enter your **email** and **password**
3. Click **Login**
4. You should now see your Dashboard!

---

## Complete User Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│ 1. REGISTER PAGE (/register)                        │
│    - Enter: Name, Email, Password, Branch, Year     │
│    - Click: Register Button                          │
│    - Result: OTP sent to email                       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 2. EMAIL VERIFICATION                              │
│    - Check email for OTP code                       │
│    - Go to: /verify-email                           │
│    - Enter: Email + OTP                             │
│    - Click: Verify OTP                              │
│    - Result: Email verified ✅                       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 3. LOGIN PAGE (/login)                              │
│    - Enter: Email, Password                         │
│    - Click: Login Button                            │
│    - Result: JWT token saved to localStorage        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 4. DASHBOARD (/dashboard)                           │
│    - View: Profile, Stats                           │
│    - Options: Edit Profile, Report Item, Browse     │
└─────────────────────────────────────────────────────┘
```

---

## Common Login Errors & Solutions

### ❌ Error: "Account not found. Please register first."
**Problem**: Your account doesn't exist or email is incorrect.
**Solution**: 
1. Check spelling of your email
2. Make sure it's a @mbu.asia email
3. Go to /register and create new account if needed

---

### ❌ Error: "Incorrect password or email."
**Problem**: Wrong password or email.
**Solution**:
1. Double-check your password (case-sensitive)
2. Verify email is typed correctly
3. Use "Forgot Password" link to reset if needed

---

### ❌ Error: "Cannot connect to backend. Make sure server is running on port 5000."
**Problem**: Backend server is not running.
**Solution**:
1. Open terminal and run:
   ```bash
   cd backend
   npm run dev
   ```
2. You should see: `🚀 Server running on port 5000`
3. Keep this terminal running while using the app

---

### ❌ Error: "Verify email first" (when entering /verify-email)
**Problem**: No OTP was sent or OTP expired.
**Solution**:
1. Go to /register again
2. Register with same email
3. New OTP will be sent
4. Use new OTP in verify-email page

---

## How OTP Verification Works

```
Registration ──> Email Sent ──> OTP Expires (10 min)
                     │
                     ▼
              Check Inbox/Spam
                     │
                     ▼
              Enter OTP at /verify-email
                     │
                     ├─ OTP Correct ──> ✅ Verified
                     │
                     └─ OTP Wrong ──> ❌ Try Again
```

---

## Test Account (Pre-Verified)

If you want to test without going through email verification:

### Option 1: Use MongoDB to Mark User as Verified
```javascript
// In MongoDB Compass or MongoDB Shell:
db.users.updateOne(
  { email: "23102A010664@mbu.asia" },
  { $set: { isVerified: true } }
)
```

### Option 2: Use Reset Password Flow
Instead of verifying email, you can:
1. Go to /forgot-password
2. Enter email that exists
3. Check email for reset link
4. Reset password
5. Login with new password

---

## Backend Login Flow (Technical)

```
POST /api/auth/login
├─ Check if user exists
├─ Check if email is verified (isVerified: true)
├─ Compare password with hashed password
├─ Generate JWT token (7 days expiry)
└─ Return token + user data

// Frontend stores:
localStorage.setItem("authToken", token)
localStorage.setItem("user", JSON.stringify(userData))

// All future API calls use this token:
Authorization: Bearer {token}
```

---

## Email Configuration Check

If OTP emails aren't arriving:

1. **Backend Status Check**:
   ```bash
   curl http://localhost:5000/api/auth/test
   # Should return: { "ok": true, "message": "Auth router test working!" }
   ```

2. **Check .env Email Settings**:
   ```
   EMAIL_SERVICE=gmail  (or your provider)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   CLIENT_URL=http://localhost:5173
   ```

3. **Test OTP Email**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@mbu.asia",
       "password": "password123",
       "branch": "CS",
       "year": "2nd",
       "contactNumber": "9876543210"
     }'
   ```

---

## Quick Reference

| Step | Action | URL |
|------|--------|-----|
| 1 | Register new account | `/register` |
| 2 | Check email for OTP | Your email inbox |
| 3 | Verify OTP | `/verify-email` |
| 4 | Login | `/login` |
| 5 | Access dashboard | `/dashboard` |

---

## Need More Help?

### Check Backend Logs
```bash
# Terminal where backend is running
# Should show: POST /api/auth/login [200 OK]
```

### Check Browser Console
```javascript
// F12 > Console tab
// Look for any JavaScript errors
```

### Check Network Tab
```
F12 > Network tab
1. Try to login
2. Look for POST /api/auth/login request
3. Check Response tab for error message
```

### MongoDB Check
```bash
# See all users:
db.users.find().pretty()

# Check specific user:
db.users.findOne({ email: "23102A010664@mbu.asia" })

# Should show: "isVerified": true
```

---

## Success Indicators ✅

**After successful login, you should see:**
- ✅ Redirected to `/dashboard`
- ✅ Greeting: "Welcome, [Your Name]!"
- ✅ Your email, branch, year displayed
- ✅ Stats showing: 0 lost, 0 found
- ✅ Token in `localStorage` (check DevTools > Application > Local Storage)

---

## Still Stuck?

1. **Clear localStorage**:
   ```javascript
   // F12 > Console:
   localStorage.clear()
   ```

2. **Restart Backend**:
   ```bash
   # Ctrl+C in backend terminal
   npm run dev
   ```

3. **Restart Frontend**:
   ```bash
   # Ctrl+C in frontend terminal
   npm run dev
   ```

4. **Check MongoDB Connection**:
   ```bash
   # Backend logs should show: ✅ MongoDB Connected
   ```

