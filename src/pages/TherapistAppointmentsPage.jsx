import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiFileText, FiSettings, FiLogOut, FiCalendar, FiHelpCircle, FiX, FiChevronDown } from 'react-icons/fi';
import '../styles/TherapistAppointments.css';

const TherapistAppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAssistant, setShowAssistant] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch profile
        const profileRes = await fetch('http://localhost:5000/api/therapist/profile', { headers });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUsername(profileData.username || profileData.email?.split('@')[0] || '');
        }

        // Fetch appointments
        const appointmentsRes = await fetch('http://localhost:5000/api/therapist/appointments', { headers });
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          console.log('Appointments fetched:', appointmentsData);
          setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
        } else {
          console.error('Appointments fetch failed:', appointmentsRes.status);
          setError(`Failed to fetch appointments: ${appointmentsRes.status}`);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === 'all') return true;
    return apt.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = String(dateString).split('T')[0].split('-').map(Number);
    if ([year, month, day].some(Number.isNaN)) return null;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = filteredAppointments.filter(apt => {
    const appointmentDate = parseDate(apt.date);
    if (!appointmentDate) return false;
    return appointmentDate >= today && apt.status?.toLowerCase() !== 'cancelled';
  });

  const pastAppointments = filteredAppointments.filter(apt => {
    const appointmentDate = parseDate(apt.date);
    if (!appointmentDate) return false;
    return appointmentDate < today;
  });

  const renderStatusBadge = (status) => {
    const statusMap = {
      'Pending': 'status-pending',
      'Scheduled': 'status-scheduled',
      'Completed': 'status-completed',
      'Cancelled': 'status-cancelled'
    };
    return <span className={`status-badge ${statusMap[status] || 'status-pending'}`}>{status}</span>;
  };

  const handleConfirm = async (appointmentId) => {
    try {
      setActionLoadingId(appointmentId);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/therapist/appointments/${appointmentId}/confirm`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to confirm appointment');
      }

      const updatedAppointment = await response.json();
      setAppointments(prev => prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const [rescheduleModal, setRescheduleModal] = useState({ isOpen: false, appointment: null, date: '', time: '' });

  const openRescheduleModal = (appointment) => {
    setRescheduleModal({
      isOpen: true,
      appointment,
      date: appointment.date,
      time: appointment.time
    });
  };

  const closeRescheduleModal = () => {
    setRescheduleModal({ isOpen: false, appointment: null, date: '', time: '' });
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModal.appointment) return;

    try {
      setActionLoadingId(rescheduleModal.appointment.id);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/therapist/appointments/${rescheduleModal.appointment.id}/reschedule`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date: rescheduleModal.date, time: rescheduleModal.time })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reschedule appointment');
      }

      const updatedAppointment = await response.json();
      setAppointments(prev => prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt));
      closeRescheduleModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="therapist-appointments-page">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>CORTEXA</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button onClick={() => handleNavClick('/therapist/dashboard')} className="nav-item">
            <FiHome className="nav-icon" />
            <span>Dashboard</span>
          </button>
          <button onClick={() => handleNavClick('/therapist/patients')} className="nav-item">
            <FiUsers className="nav-icon" />
            <span>My Patients</span>
          </button>
          <button onClick={() => handleNavClick('/therapist/schedule')} className="nav-item">
            <FiCalendar className="nav-icon" />
            <span>Schedule</span>
          </button>
          <button onClick={() => handleNavClick('/therapist/appointments')} className="nav-item active">
            <FiCalendar className="nav-icon" />
            <span>My Appointments</span>
          </button>
          <button onClick={() => handleNavClick('/therapist/slots')} className="nav-item">
            <FiCalendar className="nav-icon" />
            <span>Manage Slots</span>
          </button>
          <button onClick={() => handleNavClick('/therapist/questionnaires')} className="nav-item">
            <FiFileText className="nav-icon" />
            <span>Screening Results</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <hr className="sidebar-divider" />
          <button onClick={() => handleNavClick('/therapist/settings')} className="nav-item">
            <FiSettings className="nav-icon" />
            <span>Settings</span>
          </button>
          <button onClick={handleLogout} className="nav-item logout-btn">
            <FiLogOut className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="main-header">
          <div className="welcome-section">
            <h1 className="welcome-title">My Appointments</h1>
            <p className="welcome-subtitle">View and manage all your scheduled appointments</p>
          </div>
          <button className="assistant-trigger" onClick={() => setShowAssistant(true)}>
            <FiHelpCircle className="assistant-trigger-icon" />
            Support
          </button>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-group">
            <label>Status Filter:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button className="dismiss-btn" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading appointments...</p>
          </div>
        )}

        {/* Reschedule Modal */}
        {rescheduleModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Reschedule Appointment</h2>
                <button className="modal-close" onClick={closeRescheduleModal}>
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleRescheduleSubmit} className="appointment-form">
                <div className="form-grid">
                  <div className="form-section">
                    <div className="form-group">
                      <label className="form-label">Date *</label>
                      <input
                        type="date"
                        value={rescheduleModal.date || ''}
                        onChange={(e) => setRescheduleModal(prev => ({ ...prev, date: e.target.value }))}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time *</label>
                      <input
                        type="time"
                        value={rescheduleModal.time || ''}
                        onChange={(e) => setRescheduleModal(prev => ({ ...prev, time: e.target.value }))}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-btn secondary" onClick={closeRescheduleModal}>Cancel</button>
                  <button type="submit" className="modal-btn primary" disabled={actionLoadingId === rescheduleModal.appointment?.id}>
                    {actionLoadingId === rescheduleModal.appointment?.id ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* No Appointments */}
        {!loading && filteredAppointments.length === 0 && (
          <div className="empty-state">
            <p>No appointments found</p>
            <small>Appointments will appear here when they are booked</small>
          </div>
        )}

        {/* Upcoming Appointments */}
        {!loading && upcomingAppointments.length > 0 && (
          <div className="appointments-section">
            <h2 className="section-title">Upcoming Appointments ({upcomingAppointments.length})</h2>
            <div className="appointments-list">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-header">
                    <div className="appointment-title">
                      <h3>{apt.clientName || 'Patient'}</h3>
                      {renderStatusBadge(apt.status)}
                    </div>
                  </div>
                  <div className="appointment-details">
                    <div className="detail-row">
                      <span className="detail-label">Patient:</span>
                      <span className="detail-value">{apt.clientName || 'Unknown Patient'}</span>
                    </div>
                    {apt.parentName && (
                      <div className="detail-row">
                        <span className="detail-label">Parent/Guardian:</span>
                        <span className="detail-value">{apt.parentName}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{apt.date}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">{apt.time}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{apt.type || 'In-Person'}</span>
                    </div>
                    {apt.notes && (
                      <div className="detail-row">
                        <span className="detail-label">Notes:</span>
                        <span className="detail-value">{apt.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="appointment-actions">
                    <button
                      className="action-btn primary"
                      disabled={actionLoadingId === apt.id}
                      onClick={() => handleConfirm(apt.id)}
                    >
                      {actionLoadingId === apt.id ? 'Updating...' : 'Confirm'}
                    </button>
                    <button
                      className="action-btn secondary"
                      disabled={actionLoadingId === apt.id}
                      onClick={() => openRescheduleModal(apt)}
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Appointments */}
        {!loading && pastAppointments.length > 0 && (
          <div className="appointments-section">
            <h2 className="section-title">Past Appointments ({pastAppointments.length})</h2>
            <div className="appointments-list">
              {pastAppointments.map((apt) => (
                <div key={apt.id} className="appointment-card past">
                  <div className="appointment-header">
                    <div className="appointment-title">
                      <h3>{apt.clientName || 'Patient'}</h3>
                      {renderStatusBadge(apt.status)}
                    </div>
                  </div>
                  <div className="appointment-details">
                    <div className="detail-row">
                      <span className="detail-label">Patient:</span>
                      <span className="detail-value">{apt.clientName || 'Unknown Patient'}</span>
                    </div>
                    {apt.parentName && (
                      <div className="detail-row">
                        <span className="detail-label">Parent/Guardian:</span>
                        <span className="detail-value">{apt.parentName}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{apt.date}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">{apt.time}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{apt.type || 'In-Person'}</span>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button className="action-btn secondary">View Summary</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assistant Widget */}
      {showAssistant && (
        <div className="assistant-overlay">
          <div className="assistant-widget">
            <div className="assistant-header">
              <div className="assistant-title">Therapist AI Assistant</div>
              <button className="assistant-close" onClick={() => setShowAssistant(false)}>
                <FiX />
              </button>
            </div>
            <div className="assistant-body">
              <div className="assistant-message assistant-message-bot">
                Welcome! I'm here to help manage your appointments. You can ask me to reschedule, find specific patients, or answer questions.
              </div>
            </div>
            <div className="assistant-input-row">
              <input type="text" placeholder="Ask the assistant..." className="assistant-input" />
              <button className="assistant-send">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistAppointmentsPage;