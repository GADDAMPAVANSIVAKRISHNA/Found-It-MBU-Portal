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
      // If login resolves, AuthContext already fetched profile and set user
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      const code = err?.code || '';
      if (code === 'email-not-verified') {
        setError('Please verify your email');
        toast.error('Please verify your email');
      } else if (code === 'profile-missing') {
        setError('User not registered');
        toast.error('User not registered');
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
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{ backgroundImage: 'url(/assets/register-bg.jpg)' }}
    >
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-center mb-4">
          <img src="https://upload.wikimedia.org/wikipedia/en/4/4b/Mohan_Babu_University_Logo%2C_Tirupati%2C_Andhra_Pradesh%2C_India.png" alt="MBU" className="h-14 w-auto" />
        </div>
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Login</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 mb-6 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account? <a href="/register" className="text-blue-600 hover:underline font-semibold">Register here</a>
          </p>
          <p className="text-gray-600 mt-2">
            Forgot password? <a href="/forgot-password" className="text-blue-600 hover:underline font-semibold">Reset here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
