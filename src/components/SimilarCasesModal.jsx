import React, { useState, useEffect } from 'react';
import './SimilarCasesModal.css';

export default function SimilarCasesModal({ gameResultId, onClose }) {
  const [similarCases, setSimilarCases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSimilarCases();
  }, [gameResultId]);

  const fetchSimilarCases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/teacher/social-response-game/${gameResultId}/similar-cases`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSimilarCases(data);
      } else {
        setError('Failed to load similar cases');
      }
    } catch (err) {
      console.error('Error fetching similar cases:', err);
      setError('Error loading similar cases');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="similar-cases-overlay">
        <div className="similar-cases-modal">
          <div className="loading">Loading similar cases...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="similar-cases-overlay">
        <div className="similar-cases-modal">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  if (!similarCases) {
    return (
      <div className="similar-cases-overlay">
        <div className="similar-cases-modal">
          <div className="error">No similar cases found</div>
        </div>
      </div>
    );
  }

  const { currentCase, similarCases: cases } = similarCases;

  return (
    <div className="similar-cases-overlay" onClick={onClose}>
      <div className="similar-cases-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Similar Cases (KNN Analysis)</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="current-case">
          <h3>Current Case</h3>
          <div className="case-stats">
            <div className="stat">
              <span className="label">Accuracy</span>
              <span className="value">{currentCase.accuracy.toFixed(1)}%</span>
            </div>
            <div className="stat">
              <span className="label">Avg Reaction Time</span>
              <span className="value">{currentCase.avgReactionTime.toFixed(2)}s</span>
            </div>
            <div className="stat">
              <span className="label">Missed Responses</span>
              <span className="value">{currentCase.missedResponses}</span>
            </div>
          </div>
        </div>

        <div className="similar-cases-list">
          <h3>{cases.length > 0 ? 'Most Similar Cases' : 'No similar cases found'}</h3>
          {cases.length === 0 ? (
            <div className="no-cases">No similar cases in the database yet.</div>
          ) : (
            cases.map((caseItem, idx) => (
              <div key={idx} className="similar-case-item">
                <div className="case-rank">#{idx + 1}</div>
                <div className="case-content">
                  <div className="case-header">
                    <span className="student-name">{caseItem.studentName}</span>
                    <span className={`prediction-tag ${caseItem.prediction.includes('No') ? 'no-asd' : 'possible-asd'}`}>
                      {caseItem.prediction}
                    </span>
                  </div>
                  <div className="case-metrics">
                    <span>Accuracy: {caseItem.accuracy.toFixed(1)}%</span>
                    <span>Reaction Time: {caseItem.avgReactionTime.toFixed(2)}s</span>
                    <span>Missed: {caseItem.missedResponses}</span>
                  </div>
                  <div className="case-footer">
                    <span className="confidence">Confidence: {(caseItem.confidence * 100).toFixed(1)}%</span>
                    <span className="date">{new Date(caseItem.completedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          <p className="info-text">
            These cases have similar accuracy and reaction time profiles. This analysis helps identify patterns and provides context for understanding the current assessment.
          </p>
          <button className="close-modal-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
