import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Load Firebase config from Vercel Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Custom application URL (for email verification redirects)
// Default to Vite dev server port 5173 if not provided
const SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5173';

export const actionCodeSettings = {
  url: `${SITE_URL}/verify-email`,
  handleCodeInApp: true,
};

console.log("🔥 Firebase Action Code Settings:", actionCodeSettings);

export default app;
