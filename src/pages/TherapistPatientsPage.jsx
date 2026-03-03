import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiFileText, FiSettings, FiLogOut, FiCalendar, FiHelpCircle, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import '../styles/TherapistAppointments.css';

const TherapistPatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [showAssistant, setShowAssistant] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showGuestSearchModal, setShowGuestSearchModal] = useState(false);
  const [guestSearchEmail, setGuestSearchEmail] = useState('');
  const [guestSessions, setGuestSessions] = useState([]);
  const [selectedGuestEmail, setSelectedGuestEmail] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientGender: '',
    medicalHistory: '',
    parentName: '',
    parentEmail: ''
  });

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

  const handleSearchGuestSessions = async () => {
    if (!guestSearchEmail) {
      alert('Please enter an email address');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/therapist/search-guest-sessions?email=${encodeURIComponent(guestSearchEmail)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGuestSessions(data.sessions);
        if (data.sessions.length === 0) {
          alert('No guest sessions found for this email');
        } else {
          setSelectedGuestEmail(guestSearchEmail);
        }
      } else {
        alert('Failed to search guest sessions');
      }
    } catch (err) {
      console.error('Error searching guest sessions:', err);
      alert('Error searching guest sessions');
    }
  };

  const handleAddPatient = async (linkToGuestEmail = null) => {
    const { patientName, patientAge, patientGender, parentEmail } = formData;

    if (!patientName || !patientAge || !patientGender || !parentEmail) {
      alert('Please fill in all required fields: Patient Name, Age, Gender, and Parent Email');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/therapist/add-patient', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientName,
          patientAge: parseInt(patientAge),
          patientGender,
          medicalHistory: formData.medicalHistory,
          parentName: formData.parentName,
          parentEmail,
          linkToGuestEmail
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `✅ Patient added successfully!\n\n` +
          `Patient: ${data.patient.name}\n` +
          `Age: ${data.patient.age}\n` +
          `Gender: ${data.patient.gender}\n` +
          (data.linkedSessions ? `\nLinked ${data.linkedSessions} guest sessions` : '')
        );
        
        // Reset form and close modal
        setFormData({
          patientName: '',
          patientAge: '',
          patientGender: '',
          medicalHistory: '',
          parentName: '',
          parentEmail: ''
        });
        setShowAddPatientModal(false);
        setShowGuestSearchModal(false);
        
        // Refresh patients list
        const patientsRes = await fetch('http://localhost:5000/api/therapist/clients', { 
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatients(Array.isArray(patientsData) ? patientsData : []);
        }
      } else {
        const data = await response.json();
        alert(`Failed to add patient: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error adding patient:', err);
      alert('Error adding patient');
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
          <button onClick={() => handleNavClick('/therapist/patients')} className="nav-item active">
            <FiUsers className="nav-icon" />
            <span>My Patients</span>
          </button>
          <button onClick={() => handleNavClick('/therapist/schedule')} className="nav-item">
            <FiCalendar className="nav-icon" />
            <span>Schedule</span>
          </button>
          <button onClick={() => handleNavClick('/therapist/appointments')} className="nav-item">
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
            <h1 className="welcome-title">My Patients</h1>
            <p className="welcome-subtitle">View and manage your patients</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={() => setShowAddPatientModal(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                backgroundColor: '#4f46e5',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              <FiPlus size={18} /> Add Patient
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setShowGuestSearchModal(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              <FiSearch size={18} /> Search Guest Sessions
            </button>
            <button className="assistant-trigger" onClick={() => setShowAssistant(true)}>
              <FiHelpCircle className="assistant-trigger-icon" />
              Support
            </button>
          </div>
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
                  {/* Patient Header - Name & Status */}
                  <div className="patient-header">
                    <h3 className="patient-name">{patient.name}</h3>
                    <span className="patient-status active">Active</span>
                  </div>
                  
                  {/* Patient Info - Details */}
                  <div className="patient-info">
                    <p><strong>Age:</strong> {patient.age} years</p>
                    <p><strong>Gender:</strong> {patient.gender}</p>
                    <p><strong>Medical History:</strong> {patient.medical_history || 'No medical history recorded'}</p>
                  </div>

                  {/* Patient Actions - Buttons */}
                  <div className="patient-actions">
                    <button 
                      className="btn-primary" 
                      onClick={() => navigate(`/therapist/patients/${patient._id}`)}
                    >
                      View Profile
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={() => navigate('/therapist/appointments')}
                    >
                      View Appointments
                    </button>
                    <button 
                      className="btn-success" 
                      onClick={() => navigate(`/live-gaze-analysis?patientId=${patient._id}`)}
                    >
                      Start Live Gaze
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

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
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
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Add New Patient</h2>
              <button
                onClick={() => setShowAddPatientModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                <FiX />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Patient Name <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                  placeholder="Enter patient name"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Age <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                    placeholder="Age"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Gender <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    value={formData.patientGender}
                    onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Medical History
                </label>
                <textarea
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    minHeight: '80px'
                  }}
                  placeholder="Enter medical history or notes"
                />
              </div>

              <hr style={{ margin: '10px 0' }} />

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Parent Name
                </label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                  placeholder="Enter parent/guardian name"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Parent Email <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                  placeholder="parent@example.com"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => handleAddPatient()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Add Patient
                </button>
                <button
                  onClick={() => setShowAddPatientModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Search Modal */}
      {showGuestSearchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Search Guest Sessions</h2>
              <button
                onClick={() => {
                  setShowGuestSearchModal(false);
                  setGuestSessions([]);
                  setGuestSearchEmail('');
                  setSelectedGuestEmail(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                <FiX />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Parent Email
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  value={guestSearchEmail}
                  onChange={(e) => setGuestSearchEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                  placeholder="Enter email to search"
                />
                <button
                  onClick={handleSearchGuestSessions}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  <FiSearch size={16} />
                </button>
              </div>
            </div>

            {guestSessions.length > 0 && (
              <>
                <div style={{
                  backgroundColor: '#f3f4f6',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>
                    Found {guestSessions.length} guest session{guestSessions.length !== 1 ? 's' : ''} for {selectedGuestEmail}
                  </p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                    You can create a patient profile and link these sessions automatically.
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0 }}>Guest Sessions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                    {guestSessions.map((session, idx) => (
                      <div
                        key={session._id}
                        style={{
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{session.guestInfo?.childName || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {new Date(session.createdAt).toLocaleDateString()} - {session.snapshots?.length || 0} snapshots
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Pre-fill the add patient form with guest session data
                    const firstSession = guestSessions[0];
                    setFormData({
                      patientName: firstSession.guestInfo?.childName || '',
                      patientAge: '',
                      patientGender: '',
                      medicalHistory: '',
                      parentName: firstSession.guestInfo?.parentName || '',
                      parentEmail: selectedGuestEmail
                    });
                    setShowGuestSearchModal(false);
                    setShowAddPatientModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Create Patient & Link Sessions
                </button>
              </>
            )}

            {guestSessions.length === 0 && selectedGuestEmail && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280'
              }}>
                <p>No guest sessions found for this email.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistPatientsPage;