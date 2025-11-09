import React, { useState } from 'react';
import { FiCalendar, FiClock, FiUser, FiMapPin, FiVideo, FiPhone, FiMail, FiPlus, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import './BookAppointmentPage.css';

const BookAppointmentPage = () => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patientName: 'Emma Johnson',
      patientAge: 6,
      parentName: 'Sarah Johnson',
      parentEmail: 'sarah.j@email.com',
      parentPhone: '+1 (555) 123-4567',
      therapist: 'Alby Biju',
      appointmentType: 'In-Person',
      date: '2024-01-15',
      time: '10:00 AM',
      duration: 45,
      status: 'Confirmed',
      notes: 'Follow-up session for speech therapy progress',
      location: 'Office Room 2A'
    },
    {
      id: 2,
      patientName: 'Liam Chen',
      patientAge: 8,
      parentName: 'Michael Chen',
      parentEmail: 'm.chen@email.com',
      parentPhone: '+1 (555) 987-6543',
      therapist: 'Dr. Ravi Mohan',
      appointmentType: 'Telehealth',
      date: '2024-01-16',
      time: '2:30 PM',
      duration: 30,
      status: 'Pending',
      notes: 'Initial assessment for behavioral concerns',
      location: 'Video Call'
    },
    {
      id: 3,
      patientName: 'Sophia Rodriguez',
      patientAge: 5,
      parentName: 'Maria Rodriguez',
      parentEmail: 'maria.r@email.com',
      parentPhone: '+1 (555) 456-7890',
      therapist: 'Alen Tom',
      appointmentType: 'In-Person',
      date: '2024-01-17',
      time: '9:15 AM',
      duration: 60,
      status: 'Completed',
      notes: 'Social skills development session',
      location: 'Office Room 1B'
    }
  ]);

  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    therapist: '',
    appointmentType: 'In-Person',
    date: '',
    time: '',
    duration: 45,
    notes: '',
    location: ''
  });

  const therapists = [
    { id: 1, name: 'Yuvraj Singh', specialty: 'ASD Therapy & Support', email: 'yuvrajsingh04@gmail.com' },
    { id: 2, name: 'Dr. Ravi Mohan', specialty: 'Behavioral Therapy', email: 'ravimohan0@gmail.com' },
    { id: 3, name: 'Alby Biju', specialty: 'Speech & Language Therapy', email: 'albymbiju2002@gmail.com' },
    { id: 4, name: 'Dr. Rao Thomas', specialty: 'Occupational Therapy', email: 'raothomas2003@gmail.com' },
    { id: 5, name: 'Alen Tom', specialty: 'Social Skills Development', email: 'alentatom2026@mca.ajce.in' },
    { id: 6, name: 'Dr. Mathews V Pothen', specialty: 'Cognitive Behavioral Therapy', email: 'mathewsvp00@gmail.com' }
  ];

  // Debug: Log therapists to console
  console.log('Therapists available:', therapists);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAppointment = {
      id: appointments.length + 1,
      ...formData,
      status: 'Pending'
    };
    setAppointments(prev => [...prev, newAppointment]);
    setFormData({
      patientName: '',
      patientAge: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      therapist: '',
      appointmentType: 'In-Person',
      date: '',
      time: '',
      duration: 45,
      notes: '',
      location: ''
    });
    setShowBookingForm(false);
  };

  const updateAppointmentStatus = (id, status) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status } : apt
    ));
  };

  const deleteAppointment = (id) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeIcon = (type) => {
    return type === 'Telehealth' ? <FiVideo className="w-4 h-4" /> : <FiMapPin className="w-4 h-4" />;
  };

  return (
    <div className="appointment-booking-container">
      {/* Header */}
      <div className="appointment-header">
        <div className="header-content">
          <h1 className="page-title">
            <FiCalendar className="title-icon" />
            Appointment Management
          </h1>
          <p className="page-subtitle">Schedule and manage therapy sessions with your patients</p>
        </div>
        <button 
          className="new-appointment-btn"
          onClick={() => setShowBookingForm(true)}
        >
          <FiPlus className="w-5 h-5" />
          Book New Appointment
        </button>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600">
            <FiCalendar className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{appointments.length}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-100 text-green-600">
            <FiCheck className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{appointments.filter(apt => apt.status === 'Confirmed').length}</div>
            <div className="stat-label">Confirmed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-yellow-100 text-yellow-600">
            <FiClock className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{appointments.filter(apt => apt.status === 'Pending').length}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-purple-100 text-purple-600">
            <FiVideo className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{appointments.filter(apt => apt.appointmentType === 'Telehealth').length}</div>
            <div className="stat-label">Telehealth</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-indigo-100 text-indigo-600">
            <FiUser className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{therapists.length}</div>
            <div className="stat-label">Available Therapists</div>
          </div>
        </div>
      </div>

      {/* Debug: Show therapists list */}
      <div style={{ 
        background: 'white', 
        padding: '1rem', 
        marginBottom: '2rem', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Available Therapists (Debug):</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          {therapists.map((therapist) => (
            <li key={therapist.id} style={{ marginBottom: '0.5rem', color: '#64748b' }}>
              <strong>{therapist.name}</strong> - {therapist.specialty}
            </li>
          ))}
        </ul>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Book New Appointment</h2>
              <button 
                className="modal-close"
                onClick={() => setShowBookingForm(false)}
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="appointment-form">
              <div className="form-grid">
                {/* Patient Information */}
                <div className="form-section">
                  <h3 className="section-title">Patient Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Patient Name *</label>
                      <input
                        type="text"
                        name="patientName"
                        value={formData.patientName}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Age *</label>
                      <input
                        type="number"
                        name="patientAge"
                        value={formData.patientAge}
                        onChange={handleInputChange}
                        className="form-input"
                        min="1"
                        max="18"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Parent/Guardian Information */}
                <div className="form-section">
                  <h3 className="section-title">Parent/Guardian Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Parent Name *</label>
                      <input
                        type="text"
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        name="parentEmail"
                        value={formData.parentEmail}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Phone Number *</label>
                      <input
                        type="tel"
                        name="parentPhone"
                        value={formData.parentPhone}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="form-section">
                  <h3 className="section-title">Appointment Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Select Therapist *</label>
                      <select
                        name="therapist"
                        value={formData.therapist}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                        style={{ 
                          display: 'block', 
                          width: '100%',
                          backgroundColor: 'white',
                          border: '2px solid #e5e7eb',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          fontSize: '1rem'
                        }}
                      >
                        <option value="">Choose a therapist...</option>
                        {therapists.map((therapist) => (
                          <option key={therapist.id} value={therapist.name}>
                            {therapist.name} - {therapist.specialty}
                          </option>
                        ))}
                      </select>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        Available therapists: {therapists.length}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Appointment Type *</label>
                      <select
                        name="appointmentType"
                        value={formData.appointmentType}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      >
                        <option value="In-Person">In-Person</option>
                        <option value="Telehealth">Telehealth</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Duration (minutes) *</label>
                      <select
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      >
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date *</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time *</label>
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Location/Notes</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder={formData.appointmentType === 'Telehealth' ? 'Video call link or platform' : 'Office room or location'}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Session Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="form-textarea"
                        rows="3"
                        placeholder="Any specific goals, concerns, or notes for this session..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowBookingForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="appointments-section">
        <h2 className="section-title">Upcoming Appointments</h2>
        <div className="appointments-grid">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header-card">
                <div className="patient-info">
                  <h3 className="patient-name">{appointment.patientName}</h3>
                  <p className="patient-age">Age: {appointment.patientAge}</p>
                </div>
                <div className={`status-badge ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </div>
              </div>

              <div className="appointment-details">
                <div className="detail-row">
                  <FiCalendar className="detail-icon" />
                  <span>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</span>
                </div>
                <div className="detail-row">
                  <FiClock className="detail-icon" />
                  <span>{appointment.duration} minutes</span>
                </div>
                <div className="detail-row">
                  {getAppointmentTypeIcon(appointment.appointmentType)}
                  <span>{appointment.appointmentType}</span>
                </div>
                {appointment.therapist && (
                  <div className="detail-row">
                    <FiUser className="detail-icon" />
                    <span>With: {appointment.therapist}</span>
                  </div>
                )}
                <div className="detail-row">
                  <FiUser className="detail-icon" />
                  <span>Parent: {appointment.parentName}</span>
                </div>
                <div className="detail-row">
                  <FiMail className="detail-icon" />
                  <span>{appointment.parentEmail}</span>
                </div>
                <div className="detail-row">
                  <FiPhone className="detail-icon" />
                  <span>{appointment.parentPhone}</span>
                </div>
                {appointment.location && (
                  <div className="detail-row">
                    <FiMapPin className="detail-icon" />
                    <span>{appointment.location}</span>
                  </div>
                )}
                {appointment.notes && (
                  <div className="notes-section">
                    <p className="notes-label">Notes:</p>
                    <p className="notes-text">{appointment.notes}</p>
                  </div>
                )}
              </div>

              <div className="appointment-actions">
                {appointment.status === 'Pending' && (
                  <button 
                    className="action-btn confirm-btn"
                    onClick={() => updateAppointmentStatus(appointment.id, 'Confirmed')}
                  >
                    <FiCheck className="w-4 h-4" />
                    Confirm
                  </button>
                )}
                <button className="action-btn edit-btn">
                  <FiEdit className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => deleteAppointment(appointment.id)}
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
