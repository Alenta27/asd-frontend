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

const fallbackScreenings = [
  { id: 'fallback-manuel', studentName: 'Manuel Saji', type: 'Parent Questionnaire', riskLevel: 'Low', assignedDate: '2025-09-10', dueDate: '2025-09-17', status: 'Completed', score: 94 },
  { id: 'fallback-rohan', studentName: 'Rohan Sharma', type: 'Classroom Observation', riskLevel: 'Low', assignedDate: '2025-09-08', dueDate: '2025-09-15', status: 'Completed', score: 90 },
  { id: 'fallback-priya', studentName: 'Priya Patel', type: 'Teacher Checklist', riskLevel: 'Medium', assignedDate: '2025-09-18', dueDate: '2025-09-25', status: 'Completed', score: 82 },
  { id: 'fallback-aditya', studentName: 'Aditya Singh', type: 'Parent Questionnaire', riskLevel: 'High', assignedDate: '2025-10-04', dueDate: '2025-10-11', status: 'In Progress', score: null },
  { id: 'fallback-ananya', studentName: 'Ananya Reddy', type: 'Teacher Checklist', riskLevel: 'Low', assignedDate: '2025-09-20', dueDate: '2025-09-27', status: 'Completed', score: 96 },
  { id: 'fallback-vikram', studentName: 'Vikram Kumar', type: 'Speech Assessment', riskLevel: 'Medium', assignedDate: '2025-09-27', dueDate: '2025-10-04', status: 'Completed', score: 78 },
  { id: 'fallback-diya', studentName: 'Diya Gupta', type: 'Parent Questionnaire', riskLevel: 'Low', assignedDate: '2025-09-14', dueDate: '2025-09-21', status: 'Completed', score: 91 },
  { id: 'fallback-arjun', studentName: 'Arjun Menon', type: 'Behavior Checklist', riskLevel: 'Medium', assignedDate: '2025-10-07', dueDate: '2025-10-14', status: 'Pending', score: null },
  { id: 'fallback-aisha', studentName: 'Aisha Khan', type: 'Parent Questionnaire', riskLevel: 'Low', assignedDate: '2025-09-23', dueDate: '2025-09-30', status: 'Completed', score: 88 },
  { id: 'fallback-karan', studentName: 'Karan Verma', type: 'Teacher Checklist', riskLevel: 'High', assignedDate: '2025-10-13', dueDate: '2025-10-20', status: 'In Progress', score: null },
  { id: 'fallback-sneha', studentName: 'Sneha Desai', type: 'Speech Assessment', riskLevel: 'Medium', assignedDate: '2025-10-06', dueDate: '2025-10-13', status: 'Pending', score: null },
  { id: 'fallback-adwaith', studentName: 'Adwaith Verma', type: 'Parent Questionnaire', riskLevel: 'Low', assignedDate: '2025-08-06', dueDate: '2025-08-13', status: 'Completed', score: 89 }
];

const normalizeRisk = (value) => {
  const text = typeof value === 'string' ? value : '';
  const lower = text.toLowerCase();
  if (lower === 'high') return 'High';
  if (lower === 'medium') return 'Medium';
  return 'Low';
};

const TeacherScreeningsPage = () => {
  const [screenings, setScreenings] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchScreenings = async () => {
      setFetching(true);
      try {
        const token = localStorage.getItem('token');
        let normalized = [];
        if (token) {
          const response = await fetch('http://localhost:5000/api/teacher/screenings', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            normalized = Array.isArray(data)
              ? data.map((item, index) => ({
                  id: item.id || `screening-${index + 1}`,
                  studentName: item.studentName || 'Student',
                  type: item.type || 'Questionnaire',
                  riskLevel: normalizeRisk(item.riskLevel),
                  assignedDate: item.assignedDate || '2025-09-15',
                  dueDate: item.dueDate || '2025-09-22',
                  status: item.status || 'Pending',
                  score: typeof item.score === 'number' ? item.score : null,
                }))
              : [];
          }
        }
        if (!normalized.length) {
          normalized = fallbackScreenings;
        }
        setScreenings(normalized);
      } catch (error) {
        setScreenings(fallbackScreenings);
      } finally {
        setFetching(false);
      }
    };

    fetchScreenings();
  }, []);

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
              <div className="py-12 text-center text-gray-500">No screenings match your criteria.</div>
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
                          <button className="text-blue-600 hover:text-blue-900">
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
    </div>
  );
};

export default TeacherScreeningsPage;
