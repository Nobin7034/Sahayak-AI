import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Lock,
  User,
  Mail,
  Phone,
  Globe,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useStaffTheme } from '../../contexts/StaffThemeContext';

const StaffSettings = () => {
  const { theme } = useStaffTheme();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
      appointmentReminders: true,
      serviceUpdates: true
    },
    account: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    preferences: {
      language: 'en',
      timezone: 'Asia/Kolkata'
    }
  });

  // Theme-based classes
  const themeClasses = {
    light: {
      background: 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50',
      card: 'bg-white/80 backdrop-blur-sm border-gray-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      input: 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500',
      button: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      },
      toggle: {
        active: 'bg-blue-600',
        inactive: 'bg-gray-300'
      }
    },
    dark: {
      background: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
      card: 'bg-slate-800/50 backdrop-blur-sm border-slate-700',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400'
      },
      input: 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500',
      button: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300'
      },
      toggle: {
        active: 'bg-blue-600',
        inactive: 'bg-slate-600'
      }
    }
  };

  const currentTheme = themeClasses[theme];

  const handleNotificationToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handlePasswordChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      account: {
        ...prev.account,
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? currentTheme.toggle.active : currentTheme.toggle.inactive
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      {/* Header */}
      <div className={`${currentTheme.card} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${currentTheme.text.primary}`}>Settings</h1>
                <p className={`${currentTheme.text.secondary} text-sm`}>Manage your account preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          
          {/* Notification Settings */}
          <div className={`${currentTheme.card} rounded-2xl border`}>
            <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}>
              <div className="flex items-center space-x-3">
                <Bell className={`h-5 w-5 ${currentTheme.text.secondary}`} />
                <h2 className={`text-lg font-semibold ${currentTheme.text.primary}`}>Notifications</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${currentTheme.text.primary}`}>Email Notifications</p>
                  <p className={`text-sm ${currentTheme.text.tertiary}`}>Receive notifications via email</p>
                </div>
                <ToggleSwitch
                  enabled={settings.notifications.email}
                  onChange={() => handleNotificationToggle('email')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${currentTheme.text.primary}`}>SMS Notifications</p>
                  <p className={`text-sm ${currentTheme.text.tertiary}`}>Receive notifications via SMS</p>
                </div>
                <ToggleSwitch
                  enabled={settings.notifications.sms}
                  onChange={() => handleNotificationToggle('sms')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${currentTheme.text.primary}`}>Push Notifications</p>
                  <p className={`text-sm ${currentTheme.text.tertiary}`}>Receive push notifications</p>
                </div>
                <ToggleSwitch
                  enabled={settings.notifications.push}
                  onChange={() => handleNotificationToggle('push')}
                />
              </div>

              <div className={`border-t ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'} pt-4 mt-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${currentTheme.text.primary}`}>Appointment Reminders</p>
                    <p className={`text-sm ${currentTheme.text.tertiary}`}>Get reminders for upcoming appointments</p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.notifications.appointmentReminders}
                    onChange={() => handleNotificationToggle('appointmentReminders')}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${currentTheme.text.primary}`}>Service Updates</p>
                  <p className={`text-sm ${currentTheme.text.tertiary}`}>Receive updates about services</p>
                </div>
                <ToggleSwitch
                  enabled={settings.notifications.serviceUpdates}
                  onChange={() => handleNotificationToggle('serviceUpdates')}
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className={`${currentTheme.card} rounded-2xl border`}>
            <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}>
              <div className="flex items-center space-x-3">
                <Lock className={`h-5 w-5 ${currentTheme.text.secondary}`} />
                <h2 className={`text-lg font-semibold ${currentTheme.text.primary}`}>Security</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.secondary} mb-2`}>
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={settings.account.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={`w-full ${currentTheme.input} rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2`}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${currentTheme.text.tertiary} hover:${currentTheme.text.secondary}`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.secondary} mb-2`}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={settings.account.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`w-full ${currentTheme.input} rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${currentTheme.text.tertiary} hover:${currentTheme.text.secondary}`}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.secondary} mb-2`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={settings.account.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className={`w-full ${currentTheme.input} rounded-lg px-3 py-2 focus:outline-none focus:ring-2`}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className={`${currentTheme.card} rounded-2xl border`}>
            <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}>
              <div className="flex items-center space-x-3">
                <Globe className={`h-5 w-5 ${currentTheme.text.secondary}`} />
                <h2 className={`text-lg font-semibold ${currentTheme.text.primary}`}>Preferences</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.secondary} mb-2`}>
                  Language
                </label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, language: e.target.value }
                  }))}
                  className={`w-full ${currentTheme.input} rounded-lg px-3 py-2 focus:outline-none focus:ring-2`}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ml">Malayalam</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.secondary} mb-2`}>
                  Timezone
                </label>
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, timezone: e.target.value }
                  }))}
                  className={`w-full ${currentTheme.input} rounded-lg px-3 py-2 focus:outline-none focus:ring-2`}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className={`flex items-center space-x-2 ${currentTheme.button.primary} px-6 py-3 rounded-lg transition-colors disabled:opacity-50`}
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSettings;
