import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FeaturesPage.css';

const FeaturesPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 1,
      title: "Explainable AI",
      icon: "🧠",
      description: "Our advanced AI provides transparent insights through Grad-CAM visualizations, showing exactly what patterns the system identifies. This explainable approach helps parents and professionals understand the analysis process.",
      color: "#3B82F6",
      image: "/images/feature-autism-awareness-puzzle.jpg"
    },
    {
      id: 2,
      title: "Personalized Reports",
      icon: "📊",
      description: "Receive detailed, personalized reports tailored to your child's specific needs. Our reports include actionable insights, developmental recommendations, and clear next steps for parents and caregivers.",
      color: "#10B981",
      image: "/images/feature-report.jpeg"
    },
    {
      id: 3,
      title: "Integrated Questionnaires",
      icon: "📝",
      description: "Comprehensive screening questionnaires designed by experts, covering multiple developmental domains. Age-appropriate questions for toddlers, children, and adolescents with instant analysis.",
      color: "#8B5CF6",
      image: "/images/feature-children-flowers-interaction.jpg"
    },
    {
      id: 4,
      title: "Data Privacy & Security",
      icon: "🔒",
      description: "Your family's data is protected with enterprise-grade security. We use end-to-end encryption, comply with HIPAA standards, and never share personal information without explicit consent.",
      color: "#F59E0B",
      image: "/images/feature-diverse-children-group.jpeg"
    },
    {
      id: 5,
      title: "Multi-disorder Support",
      icon: "🌈",
      description: "Comprehensive screening for ASD, ADHD, and Down Syndrome. Our AI models are trained on diverse datasets to provide accurate insights across multiple developmental conditions.",
      color: "#EF4444",
      image: "/images/feature-boy-hand-flapping.jpeg"
    },
    {
      id: 6,
      title: "Family-Centered Care",
      icon: "👨‍👩‍👧‍👦",
      description: "Our platform recognizes that every family is unique. We provide supportive tools and resources that empower parents and caregivers to be active participants in their child's developmental journey.",
      color: "#EC4899",
      image: "/images/feature-mother-child-fidget.jpg"
    }
  ];

  const handleStartScreening = () => {
    navigate('/screening-tools');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="features-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Powerful Features for Early Detection</h1>
          <p className="hero-subtitle">
            Discover how our cutting-edge technology combines artificial intelligence with compassionate care to provide comprehensive developmental screening tools for families and professionals.
          </p>
          <div className="hero-buttons">
            <button className="hero-primary-btn" onClick={handleStartScreening}>
              Start Screening
            </button>
            <button className="hero-secondary-btn" onClick={handleRegister}>
              Create Account
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img src="/images/hero-autism-wooden-text.jpg" alt="Autism awareness and early detection" />
        </div>
      </div>

      {/* Features Grid */}
      <div className="features-section">
        <div className="features-header">
          <h2>Comprehensive Screening Solutions</h2>
          <p>Built with parents, caregivers, and professionals in mind</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={feature.id} 
              className={`feature-card ${index % 2 === 0 ? 'feature-left' : 'feature-right'}`}
              style={{ '--feature-color': feature.color }}
            >
              <div className="feature-content">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-accent" style={{ backgroundColor: feature.color }}></div>
              </div>
              <div className="feature-image">
                <img src={feature.image} alt={feature.title} />
                <div className="image-overlay" style={{ backgroundColor: `${feature.color}20` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">95%</div>
            <div className="stat-label">Accuracy Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Families Helped</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Support Available</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">6</div>
            <div className="stat-label">Key Features</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-content">
          <h3>Ready to Take the Next Step?</h3>
          <p>Join thousands of families who have found peace of mind through early detection and intervention.</p>
          <div className="cta-buttons">
            <button className="cta-primary" onClick={handleStartScreening}>
              Start Your Screening Journey
            </button>
            <button className="cta-secondary" onClick={handleRegister}>
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
