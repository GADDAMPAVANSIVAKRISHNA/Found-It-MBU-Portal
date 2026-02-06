import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: '',
    year: '',
    contactNumber: '',
    gender: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const navigate = useNavigate();

  const handleChange = (key) => (e) => {
    setFormData({ ...formData, [key]: e.target.value });
    if (key === 'password' || key === 'confirmPassword') {
      const pw = key === 'password' ? e.target.value : formData.password;
      const cpw = key === 'confirmPassword' ? e.target.value : formData.confirmPassword;
      setPasswordMatch(pw && cpw && pw === cpw);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email.endsWith('@mbu.asia')) {
      setError('Please register with your @mbu.asia email');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!passwordMatch) {
      setError('Passwords do not match');
      return;
    }
    if (formData.contactNumber && !/^\d{10}$/.test(formData.contactNumber)) {
      setError('Contact number must be exactly 10 digits and contain only numbers');
      return;
    }

    try {
      setLoading(true);

      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      await updateProfile(cred.user, { displayName: formData.name });

      // 👉 send verification through backend (NOT Firebase)
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-verification`, {
          email: formData.email,
        });
      } catch (err) {
        console.warn("Could not send verification email", err?.message);
      }

      // Create MongoDB user
      await apiFetch('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          branch: formData.branch,
          year: formData.year,
          contactNumber: formData.contactNumber,
          gender: formData.gender,
        }),
      });

      try { await signOut(auth); } catch { }

      setSuccess('Registration successful. Verification email sent.');
      setLoading(false);

      navigate('/email-sent', {
        replace: true,
        state: { email: formData.email }
      });

    } catch (err) {
      console.error('Register error', err);
      if (err.code === 'auth/email-already-in-use' || err.message?.includes('email-already-in-use')) {
        setError('Email already in use');
      } else {
        setError(err?.message || 'Registration failed');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-cover bg-center flex items-center justify-center px-3 py-4" style={{ backgroundImage: 'url(/assets/register-bg.jpg)' }}>
      <div className="w-full max-w-sm sm:max-w-lg mx-auto p-4 sm:p-6 lg:p-8 bg-white bg-opacity-95 rounded-lg lg:rounded-xl shadow-lg">
        <div className="flex justify-center mb-3 sm:mb-4">
          <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-10 sm:h-12 lg:h-14 w-auto" />
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-center text-gray-800">Create Account</h2>

        {error && <div className="bg-red-100 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-center text-xs sm:text-sm">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-center text-xs sm:text-sm">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-xs sm:text-sm" htmlFor="name">Full Name *</label>
              <input id="name" type="text" className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm" value={formData.name} onChange={handleChange('name')} required placeholder="Your full name" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-xs sm:text-sm" htmlFor="email">MBU Email *</label>
              <input id="email" type="email" className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm" value={formData.email} onChange={handleChange('email')} required placeholder="you@mbu.asia" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-xs sm:text-sm" htmlFor="branch">Branch</label>
              <input id="branch" type="text" className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm" value={formData.branch} onChange={handleChange('branch')} placeholder="e.g., CSE" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-xs sm:text-sm" htmlFor="year">Year</label>
              <select id="year" className="w-full px-3 sm:px-4 py-2 border rounded-lg bg-white text-sm" value={formData.year} onChange={handleChange('year')}>
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-xs sm:text-sm" htmlFor="password">Password *</label>
              <input id="password" type="password" className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm" value={formData.password} onChange={handleChange('password')} required placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-xs sm:text-sm" htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 text-sm ${formData.confirmPassword ? (passwordMatch ? 'border-green-500 focus:ring-green-500' : 'border-red-500 focus:ring-red-500') : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required
                placeholder="Repeat password"
              />
              {!passwordMatch && formData.confirmPassword && <p className="text-xs text-red-600 mt-1">Passwords do not match</p>}
              {passwordMatch && formData.confirmPassword && <p className="text-xs text-green-600 mt-1">Passwords match</p>}
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-xs sm:text-sm" htmlFor="contactNumber">Contact Number</label>
              <input id="contactNumber" type="tel" className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm" value={formData.contactNumber} onChange={handleChange('contactNumber')} placeholder="Optional" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700 text-xs sm:text-sm">Gender</label>
              <div className="flex gap-2 sm:gap-4 flex-wrap">
                <label className="flex items-center gap-1 sm:gap-2 text-sm">
                  <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange('gender')} />
                  Male
                </label>
                <label className="flex items-center gap-1 sm:gap-2 text-sm">
                  <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange('gender')} />
                  Female
                </label>
                <label className="flex items-center gap-1 sm:gap-2 text-sm">
                  <input type="radio" name="gender" value="other" checked={formData.gender === 'other'} onChange={handleChange('gender')} />
                  Other
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <button type="submit" className="w-full bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-semibold text-sm sm:text-base" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-gray-600 text-xs sm:text-sm">Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-semibold">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
