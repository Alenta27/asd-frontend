import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiFileText, FiSettings, FiLogOut, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import '../styles/TherapistAppointments.css';

const TherapistMessageSessionsPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySendingId, setReplySendingId] = useState(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.sessionId === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [profileRes, sessionsRes] = await Promise.all([
          fetch('http://localhost:5000/api/therapist/profile', { headers }),
          fetch('http://localhost:5000/api/therapist/query-sessions', { headers }),
        ]);

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUsername(profile.username || profile.email?.split('@')[0] || 'Therapist');
        }

        if (!sessionsRes.ok) {
          const payload = await sessionsRes.json().catch(() => ({}));
          throw new Error(payload?.message || 'Failed to fetch query sessions');
        }

        const data = await sessionsRes.json();
        const normalized = Array.isArray(data) ? data : [];
        setSessions(normalized);
        if (normalized.length > 0) {
          setActiveSessionId(normalized[0].sessionId);
        }
      } catch (err) {
        console.error('Error fetching query sessions:', err);
        setError(err.message || 'Unable to load query sessions.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleNavClick = (path) => navigate(path);

  const markMessageRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/therapist/parent-queries/${messageId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return;

      setSessions((prev) =>
        prev.map((session) => {
          const updatedMessages = session.messages.map((message) =>
            message._id === messageId && message.status === 'unread'
              ? { ...message, status: 'read', readAt: new Date().toISOString() }
              : message
          );

          const unreadCount = updatedMessages.filter((message) => message.status === 'unread').length;
          return { ...session, unreadCount, messages: updatedMessages };
        })
      );
    } catch (err) {
      console.error('Error marking message read:', err);
    }
  };

  const sendReply = async (messageId) => {
    const draft = String(replyDrafts[messageId] || '').trim();
    if (!draft) return;

    try {
      setReplySendingId(messageId);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/therapist/parent-queries/${messageId}/reply`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: draft })
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Failed to send reply');
      }

      const payload = await response.json();
      const updated = payload?.query;
      if (!updated) return;

      setSessions((prev) =>
        prev.map((session) => {
          const updatedMessages = session.messages.map((message) =>
            message._id === messageId
              ? {
                  ...message,
                  status: updated.status,
                  readAt: updated.readAt,
                  replies: Array.isArray(updated.replies) ? updated.replies : message.replies
                }
              : message
          );

          const unreadCount = updatedMessages.filter((message) => message.status === 'unread').length;
          return { ...session, unreadCount, messages: updatedMessages };
        })
      );

      setReplyDrafts((prev) => ({ ...prev, [messageId]: '' }));
    } catch (err) {
      console.error('Error sending reply:', err);
      setError(err.message || 'Unable to send reply.');
    } finally {
      setReplySendingId(null);
    }
  };

  return (
    <div className="therapist-appointments-page">
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
          <button onClick={() => handleNavClick('/therapist/appointments')} className="nav-item">
            <FiCalendar className="nav-icon" />
            <span>My Appointments</span>
          </button>
          <button onClick={() => handleNavClick('/therapist/query-sessions')} className="nav-item active">
            <FiMessageSquare className="nav-icon" />
            <span>Query Sessions</span>
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

      <div className="main-content">
        <div className="main-header">
          <div className="welcome-section">
            <h1 className="welcome-title">Query Sessions</h1>
            <p className="welcome-subtitle">All parent messages are grouped by parent and child conversation.</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button className="dismiss-btn" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading query sessions...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxHeight: '70vh', overflowY: 'auto' }}>
              {sessions.length === 0 ? (
                <div className="empty-message">No query sessions yet.</div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.sessionId}
                    onClick={() => setActiveSessionId(session.sessionId)}
                    style={{
                      width: '100%',
                      border: 'none',
                      padding: '14px 12px',
                      textAlign: 'left',
                      background: activeSessionId === session.sessionId ? '#fff1f8' : '#fff',
                      borderBottom: '1px solid #f3f3f3',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#2f2f2f' }}>{session.child?.name || 'Child'}</div>
                    <div style={{ fontSize: '12px', color: '#6f6f6f', marginTop: '2px' }}>{session.parent?.name || 'Parent'}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{session.latestSubject || 'No subject'}</div>
                    {session.unreadCount > 0 && (
                      <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, color: '#fff', background: '#ff1493' }}>
                        {session.unreadCount} unread
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxHeight: '70vh', overflowY: 'auto' }}>
              {!activeSession ? (
                <div className="empty-message">Select a session to view messages.</div>
              ) : (
                <div style={{ padding: '16px' }}>
                  <h3 style={{ marginBottom: '4px' }}>{activeSession.child?.name || 'Child'} - {activeSession.parent?.name || 'Parent'}</h3>
                  <p style={{ fontSize: '12px', color: '#777', marginBottom: '16px' }}>
                    {activeSession.messages.length} message(s)
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeSession.messages.map((message) => (
                      <div key={message._id} style={{ border: '1px solid #f0f0f0', borderRadius: '10px', padding: '12px', background: message.status === 'unread' ? '#fff7fc' : '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                          <strong style={{ color: '#333' }}>{message.subject}</strong>
                          <span style={{ fontSize: '11px', color: '#888' }}>{new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ marginTop: '8px', marginBottom: '8px', color: '#555', whiteSpace: 'pre-wrap' }}>{message.message}</p>

                        {Array.isArray(message.replies) && message.replies.length > 0 && (
                          <div style={{ marginBottom: '8px', padding: '10px', borderRadius: '8px', background: '#f8faff', border: '1px solid #e8eefc' }}>
                            {message.replies.map((reply, idx) => (
                              <div key={`${message._id}-reply-${idx}`} style={{ marginBottom: idx === message.replies.length - 1 ? 0 : '8px' }}>
                                <div style={{ fontSize: '11px', color: '#4a5a87', fontWeight: 700, marginBottom: '2px' }}>
                                  {reply.senderRole === 'therapist' ? 'Doctor Reply' : 'Parent Reply'}
                                  {' - '}
                                  {new Date(reply.createdAt).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '13px', color: '#2f2f2f', whiteSpace: 'pre-wrap' }}>{reply.message}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={replyDrafts[message._id] || ''}
                            onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [message._id]: e.target.value }))}
                            placeholder="Type your reply to parent..."
                            style={{
                              flex: 1,
                              border: '1px solid #e3e3e3',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              fontSize: '13px'
                            }}
                          />
                          <button
                            className="appointment-action-btn"
                            style={{ width: 'auto', padding: '8px 12px' }}
                            onClick={() => sendReply(message._id)}
                            disabled={replySendingId === message._id || !String(replyDrafts[message._id] || '').trim()}
                          >
                            {replySendingId === message._id ? 'Sending...' : 'Reply'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#888' }}>Provider: {message.provider?.name || 'Therapist'}</span>
                          {message.status === 'unread' ? (
                            <button className="activity-action-btn" onClick={() => markMessageRead(message._id)}>
                              Mark Read
                            </button>
                          ) : (
                            <span className="appointment-type">Read</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistMessageSessionsPage;
