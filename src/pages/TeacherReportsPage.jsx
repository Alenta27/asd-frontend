import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaFilter, FaEye, FaDownload, FaFileAlt, FaCalendar, FaTimes, FaTrash } from 'react-icons/fa';
import jsPDF from 'jspdf';

const TeacherReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [reportsError, setReportsError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newReport, setNewReport] = useState({
    studentId: '',
    title: '',
    date: new Date().toISOString().slice(0, 10),
    period: 'Q1 2026',
    summary: '',
    strengths: '',
    recommendations: ''
  });

  useEffect(() => {
    fetchReports();
    fetchStudents();
  }, []);

  const fetchReports = async () => {
    try {
      setReportsError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/teacher/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Failed to fetch reports (${response.status})`);
      }

      const data = await response.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReportsError(error.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/teacher/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        setNewReport((prev) => ({
          ...prev,
          studentId: prev.studentId || (list[0]?._id || '')
        }));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const openCreateModal = () => {
    setCreateError('');
    setActionMessage({ type: '', text: '' });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateError('');
  };

  const handleCreateFieldChange = (field) => (event) => {
    const value = event.target.value;
    setNewReport((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateReport = async (event) => {
    event.preventDefault();
    setCreateError('');

    if (!newReport.studentId || !newReport.title.trim() || !newReport.summary.trim()) {
      setCreateError('Student, title, and summary are required.');
      return;
    }

    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/teacher/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReport)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create report');
      }

      const savedReport = await response.json();
      const selectedStudent = students.find((student) => String(student._id) === String(newReport.studentId));
      const normalizedSavedReport = {
        ...savedReport,
        patientId: typeof savedReport.patientId === 'object' && savedReport.patientId !== null
          ? savedReport.patientId
          : {
              _id: newReport.studentId,
              name: selectedStudent?.name || 'Unknown'
            },
        date: savedReport.date || newReport.date,
        period: savedReport.period || newReport.period,
        summary: savedReport.summary || newReport.summary,
        strengths: savedReport.strengths || newReport.strengths,
        recommendations: savedReport.recommendations || newReport.recommendations,
        status: savedReport.status || 'final'
      };

      setReports((prev) => [normalizedSavedReport, ...prev]);

      await fetchReports();
      setShowCreateModal(false);
      setActionMessage({ type: 'success', text: 'Report saved successfully.' });
      setNewReport((prev) => ({
        ...prev,
        title: '',
        summary: '',
        strengths: '',
        recommendations: ''
      }));
    } catch (error) {
      setCreateError(error.message || 'Failed to create report');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredReports = reports.filter(report => 
    (report.patientId?.name || report.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Generating': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generatePDF = (reportData) => {
    const doc = new jsPDF();

    const studentName = reportData?.patientId?.name || 'Unknown Student';
    const screeningResult = reportData?.summary || reportData?.title || 'Not available';
    const therapyProgress = reportData?.therapyProgress || reportData?.strengths || 'Not available';
    const teacherNotes = reportData?.teacherNotes || reportData?.recommendations || 'Not available';
    const reportDate = reportData?.date ? new Date(reportData.date).toLocaleDateString() : 'N/A';

    let y = 20;
    const contentX = 14;
    const contentWidth = 182;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('ASD Screening Report', contentX, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Date: ${reportDate}`, contentX, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Student Name', contentX, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(studentName, contentX, y);
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Screening Result', contentX, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const screeningLines = doc.splitTextToSize(String(screeningResult), contentWidth);
    doc.text(screeningLines, contentX, y);
    y += screeningLines.length * 6 + 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Therapy Progress', contentX, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const therapyLines = doc.splitTextToSize(String(therapyProgress), contentWidth);
    doc.text(therapyLines, contentX, y);
    y += therapyLines.length * 6 + 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Teacher Notes', contentX, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const notesLines = doc.splitTextToSize(String(teacherNotes), contentWidth);
    doc.text(notesLines, contentX, y);

    const safeName = String(studentName).trim().replace(/\s+/g, '-').toLowerCase() || 'student';
    doc.save(`asd-screening-report-${safeName}.pdf`);
  };

  const handleDeleteReport = async (reportId) => {
    if (!reportId) return;

    setActionMessage({ type: '', text: '' });
    setReportToDelete(reportId);
  };

  const cancelDelete = () => {
    if (isDeleting) return;
    setReportToDelete(null);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/teacher/reports/${reportToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete report');
      }

      setReports((prev) => prev.filter((report) => String(report._id) !== String(reportToDelete)));
      setReportToDelete(null);
      setActionMessage({ type: 'success', text: 'Report deleted successfully.' });
      await fetchReports();
    } catch (error) {
      setActionMessage({ type: 'error', text: error.message || 'Failed to delete report.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/teacher" className="text-gray-600 hover:text-gray-800">
              <FaArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Student Reports</h1>
              <p className="text-gray-600">View and manage student progress reports</p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition font-semibold"
          >
            <FaFileAlt /> Create New Report
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports by student name or report type..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <FaFilter /> Filter
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Reports ({filteredReports.length})</h2>
          </div>
          {actionMessage.text && (
            <div className={`px-6 py-3 border-b text-sm ${actionMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {actionMessage.text}
            </div>
          )}
          {reportsError && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
              {reportsError}
            </div>
          )}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No reports found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <FaFileAlt className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{report.patientId?.name || report.patient?.name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FaCalendar className="mr-2 text-gray-400" />
                          {report.period}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(report.date || report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status === 'final' ? 'Ready' : 'Generating')}`}>
                          {report.status === 'final' ? 'Ready' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <FaEye />
                        </button>
                        <button
                          className="inline-flex items-center gap-2 text-green-600 hover:text-green-900"
                          onClick={() => generatePDF(report)}
                        >
                          <FaDownload /> Download PDF
                        </button>
                        <button
                          className="inline-flex items-center gap-2 text-red-600 hover:text-red-900 ml-3"
                          onClick={() => handleDeleteReport(report._id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-2xl font-bold text-gray-800">Create New Report</h3>
              <button onClick={closeCreateModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="px-6 py-5 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={newReport.studentId}
                  onChange={handleCreateFieldChange('studentId')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  required
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>{student.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newReport.title}
                  onChange={handleCreateFieldChange('title')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="Progress report title"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newReport.date}
                    onChange={handleCreateFieldChange('date')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <input
                    type="text"
                    value={newReport.period}
                    onChange={handleCreateFieldChange('period')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    placeholder="e.g., Q1 2026"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                <textarea
                  value={newReport.summary}
                  onChange={handleCreateFieldChange('summary')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strengths</label>
                <textarea
                  value={newReport.strengths}
                  onChange={handleCreateFieldChange('strengths')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
                <textarea
                  value={newReport.recommendations}
                  onChange={handleCreateFieldChange('recommendations')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-semibold disabled:bg-pink-300"
                >
                  {isCreating ? 'Saving...' : 'Save Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reportToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Delete Report</h3>
              <p className="text-sm text-gray-600 mt-1">Are you sure you want to delete this report permanently?</p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherReportsPage;
