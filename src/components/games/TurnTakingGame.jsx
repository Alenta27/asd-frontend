import React, { useState, useEffect, useRef } from 'react';
import { FiCheckCircle, FiClock, FiAlertCircle, FiVolume2 } from 'react-icons/fi';
import './GameStyles.css';

const TurnTakingGame = ({ studentId, onComplete }) => {
  const [gameState, setGameState] = useState('idle'); // idle, red, green, results
  const [round, setRound] = useState(0);
  const TOTAL_ROUNDS = 8;
  
  // Metrics
  const [metrics, setMetrics] = useState({
    correctGreenClicks: 0,
    impulsiveRedClicks: 0,
    missedGreenTurns: 0,
    reactionTimes: []
  });

  const [lastAction, setLastAction] = useState(null); // 'success', 'early', 'missed'

  const timerRef = useRef(null);
  const roundStartTimeRef = useRef(null);
  const hasClickedInCurrentGreenRef = useRef(false);
  const feedbackTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const showFeedback = (type) => {
    setLastAction(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setLastAction(null), 1000);
  };

  const speakInstruction = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = "Wait for your turn! Only click when the light is green.";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const startGame = () => {
    speakInstruction();
    setRound(1);
    startRedPhase();
  };

  const startRedPhase = () => {
    setGameState('red');
    hasClickedInCurrentGreenRef.current = false;
    const redDuration = Math.random() * 3000 + 2000; // 2-5 seconds
    
    timerRef.current = setTimeout(() => {
      startGreenPhase();
    }, redDuration);
  };

  const startGreenPhase = () => {
    setGameState('green');
    roundStartTimeRef.current = Date.now();
    const greenDuration = Math.random() * 500 + 1500; // 1.5-2 seconds
    
    timerRef.current = setTimeout(() => {
      // Check if missed
      if (!hasClickedInCurrentGreenRef.current) {
        showFeedback('missed');
        setMetrics(prev => ({
          ...prev,
          missedGreenTurns: prev.missedGreenTurns + 1
        }));
      }
      
      handleRoundEnd();
    }, greenDuration);
  };

  const handleRoundEnd = () => {
    setRound(prev => {
      const nextRound = prev + 1;
      if (nextRound > TOTAL_ROUNDS) {
        setGameState('results');
        return prev;
      }
      startRedPhase();
      return nextRound;
    });
  };

  const handleClick = () => {
    if (gameState === 'red') {
      // Impulsive click
      showFeedback('early');
      setMetrics(prev => ({
        ...prev,
        impulsiveRedClicks: prev.impulsiveRedClicks + 1
      }));
    } else if (gameState === 'green') {
      if (!hasClickedInCurrentGreenRef.current) {
        hasClickedInCurrentGreenRef.current = true;
        showFeedback('success');
        const reactionTime = Date.now() - roundStartTimeRef.current;
        
        setMetrics(prev => ({
          ...prev,
          correctGreenClicks: prev.correctGreenClicks + 1,
          reactionTimes: [...prev.reactionTimes, reactionTime]
        }));
      }
    }
  };

  const finishAssessment = () => {
    const avgReactionTime = metrics.reactionTimes.length > 0 
      ? metrics.reactionTimes.reduce((a, b) => a + b, 0) / metrics.reactionTimes.length 
      : 0;
    
    const accuracy = (metrics.correctGreenClicks / TOTAL_ROUNDS) * 100;
    const score = Math.max(0, Math.min(100, (metrics.correctGreenClicks - metrics.impulsiveRedClicks) * (100 / TOTAL_ROUNDS)));

    // Qualitative summary
    let summary = "";
    if (metrics.impulsiveRedClicks > 4) {
      summary = "Student showed difficulty waiting for turn, with frequent early responses.";
    } else if (metrics.missedGreenTurns > 3) {
      summary = "Student showed inconsistent attention to task cues.";
    } else {
      summary = "Student demonstrated good turn-taking and impulse control.";
    }

    const assessmentData = {
      studentId,
      assessmentType: 'turn-taking',
      game: 'Turn-Taking',
      score: Math.round(score),
      metrics: {
        turnTakingAccuracy: parseFloat(accuracy.toFixed(1)),
        impulsivityLevel: metrics.impulsiveRedClicks > 4 ? 'High' : metrics.impulsiveRedClicks > 2 ? 'Moderate' : 'Low',
        attentionConsistency: (metrics.missedGreenTurns < 2 ? 'High' : metrics.missedGreenTurns < 4 ? 'Moderate' : 'Low'),
        avgReactionTime: Math.round(avgReactionTime),
        correctClicks: metrics.correctGreenClicks,
        earlyClicks: metrics.impulsiveRedClicks,
        missedTurns: metrics.missedGreenTurns
      },
      indicators: [
        {
          label: 'Impulse Control',
          status: metrics.impulsiveRedClicks > 4 ? 'Challenge' : 'Typical',
          color: metrics.impulsiveRedClicks > 4 ? '#ef4444' : '#10b981'
        },
        {
          label: 'Attention Focus',
          status: metrics.missedGreenTurns > 3 ? 'Inconsistent' : 'Typical',
          color: metrics.missedGreenTurns > 3 ? '#f59e0b' : '#10b981'
        }
      ],
      rawGameData: metrics,
      summary,
      completedAt: new Date().toISOString()
    };

    onComplete(assessmentData);
  };

  if (gameState === 'results') {
    return (
      <div className="game-wrapper">
        <div className="game-card results-ready">
          <FiCheckCircle size={60} color="#10b981" />
          <h2>Game Over!</h2>
          <div className="turn-results-summary">
            <div className="turn-stat-box">
              <span className="turn-stat-label">Correct Clicks</span>
              <span className="turn-stat-value">{metrics.correctGreenClicks}</span>
            </div>
            <div className="turn-stat-box">
              <span className="turn-stat-label">Early Clicks</span>
              <span className="turn-stat-value">{metrics.impulsiveRedClicks}</span>
            </div>
            <div className="turn-stat-box">
              <span className="turn-stat-label">Missed Turns</span>
              <span className="turn-stat-value">{metrics.missedGreenTurns}</span>
            </div>
            <div className="turn-stat-box">
              <span className="turn-stat-label">Avg Speed</span>
              <span className="turn-stat-value">{Math.round(metrics.reactionTimes.reduce((a, b) => a + b, 0) / metrics.reactionTimes.length || 0)}ms</span>
            </div>
          </div>
          <button className="option-button correct" onClick={finishAssessment}>
            Save Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-wrapper">
      <div className="game-card">
        {gameState === 'idle' ? (
          <div className="start-screen">
            <FiClock style={{ fontSize: '60px', color: '#3b82f6', marginBottom: '20px' }} />
            <h2>Turn-Taking Game</h2>
            <div className="instruction-box">
              <p className="game-instruction">
                <FiVolume2 
                  style={{ cursor: 'pointer', marginRight: '8px', color: '#3b82f6' }} 
                  onClick={speakInstruction}
                  title="Click to hear instruction"
                />
                <strong>“Wait for your turn! Only click when the light is green.”</strong>
              </p>
            </div>
            <button className="option-button correct" onClick={startGame}>
              Start Game
            </button>
          </div>
        ) : (
          <div className="turn-taking-play">
            <div className="game-progress">Round {round} of {TOTAL_ROUNDS}</div>
            
            <div 
              className={`traffic-light ${gameState} ${lastAction ? 'feedback-' + lastAction : ''}`}
              onClick={handleClick}
            >
              <span className="light-text">
                {lastAction === 'success' ? 'GREAT!' : 
                 lastAction === 'early' ? 'WAIT!' : 
                 lastAction === 'missed' ? 'MISSED' : 
                 (gameState === 'red' ? 'WAIT' : 'CLICK')}
              </span>
            </div>
            
            <div className="tracking-status">
              {gameState === 'red' && <div className="status-dot pulsing red" style={{ backgroundColor: '#ef4444' }} />}
              {gameState === 'green' && <div className="status-dot pulsing green" style={{ backgroundColor: '#10b981' }} />}
              <span>{gameState === 'red' ? 'Wait for Green...' : 'GO! CLICK NOW!'}</span>
            </div>

            {metrics.impulsiveRedClicks > 0 && gameState === 'red' && (
              <div className="interruption-alert" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                <FiAlertCircle style={{ marginRight: '8px' }} />
                Wait for green!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnTakingGame;
