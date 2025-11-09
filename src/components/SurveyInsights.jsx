import React, { useState } from 'react';
import './SurveyInsights.css';

const SurveyInsights = ({ childId, onClose }) => {
  const [answers, setAnswers] = useState({
    PoorEyeContact: null,
    DelayedSpeech: null,
    DifficultyPeerInteraction: null,
    RepetitiveMovements: null,
    Sensitivity: null,
    PrefersRoutine: null,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const questions = [
    { key: 'PoorEyeContact', label: 'Poor Eye Contact', description: 'Does the child avoid eye contact or struggle with sustained eye contact?' },
    { key: 'DelayedSpeech', label: 'Delayed Speech', description: 'Has the child shown delayed speech development?' },
    { key: 'DifficultyPeerInteraction', label: 'Difficulty in Peer Interaction', description: 'Does the child have difficulty interacting with peers?' },
    { key: 'RepetitiveMovements', label: 'Repetitive Movements', description: 'Does the child engage in repetitive movements or actions?' },
    { key: 'Sensitivity', label: 'Over/Under Sensitivity', description: 'Does the child show heightened or reduced sensitivity to sounds, textures, or other stimuli?' },
    { key: 'PrefersRoutine', label: 'Prefers Routine', description: 'Does the child prefer structured routines and resist changes?' },
  ];

  const handleAnswerChange = (key, value) => {
    setAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmitSurvey = async () => {
    const allAnswered = Object.values(answers).every(val => val !== null);
    if (!allAnswered) {
      setError('Please answer all questions');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const answersPayload = {
        PoorEyeContact: answers.PoorEyeContact ? 1 : 0,
        DelayedSpeech: answers.DelayedSpeech ? 1 : 0,
        DifficultyPeerInteraction: answers.DifficultyPeerInteraction ? 1 : 0,
        RepetitiveMovements: answers.RepetitiveMovements ? 1 : 0,
        Sensitivity: answers.Sensitivity ? 1 : 0,
        PrefersRoutine: answers.PrefersRoutine ? 1 : 0,
      };

      const response = await fetch('http://localhost:5000/api/parent/predict-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: answersPayload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get prediction');
      }

      const data = await response.json();
      setResult({
        classification: data.classification_result,
        probability: data.probability || 0,
        important_features: data.important_features || []
      });
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Survey prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (classification) => {
    if (!classification) return 'text-gray-600';
    const lower = classification.toLowerCase();
    if (lower.includes('asd') || lower.includes('present')) return 'text-red-600';
    return 'text-green-600';
  };

  const getResultBgColor = (classification) => {
    if (!classification) return 'bg-gray-100';
    const lower = classification.toLowerCase();
    if (lower.includes('asd') || lower.includes('present')) return 'bg-red-100';
    return 'bg-green-100';
  };

  const getResultEmoji = (classification) => {
    if (!classification) return '❓';
    const lower = classification.toLowerCase();
    if (lower.includes('asd') || lower.includes('present')) return '🔴';
    return '🟢';
  };

  const resetSurvey = () => {
    setAnswers({
      PoorEyeContact: null,
      DelayedSpeech: null,
      DifficultyPeerInteraction: null,
      RepetitiveMovements: null,
      Sensitivity: null,
      PrefersRoutine: null,
    });
    setResult(null);
    setError(null);
  };

  return (
    <div className="survey-insights">
      <div className="survey-card">
        <div className="survey-header">
          <div className="header-content">
            <span className="header-icon">📋</span>
            <div>
              <h2>Survey Insights</h2>
              <p>Parent questionnaire analysis using Decision Tree Classification</p>
            </div>
          </div>
          {onClose && (
            <button className="close-btn" onClick={onClose}>✕</button>
          )}
        </div>

        <div className="survey-content">
          {!result ? (
            <>
              <div className="questions-section">
                <h3 className="section-title">Parent Questionnaire</h3>
                <p className="section-description">Please answer the following questions about your child (Yes/No)</p>
                <div className="questions-grid">
                  {questions.map(question => (
                    <div key={question.key} className="question-item">
                      <div className="question-header">
                        <label>{question.label}</label>
                      </div>
                      <p className="question-description">{question.description}</p>
                      <div className="answer-options">
                        <button
                          className={`option-btn ${answers[question.key] === true ? 'selected' : ''}`}
                          onClick={() => handleAnswerChange(question.key, true)}
                        >
                          Yes
                        </button>
                        <button
                          className={`option-btn ${answers[question.key] === false ? 'selected' : ''}`}
                          onClick={() => handleAnswerChange(question.key, false)}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="button-container">
                <button
                  className="submit-btn"
                  onClick={handleSubmitSurvey}
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Analyze Survey'}
                </button>
              </div>

              {error && (
                <div className="error-message">
                  <p>❌ {error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="result-section">
              <h3 className="section-title">Analysis Result</h3>
              <div className={`result-card ${getResultBgColor(result.classification)}`}>
                <div className="result-header">
                  <span className="result-emoji">{getResultEmoji(result.classification)}</span>
                  <div className="result-text">
                    <p className="result-label">Classification</p>
                    <p className={`result-value ${getResultColor(result.classification)}`}>
                      {result.classification}
                    </p>
                  </div>
                </div>

                {result.important_features && result.important_features.length > 0 && (
                  <div className="factors-section">
                    <h4>Top Factors Influencing Decision</h4>
                    <div className="factors-list">
                      {result.important_features.map((feature, index) => (
                        <div key={index} className="factor-item">
                          <span className="factor-icon">📌</span>
                          <span className="factor-text">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="result-notes">
                  <p className="note-title">📝 Recommendation</p>
                  {result.classification.toLowerCase().includes('asd') && result.classification.toLowerCase().includes('present') ? (
                    <p className="note-text">ASD indicators have been identified. Consider scheduling a comprehensive evaluation with a specialist for further assessment and diagnosis.</p>
                  ) : (
                    <p className="note-text">No significant ASD indicators detected based on the survey responses. Continue regular monitoring of child development.</p>
                  )}
                </div>
              </div>

              <div className="result-actions">
                <button className="reset-btn" onClick={resetSurvey}>
                  Take Survey Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyInsights;
