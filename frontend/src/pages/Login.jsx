import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../data/translations";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import axios from "axios";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, googleSignIn } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle normal login (email/password) with automatic role detection
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First try regular login to detect user role
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // If user is staff, use staff login endpoint to get complete staff data
        if (result.user.role === "staff") {
          try {
            const staffResponse = await axios.post('/api/staff/login', {
              email: formData.email,
              password: formData.password
            });

            if (staffResponse.data.success) {
              // Store staff-specific data
              localStorage.setItem("token", staffResponse.data.data.token);
              localStorage.setItem("user", JSON.stringify(staffResponse.data.data.user));
              localStorage.setItem("staff", JSON.stringify(staffResponse.data.data.staff));
              axios.defaults.headers.common["Authorization"] = `Bearer ${staffResponse.data.data.token}`;
              
              navigate("/staff/dashboard");
              return;
            }
          } catch (staffError) {
            console.error("Staff login error:", staffError);
            setError("Failed to load staff data. Please try again.");
            return;
          }
        }

        // For regular users and admins
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        axios.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;

        // Automatically redirect based on user role
        let destination = "/dashboard"; // default for regular users
        if (result.user.role === "admin") {
          destination = "/admin/dashboard";
        }
        navigate(destination);
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cleanup any OAuth query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("token") || params.has("error")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle Firebase Google login
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await googleSignIn();

      if (result.success) {
        console.log("✅ Firebase Google login success");

        // For staff users from Google login, we need to handle them differently
        // since we don't have their password for the staff endpoint
        if (result.user.role === "staff") {
          // For Google-authenticated staff users, we'll need to create a special endpoint
          // or modify the existing staff data retrieval. For now, let's try to get staff data
          try {
            const staffDataResponse = await axios.get('/api/staff/profile', {
              headers: { 'Authorization': `Bearer ${result.token || localStorage.getItem('token')}` }
            });
            
            if (staffDataResponse.data.success && staffDataResponse.data.data.staff) {
              localStorage.setItem("staff", JSON.stringify(staffDataResponse.data.data.staff));
            }
          } catch (staffError) {
            console.warn("Could not fetch staff data for Google login:", staffError);
            // Continue anyway - the staff dashboard will handle missing staff data gracefully
          }
          
          navigate("/staff/dashboard");
          return;
        }

        // Automatically redirect based on user role
        let destination = "/dashboard"; // default for regular users
        if (result.user.role === "admin") {
          destination = "/admin/dashboard";
        }
        navigate(destination);
      } else {
        console.error("❌ Firebase Google login failed:", result.error);
        setError(result.error || "Google sign-in failed");
      }
    } catch (e) {
      console.error("❌ Exception during Firebase Google login:", e);
      setError(`Google sign-in failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden md:flex w-1/2 bg-black relative items-center justify-center rounded-r-3xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1000&q=80"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="relative z-10 text-white px-10">
          <p className="uppercase text-xs tracking-widest mb-4">A Wise Quote</p>
          <h1 className="text-4xl font-bold leading-snug mb-2">
            Get Everything <br /> You Want
          </h1>
          <p className="text-sm max-w-xs text-gray-200">
           Akshaya, an innovative project implemented in the State of Kerala aimed at bridging the digital divide, addresses the issues of ICT access, basic skill sets and availability of relevant content.
          </p>
        </div>
      </div>

      {/* Right Side Login Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white px-6">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <span className="text-lg font-semibold">Sahayak AI</span>
          </div>

          {/* Back to Home */}
          <div className="mb-4">
            <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-black">
              <ArrowLeft className="h-4 w-4 mr-2" /> {t('common.home', language)}
            </Link>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">
            {t('login.title', language)}
          </h2>
          <p className="text-center text-sm text-gray-600 mb-4">
            Sign in to access your dashboard
          </p>
          

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded text-xs mb-3">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                {t('login.email', language)}
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-gray-400 absolute top-2.5 left-3" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-200 bg-gray-50 focus:ring-1 focus:ring-black focus:border-black text-sm"
                  placeholder={t('login.email', language)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                {t('login.password', language)}
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-gray-400 absolute top-2.5 left-3" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-9 py-2 rounded-md border border-gray-200 bg-gray-50 focus:ring-1 focus:ring-black focus:border-black text-sm"
                  placeholder={t('login.password', language)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>


            {/* Forgot Password */}
            <div className="flex items-center justify-end text-sm">
              <a href="#" className="text-gray-600 hover:text-black">
                {t('login.forgotPassword', language)}
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md bg-black text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? t('login.loading', language) : t('login.loginButton', language)}
            </button>
          </form>

          {/* Google Sign-In Button */}
          <div className="mt-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2 px-4 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? t('login.loading', language) : t('login.google', language)}
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {t('login.noAccount', language)}{" "}
            <Link to="/register" className="text-black font-medium">
              {t('login.signUp', language)}
            </Link>
          </p>
          
          {/* Universal Login Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              This login works for all users: Regular users, Staff members, and Administrators
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
