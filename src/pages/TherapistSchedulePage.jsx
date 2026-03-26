import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiFileText, FiSettings, FiLogOut, FiCalendar, FiClock } from 'react-icons/fi';
import './TherapistDashboard.css';

const Sidebar = ({ activeNav, onNavClick, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/therapist/dashboard' },
    { id: 'patients', label: 'My Patients', icon: FiUsers, path: '/therapist/patients' },
    { id: 'appointments', label: 'My Appointments', icon: FiCalendar, path: '/therapist/appointments' },
    { id: 'schedule', label: 'Schedule', icon: FiCalendar, path: '/therapist/schedule' },
    { id: 'slots', label: 'Manage Slots', icon: FiCalendar, path: '/therapist/slots' },
    { id: 'screening', label: 'Screening Results', icon: FiFileText, path: '/therapist/questionnaires' },
    { id: 'gaze', label: 'Live Gaze Analysis', icon: FiUsers, path: '/therapist/gaze-sessions' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>CORTEXA</h2>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavClick(item.path)}
            className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <hr className="sidebar-divider" />
        <button onClick={() => onNavClick('/therapist/settings')} className="nav-item">
          <FiSettings className="nav-icon" />
          <span>Settings</span>
        </button>
        <button onClick={onLogout} className="nav-item logout-btn">
          <FiLogOut className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const TherapistSchedulePage = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('schedule');
  const [scheduleData, setScheduleData] = useState({
    appointments: [],
    slots: [],
    weekStart: null,
    weekEnd: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [patients, setPatients] = useState([]);
  const [bookingModal, setBookingModal] = useState({
    show: false,
    day: '',
    time: '',
    date: null
  });
  const [selectedPatient, setSelectedPatient] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00'
  ];

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Fetch patients list
  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/therapist/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  // Fetch schedule data from API
  const fetchSchedule = async (weekOffset = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Calculate week start and end dates
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + diff + (weekOffset * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);
      weekEnd.setHours(23, 59, 59, 999);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/therapist/schedule?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch schedule data');
      }

      const data = await response.json();
      setScheduleData(data);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(currentWeekOffset);
    fetchPatients();
  }, [currentWeekOffset]);

  const handlePreviousWeek = () => {
    setCurrentWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setCurrentWeekOffset(prev => prev + 1);
  };

  // Convert 24-hour time to 12-hour format for display
  const format12Hour = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Get appointment for a specific day and time slot
  const getAppointmentForSlot = (day, time24) => {
    return scheduleData.appointments.find(apt => {
      const aptTime24 = convertTo24Hour(apt.time);
      return apt.day === day && aptTime24 === time24;
    });
  };

  // Convert appointment time to 24-hour format (handles both formats)
  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return '';
    
    // If already in 24-hour format
    if (timeStr.match(/^\d{2}:\d{2}$/)) {
      return timeStr;
    }
    
    // Convert from 12-hour format
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = match[3].toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    
    return timeStr;
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'confirmed':
        return { bg: '#d4edda', border: '#c3e6cb', text: '#155724' };
      case 'pending':
        return { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' };
      case 'cancelled':
        return { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' };
      case 'completed':
        return { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' };
      default:
        return { bg: '#e9ecef', border: '#dee2e6', text: '#6c757d' };
    }
  };

  // Format week display
  const formatWeekDisplay = () => {
    if (!scheduleData.weekStart || !scheduleData.weekEnd) {
      return 'Loading...';
    }
    
    const start = new Date(scheduleData.weekStart);
    const end = new Date(scheduleData.weekEnd);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${monthNames[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
  };

  // Handle slot click
  const handleSlotClick = (appointment, day, time) => {
    if (appointment) {
      // Show appointment details
      alert(`Appointment Details:\nPatient: ${appointment.patient}\nTime: ${appointment.time}\nStatus: ${appointment.status}\nParent: ${appointment.parentName || 'N/A'}`);
    } else {
      // Available slot - open booking modal
      // Find the date for this day
      const weekStart = new Date(scheduleData.weekStart);
      const dayIndex = weekDays.indexOf(day);
      const slotDate = new Date(weekStart);
      slotDate.setDate(weekStart.getDate() + dayIndex);

      setBookingModal({
        show: true,
        day: day,
        time: format12Hour(time),
        time24: time,
        date: slotDate
      });
      setSelectedPatient('');
      setBookingReason('');
    }
  };

  // Handle booking submission
  const handleBookSlot = async () => {
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }

    setBookingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/therapist/book-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          day: bookingModal.day,
          time: bookingModal.time,
          date: bookingModal.date.toISOString(),
          reason: bookingReason || 'Scheduled appointment'
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Appointment booked successfully!');
        setBookingModal({ show: false, day: '', time: '', date: null });
        // Refresh the schedule
        fetchSchedule(currentWeekOffset);
      } else {
        alert(`❌ ${data.message || 'Failed to book appointment'}`);
      }
    } catch (err) {
      console.error('Error booking slot:', err);
      alert('❌ Error booking appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Close booking modal
  const closeBookingModal = () => {
    setBookingModal({ show: false, day: '', time: '', date: null });
    setSelectedPatient('');
    setBookingReason('');
  };

  return (
    <div className="therapist-dashboard">
      <Sidebar 
        activeNav={activeNav} 
        onNavClick={handleNavClick}
        onLogout={handleLogout}
      />
      
      <div className="main-content">
        <div className="dashboard-header">
          <h1>Weekly Schedule</h1>
          <p>View your appointments for this week</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
            Loading schedule...
          </div>
        ) : error ? (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            borderRadius: '8px',
            margin: '20px'
          }}>
            Error: {error}
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Week Overview */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <h3>{formatWeekDisplay()}</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-secondary" onClick={handlePreviousWeek}>
                    <FiCalendar style={{ marginRight: '5px' }} />
                    Previous Week
                  </button>
                  <button className="btn-secondary" onClick={handleNextWeek}>
                    Next Week
                    <FiCalendar style={{ marginLeft: '5px' }} />
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  minWidth: '800px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ 
                        padding: '15px', 
                        textAlign: 'left', 
                        borderBottom: '2px solid #dee2e6',
                        fontWeight: '600',
                        width: '100px'
                      }}>Time</th>
                      {weekDays.map(day => (
                        <th key={day} style={{ 
                          padding: '15px', 
                          textAlign: 'center', 
                          borderBottom: '2px solid #dee2e6',
                          fontWeight: '600'
                        }}>
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(time => (
                      <tr key={time}>
                        <td style={{ 
                          padding: '10px 15px', 
                          borderBottom: '1px solid #e9ecef',
                          fontWeight: '500',
                          color: '#6c757d'
                        }}>
                          <FiClock style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                          {format12Hour(time)}
                        </td>
                        {weekDays.map(day => {
                          const appointment = getAppointmentForSlot(day, time);
                          const statusColors = appointment ? getStatusColor(appointment.status) : null;
                          
                          return (
                            <td 
                              key={`${day}-${time}`} 
                              style={{ 
                                padding: '10px', 
                                borderBottom: '1px solid #e9ecef',
                                textAlign: 'center',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleSlotClick(appointment, day, time)}
                            >
                              {appointment ? (
                                <div style={{
                                  backgroundColor: statusColors.bg,
                                  border: `1px solid ${statusColors.border}`,
                                  borderRadius: '6px',
                                  padding: '8px',
                                  fontSize: '13px'
                                }}>
                                  <div style={{ fontWeight: '600', marginBottom: '3px' }}>
                                    {appointment.patient}
                                  </div>
                                  <div style={{ 
                                    fontSize: '11px', 
                                    color: statusColors.text,
                                    textTransform: 'capitalize'
                                  }}>
                                    {appointment.status}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ color: '#adb5bd', fontSize: '13px' }}>
                                  Available
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3>This Week's Summary</h3>
              </div>
              <div className="card-content">
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '15px',
                  marginTop: '10px'
                }}>
                  <div style={{
                    backgroundColor: '#e3f2fd',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
                      {scheduleData.appointments.length}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                      Total Appointments
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#e8f5e9',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#388e3c' }}>
                      {scheduleData.appointments.filter(a => a.status?.toLowerCase() === 'confirmed').length}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                      Confirmed
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#fff3e0',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f57c00' }}>
                      {scheduleData.appointments.filter(a => a.status?.toLowerCase() === 'pending').length}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                      Pending
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#f3e5f5',
                    padding: '15px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7b1fa2' }}>
                      {timeSlots.length * weekDays.length - scheduleData.appointments.length}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                      Available Slots
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Upcoming Appointments</h3>
              </div>
              <div className="card-content">
                <div style={{ marginTop: '10px' }}>
                  {scheduleData.appointments.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px', 
                      color: '#999',
                      fontSize: '14px'
                    }}>
                      No appointments scheduled for this week
                    </div>
                  ) : (
                    scheduleData.appointments.slice(0, 4).map((apt, index) => {
                      const statusColors = getStatusColor(apt.status);
                      return (
                        <div key={index} style={{
                          padding: '12px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '6px',
                          marginBottom: '10px',
                          borderLeft: `4px solid ${statusColors.border}`
                        }}>
                          <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                            {apt.patient}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            <FiCalendar style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                            {apt.day} at {apt.time}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: statusColors.text,
                            marginTop: '5px',
                            textTransform: 'capitalize'
                          }}>
                            Status: {apt.status}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Book Appointment</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  <strong>Day:</strong> {bookingModal.day}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  <strong>Time:</strong> {bookingModal.time}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <strong>Date:</strong> {bookingModal.date?.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Select Patient *
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">-- Choose a patient --</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} (Age: {patient.age})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Reason (Optional)
                </label>
                <textarea
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  placeholder="e.g., Initial assessment, Follow-up session"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'flex-end',
              marginTop: '25px'
            }}>
              <button
                onClick={closeBookingModal}
                disabled={bookingLoading}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: bookingLoading ? 'not-allowed' : 'pointer',
                  opacity: bookingLoading ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBookSlot}
                disabled={bookingLoading || !selectedPatient}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: selectedPatient && !bookingLoading ? '#4CAF50' : '#ccc',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: selectedPatient && !bookingLoading ? 'pointer' : 'not-allowed'
                }}
              >
                {bookingLoading ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistSchedulePage;
