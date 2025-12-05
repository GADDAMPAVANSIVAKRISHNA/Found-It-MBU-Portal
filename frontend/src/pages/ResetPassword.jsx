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
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">New Password</label>
        <input type="password" className="w-full px-4 py-2 border rounded-lg mb-4" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-semibold">Reset Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;