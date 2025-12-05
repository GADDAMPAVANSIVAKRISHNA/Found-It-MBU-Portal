import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validate MBU email
    if (!email.endsWith('@mbu.asia')) {
      setError('Please use your @mbu.asia email address');
      return;
    }

    setLoading(true);

    try {
      // Send password reset email using Firebase
      await sendPasswordResetEmail(auth, email);
      
      setMessage('Password reset email sent! Please check your inbox and spam folder.');
      setLoading(false);
      setEmail('');
    } catch (err) {
      setLoading(false);
      console.error('Password reset error:', err);
      
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    }
  };

  return (
    <div className="w-screen overflow-x-hidden min-h-screen py-8 sm:py-12 lg:py-16 px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Forgot Password</h2>
        
        {message && <div className="bg-green-100 text-green-700 p-2 sm:p-3 rounded mb-3 sm:mb-4 text-xs sm:text-sm">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-2 sm:p-3 rounded mb-3 sm:mb-4 text-xs sm:text-sm">{error}</div>}
        
        <p className="mb-4 sm:mb-6 text-gray-600 text-xs sm:text-sm">
          Enter your MBU email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 sm:mb-6">
            <label className="block mb-2 text-xs sm:text-sm font-semibold" htmlFor="email">
              Email (@mbu.asia)
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition text-xs sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="yourname@mbu.asia"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-blue-700 transition font-semibold text-xs sm:text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <Link to="/login" className="text-blue-600 hover:underline text-xs sm:text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;