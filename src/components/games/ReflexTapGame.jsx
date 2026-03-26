import React, { useState, useEffect } from 'react';

const ReflexTapGame = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState('instructions');
  const [targetVisible, setTargetVisible] = useState(false);
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [targetShowTime, setTargetShowTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const totalRounds = 10;

  const getRandomPosition = () => {
    return {
      x: Math.random() * 70 + 15, // 15% to 85%
      y: Math.random() * 70 + 15
    };
  };

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
    showNextTarget();
  };

  const showNextTarget = () => {
    if (round >= totalRounds) {
      showResults();
      return;
    }

    // Random delay before showing target (1-3 seconds)
    const delay = 1000 + Math.random() * 2000;
    
    setTimeout(() => {
      setTargetPosition(getRandomPosition());
      setTargetVisible(true);
      setTargetShowTime(Date.now());
    }, delay);
  };

  const handleTargetClick = () => {
    if (!targetVisible) return;

    const reactionTime = (Date.now() - targetShowTime) / 1000;
    setReactionTimes([...reactionTimes, reactionTime]);
    setScore(score + Math.max(0, 100 - Math.floor(reactionTime * 50)));
    setRound(round + 1);
    setTargetVisible(false);

    setTimeout(showNextTarget, 500);
  };

  const handleMissClick = () => {
    if (!targetVisible) {
      setMistakes(mistakes + 1);
    }
  };

  const showResults = () => {
    setGameState('results');

    const accuracy = ((totalRounds / (totalRounds + mistakes)) * 100);
    const avgReactionTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const completionTime = (Date.now() - startTime) / 1000;

    const attentionScore = (accuracy * 0.6) + ((100 - Math.min(avgReactionTime * 20, 100)) * 0.4);

    let attentionLevel = 'Low';
    if (attentionScore >= 80) attentionLevel = 'High';
    else if (attentionScore >= 60) attentionLevel = 'Moderate';

    const results = {
      gameName: 'Reflex Tap',
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-100 to-red-200 p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full">
        {gameState === 'instructions' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-red-700 mb-6">Reflex Tap</h2>
            <div className="text-left bg-red-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Play:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Watch the game area carefully</li>
                <li>• A target will appear at random positions</li>
                <li>• Tap/click the target as quickly as possible</li>
                <li>• Faster reactions = higher score</li>
                <li>• Don't click when there's no target (penalty!)</li>
                <li>• Complete 10 rounds</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl text-xl font-bold hover:from-red-600 hover:to-red-800 transition shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="text-center">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-gray-600">Round</p>
                <p className="text-2xl font-bold text-red-700">{round}/{totalRounds}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Score</p>
                <p className="text-2xl font-bold text-green-700">{score}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mistakes</p>
                <p className="text-2xl font-bold text-red-700">{mistakes}</p>
              </div>
            </div>

            {/* Game Area */}
            <div
              onClick={handleMissClick}
              className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl h-96 cursor-crosshair overflow-hidden shadow-inner"
            >
              {targetVisible && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTargetClick();
                  }}
                  style={{
                    position: 'absolute',
                    left: `${targetPosition.x}%`,
                    top: `${targetPosition.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full cursor-pointer animate-pulse shadow-2xl flex items-center justify-center text-white text-3xl font-bold"
                >
                  •
                </div>
              )}
              {!targetVisible && round < totalRounds && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xl">
                  Get Ready...
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-4">
              {targetVisible ? 'Tap the target!' : 'Wait for it...'}
            </p>
          </div>
        )}

        {gameState === 'results' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-red-700 mb-6">Game Complete!</h2>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Final Score</p>
                  <p className="text-3xl font-bold text-red-700">{score}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-3xl font-bold text-green-700">
                    {Math.round((totalRounds / (totalRounds + mistakes)) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Reaction Time</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {reactionTimes.length > 0 ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(3) : '0'}s
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

export default ReflexTapGame;
