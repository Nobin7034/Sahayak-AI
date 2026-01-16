import React, { useState, useEffect } from 'react';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Clock,
  Edit,
  Save,
  X,
  Camera,
  Star,
  Users,
  Calendar,
  Settings,
  Globe,
  Shield
} from 'lucide-react';
import axios from 'axios';
import { useStaffTheme } from '../../contexts/StaffThemeContext';

const StaffProfile = () => {
  const [centerData, setCenterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const { theme } = useStaffTheme();

  // Theme-based classes
  const themeClasses = {
    light: {
      background: 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50',
      card: 'bg-white/80 backdrop-blur-sm border-gray-200',
      cardSolid: 'bg-white border-gray-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      input: 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500',
      button: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        cancel: 'bg-gray-500 hover:bg-gray-600 text-white',
        success: 'bg-green-600 hover:bg-green-700 text-white'
      }
    },
    dark: {
      background: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
      card: 'bg-slate-800/50 backdrop-blur-sm border-slate-700',
      cardSolid: 'bg-slate-800 border-slate-700',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400'
      },
      input: 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500',
      button: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300',
        cancel: 'bg-slate-600 hover:bg-slate-700 text-white',
        success: 'bg-green-600 hover:bg-green-700 text-white'
      }
    }
  };

  const currentTheme = themeClasses[theme];

  useEffect(() => {
    loadCenterProfile();
  }, []);

  const loadCenterProfile = async () => {
    try {
      const response = await axios.get('/api/staff/center-profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setCenterData(response.data.data);
      }
    } catch (error) {
      console.error('Profile load error:', error);
      // Show error message instead of mock data
      setCenterData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditData({ ...centerData });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put('/api/staff/center-profile', editData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setCenterData(editData);
        setEditing(false);
      }
    } catch (error) {
      console.error('Save error:', error);
      // For demo, just update locally
      setCenterData(editData);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({});
    setEditing(false);
  };

  const updateEditData = (path, value) => {
    const keys = path.split('.');
    const newData = { ...editData };
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setEditData(newData);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className={`mt-4 ${currentTheme.text.secondary}`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!centerData) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="text-center">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h2 className={`text-xl font-semibold ${currentTheme.text.primary} mb-2`}>Failed to Load Profile</h2>
          <p className={`${currentTheme.text.secondary} mb-4`}>Unable to fetch center profile data</p>
          <button
            onClick={loadCenterProfile}
            className={`${currentTheme.button.primary} px-4 py-2 rounded-lg transition-colors`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const data = editing ? editData : centerData;

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      {/* Header */}
      <div className={`${currentTheme.card} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${currentTheme.text.primary}`}>Center Profile</h1>
                  <p className={`${currentTheme.text.secondary} text-sm`}>Manage your Akshaya center information</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {!editing ? (
                  <button
                    onClick={handleEdit}
                    className={`flex items-center space-x-2 ${currentTheme.button.primary} px-4 py-2 rounded-lg transition-colors`}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCancel}
                      className={`flex items-center space-x-2 ${currentTheme.button.cancel} px-4 py-2 rounded-lg transition-colors`}
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`flex items-center space-x-2 ${currentTheme.button.success} px-4 py-2 rounded-lg transition-colors disabled:opacity-50`}
                    >
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${currentTheme.card} rounded-2xl p-6 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${currentTheme.text.tertiary} text-sm`}>Total Appointments</p>
                <p className={`text-2xl font-bold ${currentTheme.text.primary}`}>{data?.stats?.totalAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className={`${currentTheme.card} rounded-2xl p-6 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${currentTheme.text.tertiary} text-sm`}>Completed Services</p>
                <p className={`text-2xl font-bold ${currentTheme.text.primary}`}>{data?.stats?.completedServices}</p>
              </div>
              <Shield className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className={`${currentTheme.card} rounded-2xl p-6 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${currentTheme.text.tertiary} text-sm`}>Average Rating</p>
                <p className={`text-2xl font-bold ${currentTheme.text.primary}`}>{data?.stats?.avgRating}/5.0</p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className={`${currentTheme.card} rounded-2xl p-6 border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${currentTheme.text.tertiary} text-sm`}>Total Customers</p>
                <p className={`text-2xl font-bold ${currentTheme.text.primary}`}>{data?.stats?.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Center Information */}
          <div className={`${currentTheme.card} rounded-2xl border`}>
            <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}>
              <h2 className={`text-lg font-semibold ${currentTheme.text.primary}`}>Center Information</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Center Name */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.secondary} mb-2`}>Center Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={data?.centerName || ''}
                    onChange={(e) => updateEditData('centerName', e.target.value)}
                    className={`w-full ${currentTheme.input} rounded-lg px-3 py-2 focus:outline-none focus:ring-2`}
                  />
                ) : (
                  <p className={currentTheme.text.primary}>{data?.centerName}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.secondary} mb-2`}>Address</label>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs ${currentTheme.text.tertiary} mb-1`}>Street</label>
                    {editing ? (
                      <input
                        type="text"
                        value={data?.address?.street || ''}
                        onChange={(e) => updateEditData('address.street', e.target.value)}
                        className={`w-full ${currentTheme.input} rounded-lg px-3 py-2 focus:outline-none focus:ring-2`}
                      />
                    ) : (
                      <p className={currentTheme.text.secondary}>{data?.address?.street}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-xs ${currentTheme.text.tertiary} mb-1`}>City</label>
                    {editing ? (
                      <input
                        type="text"
                        value={data?.address?.city || ''}
                        onChange={(e) => updateEditData('address.city', e.target.value)}
                        className={`w-full ${currentTheme.input} rounded-lg px-3 py-2 focus:outline-none focus:ring-2`}
                      />
                    ) : (
                      <p className={currentTheme.text.secondary}>{data?.address?.city}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.secondary} mb-2`}>Contact Information</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className={`h-4 w-4 ${currentTheme.text.tertiary}`} />
                    {editing ? (
                      <input
                        type="text"
                        value={data?.contact?.phone || ''}
                        onChange={(e) => updateEditData('contact.phone', e.target.value)}
                        className={`flex-1 ${currentTheme.input} rounded-lg px-3 py-2 focus:outline-none focus:ring-2`}
                      />
                    ) : (
                      <span className={currentTheme.text.secondary}>{data?.contact?.phone}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className={`h-4 w-4 ${currentTheme.text.tertiary}`} />
                    {editing ? (
                      <input
                        type="email"
                        value={data?.contact?.email || ''}
                        onChange={(e) => updateEditData('contact.email', e.target.value)}
                        className={`flex-1 ${currentTheme.input} rounded-lg px-3 py-2 focus:outline-none focus:ring-2`}
                      />
                    ) : (
                      <span className={currentTheme.text.secondary}>{data?.contact?.email}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Globe className={`h-4 w-4 ${currentTheme.text.tertiary}`} />
                    {editing ? (
                      <input
                        type="text"
                        value={data?.contact?.website || ''}
                        onChange={(e) => updateEditData('contact.website', e.target.value)}
                        placeholder="www.example.com"
                        className={`flex-1 ${currentTheme.input} rounded-lg px-3 py-2 focus:outline-none focus:ring-2`}
                      />
                    ) : (
                      <span className={currentTheme.text.secondary}>{data?.contact?.website || 'Not set'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours & Services */}
          <div className="space-y-8">
            
            {/* Operating Hours */}
            <div className={`${currentTheme.card} rounded-2xl border`}>
              <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}>
                <h2 className={`text-lg font-semibold ${currentTheme.text.primary}`}>Operating Hours</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {Object.entries(data?.operatingHours || {}).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className={`${currentTheme.text.secondary} capitalize font-medium`}>{day}</span>
                      <div className="flex items-center space-x-2">
                        {hours.isOpen ? (
                          <span className="text-green-400">{hours.open} - {hours.close}</span>
                        ) : (
                          <span className="text-red-400">Closed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Services */}
            <div className={`${currentTheme.card} rounded-2xl border`}>
              <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}>
                <h2 className={`text-lg font-semibold ${currentTheme.text.primary}`}>Top Services</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {data?.services?.map((service, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-700/30'} rounded-lg`}>
                      <div>
                        <p className={`${currentTheme.text.primary} font-medium`}>{service.name}</p>
                        <p className={`${currentTheme.text.tertiary} text-sm`}>{service.count} completed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">₹{service.revenue.toLocaleString()}</p>
                        <p className={`${currentTheme.text.tertiary} text-xs`}>Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;