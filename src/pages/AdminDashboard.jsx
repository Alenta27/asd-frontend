import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaUsers, FaChartBar, FaTasks, FaCog, FaFileAlt, FaClipboardList, FaBell, FaSearch, FaSignOutAlt, FaCheckCircle, FaUserTie, FaTimes } from 'react-icons/fa';
import NotificationPanel from '../components/NotificationPanel';

const userBreakdownData = [
  { name: 'Parents', value: 15 },
  { name: 'Therapists', value: 14 },
  { name: 'Pending', value: 3 },
];

const COLORS = ['#87CEEB', '#FFB6D9', '#FFD700'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [stats, setStats] = useState({ pendingCount: 0, userCount: 0, screeningCount: 0 });
  const [screeningTrendsData, setScreeningTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/admin/metrics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        const result = await response.json();
        
        // Handle both new and legacy response formats
        const data = result.data || result;
        setStats({
          pendingCount: data.pendingApprovals || data.pendingCount || 0,
          userCount: data.totalActiveUsers || data.userCount || 0,
          screeningCount: data.screeningsThisMonth || data.screeningCount || 0
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message);
        // Fallback to zero values if API fails
        setStats({ pendingCount: 0, userCount: 0, screeningCount: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchScreeningTrends = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/admin/screening-trends', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch screening trends');
        const result = await response.json();
        
        // Handle new API format
        const trendsData = result.data || result.screeningCounts;
        
        if (Array.isArray(trendsData) && trendsData.length > 0) {
          // Check if it's the new format (array of objects) or old format (array of numbers)
          if (typeof trendsData[0] === 'object' && trendsData[0].month) {
            setScreeningTrendsData(trendsData);
          } else {
            // Legacy format fallback
            const months = ['August', 'September', 'October', 'November', 'December', 'January'];
            setScreeningTrendsData(
              trendsData.slice(0, 6).map((count, idx) => ({
                month: months[idx],
                screenings: count
              }))
            );
          }
        } else {
          // Fallback to empty data
          setScreeningTrendsData([
            { month: 'August', screenings: 0 },
            { month: 'September', screenings: 0 },
            { month: 'October', screenings: 0 },
            { month: 'November', screenings: 0 },
            { month: 'December', screenings: 0 },
            { month: 'January', screenings: 0 }
          ]);
        }
      } catch (err) {
        console.error('Error fetching screening trends:', err);
        // Fallback to empty data on error
        setScreeningTrendsData([
          { month: 'August', screenings: 0 },
          { month: 'September', screenings: 0 },
          { month: 'October', screenings: 0 },
          { month: 'November', screenings: 0 },
          { month: 'December', screenings: 0 },
          { month: 'January', screenings: 0 }
        ]);
      }
    };

    fetchScreeningTrends();
  }, []);

  const handleNavClick = (path, navItem) => {
    setActiveNav(navItem);
    navigate(path);
  };

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.clear();
    // Navigate to home page instead of login
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-blue-200 fixed left-0 top-0 h-screen shadow-lg p-6">
        {/* Logo */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-800">CORTEXA</h1>
          <p className="text-sm text-gray-600">Admin Portal</p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          <button
            onClick={() => handleNavClick('/admin/dashboard', 'dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'dashboard' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}
          >
            <FaChartBar className="text-xl" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleNavClick('/admin/users', 'users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'users' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}
          >
            <FaUsers className="text-xl" />
            <span>User Management</span>
          </button>

          <button
            onClick={() => handleNavClick('/admin/therapist-requests', 'therapist-requests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'therapist-requests' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}
          >
            <FaCheckCircle className="text-xl" />
            <span>Therapist Requests</span>
          </button>

          <button
            onClick={() => handleNavClick('/admin/children-data', 'children-data')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'children-data' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}
          >
            <FaUsers className="text-xl flex-shrink-0" />
            <span>Child Registration</span>
          </button>

          <button
            onClick={() => handleNavClick('/admin/screenings', 'screenings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'screenings' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}
          >
            <FaClipboardList className="text-xl" />
            <span>All Screenings</span>
          </button>

          <button
            onClick={() => handleNavClick('/admin/reports', 'reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'reports' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}
          >
            <FaFileAlt className="text-xl" />
            <span>Reports</span>
          </button>

          <button
            onClick={() => handleNavClick('/admin/settings', 'settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'settings' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}
          >
            <FaCog className="text-xl" />
            <span>Settings</span>
          </button>

          <hr className="my-6 border-blue-300" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-300 transition-colors"
          >
            <FaSignOutAlt className="text-xl" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm p-6 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-xl text-gray-600 hover:text-gray-800 relative transition-colors"
              >
                <FaBell />
                {stats.pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {stats.pendingCount}
                  </span>
                )}
              </button>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-400"></div>
          </div>
        </div>

        {/* Notification Panel */}
        {showNotifications && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowNotifications(false)}
            ></div>
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          </>
        )}

        {/* Welcome Banner */}
        <div className="p-8">
          <div className="bg-gradient-to-r from-pink-200 to-pink-100 rounded-2xl p-8 mb-8 shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Welcome, Admin</h3>
                <p className="text-gray-700 mb-6">Here's an overview of your system performance and pending actions.</p>
                <button 
                  onClick={() => handleNavClick('/admin/therapist-approvals', 'approvals')}
                  className="bg-pink-400 hover:bg-pink-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Review Pending Approvals
                </button>
              </div>
              <div className="text-6xl opacity-20">👋</div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Pending Approvals */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending Approvals</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{loading ? '--' : (stats.pendingCount || 0)}</p>
                </div>
                <FaCheckCircle className="text-3xl text-pink-400" />
              </div>
            </div>

            {/* Total Active Users */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Active Users</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{loading ? '--' : (stats.userCount || 0).toLocaleString()}</p>
                </div>
                <FaUsers className="text-3xl text-blue-400" />
              </div>
            </div>

            {/* Screenings This Month */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Screenings This Month</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">{loading ? '--' : (stats.screeningCount || 0)}</p>
                </div>
                <FaTasks className="text-3xl text-green-400" />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Screening Trends Chart */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Screening Trends: August - January</h3>
              <p className="text-sm text-gray-600 mb-4">Real-time screening data from database showing monthly trends.</p>
              <div className="flex flex-wrap gap-4 mb-6">
                {screeningTrendsData.map((data, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{data.month}:</span>
                    <span className="text-base font-semibold text-gray-800">{data.screenings}</span>
                  </div>
                ))}
                {screeningTrendsData.length === 0 && (
                  <span className="text-sm text-gray-400">No data available</span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={screeningTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" label={{ value: 'Number of Screenings', angle: -90, position: 'insideLeft' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="screenings" fill="#87CEEB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* User Breakdown Chart */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-2">User Breakdown</h3>
              <p className="text-sm text-gray-600 mb-4">This data reflects a beta phase environment with a nearly one-to-one ratio of parents and therapists.</p>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Parents:</span>
                  <span className="text-base font-semibold text-gray-800">15</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Therapists:</span>
                  <span className="text-base font-semibold text-gray-800">14</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Pending:</span>
                  <span className="text-base font-semibold text-gray-800">3</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={userBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {userBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
