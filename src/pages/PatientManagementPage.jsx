import React, { useState, useEffect } from 'react';
import PatientRegistration from '../components/PatientRegistration';
import MultimodalReport from '../components/MultimodalReport';
import './PatientManagementPage.css';

const PatientManagementPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('list'); // 'list', 'register', 'report'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/patients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch patients');
      }

      setPatients(data.patients || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientRegistered = (newPatient) => {
    setPatients(prev => [newPatient, ...prev]);
    setActiveView('list');
    fetchPatients(); // Refresh list
  };

  const handleViewReport = (patient) => {
    setSelectedPatient(patient);
    setActiveView('report');
  };

  const handleStartScreening = (patient) => {
    // Store selected patient ID in localStorage for screening modules to use
    localStorage.setItem('currentPatientId', patient.id);
    alert(`Patient ${patient.cortexaId} selected for screening. You can now perform any screening test, and results will be linked to this patient.`);
  };

  const getRiskBadgeColor = (level) => {
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

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cortexaId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render based on active view
  if (activeView === 'register') {
    return (
      <div className="page-container">
        <PatientRegistration
          onSuccess={handlePatientRegistered}
          onCancel={() => setActiveView('list')}
        />
      </div>
    );
  }

  if (activeView === 'report' && selectedPatient) {
    return (
      <div className="page-container">
        <MultimodalReport
          patientId={selectedPatient.id}
          onClose={() => setActiveView('list')}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="patient-management-page">
        <div className="page-header">
          <div className="header-content">
            <h1>👥 Patient Management</h1>
            <p className="subtitle">Manage patients and access multimodal ASD screening reports</p>
          </div>
          <button
            className="btn btn-primary btn-register"
            onClick={() => setActiveView('register')}
          >
            <span className="btn-icon">+</span>
            Register New Patient
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or CORTEXA ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{patients.length}</div>
              <div className="stat-label">Total Patients</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">
                {patients.filter(p => p.multimodalRiskLevel === 'Low').length}
              </div>
              <div className="stat-label">Low Risk</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <div className="stat-value">
                {patients.filter(p => p.multimodalRiskLevel === 'Moderate').length}
              </div>
              <div className="stat-label">Moderate Risk</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚨</div>
            <div className="stat-info">
              <div className="stat-value">
                {patients.filter(p => p.multimodalRiskLevel === 'High').length}
              </div>
              <div className="stat-label">High Risk</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Patients List */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Patients Found</h3>
            <p>
              {searchTerm
                ? 'No patients match your search criteria'
                : 'Register your first patient to begin multimodal ASD screening'}
            </p>
            {!searchTerm && (
              <button
                className="btn btn-primary"
                onClick={() => setActiveView('register')}
              >
                <span className="btn-icon">+</span>
                Register First Patient
              </button>
            )}
          </div>
        ) : (
          <div className="patients-grid">
            {filteredPatients.map((patient) => (
              <div key={patient.id || patient._id} className="patient-card">
                <div className="patient-card-header">
                  <div className="patient-info">
                    <h3 className="patient-name">{patient.name}</h3>
                    <p className="patient-id">{patient.cortexaId}</p>
                  </div>
                  {patient.multimodalRiskLevel && (
                    <div
                      className="risk-badge"
                      style={{ background: getRiskBadgeColor(patient.multimodalRiskLevel) }}
                    >
                      {patient.multimodalRiskLevel}
                    </div>
                  )}
                </div>

                <div className="patient-card-body">
                  <div className="patient-detail">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{patient.age} years</span>
                  </div>
                  <div className="patient-detail">
                    <span className="detail-label">Gender:</span>
                    <span className="detail-value">{patient.gender}</span>
                  </div>
                  <div className="patient-detail">
                    <span className="detail-label">Registered:</span>
                    <span className="detail-value">
                      {formatDate(patient.registrationDate || patient.createdAt)}
                    </span>
                  </div>
                  {patient.screeningCompleteness && (
                    <div className="patient-detail completeness">
                      <span className="detail-label">Screenings:</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${patient.screeningCompleteness.percentage}%` }}
                        ></div>
                      </div>
                      <span className="detail-value">
                        {patient.screeningCompleteness.completed}/
                        {patient.screeningCompleteness.total} ({patient.screeningCompleteness.percentage}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="patient-card-footer">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handleStartScreening(patient)}
                  >
                    🎯 Start Screening
                  </button>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => handleViewReport(patient)}
                  >
                    📊 View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientManagementPage;
