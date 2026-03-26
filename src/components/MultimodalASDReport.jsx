import React, { useEffect, useState } from 'react';
import { FiActivity, FiCpu, FiEye, FiUsers, FiFileText, FiAlertCircle, FiCheckCircle, FiClock, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import '../styles/MultimodalASDReport.css';

const MultimodalASDReport = ({ patientId, patientName }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCombinedReport();
  }, [patientId]);

  const fetchCombinedReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/therapist/combined-asd-report?patient_id=${patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          setError(errorData.message || 'No screening results available');
        } else {
          throw new Error('Failed to fetch combined report');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error('Error fetching combined report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTherapistDecision = async (decision) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        'http://localhost:5000/api/therapist/combined-report/decision',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patient_id: patientId,
            decision: decision,
            notes: `Decision made: ${decision.replace('_', ' ')}`
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to record decision');
      }

      const data = await response.json();
      
      // Show success message
      alert(`Decision recorded: ${decision.replace('_', ' ').toUpperCase()}`);
      
      // Refresh the report
      await fetchCombinedReport();
    } catch (err) {
      console.error('Error recording decision:', err);
      alert('Failed to record decision. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return '#9ca3af';
    if (score >= 0.70) return '#dc2626'; // High risk - red
    if (score >= 0.40) return '#f59e0b'; // Moderate risk - amber
    return '#10b981'; // Low risk - green
  };

  const getRiskLevelColor = (riskLevel) => {
    if (riskLevel === 'High') return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
    if (riskLevel === 'Moderate') return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
    return { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' };
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return 'N/A';
    return `${(score * 100).toFixed(0)}%`;
  };

  const getModuleIcon = (moduleName) => {
    if (moduleName.includes('Facial')) return <FiActivity size={20} />;
    if (moduleName.includes('MRI')) return <FiCpu size={20} />;
    if (moduleName.includes('Gaze')) return <FiEye size={20} />;
    if (moduleName.includes('Behavioral')) return <FiUsers size={20} />;
    if (moduleName.includes('Questionnaire')) return <FiFileText size={20} />;
    return <FiActivity size={20} />;
  };

  if (loading) {
    return (
      <div className="multimodal-report-card loading">
        <div className="loading-spinner"></div>
        <p>Loading multimodal assessment report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="multimodal-report-card error">
        <FiAlertCircle size={48} color="#dc2626" />
        <h4>No Multimodal Assessment Available</h4>
        <p>{error}</p>
        <p className="error-help">
          Patient needs to complete screening modules before generating a combined report.
        </p>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const riskColors = getRiskLevelColor(report.risk_level);

  return (
    <div className="multimodal-report-container">
      <div className="multimodal-report-header">
        <div className="header-left">
          <div className="header-icon">
            <FiTrendingUp size={32} color="white" />
          </div>
          <div>
            <h2>Multimodal ASD Assessment Report</h2>
            <p>Combined analysis from {report.modules_count} screening module{report.modules_count !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="report-timestamp">
          <FiClock size={16} />
          <span>Generated: {new Date(report.generated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      {/* Individual Module Scores */}
      <div className="screening-results-summary">
        <h3>Screening Results Summary</h3>
        <div className="module-scores-grid">
          {/* Facial Screening */}
          <div className="module-score-card">
            <div className="module-header" style={{ borderLeftColor: getScoreColor(report.facial_score) }}>
              <div className="module-icon">
                <FiActivity size={24} color={getScoreColor(report.facial_score)} />
              </div>
              <div className="module-info">
                <h4>Facial Screening (CNN)</h4>
                <span className="module-weight">Weight: 25%</span>
              </div>
            </div>
            <div className="module-score" style={{ color: getScoreColor(report.facial_score) }}>
              {formatScore(report.facial_score)}
            </div>
            {report.facial_score === null && (
              <span className="not-completed">Not Completed</span>
            )}
          </div>

          {/* MRI Screening */}
          <div className="module-score-card">
            <div className="module-header" style={{ borderLeftColor: getScoreColor(report.mri_score) }}>
              <div className="module-icon">
                <FiCpu size={24} color={getScoreColor(report.mri_score)} />
              </div>
              <div className="module-info">
                <h4>MRI Screening (SVM)</h4>
                <span className="module-weight">Weight: 25%</span>
              </div>
            </div>
            <div className="module-score" style={{ color: getScoreColor(report.mri_score) }}>
              {formatScore(report.mri_score)}
            </div>
            {report.mri_score === null && (
              <span className="not-completed">Not Completed</span>
            )}
          </div>

          {/* Gaze Analysis */}
          <div className="module-score-card">
            <div className="module-header" style={{ borderLeftColor: getScoreColor(report.gaze_score) }}>
              <div className="module-icon">
                <FiEye size={24} color={getScoreColor(report.gaze_score)} />
              </div>
              <div className="module-info">
                <h4>Live Gaze Analysis</h4>
                <span className="module-weight">Weight: 20%</span>
              </div>
            </div>
            <div className="module-score" style={{ color: getScoreColor(report.gaze_score) }}>
              {formatScore(report.gaze_score)}
            </div>
            {report.gaze_score === null && (
              <span className="not-completed">Not Completed</span>
            )}
          </div>

          {/* Behavioral Assessment */}
          <div className="module-score-card">
            <div className="module-header" style={{ borderLeftColor: getScoreColor(report.behavior_score) }}>
              <div className="module-icon">
                <FiUsers size={24} color={getScoreColor(report.behavior_score)} />
              </div>
              <div className="module-info">
                <h4>Behavioral Assessment</h4>
                <span className="module-weight">Weight: 15%</span>
              </div>
            </div>
            <div className="module-score" style={{ color: getScoreColor(report.behavior_score) }}>
              {formatScore(report.behavior_score)}
            </div>
            {report.behavior_score === null && (
              <span className="not-completed">Not Completed</span>
            )}
          </div>

          {/* Questionnaire */}
          <div className="module-score-card">
            <div className="module-header" style={{ borderLeftColor: getScoreColor(report.questionnaire_score) }}>
              <div className="module-icon">
                <FiFileText size={24} color={getScoreColor(report.questionnaire_score)} />
              </div>
              <div className="module-info">
                <h4>Questionnaire Screening</h4>
                <span className="module-weight">Weight: 15%</span>
              </div>
            </div>
            <div className="module-score" style={{ color: getScoreColor(report.questionnaire_score) }}>
              {formatScore(report.questionnaire_score)}
            </div>
            {report.questionnaire_score === null && (
              <span className="not-completed">Not Completed</span>
            )}
          </div>
        </div>
      </div>

      {/* Final Multimodal Assessment */}
      <div className="final-assessment">
        <h3>Final Multimodal Assessment</h3>
        <div className="final-score-container">
          <div className="final-score-display">
            <div className="score-circle" style={{ 
              background: `conic-gradient(${getScoreColor(report.final_score)} ${report.final_score * 360}deg, #e5e7eb 0deg)`
            }}>
              <div className="score-inner">
                <span className="score-value">{formatScore(report.final_score)}</span>
                <span className="score-label">ASD Risk Score</span>
              </div>
            </div>
          </div>
          
          <div className="risk-level-display">
            <div 
              className="risk-badge" 
              style={{ 
                backgroundColor: riskColors.bg,
                color: riskColors.text,
                border: `3px solid ${riskColors.border}`
              }}
            >
              {report.risk_level === 'Low' && <FiCheckCircle size={24} />}
              {report.risk_level === 'Moderate' && <FiAlertCircle size={24} />}
              {report.risk_level === 'High' && <FiAlertCircle size={24} />}
              <span>Risk Level: {report.risk_level}</span>
            </div>
            
            <div className="risk-explanation">
              {report.risk_level === 'Low' && (
                <p>This patient shows <strong>low indicators</strong> of autism spectrum disorder based on the completed assessments. Continue routine monitoring.</p>
              )}
              {report.risk_level === 'Moderate' && (
                <p>This patient shows <strong>moderate indicators</strong> of autism spectrum disorder. Further evaluation and consultation is recommended.</p>
              )}
              {report.risk_level === 'High' && (
                <p>This patient shows <strong>high indicators</strong> of autism spectrum disorder. Immediate specialist consultation and comprehensive evaluation is strongly recommended.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Therapist Decision Actions */}
      <div className="therapist-actions">
        <h3>Therapist Decision</h3>
        <div className="action-buttons">
          <button 
            className="action-btn consultation"
            onClick={() => handleTherapistDecision('consultation_scheduled')}
            disabled={actionLoading}
          >
            <FiCalendar size={20} />
            Schedule Consultation Meeting
          </button>
          
          <button 
            className="action-btn send-report"
            onClick={() => handleTherapistDecision('report_sent')}
            disabled={actionLoading}
          >
            <FiFileText size={20} />
            Send Report to Parent
          </button>
          
          <button 
            className="action-btn mark-low"
            onClick={() => handleTherapistDecision('marked_low_risk')}
            disabled={actionLoading}
          >
            <FiCheckCircle size={20} />
            Mark as Low Risk
          </button>
        </div>
        
        {report.therapist_decision && report.therapist_decision !== 'pending' && (
          <div className="decision-status">
            <FiCheckCircle size={18} color="#10b981" />
            <span>
              Current Status: <strong>{report.therapist_decision.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultimodalASDReport;
