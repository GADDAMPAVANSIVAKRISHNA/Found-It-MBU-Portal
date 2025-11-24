import { useState } from 'react';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('Reset link sent to your email if the account exists.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Forgot Password</h2>
      {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">Email (@mbu.asia)</label>
        <input type="email" className="w-full px-4 py-2 border rounded-lg mb-4" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-semibold">Send Reset Link</button>
      </form>
    </div>
  );
};

export default ForgotPassword;