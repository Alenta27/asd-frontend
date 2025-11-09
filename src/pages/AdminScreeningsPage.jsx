import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaSearch, FaFilter, FaEye, FaDownload, FaTrash, FaEdit,
  FaTimes, FaCheck, FaCalendar
} from 'react-icons/fa';

const AdminScreeningsPage = () => {
  const navigate = useNavigate();
  const [screenings, setScreenings] = useState([]);
  const [filteredScreenings, setFilteredScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [screeningToDelete, setScreeningToDelete] = useState(null);
  const [error, setError] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Filter state
  const [filters, setFilters] = useState({
    riskLevels: [],
    statuses: [],
    types: [],
    dateRange: { start: '', end: '' }
  });

  // Mock data - replace with API call
  const defaultScreenings = [
    { id: 1, childName: 'Alice Johnson', parentName: 'John Johnson', type: 'Questionnaire', date: '2024-01-15', riskLevel: 'Low', status: 'Completed' },
    { id: 2, childName: 'Ben Carter', parentName: 'Sarah Carter', type: 'Image Analysis', date: '2024-01-14', riskLevel: 'Medium', status: 'Completed' },
    { id: 3, childName: 'Chloe Singh', parentName: 'Raj Singh', type: 'Speech Analysis', date: '2024-01-13', riskLevel: 'High', status: 'Completed' },
    { id: 4, childName: 'Daniel Kim', parentName: 'Lisa Kim', type: 'Questionnaire', date: '2024-01-12', riskLevel: 'Medium', status: 'In Progress' },
    { id: 5, childName: 'Emma Wilson', parentName: 'Mike Wilson', type: 'Image Analysis', date: '2024-01-11', riskLevel: 'Low', status: 'Completed' },
  ];

  // Load screenings on component mount
  useEffect(() => {
    loadScreenings();
  }, []);

  const loadScreenings = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/screenings');
      // const data = await response.json();
      // setScreenings(data);
      setScreenings(defaultScreenings);
    } catch (err) {
      setError('Failed to load screenings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter screenings based on search and filter criteria
  useEffect(() => {
    let filtered = [...screenings];

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.childName.toLowerCase().includes(lowerSearch) ||
        s.parentName.toLowerCase().includes(lowerSearch) ||
        s.type.toLowerCase().includes(lowerSearch)
      );
    }

    // Risk level filter
    if (filters.riskLevels.length > 0) {
      filtered = filtered.filter(s => filters.riskLevels.includes(s.riskLevel));
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(s => filters.statuses.includes(s.status));
    }

    // Type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(s => filters.types.includes(s.type));
    }

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(s => new Date(s.date) >= new Date(filters.dateRange.start));
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(s => new Date(s.date) <= new Date(filters.dateRange.end));
    }

    setFilteredScreenings(filtered);
  }, [screenings, searchTerm, filters]);

  // Debounced search handler
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      // Optional: Could trigger additional API calls here with filters
    }, 300);
  }, []);

  // Filter handlers
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (filterType === 'riskLevels' || filterType === 'statuses' || filterType === 'types') {
        const array = updated[filterType];
        if (array.includes(value)) {
          updated[filterType] = array.filter(item => item !== value);
        } else {
          updated[filterType] = [...array, value];
        }
      } else if (filterType === 'dateRange') {
        updated.dateRange = { ...updated.dateRange, ...value };
      }
      return updated;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      riskLevels: [],
      statuses: [],
      types: [],
      dateRange: { start: '', end: '' }
    });
  };

  // Action handlers
  const handleViewScreening = (screeningId) => {
    navigate(`/admin/screenings/${screeningId}`);
  };

  const handleEditScreening = (screeningId) => {
    navigate(`/admin/screenings/${screeningId}/edit`);
  };

  const handleDownloadReport = async (screening) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/screenings/${screening.id}/download`);
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `screening-${screening.childName}-${screening.date}.pdf`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
      alert(`Downloading report for ${screening.childName}`);
    } catch (err) {
      console.error('Failed to download report:', err);
      setError('Failed to download report');
    }
  };

  const handleDeleteClick = (screening) => {
    setScreeningToDelete(screening);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!screeningToDelete) return;
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/screenings/${screeningToDelete.id}`, {
      //   method: 'DELETE'
      // });
      // if (!response.ok) throw new Error('Failed to delete');
      setScreenings(prev => prev.filter(s => s.id !== screeningToDelete.id));
      setShowDeleteModal(false);
      setScreeningToDelete(null);
    } catch (err) {
      console.error('Failed to delete screening:', err);
      setError('Failed to delete screening');
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-600 hover:text-gray-800 transition-colors">
              <FaArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Screening Management</h1>
              <p className="text-gray-600">Monitor and manage all screening activities</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search screenings by child name, parent, or type..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilterModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <FaFilter /> Filter
            </button>
          </div>
        </div>

        {/* Screenings Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
            <h2 className="text-xl font-semibold text-gray-800">
              All Screenings ({filteredScreenings.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <p>Loading screenings...</p>
            </div>
          ) : filteredScreenings.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <p>No screenings found. {searchTerm || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v) ? 'Try adjusting your search or filters.' : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredScreenings.map((screening, idx) => (
                    <tr 
                      key={screening.id} 
                      className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewScreening(screening.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                        >
                          {screening.childName}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{screening.parentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 font-medium">
                          {screening.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {screening.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(screening.riskLevel)}`}>
                          {screening.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(screening.status)}`}>
                          {screening.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-3 items-center">
                          <button
                            onClick={() => handleViewScreening(screening.id)}
                            title="View Report"
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEditScreening(screening.id)}
                            title="Edit Screening"
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDownloadReport(screening)}
                            title="Download Report"
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          >
                            <FaDownload />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(screening)}
                            title="Delete Screening"
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Filter Screenings</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Risk Level Filter */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Risk Level</h4>
                <div className="space-y-2">
                  {['Low', 'Medium', 'High'].map(level => (
                    <label key={level} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.riskLevels.includes(level)}
                        onChange={(e) => handleFilterChange('riskLevels', level)}
                        className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Status</h4>
                <div className="space-y-2">
                  {['Completed', 'In Progress', 'Pending'].map(status => (
                    <label key={status} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.statuses.includes(status)}
                        onChange={(e) => handleFilterChange('statuses', status)}
                        className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Type</h4>
                <div className="space-y-2">
                  {['Questionnaire', 'Image Analysis', 'Speech Analysis'].map(type => (
                    <label key={type} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type)}
                        onChange={(e) => handleFilterChange('types', type)}
                        className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FaCalendar /> Date Range
                </h4>
                <div className="space-y-3">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleFilterChange('dateRange', { start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleFilterChange('dateRange', { end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleResetFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && screeningToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Delete Screening</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to delete the screening for{' '}
                <span className="font-semibold text-gray-900">{screeningToDelete.childName}</span>?
              </p>
              <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScreeningsPage;
