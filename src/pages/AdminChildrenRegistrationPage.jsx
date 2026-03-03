import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaUser, FaFileAlt, FaClipboardList, FaCalendar, FaSearch, 
  FaPlus, FaEye, FaDownload, FaCheckCircle, FaTimesCircle, FaFilter, FaPhone, FaEnvelope
} from 'react-icons/fa';

const AdminChildrenRegistrationPage = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedChild, setSelectedChild] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchChildrenData();
    fetchTherapists();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      setSelectedTherapist(selectedChild.therapist_user_id || '');
    }
  }, [selectedChild]);

  const fetchChildrenData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/children-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setChildren(data);
      }
    } catch (error) {
      console.error('Error fetching children data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTherapists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/therapists', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTherapists(data);
      }
    } catch (error) {
      console.error('Error fetching therapists:', error);
    }
  };

  const handleAssignTherapist = async () => {
    if (!selectedChild || !selectedTherapist) {
      alert('Please select a therapist');
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/admin/children/${selectedChild._id}/assign-therapist`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ therapistId: selectedTherapist })
        }
      );

      if (response.ok) {
        const result = await response.json();
        setChildren(children.map(c => 
          c._id === selectedChild._id 
            ? { ...c, therapist_user_id: selectedTherapist }
            : c
        ));
        setSelectedChild({ ...selectedChild, therapist_user_id: selectedTherapist });
        alert('Therapist assigned successfully!');
      } else {
        alert('Failed to assign therapist');
      }
    } catch (error) {
      console.error('Error assigning therapist:', error);
      alert('Error assigning therapist');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignTherapist = async () => {
    if (!selectedChild) return;

    try {
      setAssigning(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/admin/children/${selectedChild._id}/unassign-therapist`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setChildren(children.map(c => 
          c._id === selectedChild._id 
            ? { ...c, therapist_user_id: null }
            : c
        ));
        setSelectedChild({ ...selectedChild, therapist_user_id: null });
        setSelectedTherapist('');
        alert('Therapist unassigned successfully!');
      } else {
        alert('Failed to unassign therapist');
      }
    } catch (error) {
      console.error('Error unassigning therapist:', error);
      alert('Error unassigning therapist');
    } finally {
      setAssigning(false);
    }
  };

  const filteredChildren = children.filter((child) => {
    const matchesSearch = 
      child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.parent_id?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.parent_id?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'pending' && child.screeningStatus === 'pending') ||
      (filterStatus === 'completed' && child.screeningStatus === 'completed') ||
      (filterStatus === 'high-risk' && child.riskLevel === 'High');

    return matchesSearch && matchesFilter;
  });

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'High':
        return 'text-red-600 bg-red-50';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'Low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getRiskLevelBadgeColor = (level) => {
    switch (level) {
      case 'High':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'Medium':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'Low':
        return 'bg-green-100 text-green-800 border border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const handleRegisterNew = () => {
    // Navigate to registration form or open modal
    navigate('/admin/dashboard'); // Adjust path as needed
  };

  const handleDownloadReport = () => {
    if (selectedChild?.reportData) {
      // Implement download logic
      console.log('Downloading report for:', selectedChild.name);
    }
  };

  const handleApprove = () => {
    console.log('Approving child:', selectedChild.name);
    // Implement approval logic
  };

  const handleReject = () => {
    console.log('Rejecting child:', selectedChild.name);
    // Implement rejection logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 p-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
          title="Back to Dashboard"
        >
          <FaArrowLeft className="text-2xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800">Child Registration Management</h1>
          <p className="text-gray-600 text-sm mt-1">Manage screening data and reports for registered children</p>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        {/* Controls Bar */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, parent, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative flex items-center gap-2 w-full md:w-auto">
              <FaFilter className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Screening</option>
                <option value="completed">Completed Screening</option>
                <option value="high-risk">High Risk</option>
              </select>
            </div>

            {/* Add New Child Button */}
            <button
              onClick={handleRegisterNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <FaPlus className="text-lg" />
              Register New Child
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow-md border border-gray-200">
            <div className="text-center">
              <div className="inline-block animate-spin">
                <FaUser className="text-5xl text-blue-400" />
              </div>
              <p className="text-gray-600 text-lg mt-4 font-semibold">Loading children data...</p>
            </div>
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow-md border border-gray-200">
            <div className="text-center">
              <FaUser className="text-7xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold">No children found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter criteria</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
            {/* Master: Child List Table */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">
                  Children List ({filteredChildren.length})
                </h3>
              </div>
              
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Age</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChildren.map((child) => (
                      <tr
                        key={child._id}
                        className={`border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer ${
                          selectedChild?._id === child._id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        <td
                          className="px-4 py-3 font-semibold text-gray-800"
                          onClick={() => setSelectedChild(child)}
                        >
                          {child.name}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{child.age} y</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(child.screeningStatus)}`}>
                            {child.screeningStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedChild(child)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded transition-colors"
                            title="View details"
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail: Child Details Pane */}
            {selectedChild ? (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Child Details</h3>
                  <button
                    onClick={() => setSelectedChild(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="Close details"
                  >
                    ✕
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                  {/* Child Basic Info */}
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedChild.name}</h2>
                        <p className="text-gray-600 text-sm mt-1">
                          {selectedChild.age} years old • {selectedChild.gender}
                        </p>
                      </div>
                      {selectedChild.riskLevel && (
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRiskLevelBadgeColor(selectedChild.riskLevel)}`}>
                          {selectedChild.riskLevel} Risk
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-6">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">Parent Name</p>
                        <p className="text-gray-800 font-semibold">{selectedChild.parent_id?.username || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
                          <FaEnvelope /> Email
                        </p>
                        <p className="text-gray-800 text-sm break-all">{selectedChild.parent_id?.email || 'N/A'}</p>
                      </div>
                      {selectedChild.parent_id?.phone && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-2">
                          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
                            <FaPhone /> Phone
                          </p>
                          <p className="text-gray-800 font-semibold">{selectedChild.parent_id.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registration Info */}
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3">Registration Date</p>
                    <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <FaCalendar className="text-blue-600 text-lg" />
                      <span className="text-gray-800">
                        {new Date(selectedChild.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {new Date(selectedChild.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Screening Information */}
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FaClipboardList className="text-blue-600" />
                      Screening Information
                    </h3>
                    {selectedChild.screeningData ? (
                      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Status</p>
                            <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusBadgeColor(selectedChild.screeningStatus)}`}>
                              {selectedChild.screeningStatus}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Risk Level</p>
                            <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${getRiskLevelBadgeColor(selectedChild.riskLevel)}`}>
                              {selectedChild.riskLevel || 'Not assessed'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Screening Type</p>
                            <p className="text-gray-800">{selectedChild.screeningType || 'Standard'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Submitted Date</p>
                            <p className="text-gray-800">
                              {selectedChild.submittedDate 
                                ? new Date(selectedChild.submittedDate).toLocaleDateString() 
                                : 'Pending'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-yellow-800 font-semibold">No screening data available yet</p>
                      </div>
                    )}
                  </div>

                  {/* Medical History */}
                  {selectedChild.medical_history && (
                    <div className="mb-8 pb-8 border-b border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Medical History</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-800 leading-relaxed">{selectedChild.medical_history}</p>
                      </div>
                    </div>
                  )}

                  {/* Report Information */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FaFileAlt className="text-green-600" />
                      Report Information
                    </h3>
                    {selectedChild.reportData ? (
                      <div className="bg-green-50 p-6 rounded-lg border border-green-200 space-y-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Status</p>
                            <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusBadgeColor(selectedChild.reportStatus)}`}>
                              {selectedChild.reportStatus}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Generated Date</p>
                            <p className="text-gray-800">
                              {selectedChild.reportData?.createdAt 
                                ? new Date(selectedChild.reportData.createdAt).toLocaleDateString() 
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleDownloadReport}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <FaDownload />
                          Download Report
                        </button>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-yellow-800 font-semibold">No report generated yet</p>
                      </div>
                    )}
                  </div>

                  {/* Therapist Assignment */}
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Therapist Assignment</h3>
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 space-y-4">
                      <div>
                        <label className="block text-xs text-gray-600 font-semibold uppercase tracking-wide mb-3">
                          Assign Therapist
                        </label>
                        <select
                          value={selectedTherapist}
                          onChange={(e) => setSelectedTherapist(e.target.value)}
                          disabled={assigning}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">-- Select a Therapist --</option>
                          {therapists.map((therapist) => (
                            <option key={therapist.id} value={therapist.id}>
                              {therapist.name} ({therapist.email})
                            </option>
                          ))}
                        </select>
                        {therapists.length === 0 && (
                          <p className="text-sm text-purple-700 mt-2">No active therapists available</p>
                        )}
                      </div>

                      {selectedChild?.therapist_user_id && (
                        <div className="bg-white p-3 rounded border border-purple-300 text-sm">
                          <p className="text-gray-700">
                            <span className="font-semibold">Currently assigned to:</span> {selectedChild.therapist_user_id}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={handleAssignTherapist}
                          disabled={assigning || !selectedTherapist || selectedTherapist === selectedChild?.therapist_user_id}
                          className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          {assigning ? 'Assigning...' : 'Assign Therapist'}
                        </button>
                        {selectedChild?.therapist_user_id && (
                          <button
                            onClick={handleUnassignTherapist}
                            disabled={assigning}
                            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            {assigning ? 'Unassigning...' : 'Remove Therapist'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FaCheckCircle />
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FaTimesCircle />
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <FaUser className="text-7xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-semibold">Select a child from the list</p>
                  <p className="text-gray-500 text-sm mt-2">to view detailed information</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChildrenRegistrationPage;