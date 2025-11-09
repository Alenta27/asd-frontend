import React, { useState } from 'react';
import { FaHome, FaCalendar, FaChartLine, FaFileAlt, FaUserTie, FaBook, FaCog, FaBell, FaSearch, FaPlus, FaDownload, FaChartBar, FaPenAlt, FaVideo } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const mockGoalsProgress = [
  { id: 1, name: 'Social Interaction', progress: 65, color: 'from-blue-400 to-blue-600' },
  { id: 2, name: 'Communication', progress: 75, color: 'from-green-400 to-green-600' },
  { id: 3, name: 'Sensory Response', progress: 50, color: 'from-purple-400 to-purple-600' },
  { id: 4, name: 'Motor Skills', progress: 80, color: 'from-yellow-400 to-yellow-600' },
];

const mockTherapistReports = [
  {
    id: 1,
    title: 'Quarterly Speech Report',
    provider: 'Ms. Kim Lee',
    date: '15 Oct 2025',
    file: 'speech-report-q3.pdf',
  },
  {
    id: 2,
    title: 'Occupational Therapy Progress',
    provider: 'Dr. Maria Lopez',
    date: '12 Oct 2025',
    file: 'ot-progress-oct.pdf',
  },
  {
    id: 3,
    title: 'Behavioral Assessment Update',
    provider: 'Dr. James Wilson',
    date: '08 Oct 2025',
    file: 'behavioral-update.pdf',
  },
];

const mockParentObservations = [
  {
    id: 1,
    date: '28 Oct 2025',
    title: 'Great day at school!',
    observation: 'Sammy played with another child for the first time today without prompting. Very proud moment!',
    tags: ['social', 'school'],
  },
  {
    id: 2,
    date: '25 Oct 2025',
    title: 'New word learned',
    observation: 'Started saying "more" when he wants more food. Huge progress in communication!',
    tags: ['communication', 'milestone'],
  },
];

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FaHome },
  { id: 'appointments', label: 'Appointments', icon: FaCalendar },
  { id: 'screening', label: 'Screening Results', icon: FaChartLine },
  { id: 'reports', label: 'Progress Reports', icon: FaFileAlt },
  { id: 'care-team', label: 'Care Team', icon: FaUserTie },
  { id: 'resources', label: 'Resources', icon: FaBook },
  { id: 'settings', label: 'Settings', icon: FaCog },
];

const ProgressReportsPage = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('reports');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const parentName = localStorage.getItem('token')
    ? JSON.parse(atob(localStorage.getItem('token').split('.')[1])).email?.split('@')[0] || 'Parent'
    : 'Parent';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-200 shadow-lg flex flex-col">
        <div className="p-6 border-b border-blue-300">
          <h1 className="text-2xl font-bold text-blue-800">CORTEXA</h1>
          <p className="text-xs text-blue-600 mt-1">ASD Detection & Support</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  if (item.id === 'dashboard') navigate('/dashboard');
                  else if (item.id === 'appointments') navigate('/appointments');
                  else if (item.id === 'screening') navigate('/screening-center');
                  else if (item.id === 'reports') navigate('/progress-reports');
                  else if (item.id === 'care-team') navigate('/care-team');
                  else if (item.id === 'resources') navigate('/resources-library');
                  else if (item.id === 'settings') navigate('/settings');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeNav === item.id
                    ? 'bg-blue-300 text-blue-900 font-semibold shadow-md'
                    : 'text-blue-700 hover:bg-blue-250'
                }`}
              >
                <Icon className="text-blue-600" size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-300">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 bg-red-300 text-red-900 px-4 py-2 rounded-lg hover:bg-red-400 transition font-semibold"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Progress Reports & Milestones</h1>
              <p className="text-gray-500 text-sm mt-1">Track long-term development and therapy goals</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <FaBell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-300 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                P
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            {/* Goals Timeline */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Goals Timeline</h2>
                <FaChartBar className="text-blue-400 text-2xl" />
              </div>

              <div className="space-y-6">
                {mockGoalsProgress.map((goal) => (
                  <div key={goal.id}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-800">{goal.name}</span>
                      <span className="font-bold text-blue-600">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${goal.color} transition-all duration-500`}
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Therapist Reports */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Therapist Reports</h2>
              <div className="space-y-4">
                {mockTherapistReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-800">{report.title}</p>
                      <p className="text-sm text-gray-600">{report.provider} • {report.date}</p>
                    </div>
                    <button className="px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm inline-flex items-center gap-2">
                      <FaDownload /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Parent's Log / Observations */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Your Observations Log</h2>
                <button className="px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm inline-flex items-center gap-2">
                  <FaPlus /> Add New Observation
                </button>
              </div>

              <div className="space-y-4">
                {mockParentObservations.map((obs) => (
                  <div key={obs.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">{obs.title}</p>
                        <p className="text-xs text-gray-500">{obs.date}</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800">
                        <FaPenAlt />
                      </button>
                    </div>
                    <p className="text-gray-700 mb-3">{obs.observation}</p>
                    <div className="flex flex-wrap gap-2">
                      {obs.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressReportsPage;
