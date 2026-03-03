import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiTrendingDown,
  FiActivity,
  FiEye,
  FiUsers,
  FiRepeat,
  FiVolume2,
  FiGrid,
  FiBookOpen,
  FiLayers,
  FiDownload,
  FiInfo
} from 'react-icons/fi';
import './BehavioralAnalysisReportPage.css';

const BehavioralAnalysisReportPage = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchAnalysisReport();
    }
  }, [studentId]);

  const fetchAnalysisReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/behavioral/analyze/${studentId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch analysis report');
      }

      const data = await response.json();
      setReport(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High':
        return '#ef4444';
      case 'Moderate':
        return '#f59e0b';
      case 'Low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'High':
        return <FiAlertTriangle />;
      case 'Moderate':
        return <FiAlertTriangle />;
      case 'Low':
        return <FiCheckCircle />;
      default:
        return <FiInfo />;
    }
  };

  const getProfileLevelColor = (level) => {
    if (level.includes('Strong') || level.includes('Typical') || level.includes('Minimal')) {
      return '#10b981';
    } else if (level.includes('Moderate') || level.includes('Developing')) {
      return '#f59e0b';
    } else {
      return '#ef4444';
    }
  };

  const getGameIcon = (gameType) => {
    const icons = {
      'emotion-match': FiActivity,
      'eye-gaze-tracker': FiEye,
      'social-attention': FiUsers,
      'imitation': FiRepeat,
      'sound-sensitivity': FiVolume2,
      'pattern-fixation': FiGrid,
      'story-understanding': FiBookOpen,
      'turn-taking': FiLayers
    };
    return icons[gameType] || FiActivity;
  };

  if (loading) {
    return (
      <div className="analysis-report-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Generating behavioral analysis report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-report-page">
        <div className="error-container">
          <FiAlertTriangle className="error-icon" />
          <h2>Unable to Generate Report</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/teacher/assessments')} className="back-button">
            <FiArrowLeft /> Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="analysis-report-page">
      <div className="report-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/teacher/assessments')}>
            <FiArrowLeft />
          </button>
          <div>
            <h1>Behavioral Analysis Report</h1>
            <p className="report-subtitle">Comprehensive ASD Risk Assessment Based on Game-Based Behavioral Data</p>
            <p className="report-date">Generated: {new Date(report.generatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-box">
        <FiInfo className="info-icon" />
        <p><strong>Important:</strong> {report.disclaimer}</p>
      </div>

      {/* Risk Summary */}
      <section className="report-section risk-summary">
        <h2>A. Risk Summary</h2>
        <div className="risk-summary-content">
          <div className="risk-indicator" style={{ borderColor: getRiskColor(report.riskSummary.overallRiskLevel) }}>
            <div className="risk-icon" style={{ color: getRiskColor(report.riskSummary.overallRiskLevel) }}>
              {getRiskIcon(report.riskSummary.overallRiskLevel)}
            </div>
            <div className="risk-details">
              <h3>Overall Risk Level</h3>
              <div className="risk-level" style={{ color: getRiskColor(report.riskSummary.overallRiskLevel) }}>
                {report.riskSummary.overallRiskLevel}
              </div>
              <p className="probability-score">Probability Score: {report.riskSummary.probabilityScore}%</p>
            </div>
          </div>

          <div className="probability-breakdown">
            <h4>Probability Breakdown</h4>
            <div className="probability-bars">
              <div className="prob-bar">
                <div className="prob-label">Low Risk</div>
                <div className="prob-bar-container">
                  <div 
                    className="prob-bar-fill low" 
                    style={{ width: `${report.riskSummary.probabilityBreakdown.Low}%` }}
                  >
                    {report.riskSummary.probabilityBreakdown.Low}%
                  </div>
                </div>
              </div>
              <div className="prob-bar">
                <div className="prob-label">Medium Risk</div>
                <div className="prob-bar-container">
                  <div 
                    className="prob-bar-fill medium" 
                    style={{ width: `${report.riskSummary.probabilityBreakdown.Medium}%` }}
                  >
                    {report.riskSummary.probabilityBreakdown.Medium}%
                  </div>
                </div>
              </div>
              <div className="prob-bar">
                <div className="prob-label">High Risk</div>
                <div className="prob-bar-container">
                  <div 
                    className="prob-bar-fill high" 
                    style={{ width: `${report.riskSummary.probabilityBreakdown.High}%` }}
                  >
                    {report.riskSummary.probabilityBreakdown.High}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Behavioral Profile */}
      <section className="report-section behavioral-profile">
        <h2>B. Behavioral Profile</h2>
        <div className="profile-grid">
          <div className="profile-item">
            <h4>Social Attention</h4>
            <div className="profile-score">
              <div className="score-value">{Math.round(report.behavioralProfile.socialAttention.score)}%</div>
              <div 
                className="profile-level" 
                style={{ color: getProfileLevelColor(report.behavioralProfile.socialAttention.level) }}
              >
                {report.behavioralProfile.socialAttention.level}
              </div>
            </div>
            {report.behavioralProfile.socialAttention.traits.length > 0 && (
              <ul className="profile-traits">
                {report.behavioralProfile.socialAttention.traits.map((trait, idx) => (
                  <li key={idx}>{trait}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="profile-item">
            <h4>Emotional Recognition</h4>
            <div className="profile-score">
              <div className="score-value">{Math.round(report.behavioralProfile.emotionalRecognition.score)}%</div>
              <div 
                className="profile-level" 
                style={{ color: getProfileLevelColor(report.behavioralProfile.emotionalRecognition.level) }}
              >
                {report.behavioralProfile.emotionalRecognition.level}
              </div>
            </div>
            {report.behavioralProfile.emotionalRecognition.traits.length > 0 && (
              <ul className="profile-traits">
                {report.behavioralProfile.emotionalRecognition.traits.map((trait, idx) => (
                  <li key={idx}>{trait}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="profile-item">
            <h4>Sensory Processing</h4>
            <div className="profile-score">
              <div className="score-value">{Math.round(report.behavioralProfile.sensoryProcessing.score)}%</div>
              <div 
                className="profile-level" 
                style={{ color: getProfileLevelColor(report.behavioralProfile.sensoryProcessing.level) }}
              >
                {report.behavioralProfile.sensoryProcessing.level}
              </div>
            </div>
            {report.behavioralProfile.sensoryProcessing.traits.length > 0 && (
              <ul className="profile-traits">
                {report.behavioralProfile.sensoryProcessing.traits.map((trait, idx) => (
                  <li key={idx}>{trait}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="profile-item">
            <h4>Imitation Ability</h4>
            <div className="profile-score">
              <div className="score-value">{Math.round(report.behavioralProfile.imitationAbility.score)}%</div>
              <div 
                className="profile-level" 
                style={{ color: getProfileLevelColor(report.behavioralProfile.imitationAbility.level) }}
              >
                {report.behavioralProfile.imitationAbility.level}
              </div>
            </div>
            {report.behavioralProfile.imitationAbility.traits.length > 0 && (
              <ul className="profile-traits">
                {report.behavioralProfile.imitationAbility.traits.map((trait, idx) => (
                  <li key={idx}>{trait}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="profile-item">
            <h4>Repetitive Behavior</h4>
            <div className="profile-score">
              <div className="score-value">{Math.round(report.behavioralProfile.repetitiveBehavior.score)}%</div>
              <div 
                className="profile-level" 
                style={{ color: getProfileLevelColor(report.behavioralProfile.repetitiveBehavior.level) }}
              >
                {report.behavioralProfile.repetitiveBehavior.level}
              </div>
            </div>
            {report.behavioralProfile.repetitiveBehavior.traits.length > 0 && (
              <ul className="profile-traits">
                {report.behavioralProfile.repetitiveBehavior.traits.map((trait, idx) => (
                  <li key={idx}>{trait}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="profile-item">
            <h4>Social Reciprocity</h4>
            <div className="profile-score">
              <div className="score-value">{Math.round(report.behavioralProfile.socialReciprocity.score)}%</div>
              <div 
                className="profile-level" 
                style={{ color: getProfileLevelColor(report.behavioralProfile.socialReciprocity.level) }}
              >
                {report.behavioralProfile.socialReciprocity.level}
              </div>
            </div>
            {report.behavioralProfile.socialReciprocity.traits.length > 0 && (
              <ul className="profile-traits">
                {report.behavioralProfile.socialReciprocity.traits.map((trait, idx) => (
                  <li key={idx}>{trait}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Game-wise Analysis */}
      <section className="report-section game-analysis">
        <h2>C. Game-wise Analysis</h2>
        <div className="game-analysis-grid">
          {report.gameWiseAnalysis.map((game, idx) => {
            const GameIcon = getGameIcon(game.gameType);
            return (
              <div key={idx} className="game-analysis-item">
                <div className="game-icon-wrapper">
                  <GameIcon />
                </div>
                <div className="game-analysis-content">
                  <h4>{game.gameName}</h4>
                  <p className="game-description">{game.description}</p>
                  {game.score !== null ? (
                    <>
                      <div className="game-score">Score: {game.score}%</div>
                      <p className="game-interpretation">{game.interpretation}</p>
                    </>
                  ) : (
                    <p className="game-not-completed">Not yet completed</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Progress Tracking */}
      {report.progressTracking.trends.length > 0 && (
        <section className="report-section progress-tracking">
          <h2>D. Progress Tracking</h2>
          <div className="progress-info">
            <p>Total Sessions: <strong>{report.progressTracking.totalSessions}</strong></p>
            <p>Games Completed: <strong>{report.progressTracking.gamesCompleted}</strong> / 8</p>
          </div>
          <div className="progress-trends">
            {report.progressTracking.trends.map((trend, idx) => (
              <div key={idx} className="trend-item">
                <h4>{trend.gameName}</h4>
                <div className="trend-comparison">
                  <span className="previous-score">Previous: {trend.previousScore}%</span>
                  <span className={`trend-arrow ${trend.trend.toLowerCase()}`}>
                    {trend.change > 0 ? <FiTrendingUp /> : trend.change < 0 ? <FiTrendingDown /> : '—'}
                  </span>
                  <span className="latest-score">Latest: {trend.latestScore}%</span>
                </div>
                <div className={`trend-label ${trend.trend.toLowerCase()}`}>
                  {trend.trend} ({trend.change > 0 ? '+' : ''}{trend.change}%)
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="report-section recommendations">
        <h2>E. Recommendations</h2>
        <div className="recommendations-list">
          {report.recommendations.map((rec, idx) => (
            <div key={idx} className={`recommendation-item priority-${rec.priority.toLowerCase()}`}>
              <div className="recommendation-header">
                <span className="rec-category">{rec.category}</span>
                <span className={`rec-priority priority-${rec.priority.toLowerCase()}`}>
                  {rec.priority} Priority
                </span>
              </div>
              <p className="recommendation-text">{rec.recommendation}</p>
              <div className="action-items">
                <strong>Action Items:</strong>
                <ul>
                  {rec.actionItems.map((item, itemIdx) => (
                    <li key={itemIdx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="report-footer">
        <button onClick={() => window.print()} className="print-button">
          <FiDownload /> Print Report
        </button>
      </div>
    </div>
  );
};

export default BehavioralAnalysisReportPage;
