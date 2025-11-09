import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiFileText, FiSettings, FiLogOut, FiCalendar, FiHelpCircle } from 'react-icons/fi';
import '../styles/TherapistAppointments.css';

const TherapistPatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
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

        // Fetch patients/clients
        const patientsRes = await fetch('http://localhost:5000/api/therapist/clients', { headers });
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          console.log('Patients fetched:', patientsData);
          setPatients(Array.isArray(patientsData) ? patientsData : []);
        } else {
          console.error('Patients fetch failed:', patientsRes.status);
          setError(`Failed to fetch patients: ${patientsRes.status}`);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <div className="therapist-appointments-page">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>NeuroTrack</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button onClick={() => handleNavClick('/therapist')} className="nav-item">
            <FiHome className="nav-icon" />
            <span>Dashboard</span>
          </button>
          <button onClick={() => handleNavClick('/therapist/patients')} className="nav-item active">
            <FiUsers className="nav-icon" />
            <span>My Patients</span>
          </button>
          <button onClick={() => handleNavClick('/therapist/appointments')} className="nav-item">
            <FiCalendar className="nav-icon" />
            <span>Schedule</span>
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
            <h1 className="welcome-title">My Patients</h1>
            <p className="welcome-subtitle">View and manage your patients</p>
          </div>
          <button className="assistant-trigger" onClick={() => setShowAssistant(true)}>
            <FiHelpCircle className="assistant-trigger-icon" />
            Support
          </button>
        </div>

        {/* Content */}
        <div className="content-area">
          {loading ? (
            <div className="loading-container">
              <p>Loading patients...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">Error: {error}</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <h3>No Patients Yet</h3>
              <p>You don't have any patients assigned yet.</p>
            </div>
          ) : (
            <div className="patients-grid">
              {patients.map((patient) => (
                <div key={patient._id} className="patient-card">
                  <div className="patient-header">
                    <h3 className="patient-name">{patient.name}</h3>
                    <span className="patient-status active">Active</span>
                  </div>
                  
                  <div className="patient-info">
                    <p><strong>Age:</strong> {patient.age}</p>
                    <p><strong>Gender:</strong> {patient.gender}</p>
                    <p><strong>Medical History:</strong> {patient.medical_history || 'N/A'}</p>
                  </div>

                  <div className="patient-actions">
                    <button className="btn-primary" onClick={() => navigate(`/therapist/patients/${patient._id}`)}>
                      View Profile
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/therapist/appointments')}>
                      View Appointments
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assistant Panel */}
      {showAssistant && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <h3>Support Assistant</h3>
            <button onClick={() => setShowAssistant(false)}>×</button>
          </div>
          <div className="assistant-content">
            <p>How can we help you manage your patients today?</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistPatientsPage;