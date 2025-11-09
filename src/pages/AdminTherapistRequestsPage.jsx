import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaFile, FaUser, FaEnvelope, FaPhone, FaCalendar } from 'react-icons/fa';

const AdminTherapistRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/therapist-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching therapist requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this therapist?')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/admin/therapist-requests/${userId}/approve`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        alert('Therapist approved successfully!');
        setRequests(requests.filter(r => r._id !== userId));
        setSelectedRequest(null);
      } else {
        alert('Failed to approve therapist');
      }
    } catch (error) {
      console.error('Error approving therapist:', error);
      alert('Error approving therapist');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this therapist?')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/admin/therapist-requests/${userId}/reject`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: rejectReason })
        }
      );

      if (response.ok) {
        alert('Therapist rejected successfully!');
        setRequests(requests.filter(r => r._id !== userId));
        setSelectedRequest(null);
        setRejectReason('');
      } else {
        alert('Failed to reject therapist');
      }
    } catch (error) {
      console.error('Error rejecting therapist:', error);
      alert('Error rejecting therapist');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md p-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FaArrowLeft className="text-2xl" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Therapist Requests</h1>
          <p className="text-gray-600">{requests.length} pending request(s)</p>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <FaCheckCircle className="text-6xl text-green-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No pending therapist requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Request List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {requests.map((request) => (
                  <button
                    key={request._id}
                    onClick={() => setSelectedRequest(request)}
                    className={`w-full p-4 border-b border-gray-200 text-left hover:bg-blue-50 transition-colors ${
                      selectedRequest?._id === request._id ? 'bg-blue-100' : ''
                    }`}
                  >
                    <p className="font-semibold text-gray-800">{request.username}</p>
                    <p className="text-sm text-gray-600">{request.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Applied: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Request Details */}
            {selectedRequest && (
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-8">
                  {/* Header */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedRequest.username}</h2>
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaEnvelope className="text-blue-600" />
                        <span>{selectedRequest.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold mb-1">Application Date</p>
                      <p className="text-gray-800">
                        <FaCalendar className="inline mr-2 text-gray-500" />
                        {new Date(selectedRequest.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-semibold mb-1">License Number</p>
                      <p className="text-gray-800">{selectedRequest.licenseNumber || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  {selectedRequest.doctoraldegreeUrl && (
                    <div className="mb-8 pb-8 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaFile className="text-blue-600" />
                        Credentials
                      </h3>
                      <a
                        href={selectedRequest.doctoraldegreeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <FaFile /> View Doctoral Degree
                      </a>
                    </div>
                  )}

                  {/* Rejection Reason (if needed) */}
                  <div className="mb-8">
                    <label className="block text-gray-700 font-semibold mb-3">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows="4"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(selectedRequest._id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      <FaCheckCircle /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest._id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      <FaTimesCircle /> Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTherapistRequestsPage;