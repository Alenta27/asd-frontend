import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX, FiClock } from 'react-icons/fi';
import './GameStyles.css';

const EMOTIONS = [
  { id: 1, stimulus: '😊', emotion: 'Happy' },
  { id: 2, stimulus: '😢', emotion: 'Sad' },
  { id: 3, stimulus: '😠', emotion: 'Angry' },
  { id: 4, stimulus: '😲', emotion: 'Surprised' },
  { id: 5, stimulus: '😐', emotion: 'Neutral' },
  { id: 6, stimulus: '😨', emotion: 'Scared' }
];

const EmotionMatchGame = ({ studentId, onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const options = EMOTIONS.map(e => e.emotion);

  const handleOptionClick = (option) => {
    if (selectedOption || isGameOver) return;
    
    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;
    const isCorrect = option === EMOTIONS[currentStep].emotion;
    
    setSelectedOption(option);
    
    const newResult = {
      stimulus: EMOTIONS[currentStep].emotion,
      selected: option,
      isCorrect,
      responseTime
    };
    
    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    setTimeout(() => {
      if (currentStep < EMOTIONS.length - 1) {
        setCurrentStep(currentStep + 1);
        setSelectedOption(null);
        setStartTime(Date.now());
      } else {
        finishGame(updatedResults);
      }
    }, 1000);
  };

  const finishGame = async (finalResults) => {
    setIsGameOver(true);
    const accuracy = (finalResults.filter(r => r.isCorrect).length / finalResults.length) * 100;
    const avgResponseTime = finalResults.reduce((acc, r) => acc + r.responseTime, 0) / finalResults.length;

    const assessmentData = {
      studentId,
      assessmentType: 'emotion-match',
      score: Math.round(accuracy),
      metrics: {
        accuracy: Math.round(accuracy),
        responseTime: parseFloat(avgResponseTime.toFixed(2))
      },
      indicators: [
        { 
          label: 'Emotional Recognition', 
          status: accuracy > 80 ? 'Optimal' : accuracy > 50 ? 'Moderate' : 'Needs Support',
          color: accuracy > 80 ? '#10b981' : accuracy > 50 ? '#f59e0b' : '#ef4444'
        },
        {
          label: 'Processing Speed',
          status: avgResponseTime < 1.5 ? 'Fast' : avgResponseTime < 3 ? 'Average' : 'Slow',
          color: avgResponseTime < 1.5 ? '#10b981' : avgResponseTime < 3 ? '#3b82f6' : '#f59e0b'
        }
      ],
      rawGameData: finalResults
    };

    await onComplete(assessmentData);
  };

  return (
    <div className="game-wrapper">
      <div className="game-card">
        <div className="game-progress">
          Step {currentStep + 1} of {EMOTIONS.length}
        </div>
        <div className="emotion-stimulus">
          {EMOTIONS[currentStep].stimulus}
        </div>
        <h2 className="game-question">How does this person feel?</h2>
        <div className="options-grid">
          {options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${selectedOption === option ? (option === EMOTIONS[currentStep].emotion ? 'correct' : 'incorrect') : ''}`}
              onClick={() => handleOptionClick(option)}
              disabled={selectedOption !== null}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionMatchGame;
