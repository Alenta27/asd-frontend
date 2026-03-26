import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  FaUsers, FaChartBar, FaTasks, FaCog, FaFileAlt, FaClipboardList,
  FaBell, FaSearch, FaSignOutAlt, FaCheckCircle, FaSyncAlt,
  FaUserCircle, FaCaretDown, FaTimes
} from 'react-icons/fa';
import NotificationPanel from '../components/NotificationPanel';

const COLORS = ['#87CEEB', '#FFB6D9', '#6EE7B7', '#FCD34D', '#C4B5FD'];
const API_BASE = 'http://localhost:5000/api/admin';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // ── Nav / UI state ──────────────────────────────────────────────────────────
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ── Dashboard data ──────────────────────────────────────────────────────────
  const [stats, setStats] = useState({ pendingCount: 0, userCount: 0, screeningCount: 0 });
  const [screeningTrendsData, setScreeningTrendsData] = useState([]);
  const [userBreakdownData, setUserBreakdownData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [breakdownLoading, setBreakdownLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // ── Search state ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);   // null = closed
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  // ── Profile menu ref (close on outside click) ────────────────────────────────
  const profileRef = useRef(null);

  // ── Auth helper ──────────────────────────────────────────────────────────────
  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  // ── Close dropdowns on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Search ───────────────────────────────────────────────────────────────────
  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    clearTimeout(searchTimer.current);

    if (!q.trim()) {
      setSearchResults(null);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, {
          headers: authHeaders()
        });
        if (res.ok) {
          const json = await res.json();
          setSearchResults(json.data || { users: [], children: [], screenings: [] });
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const totalSearchResults = searchResults
    ? (searchResults.users?.length || 0) + (searchResults.children?.length || 0) + (searchResults.screenings?.length || 0)
    : 0;

  // ── Metrics ──────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/metrics`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();
      const data = result.data || result;
      setStats({
        pendingCount: data.pendingApprovals ?? data.pendingCount ?? 0,
        userCount: data.totalActiveUsers ?? data.userCount ?? 0,
        screeningCount: data.screeningsThisMonth ?? data.screeningCount ?? 0
      });
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Screening Trends ──────────────────────────────────────────────────────────
  const fetchScreeningTrends = useCallback(async () => {
    try {
      setTrendsLoading(true);
      const response = await fetch(`${API_BASE}/screening-trends`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch screening trends');
      const result = await response.json();
      const trendsData = result.data || result.screeningCounts;

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const generateFallback = () => {
        const fallback = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(currentYear, currentMonth - i, 1);
          fallback.push({ month: monthNames[d.getMonth()], screenings: 0 });
        }
        return fallback;
      };

      if (Array.isArray(trendsData) && trendsData.length > 0) {
        if (typeof trendsData[0] === 'object' && trendsData[0].month) {
          setScreeningTrendsData(trendsData);
        } else {
          const fallback = generateFallback();
          setScreeningTrendsData(
            trendsData.slice(0, 6).map((count, idx) => ({ month: fallback[idx].month, screenings: count }))
          );
        }
      } else {
        setScreeningTrendsData(generateFallback());
      }
    } catch (err) {
      console.error('Error fetching screening trends:', err);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const fallback = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        fallback.push({ month: monthNames[d.getMonth()], screenings: 0 });
      }
      setScreeningTrendsData(fallback);
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  // ── User Breakdown ────────────────────────────────────────────────────────────
  const fetchUserBreakdown = useCallback(async () => {
    try {
      setBreakdownLoading(true);
      const response = await fetch(`${API_BASE}/user-breakdown`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch user breakdown');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setUserBreakdownData(result.data);
      }
    } catch (err) {
      console.error('Error fetching user breakdown:', err);
    } finally {
      setBreakdownLoading(false);
    }
  }, []);

  // ── Initial load + auto-refresh ───────────────────────────────────────────────
  useEffect(() => {
    fetchStats();
    fetchScreeningTrends();
    fetchUserBreakdown();

    const interval = setInterval(() => {
      fetchStats();
      fetchScreeningTrends();
      fetchUserBreakdown();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchScreeningTrends, fetchUserBreakdown]);

  const handleManualRefresh = () => {
    setLoading(true);
    setTrendsLoading(true);
    setBreakdownLoading(true);
    fetchStats();
    fetchScreeningTrends();
    fetchUserBreakdown();
  };

  const handleNavClick = (path, navItem) => {
    setActiveNav(navItem);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      <div className="w-64 bg-blue-200 fixed left-0 top-0 h-screen shadow-lg p-6">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-800">CORTEXA</h1>
          <p className="text-sm text-gray-600">Admin Portal</p>
        </div>

        <nav className="space-y-2">
          <button onClick={() => handleNavClick('/admin/dashboard', 'dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'dashboard' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}>
            <FaChartBar className="text-xl" /><span>Dashboard</span>
          </button>

          <button onClick={() => handleNavClick('/admin/users', 'users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'users' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}>
            <FaUsers className="text-xl" /><span>User Management</span>
          </button>

          <button onClick={() => handleNavClick('/admin/therapist-requests', 'therapist-requests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'therapist-requests' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}>
            <FaCheckCircle className="text-xl" /><span>Therapist Requests</span>
          </button>

          <button onClick={() => handleNavClick('/admin/children-data', 'children-data')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'children-data' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}>
            <FaUsers className="text-xl flex-shrink-0" /><span>Child Registration</span>
          </button>

          <button onClick={() => handleNavClick('/admin/screenings', 'screenings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'screenings' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}>
            <FaClipboardList className="text-xl" /><span>All Screenings</span>
          </button>

          <button onClick={() => handleNavClick('/admin/reports', 'reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'reports' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}>
            <FaFileAlt className="text-xl" /><span>Reports</span>
          </button>

          <button onClick={() => handleNavClick('/admin/settings', 'settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === 'settings' ? 'bg-white text-blue-600 font-semibold' : 'text-gray-700 hover:bg-blue-300'}`}>
            <FaCog className="text-xl" /><span>Settings</span>
          </button>

          <hr className="my-6 border-blue-300" />

          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-300 transition-colors">
            <FaSignOutAlt className="text-xl" /><span>Logout</span>
          </button>
        </nav>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 ml-64 overflow-auto">

        {/* ── Top Header Bar ── */}
        <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          {/* Title block */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 leading-tight">CORTEXA Admin Dashboard</h2>
            <p className="text-xs text-gray-500 mt-0.5">Monitor users, screenings, and platform activity.</p>
          </div>

          <div className="flex items-center gap-5">
            {/* Manual refresh */}
            <button
              onClick={handleManualRefresh}
              title="Refresh dashboard data"
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <FaSyncAlt className={`text-base ${(loading || trendsLoading || breakdownLoading) ? 'animate-spin' : ''}`} />
            </button>

            {/* ── Search bar ── */}
            <div className="relative" ref={searchRef}>
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInput}
                placeholder="Search users, children, screenings…"
                className="pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}

              {/* Search results dropdown */}
              {searchQuery && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {searchLoading ? (
                    <div className="p-4 text-center text-sm text-gray-400 animate-pulse">Searching…</div>
                  ) : totalSearchResults === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">No results found for <strong>"{searchQuery}"</strong></div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">

                      {/* Users */}
                      {searchResults?.users?.length > 0 && (
                        <div>
                          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">Users</div>
                          {searchResults.users.map(u => (
                            <button
                              key={u._id}
                              onClick={() => { navigate('/admin/users'); clearSearch(); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username}
                                  </p>
                                  <p className="text-xs text-gray-500">{u.email}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'therapist' ? 'bg-purple-100 text-purple-600' :
                                  u.role === 'parent' ? 'bg-blue-100 text-blue-600' :
                                    u.role === 'teacher' ? 'bg-green-100 text-green-600' :
                                      'bg-gray-100 text-gray-600'
                                  }`}>{u.role}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Children */}
                      {searchResults?.children?.length > 0 && (
                        <div>
                          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">Children</div>
                          {searchResults.children.map(c => (
                            <button
                              key={c._id}
                              onClick={() => { navigate('/admin/children-data'); clearSearch(); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors"
                            >
                              <p className="text-sm font-medium text-gray-800">
                                {c.childName || c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown'}
                              </p>
                              {c.age && <p className="text-xs text-gray-500">Age: {c.age} · {c.gender || '—'}</p>}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Screenings */}
                      {searchResults?.screenings?.length > 0 && (
                        <div>
                          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">Screenings</div>
                          {searchResults.screenings.map(s => (
                            <button
                              key={s._id}
                              onClick={() => { navigate('/admin/screenings'); clearSearch(); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-800">{s.screeningType}</p>
                                {s.result && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.result?.toLowerCase().includes('asd') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                    }`}>{s.result}</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Notification Bell ── */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-xl text-gray-500 hover:text-gray-800 relative transition-colors"
                title="Notifications"
              >
                <FaBell />
                {stats.pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {stats.pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* ── Profile Avatar + Dropdown ── */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 focus:outline-none group"
                title="Profile menu"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow">
                  <FaUserCircle className="text-white text-lg" />
                </div>
                <FaCaretDown className={`text-gray-400 text-xs transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <button
                    onClick={() => { navigate('/admin/settings'); setShowProfileMenu(false); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    <FaUserCircle className="text-blue-400" /> View Profile
                  </button>
                  <button
                    onClick={() => { navigate('/admin/settings'); setShowProfileMenu(false); }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    <FaCog className="text-gray-400" /> Admin Settings
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FaSignOutAlt className="text-red-400" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Notification Panel Overlay ── */}
        {showNotifications && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-40 z-40"
              onClick={() => setShowNotifications(false)}
            />
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          </>
        )}

        {/* ── Page Body ── */}
        <div className="p-8">

          {/* Welcome / System Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 shadow-md text-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold mb-1">CORTEXA Admin Dashboard</h3>
                <p className="text-blue-100 text-sm mb-6">Monitor users, screenings, and platform activity in real time.</p>
                <button
                  onClick={() => handleNavClick('/admin/therapist-requests', 'therapist-requests')}
                  className="bg-white text-blue-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm shadow"
                >
                  Review Pending Approvals
                </button>
              </div>
              <div className="text-right text-xs text-blue-200 self-end">
                {lastRefreshed && (
                  <span>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending Approvals</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">
                    {loading ? <span className="text-2xl text-gray-400 animate-pulse">--</span> : stats.pendingCount}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Therapist accounts awaiting review</p>
                </div>
                <FaCheckCircle className="text-3xl text-pink-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Active Users</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">
                    {loading ? <span className="text-2xl text-gray-400 animate-pulse">--</span> : stats.userCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Approved users across all roles</p>
                </div>
                <FaUsers className="text-3xl text-blue-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Screenings This Month</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">
                    {loading ? <span className="text-2xl text-gray-400 animate-pulse">--</span> : stats.screeningCount}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Across all screening modules</p>
                </div>
                <FaTasks className="text-3xl text-green-400" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Screening Trends */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xl font-bold text-gray-800">Screening Trends</h3>
                {trendsLoading && <span className="text-xs text-gray-400 animate-pulse">Refreshing…</span>}
              </div>
              <p className="text-sm text-gray-500 mb-4">Monthly screened counts across all modules — live from database.</p>

              <div className="flex flex-wrap gap-3 mb-5">
                {screeningTrendsData.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">{d.month}:</span>
                    <span className="text-sm font-semibold text-gray-700">{d.screenings}</span>
                  </div>
                ))}
                {screeningTrendsData.length === 0 && (
                  <span className="text-sm text-gray-400">No data yet — screenings will appear here as modules complete.</span>
                )}
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={screeningTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" allowDecimals={false}
                    label={{ value: 'Screenings', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                  <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="screenings" fill="#87CEEB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* User Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xl font-bold text-gray-800">User Breakdown</h3>
                {breakdownLoading && <span className="text-xs text-gray-400 animate-pulse">Refreshing…</span>}
              </div>
              <p className="text-sm text-gray-500 mb-4">Live count of registered users by role from the database.</p>

              <div className="flex flex-wrap gap-3 mb-5">
                {userBreakdownData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-500">{d.name}:</span>
                    <span className="text-sm font-semibold text-gray-700">{d.value}</span>
                  </div>
                ))}
                {userBreakdownData.length === 0 && !breakdownLoading && (
                  <span className="text-sm text-gray-400">No users found.</span>
                )}
              </div>

              {userBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={userBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {userBreakdownData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-300 text-sm">
                  {breakdownLoading ? 'Loading user data…' : 'No user data available'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
