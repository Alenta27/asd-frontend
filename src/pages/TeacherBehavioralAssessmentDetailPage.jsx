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

const clampPercent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

const normalizePercent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n >= 0 && n <= 1) return Math.round(n * 100);
  return clampPercent(n);
};

const getMetric = (session, metricKey, fallback = 0) => {
  if (!session) return fallback;
  const topLevel = session[metricKey];
  if (topLevel !== undefined && topLevel !== null) return topLevel;
  const inMetrics = session.metrics?.[metricKey];
  if (inMetrics !== undefined && inMetrics !== null) return inMetrics;
  return fallback;
};

const buildRadarDataForTool = (toolId, session, compareMode, compareSession) => {
  const baseScoreA = clampPercent(session?.score || 0);
  const baseScoreB = clampPercent(compareSession?.score || 0);

  const mkPoint = (subject, valA, valB) => ({
    subject,
    A: clampPercent(valA),
    B: compareMode && compareSession ? clampPercent(valB) : 0,
    fullMark: 100
  });

  if (toolId === 'eye-gaze-tracker') {
    const eyeContactRatioA = normalizePercent(getMetric(session, 'eyeContactRatio', 0));
    const eyeContactRatioB = normalizePercent(getMetric(compareSession, 'eyeContactRatio', 0));
    const objectFocusRatioA = normalizePercent(getMetric(session, 'objectFocusRatio', 0));
    const objectFocusRatioB = normalizePercent(getMetric(compareSession, 'objectFocusRatio', 0));
    const gazeShiftA = Number(getMetric(session, 'gazeShiftCount', 0)) || 0;
    const gazeShiftB = Number(getMetric(compareSession, 'gazeShiftCount', 0)) || 0;

    return [
      mkPoint('Overall', baseScoreA, baseScoreB),
      mkPoint('Eye Contact', eyeContactRatioA, eyeContactRatioB),
      mkPoint('Social Focus', eyeContactRatioA, eyeContactRatioB),
      mkPoint('Object Focus', 100 - objectFocusRatioA, 100 - objectFocusRatioB),
      mkPoint('Gaze Stability', 100 - Math.min(100, gazeShiftA * 8), 100 - Math.min(100, gazeShiftB * 8)),
      mkPoint('Tracking Quality', (baseScoreA + eyeContactRatioA) / 2, (baseScoreB + eyeContactRatioB) / 2),
    ];
  }

  if (toolId === 'imitation') {
    const imitationAccuracyA = clampPercent(getMetric(session, 'imitationAccuracy', baseScoreA));
    const imitationAccuracyB = clampPercent(getMetric(compareSession, 'imitationAccuracy', baseScoreB));
    const similarityA = normalizePercent(getMetric(session, 'meanSimilarityScore', 0));
    const similarityB = normalizePercent(getMetric(compareSession, 'meanSimilarityScore', 0));
    const correctA = Number(getMetric(session, 'correctImitations', 0)) || 0;
    const totalA = Number(getMetric(session, 'totalActions', 0)) || 0;
    const correctB = Number(getMetric(compareSession, 'correctImitations', 0)) || 0;
    const totalB = Number(getMetric(compareSession, 'totalActions', 0)) || 0;
    const completionA = totalA > 0 ? (correctA / totalA) * 100 : imitationAccuracyA;
    const completionB = totalB > 0 ? (correctB / totalB) * 100 : imitationAccuracyB;

    return [
      mkPoint('Overall', baseScoreA, baseScoreB),
      mkPoint('Accuracy', imitationAccuracyA, imitationAccuracyB),
      mkPoint('Action Success', completionA, completionB),
      mkPoint('Similarity', similarityA, similarityB),
      mkPoint('Consistency', (imitationAccuracyA + similarityA) / 2, (imitationAccuracyB + similarityB) / 2),
      mkPoint('Completion', completionA, completionB),
    ];
  }

  const accuracyA = clampPercent(getMetric(session, 'accuracy', baseScoreA));
  const accuracyB = clampPercent(getMetric(compareSession, 'accuracy', baseScoreB));
  const socialA = clampPercent(getMetric(session, 'socialResponseCorrectness', baseScoreA));
  const socialB = clampPercent(getMetric(compareSession, 'socialResponseCorrectness', baseScoreB));
  const turnA = clampPercent(getMetric(session, 'waitingBehaviorScore', baseScoreA));
  const turnB = clampPercent(getMetric(compareSession, 'waitingBehaviorScore', baseScoreB));
  const sensoryA = 100 - clampPercent((Number(getMetric(session, 'sensoryResponseTime', 0)) || 0) * 10);
  const sensoryB = 100 - clampPercent((Number(getMetric(compareSession, 'sensoryResponseTime', 0)) || 0) * 10);

  return [
    mkPoint('Overall', baseScoreA, baseScoreB),
    mkPoint('Accuracy', accuracyA, accuracyB),
    mkPoint('Social', socialA, socialB),
    mkPoint('Turn Taking', turnA, turnB),
    mkPoint('Sensory', sensoryA, sensoryB),
    mkPoint('Consistency', (baseScoreA + accuracyA) / 2, (baseScoreB + accuracyB) / 2),
  ];
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
        // Build session rows and derive per-student history from all available tool sessions.
        const sessionRows = data.map(s => ({
          id: s._id,
          studentId: s.studentId?._id,
          studentName: s.studentId?.name || 'Unknown Student',
          completedAt: s.completedAt,
          date: new Date(s.completedAt).toLocaleDateString(),
          score: clampPercent(s.score),
          metrics: s.metrics || {},
          indicators: Array.isArray(s.indicators) ? s.indicators : [],
          eyeContactRatio: s.eyeContactRatio,
          objectFocusRatio: s.objectFocusRatio,
          gazeShiftCount: s.gazeShiftCount,
          totalActions: s.totalActions,
          correctImitations: s.correctImitations,
          imitationAccuracy: s.imitationAccuracy,
          meanSimilarityScore: s.meanSimilarityScore,
        }));

        const historyByStudent = new Map();
        sessionRows.forEach((row) => {
          const key = row.studentId || row.studentName;
          if (!historyByStudent.has(key)) historyByStudent.set(key, []);
          historyByStudent.get(key).push({
            date: row.date,
            score: clampPercent(row.score),
            ts: new Date(row.completedAt).getTime(),
          });
        });

        const formattedSessions = sessionRows
          .map((row) => {
            const key = row.studentId || row.studentName;
            const history = (historyByStudent.get(key) || [])
              .sort((a, b) => a.ts - b.ts)
              .map(({ date, score }) => ({ date, score }));

            return {
              ...row,
              history,
            };
          })
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

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

  const radarData = buildRadarDataForTool(toolId, selectedSession, compareMode, compareSession);
  const historyData = Array.isArray(selectedSession.history) ? selectedSession.history : [];
  const trendChange = historyData.length > 1
    ? Math.round((historyData[historyData.length - 1].score || 0) - (historyData[0].score || 0))
    : 0;
  const trendClass = trendChange > 0 ? 'positive' : trendChange < 0 ? 'negative' : 'neutral';
  const trendIcon = trendChange >= 0 ? <FiTrendingUp /> : <FiAlertCircle />;
  const trendText = historyData.length > 1
    ? `${trendChange > 0 ? '+' : ''}${trendChange}% ${trendChange > 0 ? 'improvement' : trendChange < 0 ? 'change' : 'stable'}`
    : 'Need 2+ sessions for trend';

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
              <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={260}>
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
              {(selectedSession.indicators || []).length === 0 && (
                <div className="indicator-item">
                  <div className="indicator-info">
                    <span className="indicator-label">No specific indicators recorded</span>
                    <span className="indicator-status" style={{ color: '#64748b' }}>N/A</span>
                  </div>
                  <div className="indicator-bar-bg">
                    <div className="indicator-bar-fill" style={{ width: '35%', backgroundColor: '#94a3b8' }}></div>
                  </div>
                </div>
              )}
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
              <div className={`trend-indicator ${trendClass}`}>
                {trendIcon} {trendText}
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={220}>
                <LineChart data={historyData}>
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
              {historyData.length === 0 && (
                <div style={{ marginTop: '10px', color: '#64748b', fontSize: '14px' }}>
                  No session history available yet.
                </div>
              )}
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
