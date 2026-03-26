import React, { useState, useEffect } from 'react';
import './MultimodalReport.css';

const MultimodalReport = ({ patientId, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientId) {
      fetchReport();
    }
  }, [patientId]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/patients/${patientId}/multimodal-report`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReport(data);
    } catch (err) {
      console.error('Report fetch error:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return '#27ae60';
      case 'moderate':
        return '#f39c12';
      case 'high':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getRiskIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return '✅';
      case 'moderate':
        return '⚠️';
      case 'high':
        return '🚨';
      default:
        return '❓';
    }
  };

  const getModalityIcon = (modality) => {
    const icons = {
      mri: '🧠',
      facial: '📸',
      questionnaire: '📝',
      behavioral: '🎯',
      gaze: '👁️',
      speech: '🗣️'
    };
    return icons[modality] || '📊';
  };

  const getModalityName = (modality) => {
    const names = {
      mri: 'MRI Brain Imaging',
      facial: 'Facial Analysis',
      questionnaire: 'Parent Questionnaire',
      behavioral: 'Behavioral Assessment',
      gaze: 'Gaze Tracking',
      speech: 'Speech Therapy'
    };
    return names[modality] || modality;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadReport = () => {
    const reportText = generateReportText();
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CORTEXA_Report_${report.patient.cortexaId}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportText = () => {
    if (!report) return '';

    return `
╔═══════════════════════════════════════════════════════════╗
║           CORTEXA MULTIMODAL ASD SCREENING REPORT          ║
╚═══════════════════════════════════════════════════════════╝

PATIENT INFORMATION
───────────────────────────────────────────────────────────
Name:                ${report.patient.name}
CORTEXA ID:          ${report.patient.cortexaId}
Age:                 ${report.patient.age} years
Gender:              ${report.patient.gender}
Registration Date:   ${formatDate(report.patient.registrationDate)}

MULTIMODAL ANALYSIS RESULTS
───────────────────────────────────────────────────────────
Final ASD Score:     ${(report.multimodalAnalysis.finalScore * 100).toFixed(2)}%
Risk Level:          ${report.multimodalAnalysis.riskLevel}
Confidence:          ${report.multimodalAnalysis.confidence ? (report.multimodalAnalysis.confidence * 100).toFixed(2) + '%' : 'N/A'}
Completeness:        ${report.multimodalAnalysis.completeness}%

SCREENING BREAKDOWN
───────────────────────────────────────────────────────────
${Object.entries(report.screeningBreakdown || {})
  .map(([modality, data]) => `
${getModalityName(modality).toUpperCase()}
  Score:        ${(data.score * 100).toFixed(2)}%
  Weight:       ${(data.weight * 100).toFixed(0)}%
  Contribution: ${(parseFloat(data.contribution) * 100).toFixed(2)}%
  Label:        ${data.label}
  Date:         ${formatDate(data.date)}
`)
  .join('\n')}

${report.missingModalities?.length > 0 ? `
MISSING SCREENINGS
───────────────────────────────────────────────────────────
${report.missingModalities.map(m => `- ${getModalityName(m)}`).join('\n')}
` : ''}

CLINICAL RECOMMENDATION
───────────────────────────────────────────────────────────
${report.recommendation?.title || ''}

${report.recommendation?.actions?.map((action, i) => `${i + 1}. ${action}`).join('\n') || ''}

───────────────────────────────────────────────────────────
Report ID:           ${report.reportId}
Generated:           ${formatDate(report.generatedAt)}
Total Screenings:    ${report.totalScreenings}

═══════════════════════════════════════════════════════════
This report is generated by CORTEXA AI-powered multimodal 
ASD screening system. This is not a final diagnosis and 
should be reviewed by qualified healthcare professionals.
═══════════════════════════════════════════════════════════
`;
  };

  if (loading) {
    return (
      <div className="multimodal-report-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Generating multimodal report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="multimodal-report-container">
        <div className="error-state">
          <span className="error-icon">❌</span>
          <h3>Failed to Generate Report</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchReport}>
            Retry
          </button>
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="multimodal-report-container">
      <div className="report-header">
        <div className="report-title-section">
          <h1>🏥 CORTEXA Multimodal ASD Screening Report</h1>
          <p className="report-id">Report ID: {report.reportId}</p>
          <p className="report-date">Generated: {formatDate(report.generatedAt)}</p>
        </div>
        <div className="report-actions">
          <button className="btn btn-download" onClick={downloadReport}>
            📥 Download Report
          </button>
          {onClose && (
            <button className="btn btn-close" onClick={onClose}>
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Patient Information */}
      <section className="report-section patient-info">
        <h2>👤 Patient Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Name:</span>
            <span className="info-value">{report.patient.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">CORTEXA ID:</span>
            <span className="info-value cortex-id">{report.patient.cortexaId}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Age:</span>
            <span className="info-value">{report.patient.age} years</span>
          </div>
          <div className="info-item">
            <span className="info-label">Gender:</span>
            <span className="info-value">{report.patient.gender}</span>
          </div>
        </div>
      </section>

      {/* Multimodal Analysis Results */}
      <section className="report-section analysis-results">
        <h2>📊 Multimodal Analysis Results</h2>
        
        <div className="risk-summary" style={{ borderLeftColor: getRiskColor(report.multimodalAnalysis.riskLevel) }}>
          <div className="risk-badge" style={{ background: getRiskColor(report.multimodalAnalysis.riskLevel) }}>
            {getRiskIcon(report.multimodalAnalysis.riskLevel)} {report.multimodalAnalysis.riskLevel} Risk
          </div>
          
          <div className="score-display">
            <div className="score-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#ecf0f1" strokeWidth="8"/>
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke={getRiskColor(report.multimodalAnalysis.riskLevel)}
                  strokeWidth="8"
                  strokeDasharray={`${report.multimodalAnalysis.finalScore * 283} 283`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="score-text">
                <span className="score-number">{(report.multimodalAnalysis.finalScore * 100).toFixed(1)}</span>
                <span className="score-percent">%</span>
              </div>
            </div>
            <p className="score-label">Final ASD Probability Score</p>
          </div>

          <div className="metrics-row">
            <div className="metric">
              <span className="metric-label">Confidence</span>
              <span className="metric-value">
                {report.multimodalAnalysis.confidence 
                  ? `${(report.multimodalAnalysis.confidence * 100).toFixed(1)}%` 
                  : 'N/A'}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Completeness</span>
              <span className="metric-value">{report.multimodalAnalysis.completeness}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Total Screenings</span>
              <span className="metric-value">{report.totalScreenings}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Screening Breakdown */}
      <section className="report-section screening-breakdown">
        <h2>🔬 Individual Screening Results</h2>
        
        <div className="modalities-grid">
          {Object.entries(report.screeningBreakdown || {}).map(([modality, data]) => (
            <div key={modality} className="modality-card">
              <div className="modality-header">
                <span className="modality-icon">{getModalityIcon(modality)}</span>
                <h3>{getModalityName(modality)}</h3>
              </div>
              <div className="modality-body">
                <div className="modality-score">
                  <span className="score-label">Score:</span>
                  <span className="score-value">{(data.score * 100).toFixed(1)}%</span>
                </div>
                <div className="modality-detail">
                  <span>Weight: {(data.weight * 100).toFixed(0)}%</span>
                </div>
                <div className="modality-detail">
                  <span>Contribution: {(parseFloat(data.contribution) * 100).toFixed(2)}%</span>
                </div>
                <div className="modality-detail">
                  <span className="result-label">{data.label}</span>
                </div>
                <div className="modality-date">
                  {formatDate(data.date)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {report.missingModalities && report.missingModalities.length > 0 && (
          <div className="missing-screenings">
            <h4>⚠️ Missing Screenings</h4>
            <div className="missing-list">
              {report.missingModalities.map(modality => (
                <div key={modality} className="missing-item">
                  {getModalityIcon(modality)} {getModalityName(modality)}
                </div>
              ))}
            </div>
            <p className="missing-note">
              Complete these screenings for a more comprehensive assessment.
            </p>
          </div>
        )}
      </section>

      {/* Clinical Recommendation */}
      <section className="report-section recommendation">
        <h2>💡 Clinical Recommendation</h2>
        <div 
          className="recommendation-box"
          style={{ borderLeftColor: getRiskColor(report.multimodalAnalysis.riskLevel) }}
        >
          <h3>{report.recommendation?.title || 'Recommendation'}</h3>
          <ul className="recommendation-actions">
            {report.recommendation?.actions?.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <div className="report-footer">
        <p className="disclaimer">
          ⚠️ <strong>Important:</strong> This report is generated by CORTEXA AI-powered multimodal ASD screening system. 
          This is not a final diagnosis and should be reviewed by qualified healthcare professionals.
        </p>
      </div>
    </div>
  );
};

export default MultimodalReport;
