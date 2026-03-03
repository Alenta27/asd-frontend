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

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Sample appointments for demonstration
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  const sampleAppointments = [
    { day: 'Monday', time: '09:00 AM', patient: 'Sarah Johnson', status: 'Confirmed' },
    { day: 'Monday', time: '11:00 AM', patient: 'Michael Chen', status: 'Confirmed' },
    { day: 'Wednesday', time: '02:00 PM', patient: 'Emily Davis', status: 'Confirmed' },
    { day: 'Thursday', time: '10:00 AM', patient: 'David Wilson', status: 'Pending' },
    { day: 'Friday', time: '03:00 PM', patient: 'Lisa Anderson', status: 'Confirmed' }
  ];

  const getAppointmentForSlot = (day, time) => {
    return sampleAppointments.find(apt => apt.day === day && apt.time === time);
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

        <div className="dashboard-grid">
          {/* Week Overview */}
          <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h3>Current Week - January 20-24, 2026</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary">
                  <FiCalendar style={{ marginRight: '5px' }} />
                  Previous Week
                </button>
                <button className="btn-secondary">
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
                        {time}
                      </td>
                      {weekDays.map(day => {
                        const appointment = getAppointmentForSlot(day, time);
                        return (
                          <td key={`${day}-${time}`} style={{ 
                            padding: '10px', 
                            borderBottom: '1px solid #e9ecef',
                            textAlign: 'center'
                          }}>
                            {appointment ? (
                              <div style={{
                                backgroundColor: appointment.status === 'Confirmed' ? '#d4edda' : '#fff3cd',
                                border: `1px solid ${appointment.status === 'Confirmed' ? '#c3e6cb' : '#ffeaa7'}`,
                                borderRadius: '6px',
                                padding: '8px',
                                fontSize: '13px'
                              }}>
                                <div style={{ fontWeight: '600', marginBottom: '3px' }}>
                                  {appointment.patient}
                                </div>
                                <div style={{ 
                                  fontSize: '11px', 
                                  color: appointment.status === 'Confirmed' ? '#155724' : '#856404'
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
                    {sampleAppointments.length}
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
                    {sampleAppointments.filter(a => a.status === 'Confirmed').length}
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
                    {sampleAppointments.filter(a => a.status === 'Pending').length}
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
                    {timeSlots.length * weekDays.length - sampleAppointments.length}
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
                {sampleAppointments.slice(0, 4).map((apt, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    borderLeft: `4px solid ${apt.status === 'Confirmed' ? '#28a745' : '#ffc107'}`
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                      {apt.patient}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      <FiCalendar style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                      {apt.day}, {apt.time}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      marginTop: '5px',
                      color: apt.status === 'Confirmed' ? '#28a745' : '#f57c00',
                      fontWeight: '500'
                    }}>
                      {apt.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistSchedulePage;
