import React, { useState, useEffect } from 'react'
import { Search, Filter, UserCheck, UserX, Eye, Users, UserCog, Building2, Shield, CheckCircle, XCircle, Mail } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'

const AdminUsers = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('users') // 'users' or 'staff'
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchStaff()
  }, [currentPage])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/admin/users?page=${currentPage}&limit=10&role=user`)
      if (response.data.success) {
        setUsers(response.data.data.users)
        setPagination(response.data.data.pagination)
      } else {
        setError('Failed to fetch users')
      }
    } catch (error) {
      console.error('Fetch users error:', error)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`/admin/users?role=staff`)
      if (response.data.success) {
        // Enhance staff data with center information
        const staffWithCenters = await Promise.all(
          response.data.data.users.map(async (staffMember) => {
            try {
              // Try to get center information
              const centersResponse = await axios.get('/api/centers/admin/all')
              if (centersResponse.data.success) {
                const associatedCenter = centersResponse.data.centers.find(
                  center => center.registeredBy && center.registeredBy._id === staffMember._id
                )
                return {
                  ...staffMember,
                  centerName: associatedCenter?.name || staffMember.name,
                  centerStatus: associatedCenter?.status || 'unknown'
                }
              }
              return staffMember
            } catch (error) {
              console.error('Error fetching center for staff:', error)
              return staffMember
            }
          })
        )
        setStaff(staffWithCenters)
      } else {
        console.error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Fetch staff error:', error)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await axios.patch(`/admin/users/${userId}/status`, {
        isActive: !currentStatus
      })
      
      if (response.data.success) {
        // Update in both users and staff arrays
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, isActive: !currentStatus }
            : user
        ))
        setStaff(staff.map(staffMember => 
          staffMember._id === userId 
            ? { ...staffMember, isActive: !currentStatus }
            : staffMember
        ))
      }
    } catch (error) {
      console.error('Toggle user status error:', error)
      alert('Failed to update user status')
    }
  }

  const approveStaff = async (userId) => {
    try {
      // Get the current user ID from the stored user data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const adminId = currentUser?.id || storedUser?.id;
      
      if (!adminId) {
        alert('Unable to identify admin user. Please log in again.');
        return;
      }

      console.log('Approving staff with admin ID:', adminId);
      
      const response = await axios.post(`/auth/admin/approve-staff/${userId}`, {
        adminId: adminId,
        notes: 'Approved via admin panel'
      })
      
      if (response.data.success) {
        // Refresh staff data
        fetchStaff()
        alert('Staff member approved successfully!')
      }
    } catch (error) {
      console.error('Approve staff error:', error)
      console.error('Error details:', error.response?.data)
      alert(`Failed to approve staff member: ${error.response?.data?.message || error.message}`)
    }
  }

  const rejectStaff = async (userId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    try {
      // Get the current user ID from the stored user data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const adminId = currentUser?.id || storedUser?.id;
      
      if (!adminId) {
        alert('Unable to identify admin user. Please log in again.');
        return;
      }

      console.log('Rejecting staff with admin ID:', adminId);
      
      const response = await axios.post(`/auth/admin/reject-staff/${userId}`, {
        adminId: adminId,
        reason: reason
      })
      
      if (response.data.success) {
        // Refresh staff data
        fetchStaff()
        alert('Staff member rejected successfully!')
      }
    } catch (error) {
      console.error('Reject staff error:', error)
      console.error('Error details:', error.response?.data)
      alert(`Failed to reject staff member: ${error.response?.data?.message || error.message}`)
    }
  }

  const viewUserDetails = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const sendEmail = (email) => {
    window.open(`mailto:${email}`, '_blank')
  }

  const currentData = activeTab === 'users' ? users : staff
  const filteredData = currentData.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && users.length === 0 && staff.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage customer accounts and staff permissions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCog className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Staff Members</p>
              <p className="text-2xl font-semibold text-gray-900">{staff.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter(u => u.isActive).length + staff.filter(s => s.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Building2 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">
                {staff.filter(s => s.approvalStatus === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Regular Users ({users.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'staff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <UserCog className="h-4 w-4 mr-2" />
                Staff Members ({staff.length})
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'users' ? 'users' : 'staff'} by name or email...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button className="btn-secondary flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Users/Staff Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'users' ? 'User' : 'Staff Member'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                {activeTab === 'staff' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        activeTab === 'staff' ? 'bg-purple-600' : 'bg-blue-600'
                      }`}>
                        {activeTab === 'staff' ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <span className="font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {user.name}
                          {user.role === 'admin' && (
                            <Shield className="h-4 w-4 ml-2 text-red-500" title="Admin" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user._id.slice(-6)} • Role: {user.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                  </td>
                  {activeTab === 'staff' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.centerName || user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.approvalStatus ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.approvalStatus === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : user.approvalStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.approvalStatus}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Deactivate/Activate */}
                      <button
                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                        className={`p-2 rounded-lg ${
                          user.isActive 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={user.isActive ? `Deactivate ${activeTab === 'staff' ? 'Staff' : 'User'}` : `Activate ${activeTab === 'staff' ? 'Staff' : 'User'}`}
                      >
                        {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>

                      {/* View Details */}
                      <button
                        onClick={() => viewUserDetails(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* User-specific: Send Email */}
                      {activeTab === 'users' && (
                        <button
                          onClick={() => sendEmail(user.email)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Send Email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      )}

                      {/* Staff-specific: Approve/Reject for pending staff */}
                      {activeTab === 'staff' && user.approvalStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => approveStaff(user._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approve Staff Registration"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => rejectStaff(user._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Reject Staff Registration"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              {activeTab === 'users' ? <Users className="h-12 w-12" /> : <UserCog className="h-12 w-12" />}
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab === 'users' ? 'users' : 'staff members'} found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? `No ${activeTab === 'users' ? 'users' : 'staff members'} match your search criteria.`
                : `No ${activeTab === 'users' ? 'users' : 'staff members'} have been registered yet.`
              }
            </p>
          </div>
        )}

        {/* Pagination - Only show for users tab */}
        {activeTab === 'users' && pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                  {' '}({pagination.totalUsers} total users)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeTab === 'staff' ? 'Staff Member Details' : 'User Details'}
                </h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Provider</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.provider || 'Local'}</p>
                    </div>
                  </div>
                </div>

                {/* Staff-specific information */}
                {activeTab === 'staff' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Center Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.centerName || 'Not assigned'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                        {selectedUser.approvalStatus ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedUser.approvalStatus === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : selectedUser.approvalStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedUser.approvalStatus}
                          </span>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500">Not available</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Center Status</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.centerStatus || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser._id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Joined Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Login</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.lastLogin 
                          ? new Date(selectedUser.lastLogin).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Never logged in'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => sendEmail(selectedUser.email)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </button>
                  {activeTab === 'staff' && selectedUser.approvalStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          approveStaff(selectedUser._id)
                          setShowUserModal(false)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          rejectStaff(selectedUser._id)
                          setShowUserModal(false)
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers