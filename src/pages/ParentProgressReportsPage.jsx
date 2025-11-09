import React, { useState } from 'react';
import { FaArrowLeft, FaChartLine, FaPlus, FaDownload, FaCalendar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ParentProgressReportsPage = () => {
  const navigate = useNavigate();
  const [reports] = useState([
    {
      id: 1,
      from: 'Ms. Kim Lee',
      title: 'Quarterly Speech Report',
      date: '15 Oct 2025',
      description: 'Progress update on speech and language development.',
    },
    {
      id: 2,
      from: 'Dr. Leo Chen',
      title: 'Developmental Assessment Follow-up',
      date: '01 Oct 2025',
      description: 'Developmental milestones and recommendations.',
    },
  ]);

  const goalsData = [
    { goal: 'Social Interaction', progress: 65 },
    { goal: 'Communication', progress: 75 },
    { goal: 'Sensory Response', progress: 55 },
    { goal: 'Daily Living Skills', progress: 80 },
  ];

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
          <h1 className="text-3xl font-bold text-gray-800">Progress Reports & Milestones</h1>
          <p className="text-gray-600 text-sm mt-1">Track long-term development and therapy goals</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="space-y-8 max-w-4xl">
            {/* Add Observation Button */}
            <button className="w-full px-6 py-3 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold flex items-center justify-center gap-2 shadow-md">
              <FaPlus /> Add New Observation
            </button>

            {/* Goals Timeline */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaChartLine size={24} className="text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Progress Towards Goals</h2>
              </div>

              <div className="space-y-6">
                {goalsData.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-800">{item.goal}</p>
                      <p className="text-sm font-bold text-blue-600">{item.progress}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Therapist Reports */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Therapist Reports</h2>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FaCalendar size={16} className="text-blue-500" />
                          <span className="text-sm text-gray-600">{report.date}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{report.title}</h3>
                        <p className="text-gray-700 font-semibold text-sm mt-1">From: {report.from}</p>
                        <p className="text-gray-600 text-sm mt-2">{report.description}</p>
                      </div>
                      <button className="px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm flex items-center gap-2 whitespace-nowrap ml-4">
                        <FaDownload size={14} /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parent's Log Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Parent's Observation Log</h2>
              <p className="text-gray-600 text-sm mb-4">
                Keep a simple journal of your observations and notes about your child's development.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-xs text-gray-600 mb-2">25 Oct 2025</p>
                  <p className="text-gray-800">Great progress in eye contact during play sessions today. Noticed improved joint attention with favorite toys.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-xs text-gray-600 mb-2">23 Oct 2025</p>
                  <p className="text-gray-800">Started new sensory activity. Child showed positive interest in texture exploration.</p>
                </div>
              </div>
              <button className="mt-4 px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm">
                Add New Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentProgressReportsPage;
