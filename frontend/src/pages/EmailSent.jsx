import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, actionCodeSettings } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

const EmailSent = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('Verification email sent. Please check your inbox.');

  const handleResend = async () => {
    try {
      setResending(true);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        setMessage('Verification email resent. Please check your inbox.');
      } else {
        // Since we sign out after register, this is the likely path.
        // We cannot resend without a session.
        setMessage('Please log in to resend the verification email.');
        setTimeout(() => navigate('/login'), 2000);
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
        <h2 className="text-2xl font-bold mb-3 text-gray-800">Email Sent</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {email && (
          <p className="text-sm text-gray-500 mb-6">Registered email: <span className="font-semibold">{email}</span></p>
        )}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
          >
            {resending ? 'Resending...' : 'Resend verification email'}
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

export default EmailSent;
