import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(email, password);
      toast.success("Login successful!");
      navigate("/");
    } catch (err) {
      const code = err?.code || '';
      if (code === 'email-not-verified') {
        setError('Please verify your email');
        toast.error('Please verify your email');
      } else if (code === 'profile-missing') {
        setError('User profile missing');
        toast.error('User profile missing');
      } else if (code === 'auth/wrong-password') {
        setError('Incorrect password');
        toast.error('Incorrect password');
      } else if (code === 'auth/user-not-found') {
        setError('User not registered.');
        toast.error('User not registered.');
      } else {
        const msg = err?.message || 'Login failed. Please try again.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-screen overflow-x-hidden bg-cover bg-center flex items-center justify-center px-3 sm:px-4 md:px-6 py-4"
      style={{ backgroundImage: 'url(/assets/register-bg.jpg)' }}
    >
      <div className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 lg:p-8 bg-white rounded-lg lg:rounded-xl shadow-lg">
        <div className="flex justify-center mb-3 sm:mb-4">
          <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-10 sm:h-12 lg:h-14 w-auto" />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-center text-gray-800">Login</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg relative mb-3 sm:mb-4 text-sm sm:text-base" role="alert">
            <span className="block">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 sm:py-3 rounded-lg font-semibold transition mt-2 sm:mt-4 text-sm sm:text-base"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center space-y-2 sm:space-y-3">
          <p className="text-gray-600 text-xs sm:text-sm md:text-base">
            Don't have an account? <a href="/register" className="text-blue-600 hover:underline font-semibold">Register</a>
          </p>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base">
            Forgot password? <a href="/forgot-password" className="text-blue-600 hover:underline font-semibold">Reset</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
