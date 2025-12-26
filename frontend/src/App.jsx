import { useEffect, Suspense, lazy } from "react";
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";

import ActionPopup from "./components/ActionPopup";

// Pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ReportLost = lazy(() => import("./pages/ReportLost"));
const ReportFound = lazy(() => import("./pages/ReportFound"));
const ReportForm = lazy(() => import("./pages/ReportForm"));
const Gallery = lazy(() => import("./pages/Gallery"));
const ItemDetails = lazy(() => import("./pages/ItemDetails"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const EmailSent = lazy(() => import("./pages/EmailSent"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Messages = lazy(() => import("./pages/Messages"));

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
          <ActionPopup />
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
          <main className="min-h-screen">
            <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
              <Routes>

                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/email-sent" element={<EmailSent />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
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
                  path="/report"
                  element={
                    <PrivateRoute>
                      <ReportForm />
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

                <Route
                  path="/messages"
                  element={
                    <PrivateRoute>
                      <Messages />
                    </PrivateRoute>
                  }
                />

              </Routes>
            </Suspense>
          </main>

          <Footer />

        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
