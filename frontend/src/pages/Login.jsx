import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import api from '../utils/api';
import { auth } from '../lib/firebase';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendSuccess('');
    setLoading(true);
    setShowResendEmail(false);

    try {
      // Validate MBU email
      if (!formData.email.endsWith('@mbu.asia')) {
        setError('Please use your @mbu.asia email address');
        setLoading(false);
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Check if email is verified
      if (!cred.user.emailVerified) {
        setError('Please verify your email before logging in. Check your inbox for the verification email.');
        setShowResendEmail(true);
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Obtain JWT from backend and store for API calls
      try {
        const { data } = await api.post('/auth/login', { email: formData.email, password: formData.password });
        if (data?.token) {
          localStorage.setItem('token', data.token);
        }
      } catch (e) {
        // If backend password auth not configured, continue without JWT
        console.warn('Backend login failed, continuing without JWT:', e?.response?.data || e?.message);
      }

      setLoading(false);
      navigate('/');

    } catch (err) {
      setLoading(false);
      console.error('Login error:', err);
      
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    }
  };

  const handleResendEmail = async () => {
    try {
      setResendSuccess('');
      setError('');
      
      // Sign in temporarily to get the user object
      const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Send verification email
      await sendEmailVerification(cred.user);
      
      // Sign out again
      await auth.signOut();
      
      setResendSuccess('Verification email sent! Please check your inbox and spam folder.');
    } catch (err) {
      console.error('Resend email error:', err);
      setError('Failed to resend verification email. Please check your credentials.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-center mb-4">
        <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-14 w-auto" />
      </div>
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Login to Found-It</h2>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}
      {resendSuccess && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{resendSuccess}</div>}
      
      {showResendEmail && (
        <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg mb-4 text-center">
          <p className="text-lg mb-2">📧 Email not verified yet?</p>
          <button 
            type="button" 
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            onClick={handleResendEmail}
          >
            Resend Verification Email
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 font-semibold text-gray-700" htmlFor="email">
            MBU Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="yourname@mbu.asia"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold text-gray-700" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="Enter your password"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 mb-2">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline font-semibold">Register here</Link>
        </p>
        <div className="text-center">
          <Link to="/forgot-password" className="text-blue-600 hover:underline font-semibold">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
