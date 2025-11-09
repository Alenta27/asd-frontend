import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ProgressTracker.css';

const ProgressTracker = ({ childId, childName = 'Patient' }) => {
  const [chartData, setChartData] = useState([
    { week: 1, actual: 25, predicted: 27 },
    { week: 2, actual: 27, predicted: 30 },
    { week: 3, actual: 30, predicted: 32 },
    { week: 4, actual: 32, predicted: 35 },
    { week: 5, actual: 35, predicted: 37 },
    { week: 6, actual: 37, predicted: 39 },
    { week: 7, actual: 39, predicted: 41 },
    { week: 8, actual: 41, predicted: 43 },
  ]);
  
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgressPrediction();
  }, [childId]);

  const fetchProgressPrediction = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const childMetrics = {
        week: 9,
        communication: 47,
        social_skills: 42,
        behavior_control: 37,
        attention_span: 45,
        sensory_response: 39,
        current_score: 41
      };

      const response = await fetch('http://localhost:5000/api/therapist/predict-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ childData: childMetrics }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch prediction');
      }

      const data = await response.json();
      setPrediction(data);
      
      setChartData(prev => [...prev, {
        week: 9,
        actual: data.current_score,
        predicted: data.predicted_score
      }]);
    } catch (err) {
      setError(err.message);
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving':
        return '#10b981';
      case 'declining':
        return '#ef4444';
      case 'stable':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getTrendBgColor = (trend) => {
    switch (trend) {
      case 'improving':
        return '#d1fae5';
      case 'declining':
        return '#fee2e2';
      case 'stable':
        return '#fef3c7';
      default:
        return '#f3f4f6';
    }
  };

  const getTrendEmoji = (trend) => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '❓';
    }
  };

  return (
    <div className="progress-tracker">
      <div className="tracker-container">
        {/* Header */}
        <div className="tracker-header">
          <h2 className="tracker-title">Progress Tracker</h2>
          <p className="tracker-subtitle">{childName}'s improvement trends and predictions</p>
        </div>

        {/* Trend Indicator Card */}
        {prediction && (
          <div className="trend-card">
            <div className="trend-indicator" style={{ backgroundColor: getTrendBgColor(prediction.trend) }}>
              <div className="trend-content">
                <span className="trend-emoji">{getTrendEmoji(prediction.trend)}</span>
                <div className="trend-text">
                  <p className="trend-label">Current Trend</p>
                  <p className="trend-value" style={{ color: getTrendColor(prediction.trend) }}>
                    {prediction.trend.charAt(0).toUpperCase() + prediction.trend.slice(1)}
                  </p>
                </div>
              </div>
              {prediction.trend === 'improving' && (
                <p className="trend-message">Great progress! Child is making consistent improvements.</p>
              )}
              {prediction.trend === 'stable' && (
                <p className="trend-message">Progress is steady. Continue with current approach.</p>
              )}
              {prediction.trend === 'declining' && (
                <p className="trend-message">Consider reviewing current strategies.</p>
              )}
            </div>
          </div>
        )}

        {/* Chart Section */}
        <div className="chart-section">
          <div className="chart-header">
            <h3 className="chart-title">Progress Score Trend</h3>
            <div className="chart-legend-info">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                <span>Actual Score</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#93c5fd' }}></span>
                <span>Predicted Score</span>
              </div>
            </div>
          </div>
          
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  cursor={{ stroke: '#d1d5db', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#93c5fd"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#93c5fd', r: 4 }}
                  name="Predicted"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Prediction Summary Card */}
        {prediction && (
          <div className="prediction-summary">
            <h3 className="summary-title">Next Week Prediction</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <p className="summary-label">Current Score</p>
                <p className="summary-value">{prediction.current_score.toFixed(1)}</p>
              </div>
              <div className="summary-item">
                <p className="summary-label">Predicted Score</p>
                <p className="summary-value">{prediction.predicted_score}</p>
              </div>
              <div className="summary-item">
                <p className="summary-label">Expected Improvement</p>
                <p className="summary-value" style={{
                  color: prediction.improvement > 0 ? '#10b981' : prediction.improvement < 0 ? '#ef4444' : '#f59e0b'
                }}>
                  {prediction.improvement > 0 ? '+' : ''}{prediction.improvement}
                </p>
              </div>
              <div className="summary-item">
                <p className="summary-label">Improvement %</p>
                <p className="summary-value" style={{
                  color: prediction.improvement_percentage > 0 ? '#10b981' : prediction.improvement_percentage < 0 ? '#ef4444' : '#f59e0b'
                }}>
                  {prediction.improvement_percentage > 0 ? '+' : ''}{prediction.improvement_percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <p>Loading prediction...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Recommendations */}
        <div className="recommendations">
          <h3 className="rec-title">Recommendations</h3>
          <ul className="rec-list">
            {prediction?.trend === 'improving' && (
              <>
                <li>Maintain current intervention strategies</li>
                <li>Continue with weekly therapy sessions</li>
                <li>Encourage family engagement in home exercises</li>
              </>
            )}
            {prediction?.trend === 'stable' && (
              <>
                <li>Evaluate current strategies for effectiveness</li>
                <li>Consider increasing intervention intensity</li>
                <li>Focus on generalization of skills</li>
              </>
            )}
            {prediction?.trend === 'declining' && (
              <>
                <li>Reassess therapy goals and approaches</li>
                <li>Schedule conference with parents/guardians</li>
                <li>Consider environmental or external factors</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
