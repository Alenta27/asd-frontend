import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaChartLine, FaFileAlt, FaUser, FaPhone, FaEnvelope, FaEdit, FaGamepad, FaTimes } from 'react-icons/fa';
import GameResultsDisplay from '../components/GameResultsDisplay';
import SimilarCasesModal from '../components/SimilarCasesModal';

const clampDateToRange = (value) => {
  const start = '2025-08-01';
  const end = '2025-10-31';
  const fallback = '2025-09-15';
  if (!value) return fallback;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback;
    const iso = value.toISOString().split('T')[0];
    if (iso < start) return start;
    if (iso > end) return end;
    return iso;
  }
  if (typeof value === 'string') {
    const normalized = value.split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return fallback;
    if (normalized < start) return start;
    if (normalized > end) return end;
    return normalized;
  }
  return fallback;
};

const StudentProfilePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('summary');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGameResults, setShowGameResults] = useState(false);
  const [gameResultId, setGameResultId] = useState(null);
  const [showSimilarCases, setShowSimilarCases] = useState(false);
  const [progressReports, setProgressReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportModalData, setReportModalData] = useState(null);
  const [showCreateReportModal, setShowCreateReportModal] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    author: 'Ms. Athiya Krishna',
    date: clampDateToRange('2025-09-30'),
    period: 'Q4 2025',
    summary: '',
    strengths: '',
    recommendations: ''
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/teacher/students`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const students = await response.json();
          const foundStudent = students.find(s => s._id === studentId);
          if (foundStudent) {
            setStudent({ ...foundStudent, submittedDate: clampDateToRange(foundStudent.submittedDate) });
          }
        }
      } catch (error) {
        console.error('Error fetching student:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
    fetchReports();
  }, [studentId]);

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/teacher/reports/student/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProgressReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.showGameResults && location.state?.gameResultId) {
      setGameResultId(location.state.gameResultId);
      setShowGameResults(true);
    }
  }, [location.state]);

  const handleViewReport = (report) => {
    setReportModalData({
      title: report.title,
      author: report.author || 'Teacher',
      date: clampDateToRange(report.date),
      period: report.period || '',
      riskLevel: report.riskLevel || '',
      summary: report.summary || '',
      strengths: report.strengths || '',
      recommendations: report.recommendations || ''
    });
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportModalData(null);
  };

  const openCreateReportModal = () => {
    setNewReport({
      title: '',
      author: 'Ms. Athiya Krishna',
      date: clampDateToRange(student?.submittedDate || '2025-09-30'),
      period: 'Q4 2025',
      summary: '',
      strengths: '',
      recommendations: ''
    });
    setShowCreateReportModal(true);
  };

  const closeCreateReportModal = () => {
    setShowCreateReportModal(false);
  };

  const handleCreateReportSubmit = async (event) => {
    event.preventDefault();
    if (!newReport.title.trim() || !newReport.summary.trim() || !newReport.date) {
      alert('Please complete all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/teacher/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newReport,
          studentId: studentId
        })
      });

      if (response.ok) {
        const savedReport = await response.json();
        setProgressReports((prev) => [savedReport, ...prev]);
        setShowCreateReportModal(false);
        setActiveTab('reports');
        setReportModalData(savedReport);
        setShowReportModal(true);
        setNewReport({
          title: '',
          author: 'Ms. Athiya Krishna',
          date: clampDateToRange(student?.submittedDate || '2025-09-30'),
          period: 'Q4 2025',
          summary: '',
          strengths: '',
          recommendations: ''
        });
      } else {
        alert('Failed to save report');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Error creating report');
    }
  };

  const handleReportFieldChange = (field) => (event) => {
    const value = event.target.value;
    setNewReport((prev) => ({
      ...prev,
      [field]: field === 'date' ? clampDateToRange(value) : value
    }));
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'High': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskBadge = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Student Not Found</h2>
          <button onClick={() => navigate('/teacher/students')} className="text-pink-500 hover:text-pink-700">
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  // Mock data for demonstrations - in real app, this would come from API
  const screeningHistory = [
    { type: 'Parent Questionnaire', date: clampDateToRange(student.submittedDate || '2025-09-15'), result: student.riskLevel, id: 1 },
    { type: 'Facial Screening (CNN)', date: '2025-08-20', result: 'Medium Risk', id: 2 },
    { type: 'MRI Screening (CNN)', date: '2025-10-05', result: 'Medium Risk', id: 3 },
  ];

  const parentInfo = {
    name: 'Mr. Rohan Singh',
    relationship: 'Father',
    email: 'rohan.singh@email.com',
    phone: '+91-999-999-9999'
  };

  const riskLevelTimeline = [
    { month: 'Aug', level: 'Low' },
    { month: 'Sep', level: 'Medium' },
    { month: 'Oct', level: student.riskLevel },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/teacher/students')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <FaArrowLeft /> Back to Students
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{student.name}</h1>
              <p className="text-gray-600 mb-3">Age: {student.age} • Grade: {student.grade}</p>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  Active
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskBadge(student.riskLevel || 'Low')}`}>
                  {student.riskLevel || 'Low'} Risk
                </span>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={() => navigate(`/teacher/students/${studentId}/social-game`)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <FaGamepad /> Start Social Response Game
              </button>
              <button
                onClick={() => navigate('/screening-tools', { state: { studentId } })}
                className="bg-pink-300 hover:bg-pink-400 text-pink-900 px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
              >
                Start New Screening
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {['summary', 'history', 'reports', 'parent'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab === 'summary' && 'Summary'}
                {tab === 'history' && 'Screening History'}
                {tab === 'reports' && 'Progress Reports'}
                {tab === 'parent' && 'Parent/Guardian Info'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Latest Screening Widget */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Latest Screening</h2>
              <div className="border-l-4 border-gray-300 pl-4">
                <p className="text-gray-700 font-medium">Parent Questionnaire</p>
                <p className="text-gray-600 text-sm mt-1">Date: {clampDateToRange(student.submittedDate)}</p>
                <p className="text-gray-600 text-sm mt-1">
                  Result: <span className={`${getRiskBadge(student.riskLevel || 'Low')} px-2 py-1 rounded`}>
                    {student.riskLevel || 'Low'} Risk
                  </span>
                </p>
                <p className="text-gray-700 mt-3">
                  The submitted questionnaire showed strong indicators in social interaction and communication modules. 
                  Manual review by a therapist is recommended.
                </p>
                <button
                  onClick={() => progressReports.length && handleViewReport(progressReports[0])}
                  className="mt-4 bg-pink-300 hover:bg-pink-400 text-pink-900 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  View Full Report
                </button>
              </div>
            </div>

            {/* Risk Level Over Time */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Risk Level Over Time</h2>
              <div className="flex items-end justify-between h-48">
                {riskLevelTimeline.map((point, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 rounded-t" style={{ height: `${(index + 1) * 20}px` }}></div>
                    <div className="mt-2 text-sm text-gray-600">{point.level}</div>
                    <div className="mt-1 text-xs text-gray-500">{point.month}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Care Team */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Assigned Care Team</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <FaUser className="text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Teacher: Ms. Athiya Krishna</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <FaUser className="text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Therapist: Dr. Rao Thomas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screening History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Screening History</h2>
            <div className="space-y-4">
              {screeningHistory.map((screening) => (
                <div key={screening.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">{screening.type}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(screening.result)}`}>
                          {screening.result} Risk
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Date: {clampDateToRange(screening.date)}</p>
                    </div>
                    <button
                      onClick={() => progressReports.length && handleViewReport(progressReports[0])}
                      className="bg-pink-300 hover:bg-pink-400 text-pink-900 px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Progress Reports</h2>
              <button
                onClick={openCreateReportModal}
                className="bg-pink-300 hover:bg-pink-400 text-pink-900 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <FaEdit /> Create New Progress Report
              </button>
            </div>
            <div className="space-y-4">
              {reportsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading reports...</div>
              ) : progressReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No progress reports available.</div>
              ) : (
                progressReports.map((report) => (
                  <div key={report._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{report.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span>Author: {report.author || 'Teacher'}</span>
                          <span>•</span>
                          <span>Date: {new Date(report.date).toLocaleDateString()}</span>
                          {report.period && (
                            <>
                              <span>•</span>
                              <span>Period: {report.period}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewReport(report)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold"
                      >
                        View Report
                      </button>
                    </div>
                    {report.summary && (
                      <p className="text-sm text-gray-700 line-clamp-2">{report.summary}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Parent/Guardian Info Tab */}
        {activeTab === 'parent' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Parent/Guardian Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FaUser className="text-pink-600" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-800">{parentInfo.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FaUser className="text-pink-600" />
                <div>
                  <p className="text-sm text-gray-600">Relationship</p>
                  <p className="font-semibold text-gray-800">{parentInfo.relationship}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FaEnvelope className="text-pink-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-800">{parentInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FaPhone className="text-pink-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-800">{parentInfo.phone}</p>
                </div>
              </div>
            </div>
            <button className="mt-6 bg-pink-300 hover:bg-pink-400 text-pink-900 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
              <FaEnvelope /> Send Secure Message
            </button>
          </div>
        )}
      </div>

      {showReportModal && reportModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{reportModalData.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{reportModalData.author} • {clampDateToRange(reportModalData.date)}</p>
                {reportModalData.period && (
                  <p className="text-sm text-gray-500">Period: {reportModalData.period}</p>
                )}
              </div>
              <button
                onClick={closeReportModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="px-6 py-5 space-y-6">
              {reportModalData.summary && (
                <section>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Summary</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{reportModalData.summary}</p>
                </section>
              )}
              {reportModalData.strengths && (
                <section>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Strengths</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{reportModalData.strengths}</p>
                </section>
              )}
              {reportModalData.recommendations && (
                <section>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Recommendations</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{reportModalData.recommendations}</p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-2xl font-bold text-gray-800">Create Progress Report</h3>
              <button
                onClick={closeCreateReportModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateReportSubmit} className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                <input
                  type="text"
                  value={newReport.title}
                  onChange={handleReportFieldChange('title')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="Enter report title"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newReport.date}
                    onChange={handleReportFieldChange('date')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <input
                    type="text"
                    value={newReport.period}
                    onChange={handleReportFieldChange('period')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    placeholder="e.g., Q4 2025"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                <textarea
                  value={newReport.summary}
                  onChange={handleReportFieldChange('summary')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  rows={4}
                  placeholder="Provide an overview of student progress"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strengths</label>
                <textarea
                  value={newReport.strengths}
                  onChange={handleReportFieldChange('strengths')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  rows={3}
                  placeholder="Highlight student strengths"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
                <textarea
                  value={newReport.recommendations}
                  onChange={handleReportFieldChange('recommendations')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  rows={3}
                  placeholder="Add suggested next steps or interventions"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateReportModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-pink-300 hover:bg-pink-400 text-pink-900 font-semibold"
                >
                  Save Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGameResults && gameResultId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <GameResultsDisplay 
              gameResultId={gameResultId}
              studentId={studentId}
              onClose={() => setShowGameResults(false)}
              onViewSimilarCases={(id) => {
                setGameResultId(id);
                setShowSimilarCases(true);
              }}
            />
          </div>
        </div>
      )}

      {showSimilarCases && gameResultId && (
        <SimilarCasesModal 
          gameResultId={gameResultId}
          onClose={() => setShowSimilarCases(false)}
        />
      )}
    </div>
  );
};

export default StudentProfilePage;
