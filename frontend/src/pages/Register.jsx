import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../data/translations";
import { Mail, Phone, Lock, Eye, EyeOff, User, ArrowLeft } from "lucide-react";
import axios from 'axios'

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [emailStatus, setEmailStatus] = useState({ checking: false, exists: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Strict validation rules
  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required";
        if (value.length < 2) return "First name must be at least 2 characters";
        if (!/^[A-Za-z]+$/.test(value)) return "First name must contain only letters";
        break;
      case "lastName":
        if (!value.trim()) return "Last name is required";
        if (value.length < 2) return "Last name must be at least 2 characters";
        if (!/^[A-Za-z]+$/.test(value)) return "Last name must contain only letters";
        break;
      case "email":
        if (!value) return "Email is required";
        // Strict email regex
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
          return "Enter a valid email address (example: user@example.com)";
        break;
      case "phone":
        if (!value) return "Phone number is required";
        if (!/^[0-9]{10}$/.test(value))
          return "Enter a valid 10-digit phone number";
        break;
      case "password":
        if (!value) return "Password is required";
        if (
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value
          )
        ) {
          return "Password must be min 8 chars, include uppercase, lowercase, number & special char";
        }
        break;
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        break;
      default:
        return "";
    }
    return "";
  };

  // Validate all fields before submit
  const validateAll = () => {
    let newErrors = {};
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Strict live validation on input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate this field live
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));

    // Live email existence check (debounced via setTimeout in separate effect)
    if (name === 'email') {
      setEmailStatus((s) => ({ ...s, exists: false }));
    }
  };

  // Debounced email availability check
  useEffect(() => {
    const email = formData.email.trim();
    if (!email) {
      setEmailStatus({ checking: false, exists: false });
      return;
    }

    // Check only if email passes format validation
    if (validateField('email', email)) {
      setEmailStatus({ checking: false, exists: false });
      return;
    }

    let active = true;
    setEmailStatus({ checking: true, exists: false });
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/auth/check-email`, { params: { email } });
        if (!active) return;
        setEmailStatus({ checking: false, exists: !!data?.exists });
        setErrors((prev) => ({ ...prev, email: data?.exists ? 'Email already exists' : '' }));
      } catch (e) {
        if (!active) return;
        setEmailStatus({ checking: false, exists: false });
      }
    }, 400); // debounce 400ms

    return () => { active = false; clearTimeout(t); };
  }, [formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    // Extra safety: ensure passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    // Block submit if email exists
    if (emailStatus.exists) {
      setErrors((prev) => ({ ...prev, email: 'Email already exists' }));
      return;
    }

    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setErrors({ general: result.error || "Registration failed" });
      }
    } catch (err) {
      setErrors({ general: "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex-col justify-center px-12">
        <h1 className="text-4xl font-bold mb-4">Sahayak AI</h1>
        <p className="text-lg mb-6">
          Automating Akshaya services in Kerala. View required documents, service details,
          and office locators — anywhere, anytime.
        </p>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <p className="italic">
            “Sahayak AI makes government services easier by guiding citizens
            with the right documents and information. A step towards digital
            Kerala.”
          </p>
          <span className="block mt-4 font-semibold">Team Sahayak AI</span>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center">
        <div className="max-w-md w-full px-8 py-12">
          {/* Back to Home */}
          <div className="mb-4">
            <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-black">
              <ArrowLeft className="h-4 w-4 mr-2" /> {t('common.home', language)}
            </Link>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {t('register.title', language)}
          </h2>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.email ? "border-red-500" : emailStatus.exists ? 'border-red-500' : "border-gray-300"
                  }`}
                />
                {/* Right-side status icon */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {emailStatus.checking && (
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  )}
                </div>
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? t('register.loading', language) : t('register.registerButton', language)}
            </button>
          </form>



          <p className="mt-6 text-center text-sm text-gray-600">
            {t('register.alreadyHaveAccount', language)}{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-blue-500"
            >
              {t('register.signIn', language)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
