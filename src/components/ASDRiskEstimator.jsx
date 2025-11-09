import React, { useState } from 'react';
import { FiSliders } from 'react-icons/fi';
import './ASDRiskEstimator.css';

const ASDRiskEstimator = ({ studentId, onClose }) => {
  const [ratings, setRatings] = useState({
    communication: 3,
    eye_contact: 3,
    social_interaction: 3,
    emotional_response: 3,
    attention_span: 3,
    repetitive_actions: 3,
    sensory_sensitivity: 3,
    speech_clarity: 3,
    learning_adaptability: 3,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const behaviorParameters = [
    { key: 'communication', label: 'Communication', description: 'How well the child responds to conversation' },
    { key: 'eye_contact', label: 'Eye Contact', description: 'Frequency of direct eye contact' },
    { key: 'social_interaction', label: 'Social Interaction', description: 'Interest in group play' },
    { key: 'emotional_response', label: 'Emotional Response', description: 'Ability to express or understand emotions' },
    { key: 'attention_span', label: 'Attention Span', description: 'Focus level on activities' },
    { key: 'repetitive_actions', label: 'Repetitive Actions', description: 'Degree of repeated behaviors' },
    { key: 'sensory_sensitivity', label: 'Sensory Sensitivity', description: 'Reactions to light/sound/touch' },
    { key: 'speech_clarity', label: 'Speech Clarity', description: 'Coherence in speech' },
    { key: 'learning_adaptability', label: 'Learning Adaptability', description: 'Ease in learning new tasks' },
  ];

  const handleRatingChange = (key, value) => {
    setRatings(prev => ({
      ...prev,
      [key]: parseInt(value)
    }));
  };

  const handlePredictRisk = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/teacher/asd-risk-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ratings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to predict risk');
      }

      const data = await response.json();
      setResult({
        risk: data.risk,
        probability: data.probability || {},
        score: data.score || 0
      });
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (!risk) return 'text-gray-600';
    const riskLower = risk.toLowerCase();
    if (riskLower === 'high') return 'text-red-600';
    if (riskLower === 'moderate') return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskBgColor = (risk) => {
    if (!risk) return 'bg-gray-100';
    const riskLower = risk.toLowerCase();
    if (riskLower === 'high') return 'bg-red-100';
    if (riskLower === 'moderate') return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const getRiskEmoji = (risk) => {
    if (!risk) return '❓';
    const riskLower = risk.toLowerCase();
    if (riskLower === 'high') return '🔴';
    if (riskLower === 'moderate') return '🟠';
    return '🟢';
  };

  return (
    <div className="asd-risk-estimator">
      <div className="risk-estimator-card">
        <div className="risk-estimator-header">
          <div className="header-content">
            <FiSliders className="header-icon" />
            <div>
              <h2>ASD Risk Estimator</h2>
              <p>Rate student behavior on a 1-5 scale to estimate ASD risk</p>
            </div>
          </div>
          {onClose && (
            <button className="close-btn" onClick={onClose}>✕</button>
          )}
        </div>

        <div className="risk-estimator-content">
          <div className="parameters-section">
            <h3 className="section-title">Behavior Parameters</h3>
            <div className="parameters-grid">
              {behaviorParameters.map(param => (
                <div key={param.key} className="parameter-item">
                  <div className="parameter-header">
                    <label htmlFor={param.key}>{param.label}</label>
                    <span className="rating-value">{ratings[param.key]}</span>
                  </div>
                  <p className="parameter-description">{param.description}</p>
                  <div className="slider-container">
                    <input
                      type="range"
                      id={param.key}
                      min="1"
                      max="5"
                      value={ratings[param.key]}
                      onChange={(e) => handleRatingChange(param.key, e.target.value)}
                      className="slider"
                    />
                    <div className="slider-labels">
                      <span className="label-min">Low</span>
                      <span className="label-max">High</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="button-container">
            <button
              className="predict-btn"
              onClick={handlePredictRisk}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Predict Risk'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
            </div>
          )}

          {result && (
            <div className="result-section">
              <h3 className="section-title">Risk Assessment Result</h3>
              <div className={`result-card ${getRiskBgColor(result.risk)}`}>
                <div className="result-header">
                  <span className="risk-emoji">{getRiskEmoji(result.risk)}</span>
                  <div className="result-text">
                    <p className="result-label">Risk Level</p>
                    <p className={`result-value ${getRiskColor(result.risk)}`}>
                      {result.risk}
                    </p>
                  </div>
                </div>

                {result.probability && Object.keys(result.probability).length > 0 && (
                  <div className="probability-section">
                    <h4>Probability Breakdown</h4>
                    <div className="probability-bars">
                      {Object.entries(result.probability).map(([riskLevel, probability]) => (
                        <div key={riskLevel} className="probability-item">
                          <div className="probability-label">
                            <span>{riskLevel}</span>
                            <span className="probability-value">
                              {probability.toFixed(1)}%
                            </span>
                          </div>
                          <div className="probability-bar-container">
                            <div
                              className={`probability-bar ${riskLevel.toLowerCase()}`}
                              style={{ width: `${probability}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="result-notes">
                  <p className="note-title">📋 Recommendation</p>
                  {result.risk.toLowerCase() === 'high' && (
                    <p className="note-text">Consider referring the child for comprehensive evaluation by a specialist.</p>
                  )}
                  {result.risk.toLowerCase() === 'moderate' && (
                    <p className="note-text">Monitor progress over the next 2 weeks. Consider additional screening if concerns persist.</p>
                  )}
                  {result.risk.toLowerCase() === 'low' && (
                    <p className="note-text">Child shows typical development patterns. Continue regular observation and support.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ASDRiskEstimator;
