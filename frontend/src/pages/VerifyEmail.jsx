import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, actionCodeSettings } from '../lib/firebase';
import { applyActionCode, sendEmailVerification } from 'firebase/auth';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const oobCode = params.get('oobCode') || '';
  const [message, setMessage] = useState('Verifying your email...');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        if (!oobCode) {
          setMessage('Verification link expired, resend email');
          return;
        }
        await applyActionCode(auth, oobCode);
        // Marked verified on Firebase side. Reload current user if available.
        try { if (auth.currentUser) await auth.currentUser.reload(); } catch (e) {}
        setMessage('Email verified, you can now login');
      } catch (e) {
        setMessage('Verification link expired, resend email');
      }
    };
    verify();
  }, [oobCode, navigate]);

  const handleResend = async () => {
    try {
      setResending(true);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        setMessage('Verification email resent. Please check your inbox.');
      } else {
        setMessage('Cannot resend: no user session. Please register again.');
      }
    } catch (e) {
      setMessage('Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center px-4" style={{ backgroundImage: 'url(/assets/register-bg.jpg)' }}>
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="flex justify-center mb-4">
          <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-12 w-auto" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-800">Verify Email</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
          >
            {resending ? 'Resending...' : 'Resend Verification Email'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
