import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaDownload, FaSpinner } from 'react-icons/fa';

const TherapistApprovalsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    fetchTherapistRequests();
  }, []);

  const fetchTherapistRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/therapist-requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`http://localhost:5000/api/admin/therapist-requests/${userId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to approve therapist');
      setRequests(requests.filter(r => r._id !== userId));
    } catch (err) {
      alert('Error approving therapist: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    try {
      setActionLoading(userId);
      const reason = rejectReason[userId] || '';
      const response = await fetch(`http://localhost:5000/api/admin/therapist-requests/${userId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to reject therapist');
      setRequests(requests.filter(r => r._id !== userId));
      setShowRejectModal(null);
    } catch (err) {
      alert('Error rejecting therapist: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <FaSpinner className="text-4xl text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin" className="text-gray-600 hover:text-gray-800">
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Therapist Registration Requests</h1>
            <p className="text-gray-600">Review and approve pending therapist registrations</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No pending therapist registration requests.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <div key={request._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: User Info */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">{request.username}</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Email:</span> {request.email}</p>
                      <p><span className="font-medium">Status:</span> <span className="text-yellow-600 font-semibold">Pending Review</span></p>
                      <p><span className="font-medium">Applied:</span> {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Middle: Credentials */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Credentials</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">License Number:</p>
                        <p className="font-mono text-sm bg-gray-100 p-2 rounded">{request.licenseNumber || 'N/A'}</p>
                      </div>
                      {request.doctoraldegreeUrl && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Degree Certificate:</p>
                          <a
                            href={`http://localhost:5000/credentials/${request.doctoraldegreeUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <FaDownload /> View File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleApprove(request._id)}
                      disabled={actionLoading === request._id}
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {actionLoading === request._id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                      {actionLoading === request._id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setShowRejectModal(request._id)}
                      disabled={actionLoading === request._id}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {actionLoading === request._id ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                      {actionLoading === request._id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>

                {/* Reject Modal */}
                {showRejectModal === request._id && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for rejection (optional):
                    </label>
                    <textarea
                      value={rejectReason[request._id] || ''}
                      onChange={(e) => setRejectReason({ ...rejectReason, [request._id]: e.target.value })}
                      placeholder="Enter reason..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm mb-3"
                      rows="3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(request._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => setShowRejectModal(null)}
                        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistApprovalsPage;
