import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Phone, Shield, Calendar, Clock, Save, Edit3, KeyRound, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <Icon className="w-4 h-4 text-gray-500 mt-0.5" />
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-800 font-medium">{value || '-'} </div>
    </div>
  </div>
)

const Profile = () => {
  const { user: ctxUser } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('overview') // overview | edit | security
  const [form, setForm] = useState({ name: '', phone: '', avatar: '' })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' })
  const [message, setMessage] = useState({ type: '', text: '' })

  // Fetch fresh user details
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await axios.get('/auth/me')
        if (res.data.success) {
          setUser(res.data.user)
          setForm({
            name: res.data.user.name || '',
            phone: res.data.user.phone || '',
            avatar: res.data.user.avatar || ''
          })
        }
      } catch (e) {
        console.error('Failed to load profile', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const joined = useMemo(() => (user?.createdAt ? new Date(user.createdAt) : null), [user])
  const lastLogin = useMemo(() => (user?.lastLogin ? new Date(user.lastLogin) : null), [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setMessage({ type: '', text: '' })
      const res = await axios.put('/auth/me', form)
      if (res.data.success) {
        setUser(res.data.user)
        // Also refresh localStorage user if present
        try {
          const stored = localStorage.getItem('user')
          if (stored) {
            const merged = { ...JSON.parse(stored), ...res.data.user }
            localStorage.setItem('user', JSON.stringify(merged))
          }
        } catch {}
        setMessage({ type: 'success', text: 'Profile updated successfully.' })
        setTab('overview')
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Update failed' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Update failed' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!pwd.currentPassword || !pwd.newPassword) {
      setMessage({ type: 'error', text: 'Please fill both password fields.' })
      return
    }
    try {
      setSaving(true)
      setMessage({ type: '', text: '' })
      const res = await axios.put('/auth/me/password', pwd)
      if (res.data.success) {
        setPwd({ currentPassword: '', newPassword: '' })
        setMessage({ type: 'success', text: 'Password updated successfully.' })
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Password update failed' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Password update failed' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">View and manage your account details</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className="flex items-start gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm">{message.text}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar card */}
          <div className="card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-xl">{(user?.name || '?').charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{user?.name}</div>
                <div className="text-sm text-gray-500">{user?.role?.toUpperCase()}</div>
              </div>
            </div>
            <div className="space-y-3">
              <InfoRow icon={Mail} label="Email" value={user?.email} />
              <InfoRow icon={Phone} label="Phone" value={user?.phone} />
              <InfoRow icon={Shield} label="Provider" value={user?.provider === 'google' ? 'Google' : 'Local'} />
              <InfoRow icon={Calendar} label="Member since" value={joined ? joined.toLocaleDateString() : '-'} />
              <InfoRow icon={Clock} label="Last login" value={lastLogin ? lastLogin.toLocaleString() : '-'} />
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2">
              <button onClick={() => setTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'overview' ? 'bg-primary text-white' : 'border'}`}>Overview</button>
              <button onClick={() => setTab('edit')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'edit' ? 'bg-primary text-white' : 'border'}`}>Edit Profile</button>
              <button onClick={() => setTab('security')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'security' ? 'bg-primary text-white' : 'border'}`}>Security</button>
            </div>

            {/* Overview */}
            {tab === 'overview' && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Account Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoRow icon={User} label="Full Name" value={user?.name} />
                  <InfoRow icon={Mail} label="Email" value={user?.email} />
                  <InfoRow icon={Phone} label="Phone" value={user?.phone || 'Not set'} />
                  <InfoRow icon={Shield} label="Role" value={user?.role} />
                  <InfoRow icon={Calendar} label="Joined" value={joined ? joined.toLocaleString() : '-'} />
                  <InfoRow icon={Clock} label="Last Login" value={lastLogin ? lastLogin.toLocaleString() : '-'} />
                </div>
              </div>
            )}

            {/* Edit Profile */}
            {tab === 'edit' && (
              <form onSubmit={handleSaveProfile} className="card p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Full Name</label>
                    <input
                      type="text"
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <input
                      type="tel"
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Your phone number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">Avatar URL</label>
                    <input
                      type="url"
                      className="mt-1 w-full border rounded-lg px-3 py-2"
                      value={form.avatar}
                      onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary inline-flex items-center">
                    <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setTab('overview')} className="px-4 py-2 border rounded-lg inline-flex items-center">
                    <Edit3 className="w-4 h-4 mr-2" /> Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Security */}
            {tab === 'security' && (
              <div className="card p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Security</h2>
                {user?.provider === 'local' ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Current Password</label>
                        <input
                          type="password"
                          className="mt-1 w-full border rounded-lg px-3 py-2"
                          value={pwd.currentPassword}
                          onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">New Password</label>
                        <input
                          type="password"
                          className="mt-1 w-full border rounded-lg px-3 py-2"
                          value={pwd.newPassword}
                          onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary inline-flex items-center">
                      <KeyRound className="w-4 h-4 mr-2" /> {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    Password is managed by your Google account. To change it, update your Google Account password.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile