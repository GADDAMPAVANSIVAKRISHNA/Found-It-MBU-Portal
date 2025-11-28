import { useEffect } from "react";
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import Gallery from "./pages/Gallery";
import ItemDetails from "./pages/ItemDetails";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";

// Firebase auth
import { auth } from "./lib/firebase";

function App() {

  // 🔥 Debug: Print current Firebase user
  useEffect(() => {
    console.log("🔥 CURRENT USER =", auth.currentUser);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <main className="min-h-screen">
            <Routes>

              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/item/:id" element={<ItemDetails />} />

              {/* Private Routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/report-lost"
                element={
                  <PrivateRoute>
                    <ReportLost />
                  </PrivateRoute>
                }
              />

              <Route
                path="/report-found"
                element={
                  <PrivateRoute>
                    <ReportFound />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin/dashboard"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

            </Routes>
          </main>

          <Footer />

        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
