import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HowItWorksPage.css';

const HowItWorksPage = () => {
  const navigate = useNavigate();

  const handleStartScreening = () => {
    navigate('/screening-tools');
  };

  const handleLearnMore = () => {
    navigate('/learn-more');
  };
  const steps = [
    {
      id: 1,
      title: "Provide a Sample",
      icon: "📤",
      description: "Getting started is easy. Using our secure platform, you provide a screening sample. For our voice analysis, simply record a short clip of vocalization. For our visual screening, upload a clear facial photograph. No invasive procedures, just simple inputs.",
      color: "#3B82F6" // Blue
    },
    {
      id: 2,
      title: "AI-Powered Analysis",
      icon: "🤖",
      description: "Once you submit the sample, our advanced AI models get to work. Our system, built on state-of-the-art Convolutional Neural Networks (CNNs), analyzes the intricate patterns in the voice or facial features for key indicators associated with ASD. The process is entirely automated and confidential.",
      color: "#10B981" // Green
    },
    {
      id: 3,
      title: "Receive Your Report",
      icon: "📊",
      description: "Within moments, you receive a preliminary report. It's designed to be easy to understand, providing insights and indicating whether a professional follow-up is recommended. This is a screening tool to empower you with information, not a diagnosis.",
      color: "#8B5CF6" // Purple
    }
  ];

  return (
    <div className="how-it-works-container">
      <div className="hero-section">
        <h1 className="main-headline">A Simple Path to Early Insights</h1>
        <p className="sub-headline">
          Our screening process is designed to be simple, fast, and secure, turning complex technology into an accessible tool for parents and caregivers.
        </p>
      </div>

      <div className="steps-container">
        <div className="steps-header">
          <h2>The Three-Step Process</h2>
          <div className="process-line"></div>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={step.id} className="step-card" style={{ '--step-color': step.color }}>
              <div className="step-number">{step.id}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              <div className="step-connector">
                {index < steps.length - 1 && (
                  <div className="connector-line"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="trust-section">
        <div className="trust-content">
          <h3>Built with Trust & Privacy</h3>
          <div className="trust-features">
            <div className="trust-feature">
              <span className="trust-icon">🔒</span>
              <span>Secure & Confidential</span>
            </div>
            <div className="trust-feature">
              <span className="trust-icon">⚡</span>
              <span>Fast Results</span>
            </div>
            <div className="trust-feature">
              <span className="trust-icon">🎯</span>
              <span>Evidence-Based</span>
            </div>
            <div className="trust-feature">
              <span className="trust-icon">👨‍⚕️</span>
              <span>Professional Guidance</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h3>Ready to Get Started?</h3>
        <p>Take the first step towards early insights with our secure, AI-powered screening tools.</p>
        <div className="cta-buttons">
          <button className="primary-cta" onClick={handleStartScreening}>Start Screening</button>
          <button className="secondary-cta" onClick={handleLearnMore}>Learn More</button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
