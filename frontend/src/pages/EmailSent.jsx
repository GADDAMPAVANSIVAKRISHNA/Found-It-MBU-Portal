import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { auth, actionCodeSettings } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

const EmailSent = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const email = location.state?.email || params.get('email') || auth.currentUser?.email || '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('Verification email sent. Please check your inbox (including Spam).');

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

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    // We cannot use Firebase SDK 'sendEmailVerification' if user is not logged in.
    // Instead, usage the backend endpoint which generates a link using Firebase Admin.
    try {
      setResending(true);
      if (!email) {
        setMessage('No email found to resend to. Please login or register again.');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || '';
      // Use standard fetch or apiFetch if available, but axios is also fine
      const res = await fetch(`${API_URL}/api/auth/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Verification email resent! Please check your inbox (and Spam). Wait at least 2 minutes for it to arrive.');
        setResendCooldown(60); // 60s cooldown
      } else {
        // Parse raw error if possible
        let errorMsg = data.error || 'Failed to resend verification email.';

        // Handle Firebase "Too Many Attempts" specifically
        if (typeof errorMsg === 'string' && (errorMsg.includes('TOO_MANY_ATTEMPTS') || errorMsg.includes('quota'))) {
          errorMsg = 'Too many requests. Please wait a few minutes before trying again.';
        }

        // Handle object errors (sometimes Firebase returns JSON inside string)
        try {
          if (errorMsg.includes('{')) {
            const parsed = JSON.parse(errorMsg);
            if (parsed?.error?.message === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
              errorMsg = 'Too many requests. Please wait a few minutes before trying again.';
            }
          }
        } catch (e) { /* ignore parse error */ }

        setMessage(errorMsg);
      }
    } catch (e) {
      console.error(e);
      setMessage('Failed to resend verification email due to network error.');
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
        <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base">
          {message}
          <br /><br />
          <span className="text-xs text-red-500 font-semibold">
            Note: Emails may take 2-5 minutes to arrive. Please do NOT spam the resend button, or previous links will expire.
          </span>
        </p>
        {email && (
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Registered email: <span className="font-semibold break-all">{email}</span></p>
        )}
        <div className="flex flex-col gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="w-full bg-indigo-600 text-white py-2 sm:py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-semibold text-xs sm:text-sm"
          >
            {resending ? 'Resending...' : resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend verification email'}
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
