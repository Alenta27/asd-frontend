import React, { useState } from 'react';
import { FaHome, FaCalendar, FaChartLine, FaFileAlt, FaUserTie, FaBook, FaCog, FaBell, FaSearch, FaCamera, FaClipboardList, FaCheckCircle, FaTimesCircle, FaPlay, FaFilePdf } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const mockPastReports = [
  { id: 1, date: '25 Oct 2025', status: 'Complete', riskLevel: 'Low Risk' },
  { id: 2, date: '15 Oct 2025', status: 'Complete', riskLevel: 'Moderate Risk' },
  { id: 3, date: '05 Oct 2025', status: 'Complete', riskLevel: 'Low Risk' },
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

const ScreeningCenterPage = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('screening');
  const [step1Complete, setStep1Complete] = useState(false);
  const [step2Complete, setStep2Complete] = useState(false);

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
              <h1 className="text-3xl font-bold text-gray-800">New Screening Center</h1>
              <p className="text-gray-500 text-sm mt-1">Generate a preliminary ASD screening report for {childName}</p>
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
            {/* Introduction */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
              <p className="text-gray-700">
                To generate a new preliminary report for <span className="font-bold">{childName}</span>, please complete the two sections below. 
                This analysis provides supportive insights and is <span className="font-bold">not a formal diagnosis</span>. 
                Always consult with qualified healthcare professionals for official assessments.
              </p>
            </div>

            {/* Step 1: Facial & Eye-Tracking Screening */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCamera className="text-blue-600 text-xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">Step 1: Facial & Eye-Tracking Screening</h2>
                  <p className="text-gray-600 mt-2">
                    This tool will use your device's camera to present short videos and stimuli. It analyzes observational data related to facial expressions and eye-tracking patterns. 
                    Please ensure your child is in a quiet, well-lit area.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                {step1Complete ? (
                  <>
                    <FaCheckCircle className="text-green-500 text-2xl" />
                    <div>
                      <p className="font-semibold text-green-700">Status: Completed</p>
                      <p className="text-sm text-gray-600">Your facial screening data has been recorded.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-gray-400 text-2xl" />
                    <p className="text-gray-700 font-semibold">Status: Not Started</p>
                  </>
                )}
              </div>

              <button
                onClick={() => setStep1Complete(!step1Complete)}
                disabled={step1Complete}
                className={`px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition ${
                  step1Complete
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-pink-200 text-pink-800 hover:bg-pink-300'
                }`}
              >
                <FaPlay /> {step1Complete ? 'Facial Screening Completed' : 'Start Facial Screening'}
              </button>
            </div>

            {/* Step 2: Parent Observational Questionnaire */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaClipboardList className="text-blue-600 text-xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">Step 2: Parent Observational Questionnaire</h2>
                  <p className="text-gray-600 mt-2">
                    This is a standardized questionnaire (like the M-CHAT-R™) about your child's behaviors. 
                    Please answer based on your observations over the past few weeks.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                {step2Complete ? (
                  <>
                    <FaCheckCircle className="text-green-500 text-2xl" />
                    <div>
                      <p className="font-semibold text-green-700">Status: Completed</p>
                      <p className="text-sm text-gray-600">Your questionnaire responses have been saved.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-gray-400 text-2xl" />
                    <p className="text-gray-700 font-semibold">Status: Not Started</p>
                  </>
                )}
              </div>

              <button
                onClick={() => setStep2Complete(!step2Complete)}
                disabled={step2Complete}
                className={`px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition ${
                  step2Complete
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-pink-200 text-pink-800 hover:bg-pink-300'
                }`}
              >
                <FaPlay /> {step2Complete ? 'Questionnaire Completed' : 'Begin Questionnaire'}
              </button>
            </div>

            {/* Step 3: Analyze & Generate Report */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 3: Analyze & Generate Report</h2>
              <p className="text-gray-600 mb-6">
                Once both screening sections are complete, our system will analyze the combined data and generate a preliminary report.
              </p>

              <button
                disabled={!step1Complete || !step2Complete}
                className={`px-8 py-3 rounded-lg font-semibold transition ${
                  step1Complete && step2Complete
                    ? 'bg-pink-200 text-pink-800 hover:bg-pink-300 cursor-pointer'
                    : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                }`}
              >
                Analyze & View Report
              </button>
            </div>

            {/* Past Reports Section */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Past Reports</h2>
              <div className="space-y-3">
                {mockPastReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
                    <div className="flex items-center gap-4">
                      <FaFilePdf className="text-red-500 text-2xl" />
                      <div>
                        <p className="font-semibold text-gray-800">Report - {report.date}</p>
                        <p className="text-sm text-gray-600">{report.status} • {report.riskLevel}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm">
                      View PDF
                    </button>
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

export default ScreeningCenterPage;
