import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaCog, FaUsers, FaLock, FaBell, FaDatabase, FaCheckCircle, FaSpinner, FaDownload, FaTrash, FaCogs } from 'react-icons/fa';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    systemName: 'ASD Screening System',
    maxUsers: 1000,
    emailNotifications: true,
    autoBackup: true,
    dataRetention: 365,
    riskThreshold: 70,
    reportGeneration: 'automatic'
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [savedStatus, setSavedStatus] = useState(null);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSavedStatus(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Simulate saving to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSavedStatus('success');
      setTimeout(() => setSavedStatus(null), 3000);
    } catch (error) {
      setSavedStatus('error');
      setTimeout(() => setSavedStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      setActionLoading('backup');
      // Simulate backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Database backup completed successfully!');
    } catch (error) {
      alert('Failed to backup database');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearOldData = async () => {
    if (!window.confirm(`This will delete data older than ${settings.dataRetention} days. This action cannot be undone. Continue?`)) return;

    try {
      setActionLoading('clear');
      // Simulate clearing data
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Old data cleared successfully!');
    } catch (error) {
      alert('Failed to clear old data');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOptimizeDatabase = async () => {
    try {
      setActionLoading('optimize');
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Database optimization completed!');
    } catch (error) {
      alert('Failed to optimize database');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-800 transition-colors">
              <FaArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
              <p className="text-gray-600">Configure system-wide settings and preferences</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Save Status Notification */}
        {savedStatus && (
          <div className={`mb-8 p-4 rounded-lg flex items-center gap-3 ${
            savedStatus === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            <FaCheckCircle className="text-xl" />
            <span className="font-semibold">
              {savedStatus === 'success' ? 'Settings saved successfully!' : 'Failed to save settings'}
            </span>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaCog className="text-blue-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">General Settings</h2>
                <p className="text-sm text-gray-600">Configure basic system parameters</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">System Name</label>
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => handleSettingChange('systemName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Maximum Users</label>
                <input
                  type="number"
                  value={settings.maxUsers}
                  onChange={(e) => handleSettingChange('maxUsers', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-green-600">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-green-100 p-3 rounded-lg">
                <FaUsers className="text-green-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <p className="text-sm text-gray-600">Control risk assessment and report generation</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Risk Assessment Threshold (%)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.riskThreshold}
                    onChange={(e) => handleSettingChange('riskThreshold', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-bold w-12 text-center">
                    {settings.riskThreshold}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Threshold for high-risk classification</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Report Generation</label>
                <select
                  value={settings.reportGeneration}
                  onChange={(e) => handleSettingChange('reportGeneration', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                >
                  <option value="automatic">🤖 Automatic</option>
                  <option value="manual">✋ Manual</option>
                  <option value="scheduled">⏰ Scheduled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-red-600">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-red-100 p-3 rounded-lg">
                <FaLock className="text-red-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Security & Privacy</h2>
                <p className="text-sm text-gray-600">Manage data protection and backup policies</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Data Retention Period (days)</label>
                <input
                  type="number"
                  value={settings.dataRetention}
                  onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
                <p className="text-sm text-gray-600 mt-2">Data older than this period will be archived</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoBackup"
                  checked={settings.autoBackup}
                  onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                  className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="autoBackup" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Enable Automatic Backup (Recommended)
                </label>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-yellow-600">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FaBell className="text-yellow-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
                <p className="text-sm text-gray-600">Control notification preferences</p>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-center gap-3">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="emailNotifications" className="text-sm font-semibold text-gray-700 cursor-pointer">
                Enable Email Notifications for Therapist Requests and System Alerts
              </label>
            </div>
          </div>

          {/* Database Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaDatabase className="text-purple-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-800">Database Management</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Backup Button */}
              <button
                onClick={handleBackupDatabase}
                disabled={actionLoading === 'backup'}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                {actionLoading === 'backup' ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Backing up...
                  </>
                ) : (
                  <>
                    <FaDownload />
                    Backup Database
                  </>
                )}
              </button>

              {/* Clear Data Button */}
              <button
                onClick={handleClearOldData}
                disabled={actionLoading === 'clear'}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                {actionLoading === 'clear' ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <FaTrash />
                    Clear Old Data
                  </>
                )}
              </button>

              {/* Optimize Button */}
              <button
                onClick={handleOptimizeDatabase}
                disabled={actionLoading === 'optimize'}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                {actionLoading === 'optimize' ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <FaCogs />
                    Optimize Database
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              💡 <strong>Tip:</strong> Backup your database regularly to prevent data loss. Clear old data to optimize performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
