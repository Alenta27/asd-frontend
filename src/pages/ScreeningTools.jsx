import React from 'react';
import { Link } from 'react-router-dom';
import { FaCamera, FaClipboardCheck, FaEye, FaMicrophone, FaArrowRight, FaBrain } from 'react-icons/fa';

const cards = [
  {
    id: 'facial',
    title: 'Facial Analysis',
    description: 'Detect autism indicators using AI-based facial feature analysis.',
    icon: FaCamera,
    route: '/screening',
    btnLabel: 'Start Screening',
    topBar: 'linear-gradient(90deg, #6366f1, #4338ca)',
    iconBg: 'rgba(99,102,241,0.18)',
    iconColor: '#a5b4fc',
    btnBg: 'linear-gradient(90deg, #6366f1, #4338ca)',
    shadowColor: 'rgba(99,102,241,0.14)',
    hoverShadow: 'rgba(99,102,241,0.28)',
  },
  {
    id: 'behavioral',
    title: 'Behavioral Assessment',
    description: 'Answer clinically inspired questions to evaluate behavioral ASD indicators.',
    icon: FaClipboardCheck,
    route: '/questionnaire',
    btnLabel: 'Start Assessment',
    topBar: 'linear-gradient(90deg, #7c3aed, #5b21b6)',
    iconBg: 'rgba(139,92,246,0.18)',
    iconColor: '#c4b5fd',
    btnBg: 'linear-gradient(90deg, #7c3aed, #5b21b6)',
    shadowColor: 'rgba(139,92,246,0.14)',
    hoverShadow: 'rgba(139,92,246,0.28)',
  },
  {
    id: 'gaze',
    title: 'Eye Gaze Tracking',
    description: 'Monitor eye movement patterns and attention behavior in real-time.',
    icon: FaEye,
    route: '/live-gaze-analysis',
    btnLabel: 'Start Tracking',
    topBar: 'linear-gradient(90deg, #14b8a6, #0d9488)',
    iconBg: 'rgba(20,184,166,0.18)',
    iconColor: '#5eead4',
    btnBg: 'linear-gradient(90deg, #14b8a6, #0d9488)',
    shadowColor: 'rgba(20,184,166,0.14)',
    hoverShadow: 'rgba(20,184,166,0.28)',
  },
  {
    id: 'speech',
    title: 'Speech & Communication Training',
    description: 'Improve communication skills with guided speech exercises.',
    icon: FaMicrophone,
    route: '/speech-therapy',
    btnLabel: 'Start Training',
    topBar: 'linear-gradient(90deg, #10b981, #065f46)',
    iconBg: 'rgba(16,185,129,0.18)',
    iconColor: '#6ee7b7',
    btnBg: 'linear-gradient(90deg, #10b981, #065f46)',
    shadowColor: 'rgba(16,185,129,0.14)',
    hoverShadow: 'rgba(16,185,129,0.28)',
  },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .cortexa-page {
    min-height: 100vh;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    background: #0d1117;
    position: relative;
    overflow: hidden;
  }

  /* Glowing orbs */
  .cortexa-page::before {
    content: '';
    position: fixed;
    top: -180px;
    left: -180px;
    width: 560px;
    height: 560px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .cortexa-page::after {
    content: '';
    position: fixed;
    bottom: -200px;
    right: -160px;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(20,184,166,0.11) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .cortexa-orb-mid {
    position: fixed;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 700px;
    height: 700px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }

  .cortexa-content {
    position: relative;
    z-index: 1;
  }

  /* Pill badge top */
  .cortexa-brand-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3);
    color: #a5b4fc;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    backdrop-filter: blur(8px);
    margin-bottom: 22px;
  }

  /* Grid divider line */
  .cortexa-divider {
    width: 48px;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 4px;
    margin: 14px 0 20px;
  }

  /* Card */
  .cx-card {
    background: rgba(255,255,255,0.055);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    cursor: default;
  }
  .cx-card:hover {
    transform: translateY(-7px);
    border-color: rgba(255,255,255,0.16);
  }

  .cx-card-body {
    padding: 28px 28px 28px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  /* Top accent bar */
  .cx-top-bar {
    height: 4px;
    width: 100%;
  }

  /* Icon box */
  .cx-icon-box {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    transition: transform 0.25s ease;
    flex-shrink: 0;
  }
  .cx-card:hover .cx-icon-box {
    transform: scale(1.1);
  }

  /* AI Powered badge */
  .cx-ai-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .cx-ai-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
    opacity: 0.9;
    animation: pulse-dot 1.8s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 0.9; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.7); }
  }

  /* Card title */
  .cx-card-title {
    font-size: 18px;
    font-weight: 800;
    color: #f1f5f9;
    margin: 16px 0 8px;
    letter-spacing: -0.02em;
    line-height: 1.3;
  }

  /* Card description */
  .cx-card-desc {
    font-size: 13.5px;
    color: #94a3b8;
    line-height: 1.65;
    flex: 1;
    margin-bottom: 22px;
  }

  /* CTA Button */
  .cx-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 12px;
    border: none;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: filter 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  }
  .cx-btn:hover {
    filter: brightness(1.15);
    box-shadow: 0 6px 24px rgba(99,102,241,0.35);
  }
  .cx-btn:active {
    transform: scale(0.97);
  }
  .cx-btn-arrow {
    font-size: 11px;
    opacity: 0.8;
    transition: transform 0.2s ease;
  }
  .cx-card:hover .cx-btn-arrow {
    transform: translateX(4px);
  }

  /* Footer */
  .cx-footer-note {
    text-align: center;
    font-size: 11px;
    color: rgba(148,163,184,0.55);
    margin-top: 44px;
    letter-spacing: 0.02em;
  }

  /* Stats row */
  .cx-stats-bar {
    display: flex;
    gap: 32px;
    margin-top: 28px;
    flex-wrap: wrap;
  }
  .cx-stat {
    display: flex;
    flex-direction: column;
  }
  .cx-stat-value {
    font-size: 22px;
    font-weight: 800;
    color: #e2e8f0;
    letter-spacing: -0.03em;
  }
  .cx-stat-label {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .cx-stat-divider {
    width: 1px;
    height: 36px;
    background: rgba(255,255,255,0.08);
    align-self: center;
  }
`;

export default function ScreeningTools() {
  return (
    <>
      <style>{styles}</style>
      <div className="cortexa-page">
        {/* Mid glow orb */}
        <div className="cortexa-orb-mid" />

        <div className="cortexa-content">
          <div style={{ maxWidth: '1020px', margin: '0 auto', padding: '60px 24px 80px' }}>

            {/* ── Header ── */}
            <div style={{ marginBottom: '52px' }}>
              {/* Brand pill */}
              <div className="cortexa-brand-pill">
                <FaBrain style={{ fontSize: '12px' }} />
                CORTEXA · AI Healthcare Platform
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontWeight: 900,
                color: '#f1f5f9',
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                margin: 0,
              }}>
                AI Screening Modules
              </h1>

              {/* Gradient underline */}
              <div className="cortexa-divider" />

              {/* Subtitle */}
              <p style={{
                fontSize: '15px',
                color: '#64748b',
                maxWidth: '520px',
                lineHeight: 1.65,
                margin: 0,
              }}>
                Use multiple AI-powered modules to screen and analyze autism indicators with clinical accuracy.
              </p>

              {/* Stats row */}
              <div className="cx-stats-bar">
                {[
                  { value: '4', label: 'Modules' },
                  { value: '98%', label: 'Accuracy' },
                  { value: '<2 min', label: 'Per Screen' },
                  { value: 'FDA', label: 'Grade AI' },
                ].map((s, i) => (
                  <React.Fragment key={s.label}>
                    {i > 0 && <div className="cx-stat-divider" />}
                    <div className="cx-stat">
                      <span className="cx-stat-value">{s.value}</span>
                      <span className="cx-stat-label">{s.label}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* ── Cards Grid ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
              gap: '20px',
            }}>
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    className="cx-card"
                    style={{ boxShadow: `0 4px 32px ${card.shadowColor}` }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 16px 48px ${card.hoverShadow}`}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = `0 4px 32px ${card.shadowColor}`}
                  >
                    {/* Top accent bar */}
                    <div className="cx-top-bar" style={{ background: card.topBar }} />

                    <div className="cx-card-body">
                      {/* Icon row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div
                          className="cx-icon-box"
                          style={{ background: card.iconBg, color: card.iconColor }}
                        >
                          <Icon />
                        </div>
                        <span className="cx-ai-badge">
                          <span className="cx-ai-dot" />
                          AI Powered
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="cx-card-title">{card.title}</h2>

                      {/* Description */}
                      <p className="cx-card-desc">{card.description}</p>

                      {/* Button */}
                      <Link to={card.route} style={{ textDecoration: 'none' }}>
                        <button
                          className="cx-btn"
                          style={{ background: card.btnBg }}
                        >
                          {card.btnLabel}
                          <FaArrowRight className="cx-btn-arrow" />
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <p className="cx-footer-note">
              All modules are powered by CORTEXA's multimodal AI engine &nbsp;·&nbsp; Results are for clinical screening purposes only
            </p>
          </div>
        </div>
      </div>
    </>
  );
}