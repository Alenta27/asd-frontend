import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import './SocialResponseGame.css';

const GAME_SCENARIOS = [
  {
    id: 1,
    type: 'emotion',
    stimulus: '😊',
    question: 'What emotion is this?',
    options: ['Happy', 'Sad', 'Angry', 'Neutral'],
    correctAnswer: 'Happy'
  },
  {
    id: 2,
    type: 'emotion',
    stimulus: '😢',
    question: 'What emotion is this?',
    options: ['Happy', 'Sad', 'Angry', 'Neutral'],
    correctAnswer: 'Sad'
  },
  {
    id: 3,
    type: 'emotion',
    stimulus: '😠',
    question: 'What emotion is this?',
    options: ['Happy', 'Sad', 'Angry', 'Neutral'],
    correctAnswer: 'Angry'
  },
  {
    id: 4,
    type: 'emotion',
    stimulus: '😐',
    question: 'What emotion is this?',
    options: ['Happy', 'Sad', 'Angry', 'Neutral'],
    correctAnswer: 'Neutral'
  },
  {
    id: 5,
    type: 'emotion',
    stimulus: '😲',
    question: 'What emotion is this?',
    options: ['Surprised', 'Confused', 'Sad', 'Angry'],
    correctAnswer: 'Surprised'
  },
  {
    id: 6,
    type: 'emotion',
    stimulus: '😕',
    question: 'What emotion is this?',
    options: ['Surprised', 'Confused', 'Happy', 'Angry'],
    correctAnswer: 'Confused'
  },
  {
    id: 7,
    type: 'social',
    stimulus: 'Someone is waving at you from across the room.',
    question: 'What would you do?',
    options: ['Wave back', 'Look away', 'Run away', 'Stay still'],
    correctAnswer: 'Wave back'
  },
  {
    id: 8,
    type: 'social',
    stimulus: 'A classmate asks you to play at recess.',
    question: 'What would you do?',
    options: ['Say yes and join', 'Say no and ignore', 'Run away', 'Stay silent'],
    correctAnswer: 'Say yes and join'
  },
];

export default function SocialResponseGame() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [gameData, setGameData] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [scenarioDisplayTime, setScenarioDisplayTime] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scenarioRefTime = useRef(null);
  const gameStartTimeRef = useRef(null);

  const currentScenario = GAME_SCENARIOS[currentScenarioIndex];

  const startGame = () => {
    setGameStarted(true);
    const now = Date.now();
    scenarioRefTime.current = now;
    gameStartTimeRef.current = now;
    setScenarioDisplayTime(now);
  };

  const handleAnswerSelect = (answer) => {
    if (selectedAnswer) return;

    const reactionTime = (Date.now() - scenarioRefTime.current) / 1000;
    const isCorrect = answer === currentScenario.correctAnswer;
    const timestampMs = Date.now();

    setGameData([
      ...gameData,
      {
        scenarioId: currentScenario.id,
        scenarioType: currentScenario.type,
        question: currentScenario.question,
        userAnswer: answer,
        correctAnswer: currentScenario.correctAnswer,
        isCorrect,
        reactionTime,
        timestamp: new Date().toISOString(),
        timestampMs
      }
    ]);

    setSelectedAnswer(answer);

    setTimeout(() => {
      if (currentScenarioIndex < GAME_SCENARIOS.length - 1) {
        setCurrentScenarioIndex(currentScenarioIndex + 1);
        setSelectedAnswer(null);
        scenarioRefTime.current = Date.now();
      } else {
        submitGameData([...gameData, {
          scenarioId: currentScenario.id,
          scenarioType: currentScenario.type,
          question: currentScenario.question,
          userAnswer: answer,
          correctAnswer: currentScenario.correctAnswer,
          isCorrect,
          reactionTime,
          timestamp: new Date().toISOString(),
          timestampMs
        }]);
      }
    }, 1000);
  };

  const submitGameData = async (finalData) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const totalTime = (finalData[finalData.length - 1].timestampMs - finalData[0].timestampMs) / 1000;
      
      const payload = {
        studentId: studentId,
        gameResults: finalData,
        completedAt: new Date().toISOString(),
        totalTime: totalTime
      };

      console.log('Submitting game data:', payload);

      const response = await fetch('http://localhost:5000/api/teacher/social-response-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        navigate(`/teacher/students/${studentId}`, { 
          state: { 
            gameResultId: data.resultId,
            showGameResults: true 
          }
        });
      } else {
        alert(`Failed to submit game data: ${data.error || data.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error submitting game data:', error);
      alert('Error submitting game data: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const completionPercentage = ((currentScenarioIndex + 1) / GAME_SCENARIOS.length) * 100;
  const accuracy = gameData.length > 0 
    ? ((gameData.filter(d => d.isCorrect).length / gameData.length) * 100).toFixed(1)
    : 0;
  const avgReactionTime = gameData.length > 0
    ? (gameData.reduce((sum, d) => sum + d.reactionTime, 0) / gameData.length).toFixed(2)
    : 0;

  return (
    <div className="social-response-game">
      <div className="game-header">
        <button className="back-btn" onClick={() => navigate(`/teacher/students/${studentId}`)}>
          <FaArrowLeft /> Back to Student
        </button>
        <h1>Social Response Game</h1>
        <div className="game-stats-header">
          <span>{completionPercentage.toFixed(0)}% Complete</span>
        </div>
      </div>

      <div className="game-container">
        {!gameStarted ? (
          <div className="game-welcome">
            <h2>Social Response Game</h2>
            <p>Test your social awareness and emotional recognition skills!</p>
            <div className="game-info">
              <h3>How it works:</h3>
              <ul>
                <li>You will see {GAME_SCENARIOS.length} scenarios with emotional or social situations</li>
                <li>Choose the best response for each scenario</li>
                <li>Your reaction time and accuracy will be measured</li>
                <li>Results will help understand social response patterns</li>
              </ul>
            </div>
            <button className="start-game-btn" onClick={startGame}>
              Start Game
            </button>
          </div>
        ) : (
          <div className="game-play">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${completionPercentage}%` }}></div>
            </div>

            <div className="scenario-counter">
              Question {currentScenarioIndex + 1} of {GAME_SCENARIOS.length}
            </div>

            <div className="scenario-card">
              <div className="scenario-stimulus">
                {currentScenario.type === 'emotion' ? (
                  <div className="emoji-stimulus">{currentScenario.stimulus}</div>
                ) : (
                  <div className="text-stimulus">{currentScenario.stimulus}</div>
                )}
              </div>

              <h2 className="scenario-question">{currentScenario.question}</h2>

              <div className="options-grid">
                {currentScenario.options.map((option, idx) => (
                  <button
                    key={idx}
                    className={`option-btn ${selectedAnswer === option ? (option === currentScenario.correctAnswer ? 'correct' : 'incorrect') : ''} ${selectedAnswer && option === currentScenario.correctAnswer ? 'correct-highlight' : ''}`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={selectedAnswer !== null}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {selectedAnswer && (
                <div className={`feedback ${selectedAnswer === currentScenario.correctAnswer ? 'correct-feedback' : 'incorrect-feedback'}`}>
                  {selectedAnswer === currentScenario.correctAnswer 
                    ? '✓ Correct!' 
                    : `✗ Incorrect. The correct answer is: ${currentScenario.correctAnswer}`
                  }
                </div>
              )}
            </div>

            <div className="game-stats-live">
              <div className="stat">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">{accuracy}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">Avg Reaction Time</span>
                <span className="stat-value">{avgReactionTime}s</span>
              </div>
              <div className="stat">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{currentScenarioIndex}/{GAME_SCENARIOS.length}</span>
              </div>
            </div>
          </div>
        )}

        {submitting && (
          <div className="submitting-overlay">
            <div className="submitting-content">
              <FaSpinner className="spinner" />
              <p>Submitting results...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
