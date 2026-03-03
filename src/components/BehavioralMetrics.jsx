import React, { useState, useEffect } from 'react';
import './BehavioralMetrics.css';

const BehavioralMetrics = ({ patientId, sessionId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBehavioralMetrics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const response = await fetch(
          `http://localhost:5000/api/therapist/behavioral-metrics/${patientId}${
            sessionId ? `?sessionId=${sessionId}` : ''
          }`,
          { headers }
        );

        if (!response.ok) throw new Error('Failed to fetch metrics');

        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching behavioral metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchBehavioralMetrics();
    }
  }, [patientId, sessionId]);

  if (loading) {
    return <div className="behavioral-metrics-loading">Loading metrics...</div>;
  }

  if (error) {
    return <div className="behavioral-metrics-error">Error: {error}</div>;
  }

  if (!metrics) {
    return <div className="behavioral-metrics-empty">No session data available</div>;
  }

  const getRiskLevel = (value, threshold = 0.5) => {
    if (value < threshold * 0.5) return { level: 'Low', color: '#10b981' };
    if (value < threshold) return { level: 'Moderate', color: '#f59e0b' };
    return { level: 'High', color: '#ef4444' };
  };

  const gazeRisk = getRiskLevel(metrics.headGazeVariance);
  const motorRisk = getRiskLevel(metrics.averageJointVelocity, 1.0);

  return (
    <div className="behavioral-metrics-container">
      <div className="metrics-header">
        <h3 className="metrics-title">Objective Biometrics: Session {metrics.sessionDate}</h3>
        <p className="metrics-subtitle">DREAM Dataset Features Analysis</p>
      </div>

      <div className="metrics-grid">
        {/* Motor Activity Card */}
        <div className="metric-card">
          <div className="metric-card-header">
            <h4 className="metric-card-title">Motor Activity</h4>
            <span className="metric-badge">Kinematic</span>
          </div>
          <div className="metric-card-content">
            <div className="metric-value-row">
              <span className="metric-label">Average Joint Velocity</span>
              <span className="metric-value">
                {metrics.averageJointVelocity?.toFixed(3)} m/s
              </span>
            </div>
            <div className="metric-progress">
              <div
                className="metric-progress-bar"
                style={{
                  width: `${Math.min((metrics.averageJointVelocity / 2) * 100, 100)}%`,
                  backgroundColor: motorRisk.color,
                }}
              />
            </div>
            <p className="metric-interpretation">
              <span className="risk-badge" style={{ backgroundColor: motorRisk.color }}>
                {motorRisk.level}
              </span>
              {motorRisk.level === 'Low'
                ? ' - Controlled movement patterns, good motor regulation'
                : motorRisk.level === 'Moderate'
                ? ' - Moderate motor activity, some regulation challenges'
                : ' - High motor activity, potential regulation needs'}
            </p>
          </div>
        </div>

        {/* Social Attention (Gaze) Card */}
        <div className="metric-card">
          <div className="metric-card-header">
            <h4 className="metric-card-title">Social Attention</h4>
            <span className="metric-badge">Gaze Analysis</span>
          </div>
          <div className="metric-card-content">
            <div className="metric-value-row">
              <span className="metric-label">Head Gaze Variance</span>
              <span className="metric-value">
                {metrics.headGazeVariance?.toFixed(4)}
              </span>
            </div>
            <div className="metric-progress">
              <div
                className="metric-progress-bar"
                style={{
                  width: `${Math.min((metrics.headGazeVariance * 100) * 100, 100)}%`,
                  backgroundColor: gazeRisk.color,
                }}
              />
            </div>
            <p className="metric-interpretation">
              <span className="risk-badge" style={{ backgroundColor: gazeRisk.color }}>
                {gazeRisk.level}
              </span>
              {gazeRisk.level === 'Low'
                ? ' - Stable eye contact, consistent attention focus'
                : gazeRisk.level === 'Moderate'
                ? ' - Variable gaze patterns, periodic attention shifts'
                : ' - High gaze variance, significant attention variability'}
            </p>
          </div>
        </div>

        {/* ADOS Clinical Score Card */}
        <div className="metric-card">
          <div className="metric-card-header">
            <h4 className="metric-card-title">ADOS Assessment</h4>
            <span className="metric-badge">Clinical</span>
          </div>
          <div className="metric-card-content">
            <div className="metric-value-row">
              <span className="metric-label">Communication Score</span>
              <span className="metric-value">{metrics.adosCommunicationScore}</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-label">Total ADOS Score</span>
              <span className="metric-value">{metrics.adosTotalScore}</span>
            </div>
            <p className="metric-interpretation">
              Baseline assessment for clinical severity stratification
            </p>
          </div>
        </div>

        {/* Total Displacement Card */}
        <div className="metric-card">
          <div className="metric-card-header">
            <h4 className="metric-card-title">Movement Extent</h4>
            <span className="metric-badge">Kinematic</span>
          </div>
          <div className="metric-card-content">
            <div className="metric-value-row">
              <span className="metric-label">Total Displacement Ratio</span>
              <span className="metric-value">
                {metrics.totalDisplacementRatio?.toFixed(2)} units/sec
              </span>
            </div>
            <p className="metric-interpretation">
              Normalized movement extent during session
            </p>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="metrics-summary">
        <h4 className="summary-title">Session Summary</h4>
        <p className="summary-text">
          During this session, the patient demonstrated{' '}
          <strong>{motorRisk.level.toLowerCase()} motor activity</strong> with{' '}
          <strong>{gazeRisk.level.toLowerCase()} gaze stability</strong>. These objective
          measurements from skeletal tracking and eye gaze analysis provide quantifiable baselines
          for monitoring intervention progress.
        </p>
      </div>
    </div>
  );
};

export default BehavioralMetrics;
