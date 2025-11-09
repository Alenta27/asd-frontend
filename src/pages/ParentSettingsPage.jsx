import React, { useState } from 'react';
import { FaArrowLeft, FaCog, FaUser, FaBell, FaLock, FaSave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ParentSettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [formData, setFormData] = useState({
    parentName: 'John Doe',
    email: 'john.doe@email.com',
    phone: '(123) 456-7890',
    childName: 'Sammy',
    childDOB: '2020-05-15',
    emailReminders: true,
    pushNotifications: true,
    newReports: true,
    appointmentNotifications: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-200 shadow-lg flex flex-col overflow-hidden">
        <div className="p-6 border-b border-blue-300 flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 transition"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-blue-800">CORTEXA</h1>
            <p className="text-xs text-blue-600">ASD Detection & Support</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaCog /> Settings
          </h1>
          <p className="text-gray-600 text-sm mt-1">Manage your account and preferences</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="flex">
            {/* Tabs */}
            <div className="w-48 bg-white border-r border-gray-200 p-6">
              <div className="space-y-2">
                {[
                  { id: 'account', label: 'Account', icon: FaUser },
                  { id: 'notifications', label: 'Notifications', icon: FaBell },
                  { id: 'password', label: 'Password & Security', icon: FaLock },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'bg-blue-200 text-blue-900 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-auto">
              <div className="max-w-2xl">
                {/* Account Tab */}
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Parent Account</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Parent's Name</label>
                          <input
                            type="text"
                            name="parentName"
                            value={formData.parentName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Child's Profile</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Child's Name</label>
                          <input
                            type="text"
                            name="childName"
                            value={formData.childName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                          <input
                            type="date"
                            name="childDOB"
                            value={formData.childDOB}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification Preferences</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        <div>
                          <p className="font-semibold text-gray-800">Email Reminders</p>
                          <p className="text-sm text-gray-600">Receive email reminders for appointments</p>
                        </div>
                        <input
                          type="checkbox"
                          name="emailReminders"
                          checked={formData.emailReminders}
                          onChange={handleInputChange}
                          className="w-5 h-5 accent-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        <div>
                          <p className="font-semibold text-gray-800">Push Notifications</p>
                          <p className="text-sm text-gray-600">Receive push notifications on your device</p>
                        </div>
                        <input
                          type="checkbox"
                          name="pushNotifications"
                          checked={formData.pushNotifications}
                          onChange={handleInputChange}
                          className="w-5 h-5 accent-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        <div>
                          <p className="font-semibold text-gray-800">New Reports Available</p>
                          <p className="text-sm text-gray-600">Notify when new screening reports are ready</p>
                        </div>
                        <input
                          type="checkbox"
                          name="newReports"
                          checked={formData.newReports}
                          onChange={handleInputChange}
                          className="w-5 h-5 accent-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        <div>
                          <p className="font-semibold text-gray-800">Appointment Notifications</p>
                          <p className="text-sm text-gray-600">Reminder notifications for upcoming appointments</p>
                        </div>
                        <input
                          type="checkbox"
                          name="appointmentNotifications"
                          checked={formData.appointmentNotifications}
                          onChange={handleInputChange}
                          className="w-5 h-5 accent-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-4">
                        Password must be at least 8 characters long and contain a mix of letters and numbers.
                      </p>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="mt-8 px-6 py-3 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <FaSave /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentSettingsPage;
