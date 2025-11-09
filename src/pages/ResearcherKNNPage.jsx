import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiRefreshCw, FiDownload } from 'react-icons/fi';
import './ResearcherKNNPage.css';

const ResearcherKNNPage = ({ onBack }) => {
  const [kValue, setKValue] = useState(5);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [validation, setValidation] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [formData, setFormData] = useState({
    AGE_AT_SCAN: 30,
    FIQ: 100,
    VIQ: 100,
    PIQ: 100,
    ADI_R_SOCIAL_TOTAL_A: 0,
    ADI_R_VERBAL_TOTAL_BV: 0,
    ADI_RRB_TOTAL_C: 0,
    ADOS_TOTAL: 0,
    ADOS_COMM: 0,
    ADOS_SOCIAL: 0,
    SRS_RAW_TOTAL: 0,
    AQ_TOTAL: 0
  });

  // Load KNN stats on component mount
  useEffect(() => {
    fetchKNNStats();
    fetchKNNValidation();
  }, []);

  const fetchKNNStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/researcher/knn-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching KNN stats:', error);
    }
  };

  const fetchKNNValidation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/researcher/knn-validate', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setValidation(data);
    } catch (error) {
      console.error('Error fetching validation results:', error);
    }
  };

  const handlePrediction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/researcher/knn-predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          k: kValue,
          newSample: formData
        })
      });
      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Error making prediction:', error);
      setPrediction({ error: 'Failed to make prediction' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const downloadResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      kValue,
      modelStats: stats,
      validationResults: validation,
      prediction,
      inputData: formData
    };
    
    const element = document.createElement('a');
    element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    element.setAttribute('download', `knn_results_${Date.now()}.json`);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="knn-page">
      <div className="knn-header">
        <button className="back-btn" onClick={onBack}>
          <FiArrowLeft /> Back
        </button>
        <h1>KNN Prediction Model (CALTECH Dataset)</h1>
        <button className="download-btn" onClick={downloadResults} disabled={!prediction && !validation}>
          <FiDownload /> Download Results
        </button>
      </div>

      <div className="knn-container">
        {/* Left Panel - Input Form */}
        <div className="knn-form-panel">
          <div className="form-card">
            <h2>🎯 Make a Prediction</h2>
            
            <div className="k-selector">
              <label>K Value:</label>
              <div className="k-controls">
                <input 
                  type="number" 
                  min="1" 
                  max="50" 
                  value={kValue}
                  onChange={(e) => setKValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="k-input"
                />
                <span className="k-hint">(1-50 neighbors)</span>
              </div>
            </div>

            <form onSubmit={handlePrediction} className="prediction-form">
              <div className="form-section">
                <h3>Demographic Features</h3>
                <div className="form-group">
                  <label>Age at Scan (years)</label>
                  <input 
                    type="number" 
                    name="AGE_AT_SCAN" 
                    value={formData.AGE_AT_SCAN}
                    onChange={handleInputChange}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>IQ Scores</h3>
                <div className="form-group">
                  <label>Full IQ (FIQ)</label>
                  <input 
                    type="number" 
                    name="FIQ" 
                    value={formData.FIQ}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Verbal IQ (VIQ)</label>
                  <input 
                    type="number" 
                    name="VIQ" 
                    value={formData.VIQ}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Performance IQ (PIQ)</label>
                  <input 
                    type="number" 
                    name="PIQ" 
                    value={formData.PIQ}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>ADI-R Scores (Developmental History)</h3>
                <div className="form-group">
                  <label>Social (A)</label>
                  <input 
                    type="number" 
                    name="ADI_R_SOCIAL_TOTAL_A" 
                    value={formData.ADI_R_SOCIAL_TOTAL_A}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Verbal/Communication (BV)</label>
                  <input 
                    type="number" 
                    name="ADI_R_VERBAL_TOTAL_BV" 
                    value={formData.ADI_R_VERBAL_TOTAL_BV}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>RRB Total (C)</label>
                  <input 
                    type="number" 
                    name="ADI_RRB_TOTAL_C" 
                    value={formData.ADI_RRB_TOTAL_C}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>ADOS Scores (Current Observations)</h3>
                <div className="form-group">
                  <label>Total Score</label>
                  <input 
                    type="number" 
                    name="ADOS_TOTAL" 
                    value={formData.ADOS_TOTAL}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Communication</label>
                  <input 
                    type="number" 
                    name="ADOS_COMM" 
                    value={formData.ADOS_COMM}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Social Interaction</label>
                  <input 
                    type="number" 
                    name="ADOS_SOCIAL" 
                    value={formData.ADOS_SOCIAL}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Screening Questionnaires</h3>
                <div className="form-group">
                  <label>SRS Raw Total</label>
                  <input 
                    type="number" 
                    name="SRS_RAW_TOTAL" 
                    value={formData.SRS_RAW_TOTAL}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>AQ Total (Autism Quotient)</label>
                  <input 
                    type="number" 
                    name="AQ_TOTAL" 
                    value={formData.AQ_TOTAL}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <button type="submit" className="predict-btn" disabled={loading}>
                {loading ? 'Making Prediction...' : 'Predict'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="knn-results-panel">
          {/* Model Statistics */}
          {stats && (
            <div className="results-card stats-card">
              <h2>📊 Model Statistics</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Samples</span>
                  <span className="stat-value">{stats.totalSamples}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">ASD Cases</span>
                  <span className="stat-value">{stats.asdCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Control Cases</span>
                  <span className="stat-value">{stats.controlCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">ASD Percentage</span>
                  <span className="stat-value">{stats.asdPercentage}%</span>
                </div>
              </div>

              <div className="means-section">
                <h3>Average Features by Diagnosis</h3>
                <div className="means-table">
                  <div className="means-row header">
                    <div>Feature</div>
                    <div>ASD Mean</div>
                    <div>Control Mean</div>
                  </div>
                  {stats.asdMeanFeatures && Object.entries(stats.asdMeanFeatures).map(([feature, value]) => (
                    <div key={feature} className="means-row">
                      <div className="feature-name">{feature}</div>
                      <div className="asd-value">{value}</div>
                      <div className="control-value">{stats.controlMeanFeatures[feature]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validation && (
            <div className="results-card validation-card">
              <h2>✅ Model Validation (80/20 Split)</h2>
              <div className="validation-metrics">
                <div className="metric-item">
                  <span className="metric-label">Accuracy</span>
                  <span className="metric-value">{validation.accuracy.toFixed(2)}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Precision</span>
                  <span className="metric-value">{validation.precision.toFixed(2)}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Recall</span>
                  <span className="metric-value">{validation.recall.toFixed(2)}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">F1 Score</span>
                  <span className="metric-value">{validation.f1Score.toFixed(2)}%</span>
                </div>
              </div>

              <div className="confusion-matrix">
                <h3>Confusion Matrix</h3>
                <div className="matrix-grid">
                  <div className="matrix-cell header">True Positive</div>
                  <div className="matrix-cell">{validation.confusionMatrix.truePositive}</div>
                  <div className="matrix-cell header">False Positive</div>
                  <div className="matrix-cell">{validation.confusionMatrix.falsePositive}</div>
                  <div className="matrix-cell header">True Negative</div>
                  <div className="matrix-cell">{validation.confusionMatrix.trueNegative}</div>
                  <div className="matrix-cell header">False Negative</div>
                  <div className="matrix-cell">{validation.confusionMatrix.falseNegative}</div>
                </div>
              </div>
            </div>
          )}

          {/* Prediction Result */}
          {prediction && !prediction.error && (
            <div className="results-card prediction-card">
              <h2>🎯 Prediction Result</h2>
              <div className={`prediction-result ${prediction.prediction === 'ASD' ? 'asd' : 'control'}`}>
                <div className="prediction-diagnosis">{prediction.prediction}</div>
                <div className="prediction-confidence">
                  Confidence: <strong>{prediction.confidence}%</strong>
                </div>
              </div>

              <div className="neighbor-breakdown">
                <h3>Neighbor Diagnosis Breakdown (k={prediction.k})</h3>
                <div className="breakdown-bars">
                  <div className="breakdown-bar">
                    <div className="bar-label">ASD: {prediction.neighborDiagnosis.ASD}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill asd-bar" 
                        style={{ width: `${(prediction.neighborDiagnosis.ASD / prediction.k) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="breakdown-bar">
                    <div className="bar-label">Control: {prediction.neighborDiagnosis.Control}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill control-bar" 
                        style={{ width: `${(prediction.neighborDiagnosis.Control / prediction.k) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="neighbors-table">
                <h3>K-Nearest Neighbors Details</h3>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Diagnosis</th>
                      <th>Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prediction.neighbors.map((neighbor, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className={neighbor.diagnosis.toLowerCase()}>
                          {neighbor.diagnosis}
                        </td>
                        <td>{neighbor.distance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {prediction?.error && (
            <div className="results-card error-card">
              <h2>⚠️ Error</h2>
              <p>{prediction.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearcherKNNPage;