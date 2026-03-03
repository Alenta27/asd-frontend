import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiActivity, 
  FiEye, 
  FiUsers, 
  FiRepeat, 
  FiVolume2, 
  FiGrid, 
  FiBookOpen, 
  FiLayers,
  FiChevronRight,
  FiSearch,
  FiFilter,
  FiPlay,
  FiX,
  FiUser,
  FiFileText
} from 'react-icons/fi';
import './TeacherBehavioralAssessmentsPage.css';

// Import Games
import EmotionMatchGame from '../components/games/EmotionMatchGame';
import EyeGazeTrackerGame from '../components/games/EyeGazeTrackerGame';
import SocialAttentionGame from '../components/games/SocialAttentionGame';
import ImitationGame from '../components/games/ImitationGame';
import SoundSensitivityGame from '../components/games/SoundSensitivityGame';
import PatternFixationGame from '../components/games/PatternFixationGame';
import StoryUnderstandingGame from '../components/games/StoryUnderstandingGame';
import TurnTakingGame from '../components/games/TurnTakingGame';
import SocialAttentionResults from '../components/SocialAttentionResults';

const assessmentTools = [
  {
    id: 'emotion-match',
    title: 'Emotion Match',
    description: 'Assesses ability to recognize and match facial expressions.',
    icon: FiActivity,
    color: '#FF6B6B',
    metric: 'Accuracy',
    component: EmotionMatchGame
  },
  {
    id: 'eye-gaze-tracker',
    title: 'Eye-Gaze Tracker',
    description: 'Monitors visual focus and fixation patterns.',
    icon: FiEye,
    color: '#4DABF7',
    metric: 'Fixation',
    component: EyeGazeTrackerGame
  },
  {
    id: 'social-attention',
    title: 'Social Attention',
    description: 'Measures responsiveness to social cues and stimuli.',
    icon: FiUsers,
    color: '#51CF66',
    metric: 'Social Response',
    component: SocialAttentionGame
  },
  {
    id: 'imitation',
    title: 'Imitation',
    description: 'Evaluates motor and social imitation skills.',
    icon: FiRepeat,
    color: '#FCC419',
    metric: 'Imitation Score',
    component: ImitationGame
  },
  {
    id: 'sound-sensitivity',
    title: 'Sound Sensitivity',
    description: 'Tests auditory processing and sensory responses.',
    icon: FiVolume2,
    color: '#FF922B',
    metric: 'Sensory Response',
    component: SoundSensitivityGame
  },
  {
    id: 'pattern-fixation',
    title: 'Pattern Fixation',
    description: 'Analyzes repetitive visual interests and focus.',
    icon: FiGrid,
    color: '#845EF7',
    metric: 'Fixation Duration',
    component: PatternFixationGame
  },
  {
    id: 'story-understanding',
    title: 'Story Understanding',
    description: 'Assesses narrative comprehension and theory of mind.',
    icon: FiBookOpen,
    color: '#20C997',
    metric: 'Understanding',
    component: StoryUnderstandingGame
  },
  {
    id: 'turn-taking',
    title: 'Turn-Taking',
    description: 'Measures reciprocal interaction and social timing.',
    icon: FiLayers,
    color: '#FF8787',
    metric: 'Reciprocity',
    component: TurnTakingGame
  }
];

const TeacherBehavioralAssessmentsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [lastAssessmentData, setLastAssessmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeStudents: 0,
    avgEngagement: 0,
    trend: 0
  });

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/behavioral/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/teacher/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        if (data.length > 0) setSelectedStudent(data[0]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = assessmentTools.filter(tool => 
    tool.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToolClick = (toolId) => {
    navigate(`/teacher/assessments/${toolId}`);
  };

  const startAssessment = (e, tool) => {
    e.stopPropagation();
    if (!selectedStudent) {
      alert("Please select a student first");
      return;
    }
    setActiveGame(tool);
    setShowGameModal(true);
  };

  const handleGameComplete = async (assessmentData) => {
    // Social Attention Test handles its own saving in the new implementation
    if (assessmentData.assessmentType === 'social-attention' && assessmentData.sessionId) {
        setLastAssessmentData(assessmentData);
        setShowGameModal(false);
        setActiveGame(null);
        setShowResultsModal(true);
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/behavioral/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assessmentData)
      });

      if (response.ok) {
        const savedData = await response.json();
        setLastAssessmentData(savedData);
        setShowGameModal(false);
        setActiveGame(null);
        setShowResultsModal(true); // Show results modal
      } else {
        const errorData = await response.json();
        alert(`Failed to save assessment results: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving assessment:", error);
      alert("Error saving assessment results");
    }
  };

  return (
    <div className="assessments-page">
      <div className="assessments-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/teacher')}>
            <FiArrowLeft />
          </button>
          <div>
            <h1>Behavioral Assessments</h1>
            <p>Game-based screening and diagnostic tools</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="student-selector">
            <FiUser className="search-icon" />
            <select 
              value={selectedStudent?._id || ''} 
              onChange={(e) => setSelectedStudent(students.find(s => s._id === e.target.value))}
            >
              <option value="" disabled>Select Student</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          {selectedStudent && (
            <button 
              className="analysis-report-btn"
              onClick={() => navigate(`/teacher/assessments/analysis/${selectedStudent._id}`)}
              title="View Comprehensive Behavioral Analysis Report"
            >
              <FiFileText />
              <span>View Analysis Report</span>
            </button>
          )}
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search tools..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="tools-grid">
        {filteredTools.map((tool) => (
          <div 
            key={tool.id} 
            className="tool-card"
            onClick={() => handleToolClick(tool.id)}
          >
            <div className="tool-icon-wrapper" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}>
              <tool.icon className="tool-icon" />
            </div>
            <div className="tool-content">
              <div className="tool-header-flex">
                <h3>{tool.title}</h3>
                <button 
                  className="play-btn-circle" 
                  style={{ backgroundColor: tool.color }}
                  onClick={(e) => startAssessment(e, tool)}
                  title="Start Assessment Game"
                >
                  <FiPlay />
                </button>
              </div>
              <p>{tool.description}</p>
              <div className="tool-footer">
                <span className="tool-metric">Metric: {tool.metric}</span>
                <FiChevronRight className="arrow-icon" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="assessment-stats">
        <div className="stat-card">
          <h4>Total Sessions</h4>
          <p className="stat-number">{stats.totalSessions}</p>
          <span className={`stat-trend ${stats.trend >= 0 ? 'positive' : 'negative'}`}>
            {stats.trend >= 0 ? '+' : ''}{stats.trend}% vs last month
          </span>
        </div>
        <div className="stat-card">
          <h4>Active Students</h4>
          <p className="stat-number">{stats.activeStudents}</p>
          <span className="stat-trend">Engaged this month</span>
        </div>
        <div className="stat-card">
          <h4>Avg. Engagement</h4>
          <p className="stat-number">{stats.avgEngagement}%</p>
          <span className="stat-trend positive">Based on session scores</span>
        </div>
      </div>

      {showGameModal && activeGame && (
        <div className="game-modal-overlay">
          <div className="game-modal-content">
            <div className="game-modal-header">
              <h3>{activeGame.title} - {selectedStudent?.name}</h3>
              <button onClick={() => setShowGameModal(false)}><FiX /></button>
            </div>
            <div className="game-modal-body">
              <activeGame.component 
                studentId={selectedStudent?._id} 
                onComplete={handleGameComplete} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Modal - Shows collected assessment data */}
      {showResultsModal && lastAssessmentData && (
        <div className="game-modal-overlay">
          <div className="game-modal-content results-modal" style={{ maxWidth: '800px' }}>
            <div className="game-modal-header">
              <h3>Assessment Results - {lastAssessmentData.game || lastAssessmentData.assessmentType}</h3>
              <button onClick={() => {
                setShowResultsModal(false);
                setLastAssessmentData(null);
              }}><FiX /></button>
            </div>
            <div className="results-content">
              {lastAssessmentData.assessmentType === 'social-attention' ? (
                <SocialAttentionResults results={lastAssessmentData} />
              ) : (
                <>
                  <div className="results-section">
                <h4>Session Information</h4>
                <div className="results-grid">
                  {lastAssessmentData.sessionId && (
                    <div className="result-item">
                      <span className="result-label">Session ID:</span>
                      <span className="result-value">{lastAssessmentData.sessionId}</span>
                    </div>
                  )}
                  {lastAssessmentData.sessionDuration !== undefined && (
                    <div className="result-item">
                      <span className="result-label">Session Duration:</span>
                      <span className="result-value">{lastAssessmentData.sessionDuration}s</span>
                    </div>
                  )}
                  {lastAssessmentData.completedAt && (
                    <div className="result-item">
                      <span className="result-label">Completed At:</span>
                      <span className="result-value">{new Date(lastAssessmentData.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Eye-Gaze Tracker Specific Metrics */}
              {(lastAssessmentData.assessmentType === 'eye-gaze-tracker' || lastAssessmentData.game === 'Eye-Gaze Tracker') && (
                <>
                  <div className="results-section">
                    <h4>Eye-Gaze Metrics</h4>
                    <div className="results-grid">
                      {lastAssessmentData.eyeContactTime !== undefined && (
                        <div className="result-item">
                          <span className="result-label">Eye Contact Time:</span>
                          <span className="result-value highlight">{lastAssessmentData.eyeContactTime.toFixed(2)}s</span>
                        </div>
                      )}
                      {lastAssessmentData.objectFocusTime !== undefined && (
                        <div className="result-item">
                          <span className="result-label">Object Focus Time:</span>
                          <span className="result-value highlight">{lastAssessmentData.objectFocusTime.toFixed(2)}s</span>
                        </div>
                      )}
                      {lastAssessmentData.eyeContactRatio !== undefined && (
                        <div className="result-item">
                          <span className="result-label">Eye Contact Ratio:</span>
                          <span className="result-value highlight">{(lastAssessmentData.eyeContactRatio * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {lastAssessmentData.objectFocusRatio !== undefined && (
                        <div className="result-item">
                          <span className="result-label">Object Focus Ratio:</span>
                          <span className="result-value highlight">{(lastAssessmentData.objectFocusRatio * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {lastAssessmentData.gazeShiftCount !== undefined && (
                        <div className="result-item">
                          <span className="result-label">Gaze Shift Count:</span>
                          <span className="result-value highlight">{lastAssessmentData.gazeShiftCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {lastAssessmentData.metrics && (
                    <div className="results-section">
                      <h4>Detailed Metrics</h4>
                      <div className="results-grid">
                        {lastAssessmentData.metrics.eyeContactTimeMs !== undefined && (
                          <div className="result-item">
                            <span className="result-label">Eye Contact (ms):</span>
                            <span className="result-value">{lastAssessmentData.metrics.eyeContactTimeMs}ms</span>
                          </div>
                        )}
                        {lastAssessmentData.metrics.objectFocusTimeMs !== undefined && (
                          <div className="result-item">
                            <span className="result-label">Object Focus (ms):</span>
                            <span className="result-value">{lastAssessmentData.metrics.objectFocusTimeMs}ms</span>
                          </div>
                        )}
                        {lastAssessmentData.metrics.totalFrames !== undefined && (
                          <div className="result-item">
                            <span className="result-label">Total Frames:</span>
                            <span className="result-value">{lastAssessmentData.metrics.totalFrames}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Sound Sensitivity Specific Metrics */}
              {(lastAssessmentData.assessmentType === 'sound-sensitivity' || lastAssessmentData.game === 'Sound Sensitivity') && lastAssessmentData.rawGameData && (
                <div className="results-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4>Sound Response Summary</h4>
                    <div style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: lastAssessmentData.metrics?.overallLevel === 'High' ? '#fee2e2' : lastAssessmentData.metrics?.overallLevel === 'Moderate' ? '#fef3c7' : '#dcfce7', color: lastAssessmentData.metrics?.overallLevel === 'High' ? '#ef4444' : lastAssessmentData.metrics?.overallLevel === 'Moderate' ? '#f59e0b' : '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
                      Level: {lastAssessmentData.metrics?.overallLevel || 'Low'}
                    </div>
                  </div>
                  <div className="sound-results-list">
                    {lastAssessmentData.rawGameData.map((item, idx) => (
                      <div key={idx} className={`sound-result-card reaction-${item.reactionScore || 0}`}>
                        <div className="sound-result-header">
                          <strong>{item.soundName || item.label}</strong>
                          <span className="sound-type-tag">{item.soundType || item.type}</span>
                        </div>
                        <div className="sound-result-body">
                          <span className={`reaction-badge level-${item.reactionScore || 0}`}>
                            {item.intensity || (item.reactionScore === 0 ? 'No Reaction' : item.reactionScore === 1 ? 'Mild' : 'Strong')}
                          </span>
                          <div className="sound-details-mini">
                            {item.reactions && item.reactions.length > 0 ? (
                                item.reactions.map((r, i) => <span key={i} className="detail-tag">{r}</span>)
                            ) : (
                                item.reactionScore > 0 ? (
                                    <>
                                        {item.details?.earCovering && <span className="detail-tag">Ear Covering</span>}
                                        {item.details?.vocalization > 60 && <span className="detail-tag">Vocal Reaction</span>}
                                        {item.details?.facialExpressions?.length > 0 && <span className="detail-tag">Facial Change</span>}
                                        {item.details?.headTurn && <span className="detail-tag">Head Turn</span>}
                                        {item.details?.gazeAvoidance && <span className="detail-tag">Gaze Avoidance</span>}
                                    </>
                                ) : <span className="detail-tag-none">Stable</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Turn-Taking Specific Metrics */}
              {(lastAssessmentData.assessmentType === 'turn-taking' || lastAssessmentData.game === 'Turn-Taking') && (
                <div className="results-section">
                  <h4>Turn-Taking Analysis</h4>
                  <div className="results-grid">
                    {lastAssessmentData.metrics?.turnTakingAccuracy !== undefined && (
                      <div className="result-item">
                        <span className="result-label">Accuracy:</span>
                        <span className="result-value highlight">{lastAssessmentData.metrics.turnTakingAccuracy}%</span>
                      </div>
                    )}
                    {lastAssessmentData.metrics?.impulsivityLevel && (
                      <div className="result-item">
                        <span className="result-label">Impulsivity Level:</span>
                        <span className="result-value highlight">{lastAssessmentData.metrics.impulsivityLevel}</span>
                      </div>
                    )}
                    {lastAssessmentData.metrics?.attentionConsistency && (
                      <div className="result-item">
                        <span className="result-label">Attention:</span>
                        <span className="result-value highlight">{lastAssessmentData.metrics.attentionConsistency}</span>
                      </div>
                    )}
                    {lastAssessmentData.metrics?.avgReactionTime !== undefined && (
                      <div className="result-item">
                        <span className="result-label">Avg Speed:</span>
                        <span className="result-value highlight">{lastAssessmentData.metrics.avgReactionTime}ms</span>
                      </div>
                    )}
                  </div>
                  {lastAssessmentData.summary && (
                    <div className="result-item" style={{ marginTop: '16px', borderLeft: '4px solid #3b82f6' }}>
                      <span className="result-label">Clinical Observation:</span>
                      <span className="result-value" style={{ fontStyle: 'italic', marginTop: '4px' }}>"{lastAssessmentData.summary}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Imitation Specific Metrics */}
              {(lastAssessmentData.assessmentType === 'imitation' || lastAssessmentData.game === 'Imitation') && (
                <div className="results-section">
                  <h4>Imitation Performance</h4>
                  <div className="results-grid">
                    <div className="result-item">
                      <span className="result-label">Overall Accuracy:</span>
                      <span className="result-value highlight">{lastAssessmentData.metrics?.imitationAccuracy || lastAssessmentData.score}%</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">Avg Reaction Time:</span>
                      <span className="result-value highlight">{lastAssessmentData.metrics?.averageReactionTime || 0}ms</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">Actions Completed:</span>
                      <span className="result-value">{lastAssessmentData.metrics?.correctImitations || 0} / {lastAssessmentData.metrics?.totalActions || 0}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">Mean Similarity:</span>
                      <span className="result-value">{lastAssessmentData.metrics?.meanSimilarityScore || 0}</span>
                    </div>
                  </div>
                  
                  {lastAssessmentData.rawGameData && Array.isArray(lastAssessmentData.rawGameData) && (
                    <div className="imitation-breakdown" style={{ marginTop: '15px' }}>
                      <h5>Action Breakdown</h5>
                      <div className="breakdown-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', marginTop: '8px' }}>
                        {lastAssessmentData.rawGameData.map((res, idx) => (
                          <div key={idx} style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#f8fafc', border: `1px solid ${res.success ? '#dcfce7' : '#fee2e2'}` }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{res.actionName}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', color: res.success ? '#10b981' : '#ef4444' }}>{res.status}</span>
                              <span style={{ fontSize: '10px', color: '#64748b' }}>{Math.round(res.confidenceScore * 100)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* General Metrics */}
              {lastAssessmentData.metrics && (
                <div className="results-section">
                  <h4>Assessment Metrics</h4>
                  <div className="results-grid">
                    {lastAssessmentData.score !== undefined && (
                      <div className="result-item">
                        <span className="result-label">Score:</span>
                        <span className="result-value highlight">{lastAssessmentData.score}%</span>
                      </div>
                    )}
                    {Object.entries(lastAssessmentData.metrics).map(([key, value]) => {
                      if (typeof value === 'number' && !['eyeContactTimeMs', 'objectFocusTimeMs', 'totalFrames'].includes(key)) {
                        return (
                          <div key={key} className="result-item">
                            <span className="result-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                            <span className="result-value">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* Indicators */}
              {lastAssessmentData.indicators && lastAssessmentData.indicators.length > 0 && (
                <div className="results-section">
                  <h4>Behavioral Indicators</h4>
                  <div className="indicators-list">
                    {lastAssessmentData.indicators.map((indicator, idx) => (
                      <div key={idx} className="indicator-item" style={{ borderLeftColor: indicator.color }}>
                        <span className="indicator-label">{indicator.label}:</span>
                        <span className="indicator-status" style={{ color: indicator.color }}>
                          {indicator.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </>
              )}

              {/* Action Buttons - Always visible */}
              <div className="results-actions">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    if (selectedStudent) {
                      navigate(`/teacher/assessments/analysis/${selectedStudent._id}`);
                    }
                  }}
                >
                  <FiFileText style={{ marginRight: '8px' }} />
                  View Full Analysis Report
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setShowResultsModal(false);
                    setLastAssessmentData(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherBehavioralAssessmentsPage;

