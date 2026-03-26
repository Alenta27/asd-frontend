import React, { useState, useEffect } from 'react';

const NumericShuffleGame = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState('instructions');
  const [numbers, setNumbers] = useState([]);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [levelStartTime, setLevelStartTime] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const generateNumbers = (count) => {
    const nums = Array.from({ length: count }, (_, i) => i + 1);
    return nums.sort(() => Math.random() - 0.5);
  };

  const startGame = () => {
    const count = 5 + level;
    setNumbers(generateNumbers(count));
    setGameState('playing');
    setStartTime(Date.now());
    setLevelStartTime(Date.now());
    setSelectedIndex(null);
  };

  const handleSwap = (index1, index2) => {
    const newNumbers = [...numbers];
    [newNumbers[index1], newNumbers[index2]] = [newNumbers[index2], newNumbers[index1]];
    setNumbers(newNumbers);
    setMoves(moves + 1);

    // Check if sorted
    const isSorted = newNumbers.every((num, idx) => idx === 0 || num > newNumbers[idx - 1]);
    
    if (isSorted) {
      if (level < 4) {
        setTimeout(() => {
          setLevel(level + 1);
          const count = 5 + level + 1;
          setNumbers(generateNumbers(count));
          setLevelStartTime(Date.now());
          setSelectedIndex(null);
        }, 1000);
      } else {
        setTimeout(showResults, 1000);
      }
    }
  };

  const showResults = () => {
    setGameState('results');
    
    const completionTime = (Date.now() - startTime) / 1000;
    const optimalMoves = (5 + level) * level;
    const accuracy = Math.max(0, ((optimalMoves / Math.max(moves, 1)) * 100));
    const avgReactionTime = completionTime / moves;
    
    const attentionScore = (Math.min(accuracy, 100) * 0.6) + ((100 - Math.min(moves, 100)) * 0.4);
    
    let attentionLevel = 'Low';
    if (attentionScore >= 80) attentionLevel = 'High';
    else if (attentionScore >= 60) attentionLevel = 'Moderate';
    
    const results = {
      gameName: 'Numeric Shuffle',
      score: Math.max(0, 1000 - moves * 5),
      accuracy: Math.round(Math.min(accuracy, 100)),
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 to-orange-200 p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
        {gameState === 'instructions' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-orange-700 mb-6">Numeric Shuffle</h2>
            <div className="text-left bg-orange-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Play:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Numbers are shuffled randomly</li>
                <li>• Click two numbers to swap their positions</li>
                <li>• Arrange all numbers in ascending order (1, 2, 3...)</li>
                <li>• Complete 4 levels with increasing difficulty</li>
                <li>• Use the fewest moves possible for a higher score</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-700 text-white rounded-xl text-xl font-bold hover:from-orange-600 hover:to-orange-800 transition shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Level {level}</h3>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Moves</p>
                <p className="text-2xl font-bold text-orange-700">{moves}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Level</p>
                <p className="text-2xl font-bold text-blue-700">{level}/4</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Arrange numbers in order: 1, 2, 3...</p>
            <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
              {numbers.map((num, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (selectedIndex === null || selectedIndex === undefined) {
                        setSelectedIndex(index);
                      } else {
                        handleSwap(selectedIndex, index);
                        setSelectedIndex(null);
                      }
                    }}
                    className={`num-button w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-2xl text-3xl font-bold hover:from-orange-500 hover:to-orange-700 transition-all transform hover:scale-110 shadow-lg${selectedIndex === index ? ' ring-4 ring-orange-500' : ''}`}
                  >
                    {num}
                  </button>
                ))}
            </div>
            <p className="text-sm text-gray-500 mt-6">Click two numbers to swap them</p>
          </div>
        )}

        {gameState === 'results' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-orange-700 mb-6">Game Complete!</h2>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Final Score</p>
                  <p className="text-3xl font-bold text-orange-700">{Math.max(0, 1000 - moves * 5)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Moves</p>
                  <p className="text-3xl font-bold text-blue-700">{moves}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completion Time</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {((Date.now() - startTime) / 1000).toFixed(2)}s
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Levels Completed</p>
                  <p className="text-2xl font-bold text-green-700">{level}</p>
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

export default NumericShuffleGame;
