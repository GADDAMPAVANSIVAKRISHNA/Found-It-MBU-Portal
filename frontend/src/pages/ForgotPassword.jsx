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
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Forgot Password</h2>
      
      {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      
      <p className="mb-4 text-gray-600">
        Enter your MBU email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="email">
            Email (@mbu.asia)
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-4 py-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="yourname@mbu.asia"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link to="/login" className="text-blue-600 hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;