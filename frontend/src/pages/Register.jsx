import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { auth, actionCodeSettings } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, fetchSignInMethodsForEmail, signOut } from 'firebase/auth';

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
  const [emailSent, setEmailSent] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const navigate = useNavigate();

  const handleChange = (key) => (e) => {
    setFormData({ ...formData, [key]: e.target.value });
    if ((key === 'password' || key === 'confirmPassword')) {
      const pw = key === 'password' ? e.target.value : formData.password;
      const cpw = key === 'confirmPassword' ? e.target.value : formData.confirmPassword;
      setPasswordMatch(pw && cpw && pw === cpw);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validations
    if (!formData.email.endsWith('@mbu.asia')) {
      setError('Please register with your @mbu.asia email');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, formData.email);
      if (methods && methods.length > 0) {
        setError('User already registered');
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(cred.user, { displayName: formData.name });
      await sendEmailVerification(cred.user, actionCodeSettings);
      await signOut(auth);

      await apiFetch('/api/users/upsert-by-email', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          branch: formData.branch,
          year: formData.year,
          contactNumber: formData.contactNumber,
          gender: formData.gender,
        }),
      });

      setSuccess('Verification email sent. Please check your inbox.');
      setEmailSent(true);
      setLoading(false);
      setTimeout(() => {
        navigate(`/email-sent?email=${encodeURIComponent(formData.email)}`);
      }, 800);

    } catch (err) {
      console.error('Register error', err);
      setError(err?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center px-4" style={{ backgroundImage: 'url(/assets/register-bg.jpg)' }}>
      <div className="w-full max-w-lg mx-auto p-6 bg-white bg-opacity-95 rounded-lg shadow-lg">
        <div className="flex justify-center mb-4">
          <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-14 w-auto" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-gray-800">Create Account</h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold text-gray-700" htmlFor="name">Full Name *</label>
              <input id="name" type="text" className="w-full px-4 py-2 border rounded" value={formData.name} onChange={handleChange('name')} required placeholder="Your full name" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700" htmlFor="email">MBU Email *</label>
              <input id="email" type="email" className="w-full px-4 py-2 border rounded" value={formData.email} onChange={handleChange('email')} required placeholder="you@mbu.asia" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700" htmlFor="branch">Branch</label>
              <input id="branch" type="text" className="w-full px-4 py-2 border rounded" value={formData.branch} onChange={handleChange('branch')} placeholder="e.g., CSE" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700" htmlFor="year">Year</label>
              <select id="year" className="w-full px-4 py-2 border rounded bg-white" value={formData.year} onChange={handleChange('year')}>
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700" htmlFor="password">Password *</label>
              <input id="password" type="password" className="w-full px-4 py-2 border rounded" value={formData.password} onChange={handleChange('password')} required placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700" htmlFor="confirmPassword">Confirm Password *</label>
              <input id="confirmPassword" type="password" className="w-full px-4 py-2 border rounded" value={formData.confirmPassword} onChange={handleChange('confirmPassword')} required placeholder="Repeat password" />
              {formData.confirmPassword && (
                <p className={`text-sm mt-1 ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700" htmlFor="contactNumber">Contact Number</label>
              <input id="contactNumber" type="tel" className="w-full px-4 py-2 border rounded" value={formData.contactNumber} onChange={handleChange('contactNumber')} placeholder="Optional" />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Gender</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange('gender')} />
                  Male
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange('gender')} />
                  Female
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="gender" value="other" checked={formData.gender === 'other'} onChange={handleChange('gender')} />
                  Other
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" className="w-full bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 transition" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-semibold">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
