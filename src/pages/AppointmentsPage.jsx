import React, { useState } from 'react';
import { FaHome, FaCalendar, FaChartLine, FaFileAlt, FaUserTie, FaBook, FaCog, FaBell, FaSearch, FaPlus, FaClock, FaMapMarkerAlt, FaPhone, FaVideo } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const mockAppointments = {
  upcoming: [
    {
      id: 1,
      type: 'Developmental Assessment',
      provider: 'Dr. Leo Chen',
      date: '30 Oct 2025',
      time: '09:00 AM',
      location: 'Child Development Center, Room 3',
      phone: '(123) 456-7890',
      status: 'confirmed',
    },
    {
      id: 2,
      type: 'Speech Therapy',
      provider: 'Ms. Kim Lee',
      date: '01 Nov 2025',
      time: '02:30 PM',
      location: 'Therapy Clinic, Suite 200',
      phone: '(123) 456-7891',
      status: 'confirmed',
    },
    {
      id: 3,
      type: 'Occupational Therapy',
      provider: 'Dr. Maria Lopez',
      date: '05 Nov 2025',
      time: '10:00 AM',
      location: 'Wellness Center, 2nd Floor',
      phone: '(123) 456-7892',
      status: 'pending',
    },
  ],
  past: [
    {
      id: 4,
      type: 'Speech Therapy',
      provider: 'Ms. Kim Lee',
      date: '24 Oct 2025',
      time: '02:30 PM',
      location: 'Therapy Clinic, Suite 200',
      hasNotes: true,
    },
    {
      id: 5,
      type: 'Behavioral Assessment',
      provider: 'Dr. James Wilson',
      date: '18 Oct 2025',
      time: '11:00 AM',
      location: 'Child Development Center, Room 1',
      hasNotes: true,
    },
  ],
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FaHome },
  { id: 'appointments', label: 'Appointments', icon: FaCalendar },
  { id: 'screening', label: 'Screening Results', icon: FaChartLine },
  { id: 'reports', label: 'Progress Reports', icon: FaFileAlt },
  { id: 'care-team', label: 'Care Team', icon: FaUserTie },
  { id: 'resources', label: 'Resources', icon: FaBook },
  { id: 'settings', label: 'Settings', icon: FaCog },
];

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('appointments');

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
              <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your child's schedule and sessions</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search appointments..."
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
                <FaPlus /> Schedule New Appointment
              </button>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Appointments</h2>
              <div className="space-y-4">
                {mockAppointments.upcoming.map((apt) => (
                  <div key={apt.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800">{apt.type}</h3>
                        <p className="text-sm text-gray-600 mt-1">with {apt.provider}</p>
                      </div>
                      <span className={`px-4 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {apt.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaClock className="text-blue-400" />
                        <div>
                          <p className="text-xs text-gray-500">Date & Time</p>
                          <p className="font-semibold">{apt.date} at {apt.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaMapMarkerAlt className="text-blue-400" />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="font-semibold text-sm">{apt.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaPhone className="text-blue-400" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-semibold">{apt.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm">
                          Reschedule
                        </button>
                        <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Appointments */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Past Appointments</h2>
              <div className="space-y-4">
                {mockAppointments.past.map((apt) => (
                  <div key={apt.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-700">{apt.type}</h3>
                        <p className="text-sm text-gray-600 mt-1">with {apt.provider}</p>
                        <p className="text-xs text-gray-500 mt-2">{apt.date} at {apt.time}</p>
                      </div>
                      {apt.hasNotes && (
                        <button className="px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm">
                          View Summary Notes
                        </button>
                      )}
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

export default AppointmentsPage;
