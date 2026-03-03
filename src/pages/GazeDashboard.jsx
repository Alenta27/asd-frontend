import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FiHome, FiUsers, FiFileText, FiSettings, FiLogOut, FiCalendar, FiClock, FiActivity, FiArrowLeft, FiMonitor, FiVideo } from 'react-icons/fi';
import { FaEye, FaSave } from 'react-icons/fa';
import TherapistLiveGazeScreening from '../components/TherapistLiveGazeScreening';
import './TherapistDashboard.css';

const GazeDashboard = () => {
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState([]);
  const [pendingReviewSessions, setPendingReviewSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('live'); // 'live' or 'review'
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [observations, setObservations] = useState({}); // { snapshotId: notes }
  const socketRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  
  // Live screening states
  const [showLiveScreening, setShowLiveScreening] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    // Initialize Socket.io
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('new-snapshot', (snapshot) => {
      console.log('🆕 Received new snapshot via socket:', snapshot);
      setSelectedSession(prev => {
        if (!prev) return null;
        
        // Only update if the snapshot belongs to the selected session
        // Note: The socket room already filters this, but extra check doesn't hurt
        const alreadyExists = prev.snapshots.some(s => s._id === snapshot._id || (s.imagePath === snapshot.imagePath && s.timestamp === snapshot.timestamp));
        if (alreadyExists) return prev;

        return {
          ...prev,
          snapshots: [...prev.snapshots, snapshot]
        };
      });
      
      // Update the active sessions list to show new snapshot count if needed
      setActiveSessions(prev => prev.map(s => {
        if (s._id === selectedSession?._id || s._id === snapshot.sessionId) {
          return { ...s, snapshots: [...(s.snapshots || []), snapshot] };
        }
        return s;
      }));
      
      if (snapshot._id) {
        setObservations(prev => ({ ...prev, [snapshot._id]: '' }));
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/therapist/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch Live Sessions
      const liveRes = await fetch('http://localhost:5000/api/gaze/sessions/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (liveRes.ok) {
        const data = await liveRes.json();
        setActiveSessions(data);
        console.log(`✅ Loaded ${data.length} active sessions`);
      }

      // Fetch Pending Review Sessions - RETRIEVES ALL HISTORICAL PHOTOS
      const reviewRes = await fetch('http://localhost:5000/api/gaze/sessions/pending-review', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reviewRes.ok) {
        const data = await reviewRes.json();
        setPendingReviewSessions(data);
        const totalPhotos = data.reduce((sum, session) => sum + (session.snapshots?.length || 0), 0);
        console.log(`✅ Loaded ${data.length} review sessions with ${totalPhotos} total photos`);
        console.log(`📸 Sessions by type:`, {
          guest: data.filter(s => s.isGuest).length,
          patient: data.filter(s => !s.isGuest).length
        });
      } else {
        console.error('Failed to fetch review sessions:', reviewRes.status);
        const errorData = await reviewRes.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/therapist/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedSession(data);
        
        // Join the socket room for this session
        if (socketRef.current) {
          socketRef.current.emit('join-session', sessionId);
        }

        // Initialize observations from fetched data
        const notesObj = {};
        data.snapshots.forEach(s => {
          notesObj[s._id] = s.notes || '';
        });
        setObservations(prev => ({ ...notesObj, ...prev }));
      }
    } catch (err) {
      console.error("Failed to fetch session details:", err);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
    
    // Auto refresh sessions list (keep this for new sessions appearing)
    refreshIntervalRef.current = setInterval(() => {
      fetchActiveSessions();
    }, 10000);

    return () => clearInterval(refreshIntervalRef.current);
  }, []);

  const handleStartLiveScreening = () => {
    fetchPatients();
    setShowPatientSelector(true);
  };

  const handlePatientSelected = (patient) => {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
    setShowLiveScreening(true);
  };

  const handleScreeningSaved = (result) => {
    console.log('Live screening saved:', result);
    fetchActiveSessions(); // Refresh the sessions list
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSaveNotes = async (snapshotId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/gaze/snapshot/${selectedSession._id}/${snapshotId}/notes`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: observations[snapshotId] })
      });
      if (response.ok) {
        alert("Notes saved successfully");
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  };

  const handleCreateReport = async (title) => {
    try {
      if (!selectedSession.patientId?._id && !selectedSession.isGuest) {
        alert("Cannot create report: Patient ID missing.");
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/therapist/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedSession.patientId?._id || null,
          guestSessionId: selectedSession.isGuest ? selectedSession._id : null,
          title: title,
          status: 'final'
        })
      });

      if (response.ok) {
        alert("Report created successfully");
      } else {
        const data = await response.json();
        alert(`Failed to create report: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to create report:", err);
      alert("Error creating report");
    }
  };

  const handleConvertToPatient = async () => {
    if (!selectedSession || !selectedSession.isGuest) {
      alert("This is not a guest session");
      return;
    }

    const childName = selectedSession.guestInfo?.childName || '';
    const parentName = selectedSession.guestInfo?.parentName || '';
    const email = selectedSession.guestInfo?.email || '';

    const patientName = prompt("Enter patient name:", childName) || childName;
    if (!patientName) return;

    const patientAge = prompt("Enter patient age:", "5");
    if (!patientAge) return;

    const patientGender = prompt("Enter patient gender (Male/Female/Other):", "");
    if (!patientGender) return;

    const additionalInfo = prompt("Medical history or notes (optional):", "");

    const confirmed = window.confirm(
      `Convert guest session to patient?\n\n` +
      `Patient Name: ${patientName}\n` +
      `Age: ${patientAge}\n` +
      `Gender: ${patientGender}\n` +
      `Parent: ${parentName}\n` +
      `Email: ${email}\n\n` +
      `This will assign the patient to you and link all past guest sessions.`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/therapist/convert-guest-to-patient', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestSessionId: selectedSession._id,
          patientName,
          patientAge: parseInt(patientAge),
          patientGender,
          additionalInfo
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `✅ Successfully converted to patient!\n\n` +
          `Patient: ${data.patient.name}\n` +
          `Linked Sessions: ${data.linkedSessions}\n\n` +
          `The patient is now assigned to you.`
        );
        
        // Refresh sessions
        fetchActiveSessions();
        setSelectedSession(null);
      } else {
        const data = await response.json();
        alert(`Failed to convert: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to convert guest to patient:", err);
      alert("Error converting guest to patient");
    }
  };

  return (
    <div className="therapist-dashboard-page">
      {/* Sidebar - Reusing existing styles */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>CORTEXA</h2>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => navigate('/therapist')} className="nav-item">
            <FiHome className="nav-icon" /> <span>Dashboard</span>
          </button>
          <button onClick={() => navigate('/therapist/patients')} className="nav-item">
            <FiUsers className="nav-icon" /> <span>My Patients</span>
          </button>
          <button className="nav-item active">
            <FiMonitor className="nav-icon" /> <span>Live Gaze Analysis</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item logout-btn">
            <FiLogOut className="nav-icon" /> <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="main-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div className="welcome-section" style={{ flex: 1 }}>
            <h1 className="welcome-title" style={{ marginBottom: '4px' }}>Live Gaze Analysis Dashboard</h1>
            <p className="welcome-subtitle" style={{ margin: 0 }}>Monitor patient attention and gaze patterns in real-time</p>
          </div>
          
          {/* Segmented Control Tabs - Professional Medical UI */}
          <div style={{ 
            display: 'flex', 
            gap: '4px',
            backgroundColor: '#f3f4f6',
            padding: '4px',
            borderRadius: '12px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <button 
              onClick={() => setViewMode('live')}
              style={{ 
                padding: '10px 24px', 
                borderRadius: '10px', 
                border: 'none', 
                backgroundColor: viewMode === 'live' ? '#ffffff' : 'transparent',
                color: viewMode === 'live' ? '#4f46e5' : '#6b7280',
                fontSize: '14px', 
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: viewMode === 'live' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: '90px',
                justifyContent: 'center'
              }}
            >
              <FiVideo size={16} />
              Live
            </button>
            <button 
              onClick={() => setViewMode('review')}
              style={{ 
                padding: '10px 24px', 
                borderRadius: '10px', 
                border: 'none', 
                backgroundColor: viewMode === 'review' ? '#ffffff' : 'transparent',
                color: viewMode === 'review' ? '#4f46e5' : '#6b7280',
                fontSize: '14px', 
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: viewMode === 'review' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: '90px',
                justifyContent: 'center'
              }}
            >
              <FiFileText size={16} />
              Review
              {pendingReviewSessions.length > 0 && (
                <span style={{
                  backgroundColor: viewMode === 'review' ? '#4f46e5' : '#9ca3af',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  marginLeft: '2px'
                }}>
                  {pendingReviewSessions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="content-area" style={{ padding: '20px' }}>
          <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: viewMode === 'live' ? '1fr' : '300px 1fr', gap: '20px' }}>
            
            {/* LIVE TAB: Clean interface with only Start Screening button */}
            {viewMode === 'live' && (
              <div style={{ 
                backgroundColor: '#fff', 
                borderRadius: '15px', 
                padding: '60px', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '500px',
                textAlign: 'center'
              }}>
                <FiVideo size={80} color="#4f46e5" style={{ marginBottom: '30px', opacity: 0.3 }} />
                <h2 style={{ margin: '0 0 15px 0', fontSize: '28px', color: '#111827' }}>
                  Live Gaze Screening Console
                </h2>
                <p style={{ margin: '0 0 40px 0', fontSize: '16px', color: '#6b7280', maxWidth: '500px' }}>
                  Start a real-time gaze analysis session with an assigned patient. 
                  The screening tool provides live feedback and captures attention patterns.
                </p>
                <button
                  onClick={handleStartLiveScreening}
                  style={{
                    padding: '18px 40px',
                    backgroundColor: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: '0 6px 16px rgba(79, 70, 229, 0.4)',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#4338ca';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(79, 70, 229, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#4f46e5';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.4)';
                  }}
                >
                  <FiVideo size={24} /> Start Live Gaze Screening
                </button>
                <p style={{ marginTop: '20px', fontSize: '13px', color: '#9ca3af' }}>
                  Select a patient and begin real-time monitoring
                </p>
              </div>
            )}

            {/* REVIEW TAB: Session list on left, details on right */}
            {viewMode === 'review' && (
              <>
                {/* Left Column: Review Sessions */}
                <div className="sessions-list" style={{ backgroundColor: '#fff', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: '#111827' }}>
                    <FiFileText color="#4f46e5" /> Pending Review
                  </h3>
                  
                  {loading ? <p>Loading...</p> : pendingReviewSessions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      <p>No sessions to review.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {pendingReviewSessions.map(session => (
                        <div 
                          key={session._id}
                          onClick={() => fetchSessionDetails(session._id)}
                          style={{ 
                            padding: '15px', 
                            borderRadius: '10px', 
                            border: selectedSession?._id === session._id ? '2px solid #4f46e5' : '1px solid #eee',
                            cursor: 'pointer',
                            backgroundColor: selectedSession?._id === session._id ? '#f5f3ff' : '#fff',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>
                              {session.isGuest ? (session.guestInfo?.childName || 'Guest') : (session.patientId?.name || 'Unknown Patient')}
                            </p>
                            {session.isGuest && (
                              <span style={{ fontSize: '9px', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>GUEST</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                              <FiClock size={10} /> {new Date(session.startTime).toLocaleDateString()}
                            </p>
                            <span style={{ 
                              fontSize: '10px', padding: '2px 6px', borderRadius: '10px', 
                              backgroundColor: session.status === 'active' ? '#dcfce7' : '#fef3c7',
                              color: session.status === 'active' ? '#166534' : '#92400e',
                              fontWeight: 'bold'
                            }}>
                              {session.snapshots?.length || 0} snaps
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Session Details & Snapshots (REVIEW TAB ONLY) */}
                <div className="session-details" style={{ backgroundColor: '#fff', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', minHeight: '600px' }}>
                  {!selectedSession ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                      <FiFileText size={60} style={{ marginBottom: '20px', opacity: 0.2 }} />
                      <p>Select a session to review</p>
                    </div>
                  ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div>
                      <h2 style={{ margin: 0 }}>
                        {selectedSession.isGuest ? selectedSession.guestInfo?.childName : selectedSession.patientId?.name}
                        {selectedSession.isGuest && <span style={{ marginLeft: '10px', fontSize: '12px', verticalAlign: 'middle', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '10px' }}>Guest Session</span>}
                      </h2>
                      <p style={{ color: '#666', margin: '5px 0 0 0' }}>
                        {selectedSession.isGuest ? `Parent: ${selectedSession.guestInfo?.parentName} | Email: ${selectedSession.guestInfo?.email}` : `Session ID: ${selectedSession._id}`}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {selectedSession.isGuest ? (
                        <button 
                          onClick={handleConvertToPatient}
                          style={{ 
                            backgroundColor: '#8b5cf6', color: '#fff', border: 'none', 
                            padding: '8px 15px', borderRadius: '8px', fontSize: '12px', 
                            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                          }}
                        >
                          <FiUsers size={14} /> Convert to Patient
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate('/therapist/slots', { state: { patientId: selectedSession.patientId?._id } })}
                          style={{ 
                            backgroundColor: '#4f46e5', color: '#fff', border: 'none', 
                            padding: '8px 15px', borderRadius: '8px', fontSize: '12px', 
                            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                          }}
                        >
                          <FiCalendar size={14} /> Schedule Appointment
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          const name = selectedSession.isGuest ? selectedSession.guestInfo?.childName : selectedSession.patientId?.name;
                          const title = prompt("Enter Report Title:", `Gaze Analysis Report - ${name}`);
                          if (title) handleCreateReport(title);
                        }}
                        style={{ 
                          backgroundColor: '#10b981', color: '#fff', border: 'none', 
                          padding: '8px 15px', borderRadius: '8px', fontSize: '12px', 
                          fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                      >
                        <FiFileText size={14} /> Create Report
                      </button>
                      <span style={{ 
                        backgroundColor: selectedSession.status === 'active' ? '#10b981' : '#f59e0b', 
                        color: '#fff', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' 
                      }}>
                        {selectedSession.status === 'active' ? 'LIVE' : 'PENDING REVIEW'}
                      </span>
                    </div>
                  </div>

                  <div className="snapshots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {selectedSession.snapshots && selectedSession.snapshots.length > 0 ? (
                      [...selectedSession.snapshots].reverse().map((snap, idx) => (
                        <div 
                          key={snap._id || idx} 
                          style={{ 
                            backgroundColor: '#f9fafb', 
                            borderRadius: '12px', 
                            overflow: 'hidden', 
                            border: '1px solid #eee',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <div style={{ position: 'relative', height: '180px', backgroundColor: '#e5e7eb' }}>
                            <img 
                              src={`http://localhost:5000${snap.imagePath}`} 
                              alt="Gaze Snapshot" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                console.error('Failed to load image:', snap.imagePath);
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML += '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:12px;">Image not found</div>';
                              }}
                              onLoad={() => console.log('✅ Loaded image:', snap.imagePath)}
                            />
                            <button 
                              onClick={() => setSelectedImage(`http://localhost:5000${snap.imagePath}`)}
                              style={{ 
                                position: 'absolute', top: '10px', right: '10px', 
                                backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', 
                                padding: '5px', borderRadius: '5px', cursor: 'pointer' 
                              }}
                            >
                              <FaEye size={14} color="#4f46e5" />
                            </button>
                          </div>
                        <div style={{ padding: '15px', flexGrow: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '11px', color: '#666' }}>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                            <span style={{ 
                              fontSize: '11px', fontWeight: 'bold', 
                              color: snap.attentionScore > 0.6 ? '#10b981' : '#f59e0b' 
                            }}>
                              Attn: {(snap.attentionScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
                            Gaze: <span style={{ textTransform: 'capitalize', color: '#4f46e5' }}>{snap.gazeDirection || 'unknown'}</span>
                          </p>
                          
                          <div style={{ marginTop: '10px' }}>
                            <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>Therapist Notes:</label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <textarea 
                                value={observations[snap._id] || ''}
                                onChange={(e) => setObservations({ ...observations, [snap._id]: e.target.value })}
                                style={{ 
                                  width: '100%', height: '60px', borderRadius: '5px', border: '1px solid #ddd',
                                  fontSize: '12px', padding: '5px', resize: 'none'
                                }}
                                placeholder="Add observations..."
                              />
                              <button 
                                onClick={() => handleSaveNotes(snap._id)}
                                style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '5px', padding: '0 8px', cursor: 'pointer' }}
                                title="Save Notes"
                              >
                                <FaSave size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                    ) : (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        <p>No snapshots available for this session</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '40px'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Full size" 
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '10px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} 
          />
          <button 
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Patient Selector Modal */}
      {showPatientSelector && (
        <div 
          style={{
            position: 'fixed', inset: 0, 
            backgroundColor: 'rgba(0,0,0,0.6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 2000,
            padding: '20px'
          }}
        >
          <div 
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f9fafb'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                Select Patient for Live Screening
              </h2>
              <button
                onClick={() => setShowPatientSelector(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Patients List */}
            <div style={{ 
              padding: '20px', 
              overflowY: 'auto',
              flex: 1
            }}>
              {patients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <FiUsers size={48} style={{ margin: '0 auto 16px' }} />
                  <p>No patients found</p>
                  <button
                    onClick={() => navigate('/therapist/patients')}
                    style={{
                      marginTop: '16px',
                      padding: '8px 16px',
                      backgroundColor: '#4f46e5',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Manage Patients
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {patients.map(patient => (
                    <div
                      key={patient._id}
                      onClick={() => handlePatientSelected(patient)}
                      style={{
                        padding: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: '#fff'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#4f46e5';
                        e.currentTarget.style.backgroundColor = '#f5f3ff';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = '#fff';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#4f46e5',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: 'bold'
                        }}>
                          {patient.name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                            {patient.name}
                          </h3>
                          <div style={{ marginTop: '4px', fontSize: '13px', color: '#6b7280', display: 'flex', gap: '12px' }}>
                            {patient.age && <span>Age: {patient.age}</span>}
                            {patient.gender && <span>• {patient.gender}</span>}
                          </div>
                        </div>
                        <FiVideo size={20} color="#4f46e5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Screening Console */}
      {showLiveScreening && selectedPatient && (
        <TherapistLiveGazeScreening
          patient={selectedPatient}
          onClose={() => {
            setShowLiveScreening(false);
            setSelectedPatient(null);
          }}
          onSaved={handleScreeningSaved}
        />
      )}
    </div>
  );
};

export default GazeDashboard;
