import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, actionCodeSettings } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

const EmailSent = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || auth.currentUser?.email || '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('Verification email sent. Please check your inbox.');

  useEffect(() => {
    const ping = async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          navigate('/login');
        }
      }
    };
    ping();
  }, [navigate]);

  const handleResend = async () => {
    try {
      setResending(true);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        setMessage('Verification email resent. Please check your inbox.');
      } else {
        setMessage('Cannot resend: no user session. Please login to resend or register again.');
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
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-gray-800">Email Sent</h2>
        <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base">{message}</p>
        {email && (
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Registered email: <span className="font-semibold break-all">{email}</span></p>
        )}
        <div className="flex flex-col gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-indigo-600 text-white py-2 sm:py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-semibold text-xs sm:text-sm"
          >
            {resending ? 'Resending...' : 'Resend verification email'}
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

export default EmailSent;
