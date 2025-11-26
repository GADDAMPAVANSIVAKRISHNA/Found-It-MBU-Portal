import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: '',
    year: '',
    contactNumber: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    // Check if passwords match
    if (newPassword && formData.confirmPassword) {
      setPasswordMatch(newPassword === formData.confirmPassword);
    } else {
      setPasswordMatch(false);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setFormData({ ...formData, confirmPassword: newConfirmPassword });
    // Check if passwords match
    if (formData.password && newConfirmPassword) {
      setPasswordMatch(formData.password === newConfirmPassword);
    } else {
      setPasswordMatch(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // MBU email validation
      if (!formData.email.endsWith('@mbu.asia')) {
        setError('Must use @mbu.asia email');
        setLoading(false);
        return;
      }

      // Password validation
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // Create Firebase account
      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update profile with name and additional data
      if (formData.name) {
        await updateProfile(cred.user, {
          displayName: formData.name,
        });
      }

      // Send email verification
      await sendEmailVerification(cred.user);

      setEmailSent(true);
      setSuccess('Registration successful! Please check your email to verify your account.');
      setLoading(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setLoading(false);
      console.error('Registration error:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered. Please login.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    }
  };

  const handleResendEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setSuccess('Verification email resent! Please check your inbox.');
      }
    } catch (err) {
      setError('Failed to resend email. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Register for Found-It</h2>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{success}</div>}
      
      {emailSent && (
        <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg mb-4 text-center">
          <p className="text-lg mb-2">📧 Verification email sent to {formData.email}</p>
          <p className="text-gray-600 mb-3">Didn't receive the email?</p>
          <button 
            type="button" 
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            onClick={handleResendEmail}
          >
            Resend Verification Email
          </button>
        </div>
      )}

      {!emailSent && (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700" htmlFor="name">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700" htmlFor="email">
              MBU Email *
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="yourname@mbu.asia"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700" htmlFor="password">
              Password *
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.password}
              onChange={handlePasswordChange}
              required
              placeholder="At least 6 characters"
            />
          </div>

          <div className="mb-4 relative">
            <label className="block mb-2 font-semibold text-gray-700" htmlFor="confirmPassword">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type="password"
                id="confirmPassword"
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                value={formData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                placeholder="Re-enter your password"
              />
              {passwordMatch && formData.password && formData.confirmPassword && (
                <span className="absolute right-3 top-3 text-green-600 text-xl">✔</span>
              )}
            </div>
            {!passwordMatch && formData.password && formData.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700" htmlFor="branch">
              Branch
            </label>
            <input
              type="text"
              id="branch"
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700" htmlFor="year">
              Year
            </label>
            <select
              id="year"
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            >
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700" htmlFor="contactNumber">
              Contact Number
            </label>
            <input
              type="tel"
              id="contactNumber"
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              placeholder="Your phone number"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            disabled={loading || (formData.password && formData.confirmPassword && !passwordMatch)}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-semibold">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;