import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError(res.data?.error || 'Reset failed');
        return;
      }

      setSuccess('Password reset successful. You can now login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err?.message || 'Reset failed');
    }
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
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">Reset Password</h2>
        {success && <div className="bg-green-100 text-green-700 p-2 sm:p-3 rounded mb-3 sm:mb-4 text-xs sm:text-sm">{success}</div>}
        {error && <div className="bg-red-100 text-red-700 p-2 sm:p-3 rounded mb-3 sm:mb-4 text-xs sm:text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-xs sm:text-sm font-semibold">New Password</label>
          <input type="password" className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition mb-4 sm:mb-6 text-xs sm:text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-blue-700 transition text-xs sm:text-sm lg:text-base">Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;