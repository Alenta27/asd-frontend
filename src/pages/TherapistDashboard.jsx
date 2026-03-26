import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiFileText, FiSettings, FiLogOut, FiCalendar, FiHelpCircle, FiX, FiBell, FiMessageSquare } from 'react-icons/fi';
import ProgressTracker from '../components/ProgressTracker';
import './TherapistDashboard.css';

const Sidebar = ({ activeNav, onNavClick, onLogout, therapistName }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/therapist/dashboard' },
    { id: 'patients', label: 'My Patients', icon: FiUsers, path: '/therapist/patients' },
    { id: 'schedule', label: 'Schedule', icon: FiCalendar, path: '/therapist/schedule' },
    { id: 'appointments', label: 'My Appointments', icon: FiCalendar, path: '/therapist/appointments' },
    { id: 'query-sessions', label: 'Query Sessions', icon: FiMessageSquare, path: '/therapist/query-sessions' },
    { id: 'slots', label: 'Manage Slots', icon: FiCalendar, path: '/therapist/slots' },
    { id: 'screening', label: 'Screening Results', icon: FiFileText, path: '/therapist/questionnaires' },
    { id: 'gaze', label: 'Live Gaze Analysis', icon: FiUsers, path: '/therapist/gaze-sessions' },
    { id: 'speech-therapy', label: 'Speech Therapy', icon: FiUsers, path: '/therapist/speech-therapy' },
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

const MainContent = ({
  username,
  therapistName,
  appointments,
  clients,
  parentQueries,
  loading,
  onMarkQueryRead,
  onOpenAssistant,
  navigate,
}) => {
  const [selectedActivityPatient, setSelectedActivityPatient] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const upcomingAppointments = Array.isArray(appointments) 
    ? appointments.filter(a => a.status === 'Scheduled' || a.status === 'Pending').slice(0, 3)
    : [];
  
  const recentActivity = Array.isArray(clients)
    ? clients.slice(0, 3).map(client => ({
        name: client.name,
        patientId: client._id,
        activity: 'Completed new questionnaire',
        date: new Date(client.updatedAt || client.createdAt).toLocaleDateString(),
      }))
    : [];

  const unreadCount = Array.isArray(parentQueries)
    ? parentQueries.filter((query) => query.status === 'unread').length
    : 0;

  const notificationItems = Array.isArray(parentQueries) ? parentQueries.slice(0, 6) : [];

  return (
    <div className="main-content">
      <div className="main-header">
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome {username || 'User'}!</h1>
          <p className="welcome-subtitle">Manage your patients and appointments efficiently</p>
        </div>
        <div className="header-actions">
          <div className="notifications-wrapper">
            <button
              className="notification-trigger"
              onClick={() => setShowNotifications((prev) => !prev)}
              aria-label="Open parent message notifications"
            >
              <FiBell className="notification-trigger-icon" />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <h4>Parent Messages</h4>
                  <span>{unreadCount} unread</span>
                </div>

                {notificationItems.length === 0 ? (
                  <div className="notification-empty">No parent messages yet.</div>
                ) : (
                  <div className="notification-list">
                    {notificationItems.map((query) => (
                      <button
                        key={query._id}
                        className={`notification-item ${query.status === 'unread' ? 'unread' : ''}`}
                        onClick={() => {
                          if (query.status === 'unread') {
                            onMarkQueryRead(query._id);
                          }
                          setShowNotifications(false);
                        }}
                      >
                        <div className="notification-item-subject">{query.subject}</div>
                        <div className="notification-item-meta">
                          {query.parent?.name || 'Parent'} - {query.child?.name || 'Child'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="assistant-trigger" onClick={onOpenAssistant}>
            <FiHelpCircle className="assistant-trigger-icon" />
            Guide & Support
          </button>
        </div>
      </div>

      <div className="banner">
        <div className="banner-content">
          <h3>Stay Connected With Your Patients</h3>
          <p>Regular follow-ups and consistent engagement improve patient outcomes. View all appointments and patient progress in one place.</p>
        </div>
      </div>

      <div className="content-section">
        <div className="section-header">
          <h2 className="section-title">Upcoming Appointments</h2>
          <button className="view-all-btn" onClick={() => navigate('/therapist/appointments')}>View All</button>
        </div>
        
        <div className="appointments-grid">
          {loading ? (
            <div className="loading-message">Loading appointments...</div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="empty-message">No upcoming appointments scheduled</div>
          ) : (
            upcomingAppointments.map((appointment, idx) => (
              <div key={idx} className="appointment-card">
                <div className="appointment-header">
                  <h3 className="appointment-patient-name">{appointment.clientName || appointment.patientName || 'Patient Name'}</h3>
                  <span className="appointment-type">{appointment.type || 'In-Person'}</span>
                </div>
                <div className="appointment-details">
                  <p className="appointment-datetime">
                    {new Date(appointment.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })} | {appointment.time || '10:00 AM'}
                  </p>
                  {appointment.notes && <p className="appointment-notes">{appointment.notes}</p>}
                </div>
                <button 
                  className="appointment-action-btn"
                  onClick={() => {
                    if (appointment.clientId || appointment.childId) {
                      navigate(`/therapist/patients/${appointment.clientId || appointment.childId}`);
                    } else {
                      alert('Patient ID not available for this appointment');
                    }
                  }}
                >
                  View Patient Profile
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="content-section">
        <div className="section-header">
          <h2 className="section-title">Recent Patient Activity</h2>
          <button className="view-all-btn" onClick={() => navigate('/therapist/patients')}>View All</button>
        </div>
        
        <div className="activity-grid">
          {loading ? (
            <div className="loading-message">Loading activity...</div>
          ) : recentActivity.length === 0 ? (
            <div className="empty-message">No recent patient activity</div>
          ) : (
            recentActivity.map((activity, idx) => (
              <div key={idx} className="activity-card">
                <div className="activity-header">
                  <h3 className="activity-patient-name">{activity.name}</h3>
                  <p className="activity-type">{activity.activity}</p>
                </div>
                <div className="activity-footer">
                  <p className="activity-date">{activity.date}</p>
                  <button 
                    className="activity-action-btn"
                    onClick={() => {
                      if (activity.patientId) {
                        navigate(`/therapist/patients/${activity.patientId}`);
                      } else {
                        alert('Patient details not available');
                      }
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="content-section">
        <div className="section-header">
          <h2 className="section-title">Parent Queries</h2>
        </div>

        <div className="activity-grid">
          {loading ? (
            <div className="loading-message">Loading parent queries...</div>
          ) : !Array.isArray(parentQueries) || parentQueries.length === 0 ? (
            <div className="empty-message">No parent queries yet</div>
          ) : (
            parentQueries.slice(0, 4).map((query) => (
              <div key={query._id} className="activity-card">
                <div className="activity-header">
                  <h3 className="activity-patient-name">{query.subject}</h3>
                  <p className="activity-type">
                    {query.parent?.name || 'Parent'} • {query.child?.name || 'Child'}
                  </p>
                </div>
                <div className="appointment-details" style={{ marginTop: '8px' }}>
                  <p className="appointment-notes" style={{ margin: 0 }}>
                    {query.message}
                  </p>
                </div>
                <div className="activity-footer" style={{ marginTop: '12px' }}>
                  <p className="activity-date">
                    {new Date(query.createdAt).toLocaleString()}
                  </p>
                  {query.status === 'unread' ? (
                    <button className="activity-action-btn" onClick={() => onMarkQueryRead(query._id)}>
                      Mark Read
                    </button>
                  ) : (
                    <span className="appointment-type">Read</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Progress Tracker Section */}
      <div className="content-section">
        <ProgressTracker childId="current-patient" childName="Your Patient" />
      </div>
    </div>
  );
};

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [username, setUsername] = useState('');
  const [therapistName, setTherapistName] = useState('');
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [parentQueries, setParentQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantInput, setAssistantInput] = useState('');

  useEffect(() => {
    const fetchData = async () => {
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

        const profileRes = await fetch('http://localhost:5000/api/therapist/profile', { headers });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.status === 'pending') {
            navigate('/therapist-pending-approval');
            return;
          }
          setUsername(profileData.username || profileData.email?.split('@')[0] || '');
          setTherapistName(profileData.lastName || profileData.name || '');
        }

        const [clientsRes, appointmentsRes, queriesRes] = await Promise.all([
          fetch('http://localhost:5000/api/therapist/clients', { headers }),
          fetch('http://localhost:5000/api/therapist/appointments', { headers }),
          fetch('http://localhost:5000/api/therapist/parent-queries', { headers }),
        ]);

        let clientsData = [];
        let appointmentsData = [];
        let queriesData = [];

        if (clientsRes.ok) {
          clientsData = await clientsRes.json();
        } else {
          console.error('Clients fetch failed:', clientsRes.status, clientsRes.statusText);
        }

        if (appointmentsRes.ok) {
          appointmentsData = await appointmentsRes.json();
          console.log('Appointments fetched:', appointmentsData);
        } else {
          console.error('Appointments fetch failed:', appointmentsRes.status, appointmentsRes.statusText);
        }

        if (queriesRes.ok) {
          queriesData = await queriesRes.json();
        } else {
          console.error('Parent queries fetch failed:', queriesRes.status, queriesRes.statusText);
        }

        console.log('TherapistDashboard - clientsData:', clientsData);
        console.log('TherapistDashboard - appointmentsData:', appointmentsData);
        
        setClients(Array.isArray(clientsData) ? clientsData : []);
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
        setParentQueries(Array.isArray(queriesData) ? queriesData : []);
      } catch (error) {
        console.error('Error fetching therapist data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleNavClick = (path) => {
    const navMap = {
      '/therapist': 'dashboard',
      '/therapist/patients': 'patients',
      '/therapist/appointments': 'appointments',
      '/therapist/query-sessions': 'query-sessions',
      '/therapist/slots': 'slots',
      '/therapist/questionnaires': 'screening',
    };
    setActiveNav(navMap[path] || 'dashboard');
    navigate(path);
  };

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.clear();
    // Navigate to home page instead of login
    navigate('/');
  };

  const handleMarkQueryRead = async (queryId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/therapist/parent-queries/${queryId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return;
      }

      setParentQueries((prev) =>
        prev.map((query) =>
          query._id === queryId
            ? { ...query, status: 'read', readAt: new Date().toISOString() }
            : query
        )
      );
    } catch (error) {
      console.error('Error marking query as read:', error);
    }
  };

  const therapyGuidance = {
    asdExplanation: {
      trigger: ['explain asd', 'what is asd', 'autism spectrum'],
      response: `🧠 AUTISM SPECTRUM DISORDER (ASD) - CLINICAL OVERVIEW

ASD is a neurodevelopmental condition affecting:
• Social Communication: Difficulty with social reciprocity, nonverbal cues
• Restricted Behaviors: Repetitive patterns, sensory sensitivities
• Spectrum Presentation: Ranges from minimal support needs to significant support requirements

Clinical Significance: Early intervention with evidence-based practices (ABA, speech/OT therapy) significantly improves outcomes. Each child presents uniquely—personalized assessment is key.`
    },
    mriResults: {
      trigger: ['interpret mri', 'cnn result', 'explain severity'],
      response: `📊 INTERPRETING ASD DETECTION RESULTS

Severity Levels:
• Mild: Subtle behavioral differences; child may "mask" symptoms
  → Recommendation: Social skills training, sensory support
• Medium: Clear differences in communication & behavior
  → Recommendation: Structured ABA, speech therapy, sensory integration
• Severe: Significant support needs; communication challenges
  → Recommendation: Intensive ABA, augmentative communication, specialized care

Next Steps: Correlate findings with behavioral observations and parent reports.`
    },
    interventions: {
      trigger: ['suggest intervention', 'therapy plan', 'what activities'],
      response: `🎯 EVIDENCE-BASED INTERVENTIONS FOR ASD

ABA (Applied Behavior Analysis)
• 20-40 hrs/week is gold standard for Medium-Severe cases
• Focuses on reinforcing desired behaviors, reducing challenging behaviors

Speech & Language Therapy
• Targets communication, pragmatics, social language
• Includes AAC (Augmentative/Alternative Communication) if needed

Occupational Therapy
• Sensory integration activities
• Daily living skills, motor coordination

Social Skills Training
• Play-based learning, social stories
• Peer interaction coaching

Individualized Approach: Consider child's strengths, sensory profile, and family goals.`
    },
    parentCommunication: {
      trigger: ['talk to parents', 'explain results', 'parent communication'],
      response: `💬 COMMUNICATING RESULTS TO PARENTS - EMPATHETIC APPROACH

Frame Positively:
✓ "We've identified strengths and areas where your child can benefit from support."
✓ Focus on neurodiversity, not deficit
✓ Emphasize early intervention benefits

Key Points to Cover:
1. What the results mean in plain language
2. How it affects their child's learning and social interactions
3. Recommended next steps and support services
4. Positive outcomes with early, consistent intervention
5. Family's role in therapy success

Tone: Hopeful, collaborative, and supportive. You're a partner, not a judge.`
    },
    progressTracking: {
      trigger: ['track progress', 'document session', 'summarize progress'],
      response: `📈 SESSION DOCUMENTATION & PROGRESS TRACKING

What to Record:
• Specific behaviors targeted (e.g., "Improved eye contact during 5/10 interactions")
• Response to interventions (e.g., "Reduced repetitive behaviors with redirection")
• Functional outcomes (e.g., "Initiated 2 peer interactions independently")
• Parent observations & feedback
• Adjustments needed

Data-Driven Progress:
✓ Use baseline + current data to show improvement
✓ Track frequency, duration, and quality of skills
✓ Adjust interventions if no progress in 4-6 weeks
✓ Celebrate wins (maintain morale & motivation)`
    },
    research: {
      trigger: ['latest research', 'evidence-based', 'new findings'],
      response: `🔬 LATEST EVIDENCE-BASED PRACTICES IN ASD (2024)

Early Detection Wins: Screen by age 2; intervention before age 3 shows best outcomes

Neurodiversity Affirming Approaches: Moving away from pure "normalization" to supporting authentic communication styles

Technology-Supported Therapy: Apps + VR can enhance social skills training

Sensory-First Approach: Understanding sensory profiles helps personalize interventions

Family-Centered Care: Coaching parents is as effective as direct therapy

💡 Recommendation: Combine intensity with child's specific profile for best results.`
    },
    sensory: {
      trigger: ['sensory', 'overwhelmed', 'stimming'],
      response: `🎨 SENSORY INTEGRATION & REGULATION SUPPORT

Understanding Stimming:
• Often self-regulating behavior (not harmful)
• May indicate overstimulation, understimulation, or emotion
• Redirect rather than suppress

Sensory Activities:
✓ Deep pressure (weighted blankets, hugs)
✓ Proprioceptive input (jumping, pushing, resistance play)
✓ Vestibular (swings, rocking, spinning)
✓ Auditory/visual (music, colored lights)

Creating Sensory-Friendly Spaces:
• Reduce fluorescent lighting, loud noises
• Provide safe "shutdown" areas
• Offer sensory breaks between structured activities`
    }
  };

  const generateAssistantResponse = (input) => {
    const lowerInput = input.toLowerCase();
    
    for (const [key, data] of Object.entries(therapyGuidance)) {
      if (data.trigger.some(t => lowerInput.includes(t))) {
        return data.response;
      }
    }
    
    return `I'm here to help with ASD clinical guidance! You can ask me about:\n• ASD explanation & severity levels\n• Interpreting CNN/MRI results\n• Evidence-based interventions & therapy plans\n• Parent communication strategies\n• Session documentation & progress tracking\n• Latest research & best practices\n• Sensory integration techniques\n\n**Try asking:** "Suggest interventions for Medium risk ASD" or "How do I explain results to parents?"`;
  };

  const handleAssistantSend = () => {
    if (!assistantInput.trim()) return;
    
    const userMsg = { type: 'user', text: assistantInput };
    const botResponse = generateAssistantResponse(assistantInput);
    const botMsg = { type: 'bot', text: botResponse };
    
    setAssistantMessages(prev => [...prev, userMsg, botMsg]);
    setAssistantInput('');
  };

  const handleAssistantPrompt = (prompt) => {
    setAssistantInput(prompt);
    setTimeout(() => {
      const userMsg = { type: 'user', text: prompt };
      const botResponse = generateAssistantResponse(prompt);
      const botMsg = { type: 'bot', text: botResponse };
      
      setAssistantMessages(prev => [...prev, userMsg, botMsg]);
      setAssistantInput('');
    }, 100);
  };

  const openAssistant = () => {
    if (assistantMessages.length === 0) {
      setAssistantMessages([{
        type: 'bot',
        text: `👋 Welcome Dr. ${therapistName || 'Therapist'}!\n\nI'm your AI-powered therapy guide and support assistant. I can help you with:\n\n✓ Clinical Guidance - Explaining ASD detection results\n✓ Intervention Planning - Personalized therapy recommendations\n✓ Parent Communication - Empathetic messaging strategies\n✓ Progress Tracking - Session documentation insights\n✓ Research Updates - Latest evidence-based practices\n✓ Sensory Support - Regulation and activity ideas\n\nHow can I assist you today?`
      }]);
    }
    setShowAssistant(true);
  };

  return (
    <div className="therapist-dashboard">
      <Sidebar 
        activeNav={activeNav} 
        onNavClick={handleNavClick} 
        onLogout={handleLogout}
        therapistName={therapistName}
      />
      <MainContent 
        username={username}
        therapistName={therapistName}
        appointments={appointments}
        clients={clients}
        parentQueries={parentQueries}
        loading={loading}
        onMarkQueryRead={handleMarkQueryRead}
        onOpenAssistant={openAssistant}
        navigate={navigate}
      />
      {showAssistant && (
        <div className="assistant-overlay">
          <div className="assistant-widget">
            <div className="assistant-header">
              <div className="assistant-title">🧠 Guide & Support AI</div>
              <button className="assistant-close" onClick={() => setShowAssistant(false)}>
                <FiX />
              </button>
            </div>
            <div className="assistant-body">
              {assistantMessages.length === 0 ? (
                <div className="assistant-message assistant-message-bot">
                  Welcome, Dr. {therapistName || 'Therapist'}! I'm here to help. You can ask me to find patients, pull up clinical guides, or answer technical questions.
                </div>
              ) : (
                <div className="assistant-messages-container">
                  {assistantMessages.map((msg, idx) => (
                    <div key={idx} className={`assistant-message assistant-message-${msg.type}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
              )}
              {assistantMessages.length === 0 && (
                <div className="assistant-prompts">
                  <button className="assistant-prompt" onClick={() => handleAssistantPrompt("Suggest interventions for Medium risk ASD age 8")}>
                    💡 Suggest interventions for Medium risk ASD
                  </button>
                  <button className="assistant-prompt" onClick={() => handleAssistantPrompt("How do I explain ASD results to parents empathetically?")}>
                    💬 Explain results to parents
                  </button>
                  <button className="assistant-prompt" onClick={() => handleAssistantPrompt("What are the latest evidence-based practices for ASD?")}>
                    🔬 Latest research & best practices
                  </button>
                  <button className="assistant-prompt" onClick={() => handleAssistantPrompt("Help with sensory integration activities")}>
                    🎨 Sensory integration techniques
                  </button>
                </div>
              )}
            </div>
            <div className="assistant-input-row">
              <input 
                type="text" 
                placeholder="Ask the guide..." 
                className="assistant-input" 
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAssistantSend()}
              />
              <button className="assistant-send" onClick={handleAssistantSend}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
