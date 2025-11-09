import React, { useState, useEffect } from 'react';
import { FaBell, FaExclamationCircle, FaCheckCircle, FaClipboardList, FaFileAlt, FaTimes } from 'react-icons/fa';

const NotificationPanel = ({ onClose }) => {
  const [notifications, setNotifications] = useState({
    pendingTherapists: 0,
    recentRegistrations: 0,
    pendingScreenings: 0,
    pendingReports: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    fetchNotifications();
    fetchRecentRequests();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/recent-therapist-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentRequests(data);
      }
    } catch (error) {
      console.error('Error fetching recent requests:', error);
    }
  };

  const getTotalNotifications = () => {
    return notifications.pendingTherapists + notifications.recentRegistrations + 
           notifications.pendingScreenings + notifications.pendingReports;
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FaBell className="text-white text-xl" />
          <h2 className="text-white font-bold text-lg">Notifications</h2>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-blue-500 p-2 rounded-lg transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      {/* Notification Summary */}
      <div className="p-6 border-b border-gray-200 bg-blue-50">
        <p className="text-sm text-gray-600 mb-4">You have <span className="font-bold text-blue-600">{getTotalNotifications()}</span> pending items</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <FaExclamationCircle className="text-red-500" />
              <div>
                <p className="text-xs text-gray-600">Therapist Requests</p>
                <p className="text-xl font-bold text-red-600">{notifications.pendingTherapists}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-yellow-500" />
              <div>
                <p className="text-xs text-gray-600">New Registrations</p>
                <p className="text-xl font-bold text-yellow-600">{notifications.recentRegistrations}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2">
              <FaClipboardList className="text-purple-500" />
              <div>
                <p className="text-xs text-gray-600">Pending Screenings</p>
                <p className="text-xl font-bold text-purple-600">{notifications.pendingScreenings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <FaFileAlt className="text-green-500" />
              <div>
                <p className="text-xs text-gray-600">Pending Reports</p>
                <p className="text-xl font-bold text-green-600">{notifications.pendingReports}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Therapist Requests */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaExclamationCircle className="text-red-500" />
          Recent Therapist Requests
        </h3>
        
        {recentRequests.length > 0 ? (
          <div className="space-y-3">
            {recentRequests.map((request) => (
              <div key={request._id} className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
                <p className="font-semibold text-gray-800">{request.username}</p>
                <p className="text-sm text-gray-600">{request.email}</p>
                <div className="flex gap-2 mt-3">
                  <a
                    href="/admin/therapist-approvals"
                    className="flex-1 text-center px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                  >
                    Review
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaCheckCircle className="text-4xl mx-auto mb-2 text-green-500" />
            <p>No pending therapist requests</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <a
          href="/admin/therapist-approvals"
          className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          View All Requests
        </a>
      </div>
    </div>
  );
};

export default NotificationPanel;