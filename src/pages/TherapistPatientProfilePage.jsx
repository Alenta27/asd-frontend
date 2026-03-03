import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiActivity, FiFileText, FiEye, FiAlertCircle, FiHome, FiUsers, FiSettings, FiLogOut, FiBarChart2 } from 'react-icons/fi';
import '../styles/TherapistAppointments.css';
import SocialAttentionTracker from '../components/SocialAttentionTracker';

const TherapistPatientProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [screeningHistory, setScreeningHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTracker, setShowTracker] = useState(false);

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  useEffect(() => {
    const fetchPatientDetails = async () => {
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

        // Fetch patient details
        const patientRes = await fetch(`http://localhost:5000/api/therapist/patient/${id}`, { headers });
        if (patientRes.ok) {
          const patientData = await patientRes.json();
          setPatient(patientData);
        } else {
          setError('Failed to fetch patient details');
        }

        // Fetch screening history (gaze sessions)
        try {
          const screeningRes = await fetch(`http://localhost:5000/api/therapist/patient/${id}/screenings`, { headers });
          if (screeningRes.ok) {
            const screeningData = await screeningRes.json();
            setScreeningHistory(Array.isArray(screeningData) ? screeningData : []);
          }
        } catch (err) {
          console.log('No screening history available');
          setScreeningHistory([]);
        }
      } catch (error) {
        console.error('Error fetching patient details:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [id, navigate]);

  if (loading) {
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
        <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="loading-container">
            <p>Loading patient profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
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
        <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="error-container">
            <p className="error-message">Error: {error || 'Patient not found'}</p>
            <button 
              onClick={() => navigate('/therapist/patients')} 
              style={{ marginTop: '20px' }}
              className="btn-primary"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Header with Back Button */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '32px' }}>
          <button 
            onClick={() => navigate('/therapist/patients')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#6b5b95',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              marginBottom: '24px',
              padding: '10px 0',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#8b7ba8'}
            onMouseOut={(e) => e.currentTarget.style.color = '#6b5b95'}
          >
            <FiArrowLeft size={20} />
            Back to Patients
          </button>
          
          {/* Patient Header Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '36px', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  letterSpacing: '-0.5px'
                }}>
                  {patient.name}
                </h1>
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '24px',
                  fontSize: '13px',
                  fontWeight: '700',
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  border: '2px solid #a7f3d0'
                }}>
                  ✓ Active Patient
                </span>
              </div>
              <p style={{ 
                margin: 0, 
                fontSize: '15px', 
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Complete patient profile and assessment history
              </p>
            </div>
            
            {/* Primary Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => navigate('/therapist/appointments')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#6b5b95',
                  border: '2px solid #6b5b95',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  height: '48px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b5b95';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 91, 149, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#6b5b95';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FiCalendar size={18} />
                Schedule Appointment
              </button>
              <button 
                onClick={() => setShowTracker(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 24px',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: '2px solid #6366f1',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  height: '48px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#4f46e5';
                  e.currentTarget.style.borderColor = '#4f46e5';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#6366f1';
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FiBarChart2 size={18} />
                Real-time Social Scoring
              </button>
              <button 
                onClick={() => navigate(`/live-gaze-analysis?patientId=${patient._id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: '2px solid #10b981',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  height: '48px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.borderColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FiEye size={18} />
                Start Live Gaze
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Patient Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Age Card */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
              color: 'white',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
            }}>
              <p style={{ 
                margin: '0 0 8px 0', 
                fontSize: '13px', 
                fontWeight: '600', 
                textTransform: 'uppercase',
                opacity: '0.9',
                letterSpacing: '0.5px'
              }}>
                Age
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: '32px', 
                fontWeight: '700',
                lineHeight: '1'
              }}>
                {patient.age}
              </p>
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: '14px',
                opacity: '0.9',
                fontWeight: '500'
              }}>
                years old
              </p>
            </div>

            {/* Gender Card */}
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(240, 147, 251, 0.2)',
              color: 'white',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(240, 147, 251, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 147, 251, 0.2)';
            }}>
              <p style={{ 
                margin: '0 0 8px 0', 
                fontSize: '13px', 
                fontWeight: '600', 
                textTransform: 'uppercase',
                opacity: '0.9',
                letterSpacing: '0.5px'
              }}>
                Gender
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: '28px', 
                fontWeight: '700',
                lineHeight: '1.2'
              }}>
                {patient.gender}
              </p>
            </div>

            {/* Patient ID Card */}
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(79, 172, 254, 0.2)',
              color: 'white',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(79, 172, 254, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.2)';
            }}>
              <p style={{ 
                margin: '0 0 8px 0', 
                fontSize: '13px', 
                fontWeight: '600', 
                textTransform: 'uppercase',
                opacity: '0.9',
                letterSpacing: '0.5px'
              }}>
                Patient ID
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: '16px', 
                fontWeight: '600',
                fontFamily: 'Monaco, Consolas, monospace',
                letterSpacing: '0.5px'
              }}>
                {patient._id?.substring(0, 12)}...
              </p>
            </div>
          </div>

          {/* Medical History Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative element */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '5px',
              height: '100%',
              background: 'linear-gradient(180deg, #6b5b95 0%, #8b7ba8 100%)'
            }}></div>
            
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6b5b95 0%, #8b7ba8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FiFileText size={24} color="white" />
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#1f2937',
                letterSpacing: '-0.3px'
              }}>
                Medical History
              </h3>
            </div>
            
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '15px', 
                color: patient.medical_history ? '#374151' : '#9ca3af', 
                lineHeight: '1.7',
                fontWeight: patient.medical_history ? '400' : '500',
                fontStyle: patient.medical_history ? 'normal' : 'italic'
              }}>
                {patient.medical_history || 'No medical history recorded for this patient.'}
              </p>
            </div>
          </div>

          {/* Screening History Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative element */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '5px',
              height: '100%',
              background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
            }}></div>
            
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FiActivity size={24} color="white" />
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#1f2937',
                letterSpacing: '-0.3px'
              }}>
                Screening History & Recent Assessments
              </h3>
            </div>

            {screeningHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
                backgroundColor: '#f9fafb',
                borderRadius: '16px',
                border: '2px dashed #d1d5db'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <FiAlertCircle size={32} color="#9ca3af" />
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1f2937', fontWeight: '700' }}>
                  No Screening History Available
                </p>
                <p style={{ margin: 0, fontSize: '15px', color: '#6b7280', fontWeight: '500' }}>
                  This patient hasn't completed any assessments yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {screeningHistory.map((screening, idx) => (
                  <div key={screening._id || idx} style={{
                    padding: '24px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#6b5b95';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 91, 149, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {screening.screeningType || screening.sessionType || 'Assessment'}
                        </span>
                        {screening.result && (
                          <span style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            backgroundColor: screening.result === 'low_risk' ? '#d1fae5' : 
                                           screening.result === 'medium_risk' ? '#fef3c7' : '#fee2e2',
                            color: screening.result === 'low_risk' ? '#065f46' : 
                                   screening.result === 'medium_risk' ? '#92400e' : '#991b1b',
                            letterSpacing: '0.5px'
                          }}>
                            {screening.result.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#374151', fontWeight: '600' }}>
                        <strong style={{ color: '#6b7280', fontWeight: '500' }}>Date:</strong>{' '}
                        {new Date(screening.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {screening.snapshots && (
                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                          📸 Captured {screening.snapshots.length} snapshots
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (screening.sessionType === 'gaze' || screening.screeningType === 'gaze') {
                          navigate('/therapist/gaze-sessions');
                        } else {
                          alert('View details functionality for this assessment type coming soon');
                        }
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#6b5b95',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#8b7ba8';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#6b5b95';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <FiEye size={16} />
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
              
              {/* Parent/Guardian Information (if available) */}
              {patient.parent_email && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e5e7eb',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decorative element */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '5px',
                height: '100%',
                background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
              }}></div>
              
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f3f4f6'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '24px'
                }}>
                  👤
                </div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  letterSpacing: '-0.3px'
                }}>
                  Parent/Guardian Information
                </h3>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '24px' 
              }}>
                {patient.parent_name && (
                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '13px', 
                      color: '#6b7280', 
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Name
                    </p>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      {patient.parent_name}
                    </p>
                  </div>
                )}
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '13px', 
                    color: '#6b7280', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Email
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '16px', 
                    color: '#1f2937',
                    fontWeight: '600',
                    wordBreak: 'break-word'
                  }}>
                    {patient.parent_email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTracker && (
        <SocialAttentionTracker 
          patientId={patient._id} 
          onClose={() => setShowTracker(false)} 
          onComplete={(results) => {
            console.log("Assessment complete:", results);
            // Optionally refresh screening history
          }}
        />
      )}
    </div>
  );
};

export default TherapistPatientProfilePage;
