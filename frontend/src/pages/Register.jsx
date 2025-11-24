import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', branch: '', year: '1st Year', contactNumber: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.email.endsWith('@mbu.asia')) {
        setError('Must use @mbu.asia email');
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            branch: formData.branch,
            year: formData.year,
            contactNumber: formData.contactNumber
          }
        }
      });
      if (error) throw error;
      setSuccess('Check your email to confirm your account');
      setStep('done');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/verify-otp', { email: formData.email, otp });
      setSuccess('Email verified! You can login now.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Register for Found-It</h2>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}
      {step === 'form' && (
      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Name</label>
            <input type="text" className="w-full px-4 py-2 border rounded-lg" 
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <label className="block mb-2">Email (@mbu.asia)</label>
            <input type="email" className="w-full px-4 py-2 border rounded-lg" 
              value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div>
            <label className="block mb-2">Password</label>
            <input type="password" className="w-full px-4 py-2 border rounded-lg" 
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          </div>
          
          <div>
            <label className="block mb-2">Branch</label>
            <input type="text" className="w-full px-4 py-2 border rounded-lg" 
              value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})} required />
          </div>
          <div>
            <label className="block mb-2">Year</label>
            <select className="w-full px-4 py-2 border rounded-lg" 
              value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})}>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block mb-2">Contact Number</label>
            <input type="tel" className="w-full px-4 py-2 border rounded-lg" 
              value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} required />
          </div>
        </div>
        <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-semibold mt-6">
          Register
        </button>
      </form>
      )}
      {step === 'done' && (
        <div className="mt-4 text-center text-gray-700">After confirming your email, please login.</div>
      )}
      <p className="mt-4 text-center">
        Already have an account? <Link to="/login" className="text-primary">Login</Link>
      </p>
    </div>
  );
};

export default Register;
