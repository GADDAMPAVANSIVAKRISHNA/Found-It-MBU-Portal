import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email.endsWith('@mbu.asia')) {
      setError('Please use your @mbu.asia email address');
      return;
    }

    setLoading(true);

    try {
      // 👉 use Backend Gmail + Firebase reset
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-password-reset`, {
        email,
      });

      setMessage('Password reset email sent! Please check your inbox and spam folder.');
      setEmail('');
    } catch (err) {
      console.error('Password reset error:', err?.message);
      let errorMsg = err?.response?.data?.error || 'Failed to send reset email. Please try again.';

      // Friendly message for server config errors
      if (errorMsg.includes('Invalid login') || errorMsg.includes('BadCredentials')) {
        errorMsg = 'System Email Error: The server could not log in to the email account. Please contact the administrator to fix the backend configuration.';
      }

      setError(errorMsg);
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen w-screen overflow-x-hidden bg-cover bg-center flex items-center justify-center px-3 sm:px-4 md:px-6 py-4"
      style={{ backgroundImage: 'url(/assets/register-bg.jpg)' }}
    >
      <div className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 lg:p-8 bg-white rounded-lg lg:rounded-xl shadow-lg">
        <div className="flex justify-center mb-3 sm:mb-4">
          <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-10 sm:h-12 lg:h-14 w-auto" />
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">Forgot Password</h2>

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
