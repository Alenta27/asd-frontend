import React, { useState, useEffect } from 'react';
import './GameResultsDisplay.css';

export default function GameResultsDisplay({ gameResultId, studentId, onClose, onViewSimilarCases }) {
  const [gameResult, setGameResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGameResult();
  }, [gameResultId]);

  const fetchGameResult = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/teacher/social-response-game/${gameResultId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGameResult(data);
      } else {
        setError('Failed to load game results');
      }
    } catch (err) {
      console.error('Error fetching game result:', err);
      setError('Error loading game results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="results-loading">Loading results...</div>;
  }

  if (error) {
    return <div className="results-error">{error}</div>;
  }

  if (!gameResult) {
    return <div className="results-error">No game results found</div>;
  }

  const { accuracy, avgReactionTime, missedResponses, modelPrediction, gameResults } = gameResult;
  const predictionColor = modelPrediction.prediction.includes('No') ? '#28a745' : '#ffc107';

  return (
    <div className="game-results-container">
      <div className="results-header">
        <h2>Social Response Game Results</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="results-metrics">
        <div className="metric-card">
          <span className="metric-label">Avg Reaction Time (Social)</span>
          <span className="metric-value">{avgReactionTime.toFixed(2)}s</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Accuracy</span>
          <span className="metric-value">{accuracy.toFixed(1)}%</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Missed Responses</span>
          <span className="metric-value">{missedResponses}</span>
        </div>
      </div>

      <div className="model-result-card" style={{ borderLeftColor: predictionColor }}>
        <h3>Model Analysis Result</h3>
        <div className="prediction-content">
          <div className="prediction-icon" style={{ color: predictionColor }}>
            {modelPrediction.prediction.includes('No') ? '✓' : '⚠️'}
          </div>
          <div className="prediction-text">
            <p className="prediction-main" style={{ color: predictionColor }}>
              {modelPrediction.prediction}
            </p>
            <p className="prediction-confidence">
              Confidence: {(modelPrediction.confidence * 100).toFixed(1)}%
            </p>
            <p className="prediction-severity">
              Severity Level: <span className={`severity-${modelPrediction.severity.toLowerCase()}`}>
                {modelPrediction.severity}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="results-details">
        <h3>Detailed Performance</h3>
        <div className="scenario-breakdown">
          {gameResults && gameResults.map((result, idx) => (
            <div key={idx} className={`scenario-result ${result.isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="scenario-info">
                <span className="scenario-num">Q{idx + 1}</span>
                <span className="scenario-text">{result.question}</span>
              </div>
              <div className="scenario-stats">
                <span className="reaction-time">{result.reactionTime.toFixed(2)}s</span>
                <span className={`result-badge ${result.isCorrect ? 'correct-badge' : 'incorrect-badge'}`}>
                  {result.isCorrect ? '✓' : '✗'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        className="view-similar-cases-btn"
        onClick={() => onViewSimilarCases(gameResultId)}
      >
        View Similar Cases (KNN Analysis)
      </button>
    </div>
  );
}
