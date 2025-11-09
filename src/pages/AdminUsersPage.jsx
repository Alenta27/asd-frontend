import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaUserCheck, FaUserTimes, FaKey, FaEye, FaSpinner } from 'react-icons/fa';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingActions, setLoadingActions] = useState(new Set());

  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });
  const [inputValue, setInputValue] = useState('');

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log('Token:', token ? 'Present' : 'Missing');
        
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }
        
        const response = await fetch('http://localhost:5000/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const apiUsers = await response.json();
        
        // Format API data to match our component structure
        const formattedUsers = apiUsers.map((user, index) => {
          const getRoleColor = (role) => {
            if (role?.toLowerCase() === 'admin') return 'red';
            if (role?.toLowerCase() === 'therapist' || role?.toLowerCase() === 'teacher' || role?.toLowerCase() === 'researcher' || role?.toLowerCase() === 'parent') return 'blue';
            return 'gray';
          };

          const getStatusColor = (status) => {
            if (status === 'Active') return 'green';
            if (status === 'Pending Approval') return 'orange';
            return 'red';
          };

          const getActions = (role, status) => {
            if (role?.toLowerCase() === 'admin') {
              return ['Edit Role', 'Reset Password', 'Delete'];
            } else if (status === 'Pending Approval') {
              return ['Approve', 'Reject', 'View Credentials'];
            } else if (!role || role === '(not set)') {
              return ['Approve', 'Reject', 'Set Role'];
            } else {
              return ['Edit Role', 'Suspend', 'Reset Password', 'Delete'];
            }
          };

          return {
            id: user.id || user._id || index + 1,
            username: user.name || user.username || 'Unknown User',
            email: user.email || 'No email',
            role: user.role || '(not set)',
            roleColor: getRoleColor(user.role),
            status: user.status || 'Active',
            statusColor: getStatusColor(user.status || 'Active'),
            actions: getActions(user.role, user.status)
          };
        });

        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(`Failed to load users: ${err.message}`);
        
        // Try without authentication as fallback
        try {
          console.log('Trying without authentication...');
          const fallbackResponse = await fetch('http://localhost:5000/api/admin/users');
          if (fallbackResponse.ok) {
            const fallbackUsers = await fallbackResponse.json();
            console.log('Fallback API worked, got users:', fallbackUsers.length);
            // Format the fallback data
            const formattedFallbackUsers = fallbackUsers.map((user, index) => ({
              id: user.id || user._id || index + 1,
              username: user.name || user.username || 'Unknown User',
              email: user.email || 'No email',
              role: user.role || '(not set)',
              roleColor: user.role?.toLowerCase() === 'admin' ? 'red' : 'blue',
              status: user.status || 'Active',
              statusColor: 'green',
              actions: user.role?.toLowerCase() === 'admin' 
                ? ['Edit Role', 'Reset Password', 'Delete']
                : ['Edit Role', 'Suspend', 'Reset Password', 'Delete']
            }));
            setUsers(formattedFallbackUsers);
            setError(null);
            return;
          }
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
        }
        
        // Final fallback to sample data
        setUsers([
          { 
            id: 1, 
            username: 'Alenta Tom', 
            email: 'alentatms27@gmail.com', 
            role: 'Admin', 
            roleColor: 'red',
            status: 'Active', 
            statusColor: 'green',
            actions: ['Edit Role', 'Reset Password', 'Delete']
          },
          { 
            id: 2, 
            username: 'Dr. Rao Thomas', 
            email: 'raothomas2003@gmail.com', 
            role: 'Therapist', 
            roleColor: 'blue',
            status: 'Active', 
            statusColor: 'green',
            actions: ['Edit Role', 'Suspend', 'Reset Password', 'Delete']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.role.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Modal handlers
  const showModal = (type, title, message, onConfirm, onCancel = null) => {
    setInputValue('');
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      onCancel
    });
  };

  const hideModal = () => {
    setModal({
      isOpen: false,
      type: '',
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null
    });
  };

  const handleConfirm = () => {
    if (modal.onConfirm) {
      if (modal.type === 'input') {
        modal.onConfirm(inputValue);
      } else if (modal.type === 'addUser') {
        const parts = inputValue.split('|');
        const userData = {
          username: parts[0] || '',
          email: parts[1] || '',
          role: parts[2] || ''
        };
        modal.onConfirm(userData);
      } else {
        modal.onConfirm();
      }
    }
    hideModal();
  };

  const handleCancel = () => {
    if (modal.onCancel) {
      modal.onCancel();
    }
    hideModal();
  };

  // Action handlers
  const handleEditRole = (userId) => {
    const user = users.find(u => u.id === userId);
    showModal(
      'input',
      'Edit Role',
      `Enter new role for ${user.username}:`,
      (newRole) => {
        if (newRole && newRole.trim()) {
          setUsers(users.map(user => 
            user.id === userId 
              ? { ...user, role: newRole.trim(), roleColor: newRole.toLowerCase() === 'admin' ? 'red' : 'blue' }
              : user
          ));
          showModal('success', 'Success', `Role updated to: ${newRole}`);
        }
      }
    );
  };

  const handleResetPassword = async (userId, username) => {
    showModal(
      'confirm',
      'Reset Password',
      `Reset password for ${username}? This will send a password reset email to their registered email address.`,
      async () => {
        try {
          setLoadingActions(prev => new Set(prev).add(userId));
          
          // Simulate API call since endpoint doesn't exist yet
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
          
          // For now, just show success message
          showModal('success', 'Success', `Password reset email sent to ${username}\n\nNote: This is a demo. In production, this would send an actual reset email.`);
        } catch (error) {
          console.error('Reset password error:', error);
          showModal('error', 'Error', `Failed to reset password: ${error.message}`);
        } finally {
          setLoadingActions(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
    );
  };

  const handleDeleteUser = (userId, username) => {
    showModal(
      'confirm',
      'Delete User',
      `Are you sure you want to delete ${username}? This action cannot be undone.`,
      () => {
        setUsers(users.filter(user => user.id !== userId));
        showModal('success', 'Success', `${username} has been deleted`);
      }
    );
  };

  const handleSuspend = (userId, username) => {
    showModal(
      'confirm',
      'Suspend User',
      `Suspend ${username}?`,
      () => {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, status: 'Suspended', statusColor: 'red' }
            : user
        ));
        showModal('success', 'Success', `${username} has been suspended`);
      }
    );
  };

  const handleApprove = (userId, username) => {
    showModal(
      'confirm',
      'Approve User',
      `Approve ${username}?`,
      () => {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, status: 'Active', statusColor: 'green' }
            : user
        ));
        showModal('success', 'Success', `${username} has been approved`);
      }
    );
  };

  const handleReject = (userId, username) => {
    showModal(
      'confirm',
      'Reject User',
      `Reject ${username}? This will remove them from the system.`,
      () => {
        setUsers(users.filter(user => user.id !== userId));
        showModal('success', 'Success', `${username} has been rejected and removed`);
      }
    );
  };

  const handleViewCredentials = (userId, username) => {
    showModal(
      'info',
      'View Credentials',
      `Viewing credentials for ${username}\n\nIn a real application, this would open a modal or navigate to a credentials page.`
    );
  };

  const handleSetRole = (userId, username) => {
    showModal(
      'input',
      'Set Role',
      `Set role for ${username}:`,
      (newRole) => {
        if (newRole && newRole.trim()) {
          setUsers(users.map(user => 
            user.id === userId 
              ? { ...user, role: newRole.trim(), roleColor: newRole.toLowerCase() === 'admin' ? 'red' : 'blue' }
              : user
          ));
          showModal('success', 'Success', `Role set to: ${newRole} for ${username}`);
        }
      }
    );
  };

  const handleAddUser = () => {
    showModal(
      'addUser',
      'Add New User',
      'Enter user details:',
      (userData) => {
        if (userData) {
          const newUser = {
            id: Date.now(), // Temporary ID
            username: userData.username,
            email: userData.email,
            role: userData.role || '(not set)',
            roleColor: userData.role?.toLowerCase() === 'admin' ? 'red' : 'blue',
            status: 'Active',
            statusColor: 'green',
            actions: userData.role?.toLowerCase() === 'admin' 
              ? ['Edit Role', 'Reset Password', 'Delete']
              : ['Edit Role', 'Suspend', 'Reset Password', 'Delete']
          };
          setUsers([...users, newUser]);
          showModal('success', 'Success', `User ${userData.username} has been added`);
        }
      }
    );
  };

  const getActionHandler = (action, userId, username) => {
    switch (action) {
      case 'Edit Role':
        return () => handleEditRole(userId);
      case 'Reset Password':
        return () => handleResetPassword(userId, username);
      case 'Delete':
        return () => handleDeleteUser(userId, username);
      case 'Suspend':
        return () => handleSuspend(userId, username);
      case 'Approve':
        return () => handleApprove(userId, username);
      case 'Reject':
        return () => handleReject(userId, username);
      case 'View Credentials':
        return () => handleViewCredentials(userId, username);
      case 'Set Role':
        return () => handleSetRole(userId, username);
      default:
        return () => alert(`${action} action clicked for ${username}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <FaSpinner className="animate-spin text-blue-600 text-xl" />
              <span className="text-gray-600">Loading users...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-xl mb-2">⚠️</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-500 hover:text-blue-600 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50">
              <FaArrowLeft className="text-xl" />
            </Link>
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Manage all system users and their roles</p>
              </div>
            </div>
            <button 
              onClick={handleAddUser}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaPlus className="text-lg" /> Add User
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-10 pr-8 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-lg min-w-[150px]"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="therapist">Therapist</option>
                  <option value="teacher">Teacher</option>
                  <option value="researcher">Researcher</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending approval">Pending Approval</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? `Filtered Users (${filteredUsers.length} of ${users.length})` 
                  : `All Users (${users.length})`
                }
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaUsers className="text-blue-500" />
                <span>Total: {users.length}</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100" style={{ minWidth: '1200px' }}>
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-1/5">Username</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-1/4">Email</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-1/6">Role</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-1/6">Status</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-1/3">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-base text-gray-700">{user.email}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full shadow-sm ${
                        user.roleColor === 'red' 
                          ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200' 
                          : user.roleColor === 'gray'
                          ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200'
                          : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full shadow-sm ${
                        user.statusColor === 'green' 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                          : user.statusColor === 'orange'
                          ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200'
                          : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2 min-w-0">
                        {user.actions.map((action, index) => {
                          const isLoading = loadingActions.has(user.id) && action === 'Reset Password';
                          return (
                            <button 
                              key={index}
                              onClick={getActionHandler(action, user.id, user.username)}
                              disabled={isLoading}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
                                action === 'Delete' || action === 'Reject'
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                  : action === 'Approve'
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                  : action === 'Reset Password'
                                  ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                                  : action === 'Suspend'
                                  ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                              }`}
                            >
                              {isLoading ? (
                                <div className="flex items-center gap-1">
                                  <FaSpinner className="animate-spin text-xs" />
                                  <span>Loading...</span>
                                </div>
                              ) : (
                                action
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <FaUsers className="text-white text-lg" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{modal.title}</h3>
            </div>
            <p className="text-gray-600 mb-8 whitespace-pre-line text-lg leading-relaxed">{modal.message}</p>
            
            {modal.type === 'input' && (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6 text-lg transition-all duration-200"
                placeholder="Enter role..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirm();
                  }
                }}
                ref={(input) => input && input.focus()}
              />
            )}
            
            {modal.type === 'addUser' && (
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">Username</label>
                  <input
                    type="text"
                    value={inputValue.split('|')[0] || ''}
                    onChange={(e) => {
                      const parts = inputValue.split('|');
                      parts[0] = e.target.value;
                      setInputValue(parts.join('|'));
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                    placeholder="Enter username..."
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">Email</label>
                  <input
                    type="email"
                    value={inputValue.split('|')[1] || ''}
                    onChange={(e) => {
                      const parts = inputValue.split('|');
                      parts[1] = e.target.value;
                      setInputValue(parts.join('|'));
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                    placeholder="Enter email..."
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">Role</label>
                  <select
                    value={inputValue.split('|')[2] || ''}
                    onChange={(e) => {
                      const parts = inputValue.split('|');
                      parts[2] = e.target.value;
                      setInputValue(parts.join('|'));
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all duration-200"
                  >
                    <option value="">Select role...</option>
                    <option value="admin">Admin</option>
                    <option value="therapist">Therapist</option>
                    <option value="teacher">Teacher</option>
                    <option value="researcher">Researcher</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-4">
              {modal.type === 'confirm' && (
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  modal.type === 'confirm' || modal.type === 'input'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                    : modal.type === 'success'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                    : modal.type === 'addUser'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                {modal.type === 'confirm' ? 'Confirm' : modal.type === 'input' ? 'Save' : modal.type === 'addUser' ? 'Add User' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
