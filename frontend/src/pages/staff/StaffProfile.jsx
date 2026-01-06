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

const StaffProfile = () => {
  const [centerData, setCenterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

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
      // Mock data for development
      setCenterData({
        centerName: 'Akshaya Center - Kochi',
        address: {
          street: 'MG Road, Near Metro Station',
          city: 'Kochi',
          district: 'Ernakulam',
          state: 'Kerala',
          pincode: '682016'
        },
        contact: {
          phone: '+91 9876543210',
          email: 'kochi.center@sahayak.ai',
          website: 'www.sahayak-kochi.com'
        },
        operatingHours: {
          monday: { open: '09:00', close: '17:00', isOpen: true },
          tuesday: { open: '09:00', close: '17:00', isOpen: true },
          wednesday: { open: '09:00', close: '17:00', isOpen: true },
          thursday: { open: '09:00', close: '17:00', isOpen: true },
          friday: { open: '09:00', close: '17:00', isOpen: true },
          saturday: { open: '09:00', close: '17:00', isOpen: true },
          sunday: { open: '10:00', close: '16:00', isOpen: false }
        },
        stats: {
          totalAppointments: 1250,
          completedServices: 1180,
          avgRating: 4.8,
          totalCustomers: 890
        },
        services: [
          { name: 'Aadhaar Services', count: 450, revenue: 22500 },
          { name: 'PAN Card Services', count: 320, revenue: 35200 },
          { name: 'Passport Services', count: 180, revenue: 36000 },
          { name: 'Certificate Services', count: 230, revenue: 11500 }
        ],
        staffInfo: {
          name: 'Rajesh Kumar',
          role: 'Center Manager',
          joinDate: '2023-01-15',
          experience: '5 years'
        }
      });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  const data = editing ? editData : centerData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Center Profile</h1>
                  <p className="text-slate-300 text-sm">Manage your Akshaya center information</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {!editing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
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
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Appointments</p>
                <p className="text-2xl font-bold text-white">{data?.stats?.totalAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Completed Services</p>
                <p className="text-2xl font-bold text-white">{data?.stats?.completedServices}</p>
              </div>
              <Shield className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Average Rating</p>
                <p className="text-2xl font-bold text-white">{data?.stats?.avgRating}/5.0</p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Customers</p>
                <p className="text-2xl font-bold text-white">{data?.stats?.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Center Information */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Center Information</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Center Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Center Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={data?.centerName || ''}
                    onChange={(e) => updateEditData('centerName', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{data?.centerName}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Street</label>
                    {editing ? (
                      <input
                        type="text"
                        value={data?.address?.street || ''}
                        onChange={(e) => updateEditData('address.street', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-slate-300">{data?.address?.street}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">City</label>
                      {editing ? (
                        <input
                          type="text"
                          value={data?.address?.city || ''}
                          onChange={(e) => updateEditData('address.city', e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-300">{data?.address?.city}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Pincode</label>
                      {editing ? (
                        <input
                          type="text"
                          value={data?.address?.pincode || ''}
                          onChange={(e) => updateEditData('address.pincode', e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-300">{data?.address?.pincode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Contact Information</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {editing ? (
                      <input
                        type="text"
                        value={data?.contact?.phone || ''}
                        onChange={(e) => updateEditData('contact.phone', e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-slate-300">{data?.contact?.phone}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {editing ? (
                      <input
                        type="email"
                        value={data?.contact?.email || ''}
                        onChange={(e) => updateEditData('contact.email', e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-slate-300">{data?.contact?.email}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-slate-400" />
                    {editing ? (
                      <input
                        type="text"
                        value={data?.contact?.website || ''}
                        onChange={(e) => updateEditData('contact.website', e.target.value)}
                        placeholder="www.example.com"
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-slate-300">{data?.contact?.website || 'Not set'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours & Services */}
          <div className="space-y-8">
            
            {/* Operating Hours */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Operating Hours</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {Object.entries(data?.operatingHours || {}).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-slate-300 capitalize font-medium">{day}</span>
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
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Top Services</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {data?.services?.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{service.name}</p>
                        <p className="text-slate-400 text-sm">{service.count} completed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">₹{service.revenue.toLocaleString()}</p>
                        <p className="text-slate-400 text-xs">Revenue</p>
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