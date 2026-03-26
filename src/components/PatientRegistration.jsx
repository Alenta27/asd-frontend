import React, { useState } from 'react';
import './PatientRegistration.css';

const PatientRegistration = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    dateOfBirth: '',
    grade: '',
    medical_history: '',
    preferredLanguage: 'en-US'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Validation
    if (!formData.name || !formData.age || !formData.gender) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/patients/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register patient');
      }

      setSuccessMessage(`Patient registered successfully! ID: ${data.patient.cortexaId}`);
      
      // Reset form
      setFormData({
        name: '',
        age: '',
        gender: '',
        dateOfBirth: '',
        grade: '',
        medical_history: '',
        preferredLanguage: 'en-US'
      });

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(data.patient);
        }, 1500);
      }

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-registration-container">
      <div className="registration-header">
        <h2>🏥 Register New Patient</h2>
        <p className="registration-subtitle">
          Create a patient profile to begin multimodal ASD screening
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter patient's full name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">
              Age <span className="required">*</span>
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Age in years"
              min="1"
              max="120"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">
              Gender <span className="required">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="grade">Grade/Class</label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              placeholder="e.g., Grade 1, Kindergarten"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferredLanguage">Preferred Language</label>
            <select
              id="preferredLanguage"
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="en-US">English (US)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="zh-CN">Chinese (Mandarin)</option>
              <option value="hi-IN">Hindi</option>
            </select>
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="medical_history">Medical History</label>
          <textarea
            id="medical_history"
            name="medical_history"
            value={formData.medical_history}
            onChange={handleChange}
            placeholder="Enter any relevant medical history, previous diagnoses, medications, etc."
            rows="4"
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Registering...
              </>
            ) : (
              <>
                <span className="btn-icon">✓</span>
                Register Patient
              </>
            )}
          </button>
        </div>
      </form>

      <div className="info-box">
        <h4>📋 What happens next?</h4>
        <ul>
          <li>A unique <strong>CORTEXA ID</strong> will be assigned</li>
          <li>You can perform multiple screening tests</li>
          <li>All results will be linked to this patient</li>
          <li>Generate comprehensive multimodal reports</li>
        </ul>
      </div>
    </div>
  );
};

export default PatientRegistration;
