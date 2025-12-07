import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { toast } from 'react-hot-toast';

const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('OTP sent to registered mail. Please check your inbox.');
    const [resending, setResending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    useEffect(() => {
        // Automatically send OTP on mount if email is present
        if (email && !otpSent) {
            handleSendOtp(true); // pass true to indicate initial send
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email]);

    const handleSendOtp = async (isInitial = false) => {
        if (!email) return;
        setResending(true);
        try {
            const res = await apiFetch("/api/otp/send", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                const msg = res.data.message || 'OTP sent to registered mail. Please check your inbox.';
                setMessage(msg);
                setOtpSent(true);
                if (!isInitial) {
                    toast.success('OTP sent again successfully');
                }
            } else {
                setMessage(res.data.message || 'Failed to send OTP.');
                toast.error(res.data.message || 'Failed to send OTP');
            }
        } catch (e) {
            setMessage('Error sending OTP. Please try again.');
        } finally {
            setResending(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return;
        setVerifying(true);
        try {
            const res = await apiFetch("/api/otp/verify", {
                method: "POST",
                body: JSON.stringify({ email, otp }),
            });

            if (res.ok && res.data.success) {
                // Success
                toast.success('OTP validation successfully completed');
                // Give a small delay or immediate redirect? User asked for popup. Toast is the popup.
                // Immediate redirect is better for flow, usually.
                setTimeout(() => {
                    navigate('/login');
                }, 1000);
            } else {
                setMessage(res.data.message || 'Invalid OTP. Please try again.');
                toast.error(res.data.message || 'Invalid OTP');
            }
        } catch (e) {
            setMessage('Verification failed. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const handleOtpChange = (e) => {
        const val = e.target.value;
        // Allow only digits
        if (/^\d*$/.test(val)) {
            // Limit to 4 chars
            if (val.length <= 4) {
                setOtp(val);
            }
        }
    };

    return (
        <div className="min-h-screen w-screen overflow-x-hidden bg-cover bg-center flex items-center justify-center px-3 sm:px-4 md:px-6 py-4" style={{ backgroundImage: 'url(/assets/register-bg.jpg)' }}>
            <div className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 lg:p-8 bg-white rounded-lg lg:rounded-xl shadow-md text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                    <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-10 sm:h-12 lg:h-14 w-auto" />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-gray-800">Verify OTP</h2>
                <p className="text-gray-600 mb-2 sm:mb-4 text-xs sm:text-sm lg:text-base">OTP sent to registered mail. Please check your inbox.</p>

                {email && (
                    <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Registered email: <span className="font-semibold break-all">{email}</span></p>
                )}

                {/* Error message display if any (but not the success message) */}
                {message && !message.includes('OTP sent') && (
                    <p className="text-red-500 text-xs sm:text-sm mb-4">{message}</p>
                )}

                <div className="flex flex-col gap-2 sm:gap-3">
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        className="w-full px-3 py-2 border rounded-lg text-sm text-center tracking-widest font-mono"
                        value={otp}
                        onChange={handleOtpChange}
                        disabled={verifying}
                        maxLength={4}
                    />

                    <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifying || otp.length !== 4}
                        className="w-full bg-green-600 text-white py-2 sm:py-2.5 rounded-lg hover:bg-green-700 transition font-semibold text-xs sm:text-sm disabled:opacity-50"
                    >
                        {verifying ? 'Verifying...' : 'Validate OTP'}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSendOtp(false)}
                        disabled={resending}
                        className="w-full bg-indigo-600 text-white py-2 sm:py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-semibold text-xs sm:text-sm"
                    >
                        {resending ? 'Resending...' : 'Resend OTP again'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
