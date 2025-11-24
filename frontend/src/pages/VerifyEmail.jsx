import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ loading: true, success: '', error: '' });

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/auth/verify/${token}`);
        setStatus({ loading: false, success: 'Email verified! You can login now.', error: '' });
      } catch (err) {
        setStatus({ loading: false, success: '', error: err.response?.data?.error || 'Invalid or expired link' });
      }
    };
    verify();
  }, [token]);

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-6">Verify Email</h2>
      {status.loading && <div>Verifying...</div>}
      {status.success && (
        <>
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{status.success}</div>
          <button onClick={() => navigate('/login')} className="w-full bg-primary text-white py-2 rounded-lg font-semibold">Go to Login</button>
        </>
      )}
      {status.error && (
        <>
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{status.error}</div>
          <Link to="/register" className="text-primary">Register</Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;