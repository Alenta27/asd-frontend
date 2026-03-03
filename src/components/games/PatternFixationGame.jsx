import React, { useState, useEffect, useRef } from 'react';
import { FiCheck, FiX, FiClock, FiActivity, FiAlertCircle } from 'react-icons/fi';
import './GameStyles.css';

// Shape definitions
const SHAPES = ['square', 'circle', 'triangle', 'star'];
const COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#f472b6'];

// Round configurations
const ROUNDS_CONFIG = [
  { id: 1, name: 'Pattern Completion', duration: 40, trials: 5 },
  { id: 2, name: 'Pattern vs Novelty Choice', duration: 30, trials: 8 },
  { id: 3, name: 'Rule Switching Test', duration: 45, trials: 10 },
  { id: 4, name: 'Repetitive Selection Test', duration: 30, trials: 12 }
];

const PatternFixationGame = ({ studentId, onComplete }) => {
  // Game state
  const [gamePhase, setGamePhase] = useState('idle'); // 'idle' | 'round_intro' | 'round_active' | 'final_results'
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);
  
  // Round-specific state
  const [patternSequence, setPatternSequence] = useState([]);
  const [userChoice, setUserChoice] = useState(null);
  const [choices, setChoices] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Behavioral tracking
  const sessionDataRef = useRef({
    round1: [], // Pattern completion results
    round2: [], // Pattern vs novelty choices
    round3: [], // Rule switching performance
    round4: [], // Repetitive selection tracking
    startTime: null
  });
  
  const timerRef = useRef(null);
  const trialStartTimeRef = useRef(null);
  const currentRuleRef = useRef('color'); // For round 3: 'color' or 'shape'

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start game
  const startGame = () => {
    sessionDataRef.current.startTime = Date.now();
    setCurrentRound(0);
    startRound(0);
  };

  // Start specific round
  const startRound = (roundIndex) => {
    setGamePhase('round_intro');
    setCurrentRound(roundIndex);
    setCurrentTrial(0);
    setSelectedItems([]);
    
    // Initialize round after brief intro
    setTimeout(() => {
      const config = ROUNDS_CONFIG[roundIndex];
      setTimeLeft(config.duration);
      setGamePhase('round_active');
      
      // Start timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            endRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Initialize first trial
      initializeTrial(roundIndex, 0);
    }, 2000);
  };

  // Initialize trial based on round
  const initializeTrial = (roundIndex, trialNum) => {
    trialStartTimeRef.current = Date.now();
    setCurrentTrial(trialNum);
    setShowFeedback(false);
    setUserChoice(null);
    
    switch (roundIndex) {
      case 0: // Round 1: Pattern Completion
        generatePatternSequence();
        break;
      case 1: // Round 2: Pattern vs Novelty Choice
        generateChoicePanels();
        break;
      case 2: // Round 3: Rule Switching Test
        // Switch rule every 3 trials
        if (trialNum % 3 === 0) {
          currentRuleRef.current = currentRuleRef.current === 'color' ? 'shape' : 'color';
        }
        generateRuleSwitchTrial();
        break;
      case 3: // Round 4: Repetitive Selection Test
        generateSelectionGrid();
        break;
    }
  };

  // ROUND 1: Pattern Completion
  const generatePatternSequence = () => {
    const patternLength = 4;
    const sequence = [];
    const baseShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const baseColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // Create repeating pattern
    for (let i = 0; i < patternLength; i++) {
      sequence.push({ shape: baseShape, color: COLORS[i % 2 === 0 ? 0 : 1] });
    }
    
    setPatternSequence(sequence);
    
    // Generate options including correct answer
    const correctAnswer = { shape: baseShape, color: COLORS[0] };
    const options = [
      correctAnswer,
      { shape: SHAPES[(SHAPES.indexOf(baseShape) + 1) % SHAPES.length], color: COLORS[0] },
      { shape: baseShape, color: COLORS[2] }
    ].sort(() => Math.random() - 0.5);
    
    setChoices(options);
  };

  const handlePatternCompletion = (choice) => {
    const reactionTime = Date.now() - trialStartTimeRef.current;
    const correct = choice.shape === patternSequence[0].shape && choice.color === COLORS[0];
    
    setUserChoice(choice);
    setIsCorrect(correct);
    setShowFeedback(true);
    
    sessionDataRef.current.round1.push({
      trial: currentTrial,
      correct,
      reactionTime,
      pattern: patternSequence,
      choice
    });
    
    setTimeout(() => {
      const nextTrial = currentTrial + 1;
      if (nextTrial < ROUNDS_CONFIG[0].trials) {
        initializeTrial(0, nextTrial);
      } else {
        endRound();
      }
    }, 1000);
  };

  // ROUND 2: Pattern vs Novelty Choice
  const generateChoicePanels = () => {
    const patternPanel = [];
    const noveltyPanel = [];
    const patternShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const patternColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // Pattern panel: 9 identical items
    for (let i = 0; i < 9; i++) {
      patternPanel.push({ shape: patternShape, color: patternColor, id: `p${i}` });
    }
    
    // Novelty panel: 9 random items
    for (let i = 0; i < 9; i++) {
      noveltyPanel.push({
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        id: `n${i}`
      });
    }
    
    setChoices([
      { type: 'pattern', items: patternPanel },
      { type: 'novelty', items: noveltyPanel }
    ]);
  };

  const handlePanelChoice = (panelType) => {
    const reactionTime = Date.now() - trialStartTimeRef.current;
    
    sessionDataRef.current.round2.push({
      trial: currentTrial,
      choice: panelType,
      reactionTime,
      preferredPattern: panelType === 'pattern'
    });
    
    const nextTrial = currentTrial + 1;
    if (nextTrial < ROUNDS_CONFIG[1].trials) {
      initializeTrial(1, nextTrial);
    } else {
      endRound();
    }
  };

  // ROUND 3: Rule Switching Test
  const generateRuleSwitchTrial = () => {
    const targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    const options = [];
    const currentRule = currentRuleRef.current;
    
    // Correct answer based on current rule
    const correctOption = { shape: targetShape, color: targetColor, isCorrect: true };
    
    // Generate distractors
    if (currentRule === 'color') {
      options.push(
        correctOption,
        { shape: SHAPES[(SHAPES.indexOf(targetShape) + 1) % SHAPES.length], color: targetColor, isCorrect: false },
        { shape: SHAPES[(SHAPES.indexOf(targetShape) + 2) % SHAPES.length], color: COLORS[(COLORS.indexOf(targetColor) + 1) % COLORS.length], isCorrect: false }
      );
    } else {
      options.push(
        correctOption,
        { shape: targetShape, color: COLORS[(COLORS.indexOf(targetColor) + 1) % COLORS.length], isCorrect: false },
        { shape: SHAPES[(SHAPES.indexOf(targetShape) + 1) % SHAPES.length], color: COLORS[(COLORS.indexOf(targetColor) + 2) % COLORS.length], isCorrect: false }
      );
    }
    
    setChoices(options.sort(() => Math.random() - 0.5));
    setPatternSequence([{ shape: targetShape, color: targetColor }]); // Target reference
  };

  const handleRuleSwitchChoice = (choice) => {
    const reactionTime = Date.now() - trialStartTimeRef.current;
    const currentRule = currentRuleRef.current;
    const target = patternSequence[0];
    
    let correct = false;
    if (currentRule === 'color') {
      correct = choice.color === target.color;
    } else {
      correct = choice.shape === target.shape;
    }
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    sessionDataRef.current.round3.push({
      trial: currentTrial,
      rule: currentRule,
      correct,
      reactionTime,
      target,
      choice,
      wasRuleSwitch: currentTrial % 3 === 0 && currentTrial > 0
    });
    
    setTimeout(() => {
      const nextTrial = currentTrial + 1;
      if (nextTrial < ROUNDS_CONFIG[2].trials) {
        initializeTrial(2, nextTrial);
      } else {
        endRound();
      }
    }, 1000);
  };

  // ROUND 4: Repetitive Selection Test
  const generateSelectionGrid = () => {
    const grid = [];
    for (let i = 0; i < 16; i++) {
      grid.push({
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        id: i
      });
    }
    setChoices(grid);
    setSelectedItems([]);
  };

  const handleGridSelection = (item) => {
    const reactionTime = Date.now() - trialStartTimeRef.current;
    
    const newSelected = [...selectedItems, { ...item, reactionTime }];
    setSelectedItems(newSelected);
    
    sessionDataRef.current.round4.push({
      trial: currentTrial,
      selection: item,
      reactionTime,
      sequencePosition: newSelected.length
    });
    
    const nextTrial = currentTrial + 1;
    if (nextTrial < ROUNDS_CONFIG[3].trials) {
      trialStartTimeRef.current = Date.now();
      setCurrentTrial(nextTrial);
    } else {
      endRound();
    }
  };

  // End current round
  const endRound = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const nextRound = currentRound + 1;
    if (nextRound < ROUNDS_CONFIG.length) {
      startRound(nextRound);
    } else {
      finishGame();
    }
  };

  // Calculate final metrics and finish
  const finishGame = () => {
    const data = sessionDataRef.current;
    
    // METRIC 1: Pattern Choice Ratio
    const patternChoices = data.round2.filter(r => r.preferredPattern).length;
    const totalChoices = data.round2.length || 1;
    const patternChoiceRatio = patternChoices / totalChoices;
    
    // METRIC 2: Repetitive Selection Rate
    let repetitiveSelections = 0;
    for (let i = 1; i < data.round4.length; i++) {
      const prev = data.round4[i - 1].selection;
      const curr = data.round4[i].selection;
      if (prev.shape === curr.shape || prev.color === curr.color) {
        repetitiveSelections++;
      }
    }
    const repetitiveSelectionRate = data.round4.length > 1 ? repetitiveSelections / (data.round4.length - 1) : 0;
    
    // METRIC 3: Rule Switch Error Rate
    const switchTrials = data.round3.filter(r => r.wasRuleSwitch);
    const switchErrors = switchTrials.filter(r => !r.correct).length;
    const ruleSwitchErrorRate = switchTrials.length > 0 ? switchErrors / switchTrials.length : 0;
    
    // METRIC 4: Average Response Time
    const allReactionTimes = [
      ...data.round1.map(r => r.reactionTime),
      ...data.round2.map(r => r.reactionTime),
      ...data.round3.map(r => r.reactionTime),
      ...data.round4.map(r => r.reactionTime)
    ];
    const averageResponseTime = allReactionTimes.length > 0 
      ? allReactionTimes.reduce((a, b) => a + b, 0) / allReactionTimes.length 
      : 0;
    
    // FIXATION SCORE CALCULATION
    const fixationScore = 
      (patternChoiceRatio * 0.4) +
      (repetitiveSelectionRate * 0.3) +
      (ruleSwitchErrorRate * 0.3);
    
    // Risk interpretation
    let fixationLevel, fixationColor, cognitiveFlexibility;
    if (fixationScore < 0.35) {
      fixationLevel = 'Low';
      fixationColor = '#10b981';
      cognitiveFlexibility = 'Good';
    } else if (fixationScore <= 0.65) {
      fixationLevel = 'Medium';
      fixationColor = '#f59e0b';
      cognitiveFlexibility = 'Reduced';
    } else {
      fixationLevel = 'High';
      fixationColor = '#ef4444';
      cognitiveFlexibility = 'Reduced';
    }
    
    const assessmentData = {
      studentId,
      game: 'Pattern Fixation',
      assessmentType: 'pattern-fixation',
      fixationScore: Number(fixationScore.toFixed(3)),
      patternChoiceRatio: Number(patternChoiceRatio.toFixed(3)),
      repetitiveSelectionRate: Number(repetitiveSelectionRate.toFixed(3)),
      ruleSwitchErrorRate: Number(ruleSwitchErrorRate.toFixed(3)),
      averageResponseTime: Math.round(averageResponseTime),
      fixationLevel,
      cognitiveFlexibility,
      score: Math.round(fixationScore * 100),
      metrics: {
        patternBias: Math.round(patternChoiceRatio * 100),
        repetitiveRate: Math.round(repetitiveSelectionRate * 100),
        switchErrorRate: Math.round(ruleSwitchErrorRate * 100),
        avgResponseTimeMs: Math.round(averageResponseTime)
      },
      indicators: [
        {
          label: 'Pattern Fixation',
          status: fixationLevel,
          color: fixationColor
        },
        {
          label: 'Cognitive Flexibility',
          status: cognitiveFlexibility,
          color: cognitiveFlexibility === 'Good' ? '#10b981' : '#f59e0b'
        },
        {
          label: 'Pattern Bias',
          status: `${Math.round(patternChoiceRatio * 100)}%`,
          color: patternChoiceRatio > 0.6 ? '#ef4444' : patternChoiceRatio > 0.4 ? '#f59e0b' : '#10b981'
        }
      ],
      rawGameData: data
    };
    
    setGamePhase('final_results');
    
    // Send to backend
    onComplete(assessmentData);
  };

  // Render shape
  const renderShape = (shape, color, size = 60) => {
    const style = { backgroundColor: color, width: size, height: size };
    
    switch (shape) {
      case 'circle':
        return <div className="shape-circle" style={style} />;
      case 'triangle':
        return <div className="shape-triangle" style={{ borderBottomColor: color, width: 0, height: 0, borderLeft: `${size/2}px solid transparent`, borderRight: `${size/2}px solid transparent`, borderBottom: `${size}px solid ${color}` }} />;
      case 'star':
        return <div className="shape-star" style={{ color, fontSize: size }}>★</div>;
      case 'square':
      default:
        return <div className="shape-square" style={style} />;
    }
  };

  // === RENDER UI ===
  
  // Render idle screen
  if (gamePhase === 'idle') {
    return (
      <div className="game-wrapper">
        <div className="game-card">
          <div className="start-screen">
            <FiActivity size={56} color="#6366f1" style={{ marginBottom: 16 }} />
            <h2>Pattern Fixation Assessment</h2>
            <p className="game-instruction" style={{ marginBottom: 24 }}>
              This assessment measures repetitive and restricted behavior patterns through 4 cognitive tasks.
            </p>
            <div style={{ textAlign: 'left', marginBottom: 24, background: '#f3f4f6', padding: 16, borderRadius: 8 }}>
              <h4 style={{ marginBottom: 12 }}>Assessment Rounds:</h4>
              <ul style={{ paddingLeft: 24, lineHeight: 1.8 }}>
                <li><strong>Round 1:</strong> Pattern Completion (5 trials)</li>
                <li><strong>Round 2:</strong> Pattern vs Novelty Choice (8 trials)</li>
                <li><strong>Round 3:</strong> Rule Switching Test (10 trials)</li>
                <li><strong>Round 4:</strong> Repetitive Selection Test (12 trials)</li>
              </ul>
            </div>
            <button className="option-button correct" onClick={startGame}>
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render round intro
  if (gamePhase === 'round_intro') {
    const round = ROUNDS_CONFIG[currentRound];
    return (
      <div className="game-wrapper">
        <div className="game-card">
          <div className="start-screen">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'inline-block', background: '#6366f1', color: '#fff', padding: '8px 16px', borderRadius: 20, fontWeight: 600 }}>
                Round {round.id} of {ROUNDS_CONFIG.length}
              </div>
            </div>
            <h2>{round.name}</h2>
            <p className="game-instruction">
              {currentRound === 0 && 'Complete the pattern by selecting the correct next item.'}
              {currentRound === 1 && 'Choose which panel you prefer to look at.'}
              {currentRound === 2 && 'Match by the rule shown. The rule will change!'}
              {currentRound === 3 && 'Click items in the grid. Select any items you like.'}
            </p>
            <div style={{ marginTop: 24, color: '#666' }}>
              <FiClock style={{ display: 'inline', marginRight: 6 }} />
              {round.duration} seconds | {round.trials} trials
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Round 1: Pattern Completion
  if (gamePhase === 'round_active' && currentRound === 0) {
    return (
      <div className="game-wrapper">
        <div className="game-card">
          <div className="game-header">
            <div className="game-progress">
              Round {currentRound + 1} | Trial {currentTrial + 1}/{ROUNDS_CONFIG[currentRound].trials}
            </div>
            <div className="game-timer">
              <FiClock /> {timeLeft}s
            </div>
          </div>
          
          <div className="game-content" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Complete the Pattern</h3>
            
            {/* Show pattern sequence */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
              {patternSequence.map((item, idx) => (
                <div key={idx} style={{ padding: 8 }}>
                  {renderShape(item.shape, item.color)}
                </div>
              ))}
              <div style={{ padding: 8, display: 'flex', alignItems: 'center', fontSize: 32, color: '#666' }}>
                ?
              </div>
            </div>
            
            {/* Choice options */}
            {!showFeedback && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                {choices.map((choice, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handlePatternCompletion(choice)}
                    style={{
                      padding: 16,
                      border: '2px solid #e5e7eb',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    {renderShape(choice.shape, choice.color)}
                  </div>
                ))}
              </div>
            )}
            
            {/* Feedback */}
            {showFeedback && (
              <div style={{ textAlign: 'center' }}>
                {isCorrect ? (
                  <div style={{ color: '#10b981', fontSize: 24, fontWeight: 600 }}>
                    <FiCheck style={{ display: 'inline', marginRight: 8 }} />
                    Correct!
                  </div>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: 24, fontWeight: 600 }}>
                    <FiX style={{ display: 'inline', marginRight: 8 }} />
                    Incorrect
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Round 2: Pattern vs Novelty Choice
  if (gamePhase === 'round_active' && currentRound === 1) {
    return (
      <div className="game-wrapper">
        <div className="game-card">
          <div className="game-header">
            <div className="game-progress">
              Round {currentRound + 1} | Trial {currentTrial + 1}/{ROUNDS_CONFIG[currentRound].trials}
            </div>
            <div className="game-timer">
              <FiClock /> {timeLeft}s
            </div>
          </div>
          
          <div className="game-content" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 24, textAlign: 'center' }}>Which panel do you prefer?</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {choices.map((panel, panelIdx) => (
                <div
                  key={panelIdx}
                  onClick={() => handlePanelChoice(panel.type)}
                  style={{
                    border: '3px solid #e5e7eb',
                    borderRadius: 16,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginBottom: 12
                  }}>
                    {panel.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {renderShape(item.shape, item.color, 40)}
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', color: '#666', fontSize: 14, textTransform: 'capitalize' }}>
                    {panel.type === 'pattern' ? 'Panel A' : 'Panel B'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Round 3: Rule Switching Test
  if (gamePhase === 'round_active' && currentRound === 2) {
    const target = patternSequence[0];
    const currentRule = currentRuleRef.current;
    
    return (
      <div className="game-wrapper">
        <div className="game-card">
          <div className="game-header">
            <div className="game-progress">
              Round {currentRound + 1} | Trial {currentTrial + 1}/{ROUNDS_CONFIG[currentRound].trials}
            </div>
            <div className="game-timer">
              <FiClock /> {timeLeft}s
            </div>
          </div>
          
          <div className="game-content" style={{ padding: 24 }}>
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <div style={{
                display: 'inline-block',
                background: '#6366f1',
                color: '#fff',
                padding: '8px 24px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 18,
                textTransform: 'uppercase'
              }}>
                Match by: {currentRule}
              </div>
            </div>
            
            <h3 style={{ marginBottom: 16, textAlign: 'center' }}>Find the matching item</h3>
            
            {/* Target */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
              <div style={{ padding: 16, border: '3px dashed #6366f1', borderRadius: 12 }}>
                {renderShape(target.shape, target.color, 80)}
              </div>
            </div>
            
            {/* Choices */}
            {!showFeedback && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                {choices.map((choice, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleRuleSwitchChoice(choice)}
                    style={{
                      padding: 16,
                      border: '2px solid #e5e7eb',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    {renderShape(choice.shape, choice.color)}
                  </div>
                ))}
              </div>
            )}
            
            {/* Feedback */}
            {showFeedback && (
              <div style={{ textAlign: 'center' }}>
                {isCorrect ? (
                  <div style={{ color: '#10b981', fontSize: 24, fontWeight: 600 }}>
                    <FiCheck style={{ display: 'inline', marginRight: 8 }} />
                    Correct!
                  </div>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: 24, fontWeight: 600 }}>
                    <FiX style={{ display: 'inline', marginRight: 8 }} />
                    Incorrect
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Round 4: Repetitive Selection Test
  if (gamePhase === 'round_active' && currentRound === 3) {
    return (
      <div className="game-wrapper">
        <div className="game-card">
          <div className="game-header">
            <div className="game-progress">
              Round {currentRound + 1} | Selections: {selectedItems.length}/{ROUNDS_CONFIG[currentRound].trials}
            </div>
            <div className="game-timer">
              <FiClock /> {timeLeft}s
            </div>
          </div>
          
          <div className="game-content" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 24, textAlign: 'center' }}>Click any items you like</h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              maxWidth: 500,
              margin: '0 auto'
            }}>
              {choices.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleGridSelection(item)}
                  style={{
                    padding: 16,
                    border: '2px solid #e5e7eb',
                    borderRadius: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    minHeight: 80
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  {renderShape(item.shape, item.color, 45)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render final results
  if (gamePhase === 'final_results') {
    const data = sessionDataRef.current;
    
    // Calculate metrics
    const patternChoices = data.round2.filter(r => r.preferredPattern).length;
    const patternChoiceRatio = patternChoices / (data.round2.length || 1);
    
    let repetitiveSelections = 0;
    for (let i = 1; i < data.round4.length; i++) {
      const prev = data.round4[i - 1].selection;
      const curr = data.round4[i].selection;
      if (prev.shape === curr.shape || prev.color === curr.color) {
        repetitiveSelections++;
      }
    }
    const repetitiveSelectionRate = data.round4.length > 1 ? repetitiveSelections / (data.round4.length - 1) : 0;
    
    const switchTrials = data.round3.filter(r => r.wasRuleSwitch);
    const switchErrors = switchTrials.filter(r => !r.correct).length;
    const ruleSwitchErrorRate = switchTrials.length > 0 ? switchErrors / switchTrials.length : 0;
    
    const fixationScore = 
      (patternChoiceRatio * 0.4) +
      (repetitiveSelectionRate * 0.3) +
      (ruleSwitchErrorRate * 0.3);
    
    let fixationLevel, fixationColor, cognitiveFlexibility;
    if (fixationScore < 0.35) {
      fixationLevel = 'Low';
      fixationColor = '#10b981';
      cognitiveFlexibility = 'Good';
    } else if (fixationScore <= 0.65) {
      fixationLevel = 'Medium';
      fixationColor = '#f59e0b';
      cognitiveFlexibility = 'Reduced';
    } else {
      fixationLevel = 'High';
      fixationColor = '#ef4444';
      cognitiveFlexibility = 'Reduced';
    }
    
    return (
      <div className="game-wrapper">
        <div className="game-card">
          <div className="results-screen" style={{ padding: 24 }}>
            <FiActivity size={56} color="#6366f1" style={{ marginBottom: 16 }} />
            <h2 style={{ marginBottom: 8 }}>Pattern Fixation Result</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Cognitive-Behavioral Assessment Complete</p>
            
            {/* Primary Result */}
            <div style={{
              background: fixationColor,
              color: '#fff',
              padding: '24px',
              borderRadius: 16,
              marginBottom: 32,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Fixation Level</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{fixationLevel}</div>
              <div style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>
                Fixation Score: {(fixationScore * 100).toFixed(0)}%
              </div>
            </div>
            
            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
              <MetricBox
                label="Pattern Bias"
                value={`${Math.round(patternChoiceRatio * 100)}%`}
                color={patternChoiceRatio > 0.6 ? '#ef4444' : patternChoiceRatio > 0.4 ? '#f59e0b' : '#10b981'}
              />
              <MetricBox
                label="Cognitive Flexibility"
                value={cognitiveFlexibility}
                color={cognitiveFlexibility === 'Good' ? '#10b981' : '#f59e0b'}
              />
              <MetricBox
                label="Repetitive Rate"
                value={`${Math.round(repetitiveSelectionRate * 100)}%`}
                color={repetitiveSelectionRate > 0.5 ? '#ef4444' : '#f59e0b'}
              />
              <MetricBox
                label="Switch Error Rate"
                value={`${Math.round(ruleSwitchErrorRate * 100)}%`}
                color={ruleSwitchErrorRate > 0.4 ? '#ef4444' : ruleSwitchErrorRate > 0.2 ? '#f59e0b' : '#10b981'}
              />
            </div>
            
            {/* Clinical Interpretation */}
            <div style={{
              background: '#f3f4f6',
              padding: 20,
              borderRadius: 12,
              textAlign: 'left'
            }}>
              <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                <FiAlertCircle style={{ marginRight: 8 }} />
                Clinical Interpretation
              </h4>
              <p style={{ color: '#666', lineHeight: 1.6, fontSize: 14 }}>
                {fixationLevel === 'Low' && 'Shows typical pattern exploration behavior with good cognitive flexibility. No significant repetitive interest patterns detected.'}
                {fixationLevel === 'Medium' && 'Shows some preference for repetitive patterns with moderate cognitive flexibility. May benefit from activities that encourage varied exploration.'}
                {fixationLevel === 'High' && 'Shows strong preference for repetitive patterns with reduced cognitive flexibility. Consider further clinical evaluation for restricted and repetitive behavior patterns.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const MetricBox = ({ label, value, color }) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 16,
    textAlign: 'center'
  }}>
    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
  </div>
);

export default PatternFixationGame;
