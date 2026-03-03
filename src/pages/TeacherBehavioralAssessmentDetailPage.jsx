import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiUser, 
  FiBarChart2, 
  FiActivity,
  FiTrendingUp,
  FiAlertCircle,
  FiDownload,
  FiShare2
} from 'react-icons/fi';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import './TeacherBehavioralAssessmentDetailPage.css';

const toolNames = {
  'emotion-match': 'Emotion Match',
  'eye-gaze-tracker': 'Eye-Gaze Tracker',
  'social-attention': 'Social Attention',
  'imitation': 'Imitation',
  'sound-sensitivity': 'Sound Sensitivity',
  'pattern-fixation': 'Pattern Fixation',
  'story-understanding': 'Story Understanding',
  'turn-taking': 'Turn-Taking'
};

const TeacherBehavioralAssessmentDetailPage = () => {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSession, setCompareSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const toolName = toolNames[toolId] || 'Assessment Detail';

  useEffect(() => {
    fetchSessions();
  }, [toolId]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/behavioral/tool/${toolId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // data contains populated studentId
        const formattedSessions = data.map(s => ({
          id: s._id,
          studentId: s.studentId?._id,
          studentName: s.studentId?.name || 'Unknown Student',
          date: new Date(s.completedAt).toLocaleDateString(),
          score: s.score,
          metrics: s.metrics || {},
          indicators: s.indicators || {},
          // We can't easily get history for all students in one go without more API calls
          // For now, let's just use the current score as history point
          history: [{ date: new Date(s.completedAt).toLocaleDateString(), score: s.score }]
        }));
        setSessions(formattedSessions);
        if (formattedSessions.length > 0) {
          setSelectedSession(formattedSessions[0]);
          setActiveSessionId(formattedSessions[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = (session) => {
    if (compareMode) {
      setCompareSession(session);
    } else {
      setSelectedSession(session);
      setActiveSessionId(session.id);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading assessment data...</div>;
  }

  if (!selectedSession) {
    return (
      <div className="assessment-detail-page empty">
        <div className="detail-sidebar">
           <div className="sidebar-header">
            <button className="back-link" onClick={() => navigate('/teacher/assessments')}>
              <FiArrowLeft /> Back to Tools
            </button>
            <h2>{toolName}</h2>
          </div>
          <div className="session-list-container">
            <p>No sessions recorded yet.</p>
          </div>
        </div>
        <div className="detail-content empty-state">
           <h1>No Data Available</h1>
           <p>Complete an assessment game to see real behavior-driven analytics here.</p>
           <button className="btn-primary" onClick={() => navigate('/teacher/assessments')}>
             Go to Assessment Tools
           </button>
        </div>
      </div>
    );
  }

  const radarData = [
    { subject: 'Accuracy', A: selectedSession.metrics?.accuracy || 0, B: compareMode && compareSession ? compareSession.metrics?.accuracy || 0 : 0, fullMark: 100 },
    { subject: 'Eye Contact', A: selectedSession.metrics?.eyeContactTime || 0, B: compareMode && compareSession ? compareSession.metrics?.eyeContactTime || 0 : 0, fullMark: 100 },
    { subject: 'Imitation', A: selectedSession.metrics?.imitationScore || 0, B: compareMode && compareSession ? compareSession.metrics?.imitationScore || 0 : 0, fullMark: 100 },
    { subject: 'Social', A: selectedSession.metrics?.socialResponseCorrectness || 0, B: compareMode && compareSession ? compareSession.metrics?.socialResponseCorrectness || 0 : 0, fullMark: 100 },
    { subject: 'Turn Taking', A: selectedSession.metrics?.waitingBehaviorScore || 0, B: compareMode && compareSession ? compareSession.metrics?.waitingBehaviorScore || 0 : 0, fullMark: 100 },
    { subject: 'Sensory', A: (100 - (selectedSession.metrics?.sensoryResponseTime * 10 || 0)), B: compareMode && compareSession ? (100 - (compareSession.metrics?.sensoryResponseTime * 10 || 0)) : 0, fullMark: 100 },
  ];

  return (
    <div className="assessment-detail-page">
      <div className="detail-sidebar">
        <div className="sidebar-header">
          <button className="back-link" onClick={() => navigate('/teacher/assessments')}>
            <FiArrowLeft /> Back to Tools
          </button>
          <h2>{toolName}</h2>
          <div className="compare-toggle">
            <span>Compare Mode</span>
            <input 
              type="checkbox" 
              checked={compareMode} 
              onChange={() => setCompareMode(!compareMode)} 
            />
          </div>
        </div>
        
        <div className="session-list-container">
          <h3>{compareMode ? 'Select Session to Compare' : 'Recent Sessions'}</h3>
          <div className="session-list">
            {sessions.map(session => (
              <div 
                key={session.id} 
                className={`session-item ${activeSessionId === session.id ? 'active' : ''} ${compareMode && compareSession?.id === session.id ? 'comparing' : ''}`}
                onClick={() => handleSessionSelect(session)}
              >
                <div className="session-item-info">
                  <span className="session-child-name">{session.studentName}</span>
                  <span className="session-date">{session.date}</span>
                </div>
                <div className="session-score-badge" style={{ backgroundColor: session.score > 70 ? '#10b981' : session.score > 50 ? '#f59e0b' : '#ef4444' }}>
                  {session.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="content-header">
          <div className="child-profile-brief">
            <div className="avatar-group">
              <div className="avatar-small">
                {selectedSession.studentName.charAt(0)}
              </div>
              {compareMode && compareSession && (
                <div className="avatar-small compare">
                  {compareSession.studentName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1>
                {selectedSession.studentName}
                {compareMode && compareSession && <span className="vs"> vs </span>}
                {compareMode && compareSession && compareSession.studentName}
              </h1>
              <p>
                {compareMode && compareSession
                  ? `Comparing sessions from ${selectedSession.date} and ${compareSession.date}`
                  : `Session Date: ${selectedSession.date}`
                }
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary"><FiDownload /> Export</button>
            <button className="btn-primary"><FiShare2 /> Share Report</button>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card main-metric">
            <h3>{compareMode && compareSession ? 'Comparative Performance' : 'Assessment Performance'}</h3>
            <div className="radar-container">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name={selectedSession.studentName}
                    dataKey="A"
                    stroke="#ff1493"
                    fill="#ff1493"
                    fillOpacity={0.6}
                  />
                  {compareMode && compareSession && (
                    <Radar
                      name={compareSession.studentName}
                      dataKey="B"
                      stroke="#4dabf7"
                      fill="#4dabf7"
                      fillOpacity={0.4}
                    />
                  )}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="metric-card indicators-card">
            <h3>ASD-Relevant Indicators</h3>
            <div className="indicators-list">
              {(selectedSession.indicators || []).map((indicator, idx) => (
                <div key={idx} className="indicator-item">
                  <div className="indicator-info">
                    <span className="indicator-label">{indicator.label}</span>
                    <span className="indicator-status" style={{ color: indicator.color }}>{indicator.status}</span>
                  </div>
                  <div className="indicator-bar-bg">
                    <div 
                      className="indicator-bar-fill" 
                      style={{ 
                        width: indicator.status === 'Optimal' || indicator.status === 'Good' || indicator.status === 'Low' ? '100%' : '50%',
                        backgroundColor: indicator.color 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="clinical-note">
              <FiAlertCircle className="note-icon" />
              <p>
                {(selectedSession.indicators || []).some(i => i.color === '#ef4444')
                  ? "Analysis suggests areas requiring attention. Review specific indicators marked in red for intervention planning."
                  : "Child shows positive engagement. Continue with current support plan and monitor progress."}
              </p>
            </div>
          </div>
        </div>

        <div className="progress-section">
          <div className="metric-card full-width">
            <div className="card-header-flex">
              <h3>Progress History</h3>
              <div className="trend-indicator positive">
                <FiTrendingUp /> +8% improvement
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={selectedSession.history || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#ff1493" 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: '#ff1493', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="structured-data-section">
          <h3>Structured Behavioral Metrics</h3>
          <div className="data-table">
            <div className="table-row header">
              <span>Metric</span>
              <span>Value</span>
              <span>Session Context</span>
            </div>
            {Object.entries(selectedSession.metrics || {}).map(([key, value]) => (
              <div className="table-row" key={key}>
                <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="value-text">{typeof value === 'number' && value < 10 ? value.toFixed(2) : value}{key.toLowerCase().includes('time') ? 's' : ''}</span>
                <span>Recorded via real-time tracking</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherBehavioralAssessmentDetailPage;
