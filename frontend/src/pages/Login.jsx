import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "user",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(
        formData.email,
        formData.password,
        formData.role
      );
      if (result.success) {
        if (formData.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credResp) => {
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/google', {
        credential: credResp.credential
      });
      if (data?.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        if (formData.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError('Google sign-in failed');
      }
    } catch (e) {
      console.error(e);
      setError('Google sign-in failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side with Background + Quote */}
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
            You can get everything you want if you work hard, trust the process,
            and stick to the plan.
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

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-500 mb-8 text-center">
            Enter your email and password to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded text-xs">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Email
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
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Password
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
                  placeholder="Enter your password"
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

            {/* Role Selection */}
            <div>
              <span className="block text-xs font-medium text-gray-700 mb-1">
                Select Role
              </span>
              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={formData.role === "user"}
                    onChange={handleChange}
                    className="text-black focus:ring-black"
                  />
                  User
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === "admin"}
                    onChange={handleChange}
                    className="text-black focus:ring-black"
                  />
                  Admin
                </label>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                Remember me
              </label>
              <a href="#" className="text-gray-600 hover:text-black">
                Forgot Password
              </a>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md bg-black text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Google Button */}
          <div className="mt-4">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google sign-in failed')} useOneTap />
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don’t have an account?{" "}
            <Link to="/register" className="text-black font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
