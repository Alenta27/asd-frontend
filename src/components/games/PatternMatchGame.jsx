import React, { useState, useEffect } from 'react';

const PatternMatchGame = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState('instructions');
  const [pattern, setPattern] = useState([]);
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const shapes = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐', '🔺', '⬛', '⬜'];

  const generatePattern = () => {
    const patternLength = 3 + level;
    const newPattern = [];
    
    // Create a simple repeating pattern
    const basePattern = shapes.slice(0, 2 + Math.floor(level / 2));
    for (let i = 0; i < patternLength; i++) {
      newPattern.push(basePattern[i % basePattern.length]);
    }
    
    // Next item in sequence
    const answer = basePattern[patternLength % basePattern.length];
    
    // Generate wrong options
    const wrongOptions = shapes
      .filter(s => s !== answer)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    const allOptions = [answer, ...wrongOptions].sort(() => 0.5 - Math.random());
    
    setPattern(newPattern);
    setCorrectAnswer(answer);
    setOptions(allOptions);
  };

  const startGame = () => {
    generatePattern();
    setGameState('playing');
    setStartTime(Date.now());
  };

  const handleOptionClick = (option) => {
    const endTime = Date.now();
    const reactionTime = (endTime - startTime) / 1000;
    setReactionTimes([...reactionTimes, reactionTime]);
    
    setAttempts(attempts + 1);
    
    if (option === correctAnswer) {
      setScore(score + level * 15);
      
      if (level < 5) {
        setLevel(level + 1);
        setTimeout(() => {
          generatePattern();
          setStartTime(Date.now());
        }, 1000);
      } else {
        setTimeout(showResults, 1000);
      }
    } else {
      setMistakes(mistakes + 1);
      if (attempts < 9) {
        setFeedbackMessage('❌ Not quite! Look at the pattern again.');
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          setTimeout(() => {
            generatePattern();
            setStartTime(Date.now());
          }, 500);
        }, 1500);
      } else {
        showResults();
      }
    }
  };

  const showResults = () => {
    setGameState('results');
    
    const totalAttempts = attempts + 1;
    const accuracy = ((totalAttempts - mistakes) / totalAttempts) * 100;
    const avgReactionTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const completionTime = (Date.now() - startTime) / 1000;
    
    const attentionScore = (accuracy * 0.6) + ((100 - Math.min(avgReactionTime * 10, 100)) * 0.4);
    
    let attentionLevel = 'Low';
    if (attentionScore >= 80) attentionLevel = 'High';
    else if (attentionScore >= 60) attentionLevel = 'Moderate';
    
    const results = {
      gameName: 'Pattern Match',
      score,
      accuracy: Math.round(accuracy),
      reactionTime: avgReactionTime.toFixed(2),
      completionTime: completionTime.toFixed(2),
      mistakes,
      attentionScore: Math.round(attentionScore),
      attentionLevel
    };
    
    setTimeout(() => {
      onComplete(results);
    }, 3000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-pink-200 p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
        {gameState === 'instructions' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-pink-700 mb-6">Pattern Match</h2>
            <div className="text-left bg-pink-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Play:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Look at the pattern of shapes displayed</li>
                <li>• Identify the repeating sequence</li>
                <li>• Choose the shape that comes next</li>
                <li>• Complete 5 levels with increasingly complex patterns</li>
                <li>• Pay attention to the order!</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded-xl text-xl font-bold hover:from-pink-600 hover:to-pink-800 transition shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="text-center">
            {showFeedback && (
              <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded-lg animate-bounce">
                <p className="text-red-700 font-semibold">{feedbackMessage}</p>
              </div>
            )}
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Level {level}</h3>
            <p className="text-gray-600 mb-6">What comes next in the pattern?</p>
            
            {/* Pattern Display */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 mb-8">
              <div className="flex justify-center items-center gap-4 mb-4">
                {pattern.map((shape, index) => (
                  <div key={index} className="text-6xl">
                    {shape}
                  </div>
                ))}
                <div className="text-6xl font-bold text-pink-600">?</div>
              </div>
            </div>

            {/* Options */}
            <p className="text-gray-600 mb-4">Choose the next shape:</p>
            <div className="grid grid-cols-4 gap-6 max-w-2xl mx-auto mb-8">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className="aspect-square bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl flex items-center justify-center text-6xl hover:from-pink-300 hover:to-pink-400 transition-all transform hover:scale-110 shadow-lg"
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-sm text-gray-600">Score</p>
                <p className="text-2xl font-bold text-pink-700">{score}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Level</p>
                <p className="text-2xl font-bold text-blue-700">{level}/5</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Mistakes</p>
                <p className="text-2xl font-bold text-red-700">{mistakes}</p>
              </div>
            </div>
          </div>
        )}

        {gameState === 'results' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-pink-700 mb-6">Game Complete!</h2>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Final Score</p>
                  <p className="text-3xl font-bold text-pink-700">{score}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-3xl font-bold text-green-700">
                    {Math.round(((attempts + 1 - mistakes) / (attempts + 1)) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Reaction Time</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {reactionTimes.length > 0 ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(2) : '0'}s
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mistakes</p>
                  <p className="text-2xl font-bold text-red-700">{mistakes}</p>
                </div>
              </div>
            </div>
            <p className="text-gray-600">Saving results and returning to menu...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternMatchGame;
