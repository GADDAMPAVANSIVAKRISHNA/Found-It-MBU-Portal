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
        try { if (auth.currentUser) await auth.currentUser.reload(); } catch (e) { }
        setMessage('Email verified, you can now login');
      } catch (e) {
        // If the code is invalid, it mostly means it was already used (e.g. by email scanner)
        // or actually expired.
        // We encourage the user to try logging in.
        if (e.code === 'auth/invalid-action-code') {
          setMessage('Link invalid or already used. You might already be verified. Please try logging in.');
        } else {
          setMessage('Verification failed. Link may be expired.');
        }
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
    <div className="min-h-screen w-screen overflow-x-hidden bg-cover bg-center flex items-center justify-center px-3 sm:px-4 md:px-6 py-4" style={{ backgroundImage: 'url(/assets/register-bg.jpg)' }}>
      <div className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 lg:p-8 bg-white rounded-lg lg:rounded-xl shadow-md text-center">
        <div className="flex justify-center mb-3 sm:mb-4">
          <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-10 sm:h-12 lg:h-14 w-auto" />
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-gray-800">Verify Email</h2>
        <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base">{message}</p>
        <div className="flex flex-col gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-indigo-600 text-white py-2 sm:py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-semibold text-xs sm:text-sm"
          >
            {resending ? 'Resending...' : 'Resend Verification Email'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full bg-green-600 text-white py-2 sm:py-2.5 rounded-lg hover:bg-green-700 transition font-semibold text-xs sm:text-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
