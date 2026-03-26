import React, { useState, useEffect } from 'react';

const SignalSwitchGame = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState('instructions');
  const [currentColor, setCurrentColor] = useState('');
  const [targetColor, setTargetColor] = useState('');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [signalShowTime, setSignalShowTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [waitingForTap, setWaitingForTap] = useState(false);
  const totalRounds = 15;

  const colors = [
    { name: 'red', bg: 'bg-red-500', hex: '#ef4444' },
    { name: 'blue', bg: 'bg-blue-500', hex: '#3b82f6' },
    { name: 'green', bg: 'bg-green-500', hex: '#22c55e' },
    { name: 'yellow', bg: 'bg-yellow-500', hex: '#eab308' }
  ];

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
    showNextSignal();
  };

  const showNextSignal = () => {
    if (round >= totalRounds) {
      showResults();
      return;
    }

    // Pick a random color for display
    const displayColor = colors[Math.floor(Math.random() * colors.length)];
    // Pick a random target color to watch for
    const target = colors[Math.floor(Math.random() * colors.length)];
    
    setCurrentColor(displayColor.name);
    setTargetColor(target.name);
    setSignalShowTime(Date.now());
    setWaitingForTap(displayColor.name === target.name);

    // Auto-advance if colors don't match after 2 seconds
    setTimeout(() => {
      if (waitingForTap && round < totalRounds) {
        setMistakes(mistakes + 1);
        setRound(round + 1);
        setWaitingForTap(false);
        setTimeout(showNextSignal, 500);
      } else if (!waitingForTap) {
        setRound(round + 1);
        setTimeout(showNextSignal, 500);
      }
    }, 2000);
  };

  const handleTap = () => {
    const reactionTime = (Date.now() - signalShowTime) / 1000;

    if (currentColor === targetColor) {
      // Correct tap
      setReactionTimes([...reactionTimes, reactionTime]);
      setScore(score + Math.max(0, 100 - Math.floor(reactionTime * 50)));
      setRound(round + 1);
      setWaitingForTap(false);
      setTimeout(showNextSignal, 500);
    } else {
      // Incorrect tap (tapped when colors didn't match)
      setMistakes(mistakes + 1);
    }
  };

  const showResults = () => {
    setGameState('results');

    const expectedTaps = totalRounds / 4; // Approximately 25% should match
    const accuracy = reactionTimes.length > 0 
      ? ((reactionTimes.length / (reactionTimes.length + mistakes)) * 100)
      : 0;
    const avgReactionTime = reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 0;
    const completionTime = (Date.now() - startTime) / 1000;

    const attentionScore = (accuracy * 0.6) + ((100 - Math.min(avgReactionTime * 20, 100)) * 0.4);

    let attentionLevel = 'Low';
    if (attentionScore >= 80) attentionLevel = 'High';
    else if (attentionScore >= 60) attentionLevel = 'Moderate';

    const results = {
      gameName: 'Signal Switch',
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

  const getCurrentColorData = () => colors.find(c => c.name === currentColor);
  const getTargetColorData = () => colors.find(c => c.name === targetColor);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-indigo-200 p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
        {gameState === 'instructions' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-indigo-700 mb-6">Signal Switch</h2>
            <div className="text-left bg-indigo-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Play:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Watch the color that appears in the center</li>
                <li>• You'll be told which color to watch for</li>
                <li>• When the displayed color matches the target color, tap the screen quickly</li>
                <li>• Don't tap if the colors don't match!</li>
                <li>• Stay focused for all 15 rounds</li>
                <li>• Faster correct taps = higher score</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl text-xl font-bold hover:from-indigo-600 hover:to-indigo-800 transition shadow-lg"
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
                <p className="text-2xl font-bold text-indigo-700">{round}/{totalRounds}</p>
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

            {/* Target Color Indicator */}
            <div className="mb-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
              <p className="text-gray-600 mb-2">Tap when you see:</p>
              <div className="flex items-center justify-center gap-3">
                <div 
                  className={`w-12 h-12 ${getTargetColorData()?.bg} rounded-full shadow-lg`}
                ></div>
                <span className="text-2xl font-bold capitalize text-gray-800">
                  {targetColor}
                </span>
              </div>
            </div>

            {/* Signal Display */}
            <div
              onClick={handleTap}
              className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl h-80 flex items-center justify-center cursor-pointer overflow-hidden shadow-2xl mb-6"
            >
              <div 
                className={`w-48 h-48 ${getCurrentColorData()?.bg} rounded-full shadow-2xl animate-pulse transition-all duration-300`}
              ></div>
            </div>

            <p className="text-lg font-semibold text-gray-700">
              {waitingForTap ? '⚡ TAP NOW! ⚡' : 'Wait...'}
            </p>
          </div>
        )}

        {gameState === 'results' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-indigo-700 mb-6">Game Complete!</h2>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Final Score</p>
                  <p className="text-3xl font-bold text-indigo-700">{score}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Correct Taps</p>
                  <p className="text-3xl font-bold text-green-700">{reactionTimes.length}</p>
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

export default SignalSwitchGame;
