import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiEdit2, FiPlus } from 'react-icons/fi';
import './AppointmentManager.css';

const AppointmentManager = ({ patientId, therapistId }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('complete');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const endpoint = patientId
          ? `http://localhost:5000/api/therapist/appointments?patientId=${patientId}`
          : 'http://localhost:5000/api/therapist/appointments';

        const response = await fetch(endpoint, { headers });

        if (!response.ok) throw new Error('Failed to fetch appointments');

        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching appointments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [patientId]);

  const handleCompleteSession = async () => {
    if (!selectedAppointment) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const payload = {
        appointmentId: selectedAppointment._id,
        status: 'Completed',
        clinicalNotes,
      };

      const response = await fetch(
        'http://localhost:5000/api/therapist/appointments/complete-session',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error('Failed to complete session');

      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === selectedAppointment._id
            ? { ...apt, status: 'Completed', clinicalNotes }
            : apt
        )
      );

      setShowModal(false);
      setClinicalNotes('');
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Error completing session:', err);
      alert('Failed to complete session: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(
        `http://localhost:5000/api/therapist/appointments/${appointmentId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) throw new Error('Failed to cancel appointment');

      setAppointments((prev) => prev.filter((apt) => apt._id !== appointmentId));
    } catch (err) {
      console.error('Error canceling appointment:', err);
      alert('Failed to cancel appointment: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Scheduled: { bg: '#dbeafe', text: '#1e40af', label: 'Scheduled' },
      Pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
      Completed: { bg: '#dcfce7', text: '#166534', label: 'Completed' },
      Cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled' },
    };
    return statusMap[status] || statusMap.Scheduled;
  };

  if (loading) {
    return <div className="appointment-manager-loading">Loading appointments...</div>;
  }

  if (error) {
    return <div className="appointment-manager-error">Error: {error}</div>;
  }

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'Scheduled' || apt.status === 'Pending'
  );
  const completedAppointments = appointments.filter((apt) => apt.status === 'Completed');

  return (
    <div className="appointment-manager-container">
      <div className="appointment-manager-header">
        <h3 className="appointment-manager-title">Session Management</h3>
        <button className="appointment-new-btn">
          <FiPlus /> Schedule New Session
        </button>
      </div>

      {/* Upcoming Appointments */}
      <div className="appointment-section">
        <h4 className="appointment-section-title">
          Upcoming Sessions ({upcomingAppointments.length})
        </h4>

        {upcomingAppointments.length === 0 ? (
          <div className="appointment-empty">No upcoming sessions scheduled</div>
        ) : (
          <div className="appointment-list">
            {upcomingAppointments.map((apt) => {
              const statusInfo = getStatusBadge(apt.status);
              return (
                <div key={apt._id} className="appointment-item">
                  <div className="appointment-item-info">
                    <div className="appointment-date-time">
                      <span className="appointment-date">
                        {new Date(apt.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="appointment-time">{apt.time || '10:00 AM'}</span>
                    </div>
                    <div className="appointment-details">
                      <p className="appointment-patient">
                        <strong>{apt.clientName || apt.patientName || 'Patient'}</strong>
                      </p>
                      {apt.notes && <p className="appointment-notes">{apt.notes}</p>}
                    </div>
                  </div>
                  <div className="appointment-item-actions">
                    <span
                      className="appointment-status-badge"
                      style={{
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.text,
                      }}
                    >
                      {statusInfo.label}
                    </span>
                    <button
                      className="appointment-action-btn complete-btn"
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setModalType('complete');
                        setShowModal(true);
                      }}
                      title="Mark session as completed"
                    >
                      <FiCheck />
                    </button>
                    <button
                      className="appointment-action-btn cancel-btn"
                      onClick={() => handleCancelAppointment(apt._id)}
                      title="Cancel appointment"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Completed Sessions */}
      {completedAppointments.length > 0 && (
        <div className="appointment-section">
          <h4 className="appointment-section-title">
            Recent Sessions ({completedAppointments.slice(0, 5).length})
          </h4>
          <div className="appointment-list">
            {completedAppointments.slice(0, 5).map((apt) => {
              const statusInfo = getStatusBadge(apt.status);
              return (
                <div key={apt._id} className="appointment-item completed">
                  <div className="appointment-item-info">
                    <div className="appointment-date-time">
                      <span className="appointment-date">
                        {new Date(apt.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="appointment-time">{apt.time || '10:00 AM'}</span>
                    </div>
                    <div className="appointment-details">
                      <p className="appointment-patient">
                        <strong>{apt.clientName || apt.patientName || 'Patient'}</strong>
                      </p>
                      {apt.clinicalNotes && (
                        <p className="appointment-notes">Notes: {apt.clinicalNotes}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className="appointment-status-badge"
                    style={{
                      backgroundColor: statusInfo.bg,
                      color: statusInfo.text,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for completing session */}
      {showModal && selectedAppointment && (
        <div className="appointment-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Complete Session</h4>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-content">
              <p className="modal-subtitle">
                Session with <strong>{selectedAppointment.clientName || 'Patient'}</strong> on{' '}
                {new Date(selectedAppointment.date).toLocaleDateString()}
              </p>
              <div className="modal-form-group">
                <label className="modal-label">Clinical Notes</label>
                <textarea
                  className="modal-textarea"
                  placeholder="Document key observations, behaviors, interventions used, and patient response..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="modal-btn submit-btn"
                onClick={handleCompleteSession}
                disabled={submitting || !clinicalNotes.trim()}
              >
                {submitting ? 'Saving...' : 'Complete Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManager;
