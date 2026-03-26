import React, { useState, useEffect } from 'react';

const OddOneOutGame = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState('instructions');
  const [items, setItems] = useState([]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const puzzles = [
    { category: 'Fruits', items: ['🍎', '🍊', '🍌', '🚗'], odd: 3 },
    { category: 'Animals', items: ['🐶', '🐱', '🐭', '🏠'], odd: 3 },
    { category: 'Shapes', items: ['⭐', '⭐', '⭐', '🔺'], odd: 3 },
    { category: 'Colors', items: ['🔴', '🔴', '🔴', '🔵'], odd: 3 },
    { category: 'Numbers', items: ['2', '4', '6', '7'], odd: 3 },
    { category: 'Vehicles', items: ['🚗', '🚕', '🚙', '🌳'], odd: 3 },
    { category: 'Sports', items: ['⚽', '🏀', '🎾', '🍕'], odd: 3 },
    { category: 'Weather', items: ['☀️', '🌤️', '⛅', '🍔'], odd: 3 },
  ];

  const generatePuzzle = () => {
    const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    const shuffled = [...puzzle.items];
    
    // Shuffle array
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      if (i === puzzle.odd) setCorrectIndex(j);
      else if (j === puzzle.odd) setCorrectIndex(i);
    }
    
    setItems(shuffled);
    setCorrectIndex(shuffled.indexOf(puzzle.items[puzzle.odd]));
  };

  const startGame = () => {
    generatePuzzle();
    setGameState('playing');
    setStartTime(Date.now());
  };

  const handleItemClick = (index) => {
    const endTime = Date.now();
    const reactionTime = (endTime - startTime) / 1000;
    setReactionTimes([...reactionTimes, reactionTime]);
    
    setAttempts(attempts + 1);
    
    if (index === correctIndex) {
      setScore(score + level * 20);
      
      if (level < 5) {
        setLevel(level + 1);
        setTimeout(() => {
          generatePuzzle();
          setStartTime(Date.now());
        }, 1000);
      } else {
        setTimeout(showResults, 1000);
      }
    } else {
      setMistakes(mistakes + 1);
      if (attempts < 9) {
        setFeedbackMessage('❌ Not quite! Try again.');
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          setTimeout(() => {
            generatePuzzle();
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
      gameName: 'Odd One Out',
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-100 to-yellow-200 p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
        {gameState === 'instructions' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-yellow-700 mb-6">Odd One Out</h2>
            <div className="text-left bg-yellow-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Play:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Look at the items displayed</li>
                <li>• Find the one that doesn't belong with the others</li>
                <li>• Click on the odd item</li>
                <li>• Complete 5 levels to finish the game</li>
                <li>• Think carefully - some are tricky!</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-700 text-white rounded-xl text-xl font-bold hover:from-yellow-600 hover:to-yellow-800 transition shadow-lg"
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
            <p className="text-gray-600 mb-8">Which one doesn't belong?</p>
            <div className="grid grid-cols-2 gap-8 max-w-xl mx-auto mb-6">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemClick(index)}
                  className="aspect-square bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-3xl flex items-center justify-center text-7xl hover:from-yellow-300 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-xl"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-sm text-gray-600">Score</p>
                <p className="text-2xl font-bold text-yellow-700">{score}</p>
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
            <h2 className="text-4xl font-bold text-yellow-700 mb-6">Game Complete!</h2>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Final Score</p>
                  <p className="text-3xl font-bold text-yellow-700">{score}</p>
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

export default OddOneOutGame;
