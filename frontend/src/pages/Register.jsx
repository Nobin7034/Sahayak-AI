import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../data/translations";
import { Mail, Phone, Lock, Eye, EyeOff, User, ArrowLeft, MapPin, Building, Navigation } from "lucide-react";
import axios from 'axios';
import StaffRegistrationMap from '../components/map/StaffRegistrationMap';

const Register = () => {
  const [formData, setFormData] = useState({
    accountType: "user", // user or staff
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Staff-specific fields
    centerName: "",
    centerAddress: {
      street: "",
      city: "",
      district: "",
      state: "Kerala",
      pincode: ""
    },
    centerContact: {
      phone: "",
      email: ""
    },
    centerLocation: {
      latitude: "",
      longitude: ""
    }
  });
  const [errors, setErrors] = useState({});
  const [emailStatus, setEmailStatus] = useState({ checking: false, exists: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Staff registration specific states
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [registrationStep, setRegistrationStep] = useState(1); // 1: Center Details, 2: Credentials

  const { register } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Strict validation rules
  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
        if (formData.accountType === 'user') {
          if (!value.trim()) return "First name is required";
          if (value.length < 2) return "First name must be at least 2 characters";
          if (!/^[A-Za-z]+$/.test(value)) return "First name must contain only letters";
        }
        break;
      case "lastName":
        if (formData.accountType === 'user') {
          if (!value.trim()) return "Last name is required";
          if (value.length < 2) return "Last name must be at least 2 characters";
          if (!/^[A-Za-z]+$/.test(value)) return "Last name must contain only letters";
        }
        break;
      case "email":
        if (formData.accountType === 'user') {
          if (!value) return "Email is required";
          // Strict email regex
          if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
            return "Enter a valid email address (example: user@example.com)";
        }
        break;
      case "phone":
        if (formData.accountType === 'user') {
          if (!value) return "Phone number is required";
          if (!/^[0-9]{10}$/.test(value))
            return "Enter a valid 10-digit phone number";
        }
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
      // Staff-specific validations
      case "centerName":
        if (formData.accountType === 'staff' && !value.trim()) return "Center name is required";
        break;
      case "centerAddress.street":
        if (formData.accountType === 'staff' && !value.trim()) return "Street address is required";
        break;
      case "centerAddress.city":
        if (formData.accountType === 'staff' && !value.trim()) return "City is required";
        break;
      case "centerAddress.district":
        if (formData.accountType === 'staff' && !value.trim()) return "District is required";
        break;
      case "centerAddress.pincode":
        if (formData.accountType === 'staff') {
          if (!value.trim()) return "Pincode is required";
          if (!/^[0-9]{6}$/.test(value)) return "Enter a valid 6-digit pincode";
        }
        break;
      case "centerContact.phone":
        if (formData.accountType === 'staff') {
          if (!value.trim()) return "Center phone is required";
          if (!/^\+91[0-9]{10}$/.test(value)) return "Enter a valid phone number (+919876543210)";
        }
        break;
      case "centerContact.email":
        if (formData.accountType === 'staff') {
          if (!value.trim()) return "Center email is required";
          if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
            return "Enter a valid email address";
        }
        break;
      case "centerLocation.latitude":
        if (formData.accountType === 'staff') {
          if (!value || value.trim() === '') return "Please select a location on the map";
          const lat = parseFloat(value);
          if (isNaN(lat) || lat < -90 || lat > 90) return "Invalid latitude value";
        }
        break;
      case "centerLocation.longitude":
        if (formData.accountType === 'staff') {
          if (!value || value.trim() === '') return "Please select a location on the map";
          const lng = parseFloat(value);
          if (isNaN(lng) || lng < -180 || lng > 180) return "Invalid longitude value";
        }
        break;
      default:
        return "";
    }
    return "";
  };

  // Validate all fields before submit
  const validateAll = () => {
    let newErrors = {};
    
    // For user registration, validate personal fields
    if (formData.accountType === 'user') {
      ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword'].forEach((field) => {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      });
    }
    
    // For staff registration, validate all required fields
    if (formData.accountType === 'staff') {
      ['password', 'confirmPassword', 'centerName', 'centerAddress.street', 'centerAddress.city', 
       'centerAddress.district', 'centerAddress.pincode', 'centerContact.phone', 'centerContact.email',
       'centerLocation.latitude', 'centerLocation.longitude'].forEach((field) => {
        const error = validateField(field, getNestedValue(formData, field));
        if (error) newErrors[field] = error;
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Strict live validation on input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested object updates
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Update form data
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Validate this field live
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));

    // Live email existence check for both user and staff (center email) registration
    if ((name === 'email' && formData.accountType === 'user') || 
        (name === 'centerContact.email' && formData.accountType === 'staff')) {
      setEmailStatus((s) => ({ ...s, exists: false }));
    }
  };

  // Debounced email availability check for both user and staff registration
  useEffect(() => {
    let email = '';
    let fieldName = '';
    
    if (formData.accountType === 'user') {
      email = formData.email.trim();
      fieldName = 'email';
    } else if (formData.accountType === 'staff') {
      email = formData.centerContact.email.trim();
      fieldName = 'centerContact.email';
    }

    if (!email) {
      setEmailStatus({ checking: false, exists: false });
      return;
    }

    // Check only if email passes format validation
    if (validateField(fieldName, email)) {
      setEmailStatus({ checking: false, exists: false });
      return;
    }

    let active = true;
    setEmailStatus({ checking: true, exists: false });
    const t = setTimeout(async () => {
      try {
        // Use different endpoint for staff email checking
        const endpoint = formData.accountType === 'staff' ? '/auth/check-staff-email' : '/auth/check-email';
        const { data } = await axios.get(endpoint, { params: { email } });
        if (!active) return;
        setEmailStatus({ checking: false, exists: !!data?.exists });
        setErrors((prev) => ({ ...prev, [fieldName]: data?.exists ? 'Email already exists' : '' }));
      } catch (e) {
        if (!active) return;
        setEmailStatus({ checking: false, exists: false });
      }
    }, 400); // debounce 400ms

    return () => { active = false; clearTimeout(t); };
  }, [formData.email, formData.centerContact.email, formData.accountType]);

  // Handle location selection from map
  const handleLocationSelect = (latitude, longitude, addressInfo = null) => {
    setFormData(prev => ({
      ...prev,
      centerLocation: {
        latitude: latitude.toString(),
        longitude: longitude.toString()
      },
      // Auto-fill address fields if available from reverse geocoding
      ...(addressInfo && {
        centerAddress: {
          ...prev.centerAddress,
          street: addressInfo.street || prev.centerAddress.street,
          city: addressInfo.city || prev.centerAddress.city,
          district: addressInfo.district || prev.centerAddress.district,
          state: addressInfo.state || prev.centerAddress.state,
          pincode: addressInfo.pincode || prev.centerAddress.pincode
        }
      })
    }));

    // Store detected location for map restrictions
    if (addressInfo) {
      setDetectedLocation({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        ...addressInfo
      });
    }

    // Clear location-related errors
    setErrors(prev => ({
      ...prev,
      'centerLocation.latitude': '',
      'centerLocation.longitude': ''
    }));
  };

  // Handle step navigation for staff registration
  const handleStepNavigation = (step) => {
    if (step === 2) {
      // Validate only center details (not contact info) before moving to credentials step
      const centerFields = ['centerName', 'centerAddress.street', 'centerAddress.city', 
                           'centerAddress.district', 'centerAddress.pincode',
                           'centerLocation.latitude', 'centerLocation.longitude'];
      
      let stepErrors = {};
      centerFields.forEach(field => {
        const value = getNestedValue(formData, field);
        const error = validateField(field, value);
        if (error) stepErrors[field] = error;
      });
      
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }
    
    setRegistrationStep(step);
  };

  // Helper function to get nested object values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || '';
  };

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
      const fieldName = formData.accountType === 'user' ? 'email' : 'centerContact.email';
      setErrors((prev) => ({ ...prev, [fieldName]: 'Email already exists' }));
      return;
    }

    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        if (result.requiresApproval) {
          // Staff registration - show approval message
          setErrors({ 
            general: result.message || "Staff registration submitted successfully. Your account is pending admin approval." 
          });
          // Don't navigate, let user see the message
        } else {
          // User registration - navigate to dashboard
          navigate("/dashboard");
        }
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
        <div className={`w-full px-8 py-12 ${formData.accountType === 'staff' ? 'max-w-2xl' : 'max-w-md'}`}>
          {/* Back to Home */}
          <div className="mb-4">
            <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-black">
              <ArrowLeft className="h-4 w-4 mr-2" /> {t('common.home', language)}
            </Link>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {formData.accountType === 'staff' ? 'Staff Registration' : t('register.title', language)}
          </h2>

          {errors.general && (
            <div className={`px-4 py-3 rounded-lg mb-4 ${
              errors.general.includes('pending approval') || errors.general.includes('submitted successfully')
                ? 'bg-green-50 border border-green-200 text-green-600'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Account Type
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.accountType === 'user' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="user"
                    checked={formData.accountType === 'user'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <User className="h-5 w-5 mr-2" />
                  <div>
                    <div className="font-medium">User</div>
                    <div className="text-xs text-gray-500">Access services</div>
                  </div>
                </label>
                
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.accountType === 'staff' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="staff"
                    checked={formData.accountType === 'staff'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Building className="h-5 w-5 mr-2" />
                  <div>
                    <div className="font-medium">Staff</div>
                    <div className="text-xs text-gray-500">Manage center</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Personal Information - Only for User Registration */}
            {formData.accountType === 'user' && (
              <>
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
              </>
            )}

            {/* Staff Registration Note */}
            {formData.accountType === 'staff' && registrationStep === 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <Navigation className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800">
                      <strong>Enhanced Location Detection:</strong> We'll automatically detect your location and provide an interactive map to precisely set your Akshaya center location.
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Complete center details first, then set your login credentials in the next step.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Password Fields - Only for User Registration */}
            {formData.accountType === 'user' && (
              <>
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
              </>
            )}

            {/* Staff-specific fields */}
            {formData.accountType === 'staff' && (
              <>
                {/* Step Progress Indicator */}
                <div className="border-t pt-5">
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-2 ${registrationStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          registrationStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          1
                        </div>
                        <span className="text-sm font-medium">Center Details</span>
                      </div>
                      <div className={`w-8 h-0.5 ${registrationStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                      <div className={`flex items-center space-x-2 ${registrationStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          registrationStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          2
                        </div>
                        <span className="text-sm font-medium">Credentials</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Center Details */}
                  {registrationStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Akshaya Center Details</h3>
                  
                  {/* Center Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Center Name *
                    </label>
                    <div className="relative mt-1">
                      <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="centerName"
                        value={formData.centerName}
                        onChange={handleChange}
                        placeholder="Enter center name"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                          errors.centerName ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                      />
                    </div>
                    {errors.centerName && (
                      <p className="text-red-500 text-sm mt-1">{errors.centerName}</p>
                    )}
                  </div>

                  {/* Center Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="centerAddress.street"
                        value={formData.centerAddress.street}
                        onChange={handleChange}
                        placeholder="Street address"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                          errors['centerAddress.street'] ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                      />
                      {errors['centerAddress.street'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['centerAddress.street']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        City *
                      </label>
                      <input
                        type="text"
                        name="centerAddress.city"
                        value={formData.centerAddress.city}
                        onChange={handleChange}
                        placeholder="City"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                          errors['centerAddress.city'] ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                      />
                      {errors['centerAddress.city'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['centerAddress.city']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        District *
                      </label>
                      <input
                        type="text"
                        name="centerAddress.district"
                        value={formData.centerAddress.district}
                        onChange={handleChange}
                        placeholder="District"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                          errors['centerAddress.district'] ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                      />
                      {errors['centerAddress.district'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['centerAddress.district']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="centerAddress.pincode"
                        value={formData.centerAddress.pincode}
                        onChange={handleChange}
                        placeholder="6-digit pincode"
                        pattern="[0-9]{6}"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                          errors['centerAddress.pincode'] ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                      />
                      {errors['centerAddress.pincode'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['centerAddress.pincode']}</p>
                      )}
                    </div>
                  </div>



                      {/* Interactive Map for Location Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Center Location *
                        </label>
                        <StaffRegistrationMap
                          selectedLocation={formData.centerLocation}
                          onLocationSelect={handleLocationSelect}
                          detectedLocation={detectedLocation}
                          restrictedRadius={5000} // 5km radius
                        />
                        {(errors['centerLocation.latitude'] || errors['centerLocation.longitude']) && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors['centerLocation.latitude'] || errors['centerLocation.longitude']}
                          </p>
                        )}
                      </div>

                      {/* Step Navigation */}
                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => handleStepNavigation(2)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                        >
                          Next: Set Credentials
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Credentials */}
                  {registrationStep === 2 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Login Credentials</h3>
                      
                      {/* Email (Username) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email (Username) *
                        </label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            name="centerContact.email"
                            value={formData.centerContact.email}
                            onChange={handleChange}
                            placeholder="your.email@example.com"
                            className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                              errors['centerContact.email'] ? "border-red-500" : emailStatus.exists ? 'border-red-500' : "border-gray-300"
                            }`}
                            required
                          />
                          {/* Email checking status */}
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            {emailStatus.checking && (
                              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                        {errors['centerContact.email'] && (
                          <p className="text-red-500 text-sm mt-1">{errors['centerContact.email']}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">This email will be used as your login username</p>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Phone Number *
                        </label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            name="centerContact.phone"
                            value={formData.centerContact.phone}
                            onChange={handleChange}
                            placeholder="+919876543210"
                            pattern="^\+91[0-9]{10}$"
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                              errors['centerContact.phone'] ? "border-red-500" : "border-gray-300"
                            }`}
                            required
                          />
                        </div>
                        {errors['centerContact.phone'] && (
                          <p className="text-red-500 text-sm mt-1">{errors['centerContact.phone']}</p>
                        )}
                      </div>

                      {/* Step Navigation */}
                      <div className="flex justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setRegistrationStep(1)}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
                        >
                          Back: Center Details
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}

            {/* Password Fields for Staff Registration - Only in Step 2 */}
            {formData.accountType === 'staff' && registrationStep === 2 && (
              <>
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password *
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
                      required
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
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password *
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
                      required
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

                {/* Registration Note */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your staff account will be pending approval until reviewed by an administrator. 
                    Once approved, your Akshaya center will become active and visible to users.
                  </p>
                </div>
              </>
            )}

            {/* Submit Button - Show for user registration or staff step 2 */}
            {(formData.accountType === 'user' || (formData.accountType === 'staff' && registrationStep === 2)) && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? t('register.loading', language) : t('register.registerButton', language)}
              </button>
            )}
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
