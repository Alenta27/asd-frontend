import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaEye, FaPlay } from 'react-icons/fa';

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed': return 'bg-green-100 text-green-800';
    case 'In Progress': return 'bg-blue-100 text-blue-800';
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'Overdue': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getScoreColor = (score) => {
  if (score === null || typeof score === 'undefined') return 'text-gray-500';
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

const normalizeRisk = (value) => {
  const text = typeof value === 'string' ? value : '';
  const lower = text.toLowerCase();
  if (lower === 'high') return 'High';
  if (lower === 'medium') return 'Medium';
  return 'Low';
};

const buildFallbackReportPayload = (screening) => {
  const scoreText = typeof screening?.score === 'number' ? `${screening.score}%` : 'N/A';
  const risk = screening?.riskLevel || 'Low';
  const summary = [
    `This report summarizes the latest ${screening?.type || 'screening'} for ${screening?.studentName || 'the student'}.`,
    `Current status is ${screening?.status || 'Pending'}, risk level is ${risk}, and score is ${scoreText}.`,
    'These findings should be interpreted with classroom observations and follow-up assessments for a complete understanding.'
  ].join(' ');

  const strengths =
    risk === 'Low'
      ? 'The student shows stable responses during screening tasks and demonstrates encouraging developmental indicators.'
      : risk === 'Medium'
        ? 'The student shows partial strengths in structured tasks, providing a useful baseline for targeted support.'
        : 'The screening captured clear behavioral signals that support focused and timely intervention planning.';

  const recommendations =
    risk === 'Low'
      ? 'Continue periodic monitoring and maintain current supportive classroom practices.'
      : risk === 'Medium'
        ? 'Plan focused support sessions and repeat assessment in 4 to 6 weeks to track changes.'
        : 'Coordinate specialist follow-up and implement structured interventions with close short-term monitoring.';

  return {
    studentId: screening.id,
    title: `${screening?.type || 'Screening'} Report - ${screening?.studentName || 'Student'}`,
    date: screening?.assignedDate && screening.assignedDate !== '-' ? screening.assignedDate : new Date().toISOString(),
    period: `${new Date().getFullYear()} Screening Cycle`,
    summary,
    strengths,
    recommendations,
    status: 'final'
  };
};

const TeacherScreeningsPage = () => {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const [screenings, setScreenings] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchScreenings = async () => {
      setFetching(true);
      setFetchError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setScreenings([]);
          setFetchError('Please sign in to view screenings.');
          return;
        }

        const response = await fetch(`${API_BASE}/api/teacher/screenings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch screenings (${response.status})`);
        }

        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((item, index) => ({
              id: item.id || `screening-${index + 1}`,
              studentName: item.studentName || 'Student',
              type: item.type || 'Unknown',
              riskLevel: normalizeRisk(item.riskLevel),
              assignedDate: item.assignedDate || '-',
              dueDate: item.dueDate || '-',
              status: item.status || 'Pending',
              score: typeof item.score === 'number' ? item.score : null,
            }))
          : [];

        setScreenings(normalized);
      } catch (error) {
        setScreenings([]);
        setFetchError(error.message || 'Failed to load screenings.');
      } finally {
        setFetching(false);
      }
    };

    fetchScreenings();
  }, []);

  const handleViewReport = async (screening) => {
    setReportLoading(true);
    setReportError('');
    setSelectedReport(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please sign in to view the report.');
      }

      const response = await fetch(`${API_BASE}/api/teacher/screenings/${screening.id}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedReport(data);
        return;
      }

      // Fallback for older backend builds where /screenings/:studentId/report is not available yet.
      if (response.status === 404) {
        const existingRes = await fetch(`${API_BASE}/api/teacher/reports/student/${screening.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!existingRes.ok) {
          throw new Error(`Failed to load report (${existingRes.status})`);
        }

        const existingReports = await existingRes.json();
        let report = Array.isArray(existingReports) && existingReports.length
          ? existingReports[0]
          : null;

        if (!report) {
          const createPayload = buildFallbackReportPayload(screening);
          const createRes = await fetch(`${API_BASE}/api/teacher/reports`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(createPayload)
          });

          if (!createRes.ok) {
            throw new Error(`Failed to create report (${createRes.status})`);
          }

          report = await createRes.json();
        }

        setSelectedReport({
          report,
          screening: {
            studentId: screening.id,
            studentName: screening.studentName,
            type: screening.type,
            riskLevel: screening.riskLevel,
            status: screening.status,
            score: screening.score,
            screeningDate: screening.assignedDate
          }
        });
        return;
      }

      throw new Error(`Failed to load report (${response.status})`);
    } catch (error) {
      setReportError(error.message || 'Failed to load report.');
    } finally {
      setReportLoading(false);
    }
  };

  const closeReportModal = () => {
    setSelectedReport(null);
    setReportError('');
    setReportLoading(false);
  };

  const filteredScreenings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return screenings.filter((screening) => {
      const matchesQuery =
        query.length === 0 ||
        screening.studentName.toLowerCase().includes(query) ||
        (screening.type || '').toLowerCase().includes(query) ||
        (screening.riskLevel || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'All' || screening.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [screenings, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    const total = screenings.length;
    const completed = screenings.filter((item) => item.status === 'Completed').length;
    const pending = screenings.filter((item) => item.status === 'Pending').length;
    const inProgress = screenings.filter((item) => item.status === 'In Progress').length;
    return { total, completed, pending, inProgress };
  }, [screenings]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/teacher" className="text-gray-600 hover:text-gray-800">
              <FaArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Screening Management</h1>
              <p className="text-gray-600">Track and manage student screening activities</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Screenings</p>
            <p className="text-2xl font-semibold text-gray-800">{summary.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-semibold text-green-600">{summary.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Pending / In Progress</p>
            <p className="text-2xl font-semibold text-yellow-600">{summary.pending + summary.inProgress}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student, type, or risk level..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Student Screenings ({filteredScreenings.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {fetching ? (
              <div className="py-12 text-center text-gray-500">Loading screenings...</div>
            ) : filteredScreenings.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                {fetchError || 'No screenings match your criteria.'}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredScreenings.map((screening) => (
                    <tr key={screening.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{screening.studentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {screening.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {screening.riskLevel || 'Low'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {screening.assignedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {screening.dueDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(screening.status)}`}>
                          {screening.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${getScoreColor(screening.score)}`}>
                          {screening.score === null || typeof screening.score === 'undefined' ? 'N/A' : `${screening.score}%`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {screening.status === 'Completed' ? (
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleViewReport(screening)}
                            title="View screening report"
                          >
                            <FaEye />
                          </button>
                        ) : (
                          <button className="text-green-600 hover:text-green-900">
                            <FaPlay />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {(reportLoading || reportError || selectedReport) && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Screening Report</h3>
              <button
                onClick={closeReportModal}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {reportLoading && <p className="text-gray-600">Generating report...</p>}

              {!reportLoading && reportError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                  {reportError}
                </div>
              )}

              {!reportLoading && selectedReport?.report && (
                <>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedReport.report.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Date: {new Date(selectedReport.report.date).toLocaleDateString()} | Status: {selectedReport.report.status}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-gray-500">Student</p>
                      <p className="font-semibold text-gray-800">{selectedReport.screening?.studentName || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-gray-500">Screening Type</p>
                      <p className="font-semibold text-gray-800">{selectedReport.screening?.type || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-gray-500">Risk Level</p>
                      <p className="font-semibold text-gray-800">{selectedReport.screening?.riskLevel || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-gray-500">Score</p>
                      <p className="font-semibold text-gray-800">
                        {typeof selectedReport.screening?.score === 'number' ? `${selectedReport.screening.score}%` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Summary</h5>
                    <p className="text-sm text-gray-700 leading-6 whitespace-pre-line">{selectedReport.report.summary}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Strengths</h5>
                    <p className="text-sm text-gray-700 leading-6 whitespace-pre-line">{selectedReport.report.strengths || 'N/A'}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Recommendations</h5>
                    <p className="text-sm text-gray-700 leading-6 whitespace-pre-line">{selectedReport.report.recommendations || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherScreeningsPage;
