import React, { useState, useEffect } from 'react';
import './DreamDatasetAnalysis.css';

const DreamDatasetAnalysis = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('37');
  const [availableSubjects, setAvailableSubjects] = useState([
    { id: '10', age: 45, condition: 'ASD', sessionId: 'S001' },
    { id: '37', age: 47, condition: 'ASD', sessionId: 'S002' },
    { id: '42', age: 52, condition: 'TD', sessionId: 'S003' },
    { id: '55', age: 38, condition: 'ASD', sessionId: 'S004' },
    { id: '68', age: 41, condition: 'TD', sessionId: 'S005' },
  ]);

  useEffect(() => {
    fetchDreamAnalysis();
  }, [selectedSubject]);

  const fetchDreamAnalysis = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(
        `http://localhost:5000/api/researcher/dream-analysis?subjectId=${selectedSubject}`,
        { headers }
      );

      if (!response.ok) throw new Error('Failed to fetch DREAM analysis');

      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching DREAM analysis:', err);
      // Use mock data for demo
      setMetrics({
        joint_velocity: 0.73,
        gaze_variance: 0.042,
        communication_score: 8,
        ados_score: 10,
        displacement_ratio: 0.52,
        participant_id: selectedSubject,
        age_months: 47,
        condition: 'ASD'
      });
    } finally {
      setLoading(false);
    }
  };

  const getMetricLevel = (value, thresholds) => {
    if (value < thresholds.low) return { level: 'Low', color: '#10b981', bg: '#d1fae5' };
    if (value < thresholds.high) return { level: 'Moderate', color: '#f59e0b', bg: '#fef3c7' };
    return { level: 'High', color: '#ef4444', bg: '#fee2e2' };
  };

  const selectedSubjectInfo = availableSubjects.find(s => s.id === selectedSubject) || availableSubjects[0];

  if (loading) {
    return <div className="dream-loading">Loading DREAM Dataset Analysis...</div>;
  }

  if (error && !metrics) {
    return <div className="dream-error">Error: {error}</div>;
  }

  const velocityLevel = getMetricLevel(metrics.joint_velocity || 0, { low: 0.5, high: 1.0 });
  const gazeLevel = getMetricLevel(metrics.gaze_variance || 0, { low: 0.03, high: 0.06 });
  const commLevel = getMetricLevel(metrics.communication_score || 0, { low: 5, high: 10 });
  const adosLevel = getMetricLevel(metrics.ados_score || 0, { low: 7, high: 15 });

  return (
    <div className="dream-analysis-container">
      {/* Header Section */}
      <div className="dream-header">
        <div className="dream-title-section">
          <h2 className="dream-title">Behavioral Dataset Analysis</h2>
          <p className="dream-subtitle">DREAM Dataset - Kinematic & Gaze Features</p>
        </div>
        
        {/* Subject Selector */}
        <div className="dream-subject-selector">
          <label htmlFor="subject-select" className="subject-label">
            Dataset Subject:
          </label>
          <select
            id="subject-select"
            className="subject-selector-input"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {availableSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                Participant {subject.id} | Age: {subject.age} months | {subject.condition}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Participant Info Card */}
      <div className="participant-info-card">
        <div className="info-row">
          <div className="info-item">
            <span className="info-label">Participant ID:</span>
            <span className="info-value">DREAM_{selectedSubjectInfo.id}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Age:</span>
            <span className="info-value">{selectedSubjectInfo.age} months</span>
          </div>
          <div className="info-item">
            <span className="info-label">Condition:</span>
            <span className={`info-value condition-badge ${selectedSubjectInfo.condition.toLowerCase()}`}>
              {selectedSubjectInfo.condition === 'ASD' ? 'Autism Spectrum Disorder' : 'Typical Development'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Session ID:</span>
            <span className="info-value">{selectedSubjectInfo.sessionId}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="dream-metrics-grid">
        {/* Motor Activity - Joint Velocity */}
        <div className="dream-metric-card">
          <div className="metric-card-header">
            <h4 className="metric-title">Average Joint Velocity</h4>
            <span className="metric-category">Motor Activity – Kinematic</span>
          </div>
          <div className="metric-content">
            <div className="metric-value-large">
              {(metrics.joint_velocity || 0).toFixed(3)} <span className="metric-unit">m/s</span>
            </div>
            <div className="metric-progress-bar">
              <div
                className="metric-progress-fill"
                style={{
                  width: `${Math.min((metrics.joint_velocity / 2) * 100, 100)}%`,
                  backgroundColor: velocityLevel.color,
                }}
              />
            </div>
            <div className="metric-interpretation">
              <span
                className="metric-badge"
                style={{ backgroundColor: velocityLevel.bg, color: velocityLevel.color }}
              >
                {velocityLevel.level}
              </span>
              <p className="metric-description">
                {velocityLevel.level === 'Low'
                  ? 'Controlled movement patterns, reduced motor activity'
                  : velocityLevel.level === 'Moderate'
                  ? 'Moderate motor activity within typical range'
                  : 'High motor activity, increased movement velocity'}
              </p>
            </div>
          </div>
        </div>

        {/* Social Attention - Gaze Variance */}
        <div className="dream-metric-card">
          <div className="metric-card-header">
            <h4 className="metric-title">Head Gaze Variance</h4>
            <span className="metric-category">Social Attention – Gaze Analysis</span>
          </div>
          <div className="metric-content">
            <div className="metric-value-large">
              {(metrics.gaze_variance || 0).toFixed(4)} <span className="metric-unit">rad²</span>
            </div>
            <div className="metric-progress-bar">
              <div
                className="metric-progress-fill"
                style={{
                  width: `${Math.min((metrics.gaze_variance * 1000), 100)}%`,
                  backgroundColor: gazeLevel.color,
                }}
              />
            </div>
            <div className="metric-interpretation">
              <span
                className="metric-badge"
                style={{ backgroundColor: gazeLevel.bg, color: gazeLevel.color }}
              >
                {gazeLevel.level}
              </span>
              <p className="metric-description">
                {gazeLevel.level === 'Low'
                  ? 'Consistent gaze patterns, stable visual attention'
                  : gazeLevel.level === 'Moderate'
                  ? 'Moderate gaze variability, typical attention shifts'
                  : 'High gaze variance, frequent attention changes'}
              </p>
            </div>
          </div>
        </div>

        {/* Communication Score */}
        <div className="dream-metric-card">
          <div className="metric-card-header">
            <h4 className="metric-title">Communication Score</h4>
            <span className="metric-category">ADOS Clinical Score</span>
          </div>
          <div className="metric-content">
            <div className="metric-value-large">
              {metrics.communication_score || 0} <span className="metric-unit">/ 15</span>
            </div>
            <div className="metric-progress-bar">
              <div
                className="metric-progress-fill"
                style={{
                  width: `${(metrics.communication_score / 15) * 100}%`,
                  backgroundColor: commLevel.color,
                }}
              />
            </div>
            <div className="metric-interpretation">
              <span
                className="metric-badge"
                style={{ backgroundColor: commLevel.bg, color: commLevel.color }}
              >
                {commLevel.level}
              </span>
              <p className="metric-description">
                ADOS Communication subscale (lower scores indicate better communication)
              </p>
            </div>
          </div>
        </div>

        {/* Total ADOS Score */}
        <div className="dream-metric-card">
          <div className="metric-card-header">
            <h4 className="metric-title">Total ADOS Score</h4>
            <span className="metric-category">Clinical Assessment</span>
          </div>
          <div className="metric-content">
            <div className="metric-value-large">
              {metrics.ados_score || 0} <span className="metric-unit">/ 28</span>
            </div>
            <div className="metric-progress-bar">
              <div
                className="metric-progress-fill"
                style={{
                  width: `${(metrics.ados_score / 28) * 100}%`,
                  backgroundColor: adosLevel.color,
                }}
              />
            </div>
            <div className="metric-interpretation">
              <span
                className="metric-badge"
                style={{ backgroundColor: adosLevel.bg, color: adosLevel.color }}
              >
                {adosLevel.level}
              </span>
              <p className="metric-description">
                {metrics.ados_score < 7
                  ? 'Non-spectrum range'
                  : metrics.ados_score < 15
                  ? 'ASD spectrum range'
                  : 'Autism range'}
              </p>
            </div>
          </div>
        </div>

        {/* Total Displacement Ratio */}
        <div className="dream-metric-card wide">
          <div className="metric-card-header">
            <h4 className="metric-title">Total Displacement Ratio</h4>
            <span className="metric-category">Movement Extent</span>
          </div>
          <div className="metric-content">
            <div className="metric-value-large">
              {(metrics.displacement_ratio || 0).toFixed(3)}
            </div>
            <div className="metric-progress-bar">
              <div
                className="metric-progress-fill"
                style={{
                  width: `${(metrics.displacement_ratio * 100)}%`,
                  backgroundColor: '#667eea',
                }}
              />
            </div>
            <div className="metric-interpretation">
              <p className="metric-description">
                Ratio of direct displacement to total path length (higher values indicate more direct movements)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Info Footer */}
      <div className="dream-footer">
        <div className="footer-info">
          <p className="footer-text">
            <strong>Data Source:</strong> DREAM (Database for Research in Emotion, Attention, and Motor activity)
          </p>
          <p className="footer-text">
            <strong>Features:</strong> Kinematic measurements, gaze tracking, and ADOS clinical assessments
          </p>
        </div>
      </div>
    </div>
  );
};

export default DreamDatasetAnalysis;
