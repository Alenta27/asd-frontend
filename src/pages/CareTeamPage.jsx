import React, { useState } from 'react';
import { FaHome, FaCalendar, FaChartLine, FaFileAlt, FaUserTie, FaBook, FaCog, FaBell, FaSearch, FaPlus, FaPhone, FaEnvelope, FaVideo } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const mockCareTeam = [
  {
    id: 1,
    name: 'Dr. Aisha Khan',
    role: 'Neurologist',
    facility: 'Child Development Center',
    phone: '(123) 456-7890',
    email: 'aisha.khan@center.com',
    specialization: 'ASD Assessment & Diagnosis',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 2,
    name: 'Ms. Kim Lee',
    role: 'Speech Therapist',
    facility: 'Therapy Clinic',
    phone: '(123) 456-7891',
    email: 'kim.lee@clinic.com',
    specialization: 'Speech & Language Therapy',
    color: 'from-green-400 to-green-600',
  },
  {
    id: 3,
    name: 'Dr. Leo Chen',
    role: 'Developmental Pediatrician',
    facility: 'Child Development Center',
    phone: '(123) 456-7892',
    email: 'leo.chen@center.com',
    specialization: 'Developmental Assessment',
    color: 'from-purple-400 to-purple-600',
  },
  {
    id: 4,
    name: 'Dr. Maria Lopez',
    role: 'Occupational Therapist',
    facility: 'Wellness Center',
    phone: '(123) 456-7893',
    email: 'maria.lopez@wellness.com',
    specialization: 'Occupational & Sensory Therapy',
    color: 'from-yellow-400 to-yellow-600',
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

const CareTeamPage = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('care-team');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const parentName = localStorage.getItem('token')
    ? JSON.parse(atob(localStorage.getItem('token').split('.')[1])).email?.split('@')[0] || 'Parent'
    : 'Parent';

  const childName = 'Your Child'; // This would come from selected child

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
              <h1 className="text-3xl font-bold text-gray-800">{childName}'s Care Team</h1>
              <p className="text-gray-500 text-sm mt-1">Manage and communicate with your child's healthcare providers</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search providers..."
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
            {/* Action Button */}
            <div className="flex justify-end">
              <button className="px-6 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold inline-flex items-center gap-2">
                <FaPlus /> Add New Provider
              </button>
            </div>

            {/* Care Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {mockCareTeam.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-200"
                >
                  {/* Header with color gradient */}
                  <div className={`h-24 bg-gradient-to-r ${provider.color}`}></div>

                  {/* Content */}
                  <div className="p-6 -mt-12 relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-md">
                      {provider.name.charAt(0)}
                    </div>

                    <h3 className="text-xl font-bold text-gray-800">{provider.name}</h3>
                    <p className="text-sm font-semibold text-gray-600 mt-1">{provider.role}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{provider.facility}</p>

                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FaPhone className="text-gray-400" size={14} />
                        <span className="text-sm">{provider.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <FaEnvelope className="text-gray-400" size={14} />
                        <span className="text-sm break-all">{provider.email}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-700">
                        <FaUserTie className="text-gray-400 flex-shrink-0 mt-0.5" size={14} />
                        <span className="text-sm">{provider.specialization}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm inline-flex items-center justify-center gap-1">
                        <FaEnvelope size={14} /> Message
                      </button>
                      <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm inline-flex items-center justify-center gap-1">
                        <FaVideo size={14} /> Video Call
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareTeamPage;
