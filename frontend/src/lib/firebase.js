import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAVGBANDF3HbIfS--CLv0ax1Q5-8Assu7U",
  authDomain: "found-it-69b12.firebaseapp.com",
  projectId: "found-it-69b12",
  storageBucket: "found-it-69b12.appspot.com",   // ✅ FIXED
  messagingSenderId: "391244190684",
  appId: "1:391244190684:web:62df31f81e02c89edf7519",
  measurementId: "G-J2T3PV04MG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
