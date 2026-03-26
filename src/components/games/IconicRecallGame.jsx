import React, { useState, useEffect } from 'react';
import { FaApple, FaCar, FaStar, FaHeart, FaTree, FaCoffee, FaMusic, FaCrown, FaGem, FaRocket } from 'react-icons/fa';

const IconicRecallGame = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState('instructions');
  const [level, setLevel] = useState(1);
  const [iconSequence, setIconSequence] = useState([]);
  const [userSelection, setUserSelection] = useState([]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const allIcons = [
    { id: 'apple', Icon: FaApple, color: 'text-red-500' },
    { id: 'car', Icon: FaCar, color: 'text-blue-500' },
    { id: 'star', Icon: FaStar, color: 'text-yellow-500' },
    { id: 'heart', Icon: FaHeart, color: 'text-pink-500' },
    { id: 'tree', Icon: FaTree, color: 'text-green-500' },
    { id: 'coffee', Icon: FaCoffee, color: 'text-amber-700' },
    { id: 'music', Icon: FaMusic, color: 'text-purple-500' },
    { id: 'crown', Icon: FaCrown, color: 'text-yellow-600' },
    { id: 'gem', Icon: FaGem, color: 'text-cyan-500' },
    { id: 'rocket', Icon: FaRocket, color: 'text-orange-500' }
  ];

  const generateIconSequence = (length) => {
    const shuffled = [...allIcons].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, length);
  };

  const startGame = () => {
    const sequence = generateIconSequence(3 + level);
    setIconSequence(sequence);
    setUserSelection([]);
    setGameState('memorize');
    if (level === 1 && !sessionStartTime) setSessionStartTime(Date.now());

    setTimeout(() => {
      setGameState('select');
      setStartTime(Date.now());
    }, 2000 + level * 500);
  };

const handleIconClick = (icon) => {
    const newSelection = [...userSelection, icon];
    setUserSelection(newSelection);

    if (newSelection.length === iconSequence.length) {
      setTimeout(() => checkAnswer(newSelection), 300);
    }
  };

  const checkAnswer = (selection) => {
    const endTime = Date.now();
    const reactionTime = (endTime - startTime) / 1000;
    const newReactionTimes = [...reactionTimes, reactionTime];
    setReactionTimes(newReactionTimes);

    const correct = selection.every((icon, idx) => icon.id === iconSequence[idx].id);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (correct) {
      setScore(score + level * 10);
      if (level < 5) {
        setLevel(level + 1);
        setTimeout(startGame, 1000);
      } else {
        showResults(newReactionTimes, newAttempts, mistakes);
      }
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newAttempts < 5) { // Fixed attempts count check
        setFeedbackMessage('❌ Incorrect! Try again.');
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          setTimeout(startGame, 500);
        }, 1500);
      } else {
        showResults(newReactionTimes, newAttempts, newMistakes);
      }
    }
  };

  const showResults = (currentReactionTimes, totalAttempts, finalMistakes) => {
    setGameState('results');

    const accuracy = ((totalAttempts - finalMistakes) / totalAttempts) * 100;
    const avgReactionTime = currentReactionTimes.reduce((a, b) => a + b, 0) / currentReactionTimes.length;
    const completionTime = (Date.now() - (sessionStartTime || startTime)) / 1000;

    const attentionScore = (accuracy * 0.6) + ((100 - Math.min(avgReactionTime * 10, 100)) * 0.4);

    let attentionLevel = 'Low';
    if (attentionScore >= 80) attentionLevel = 'High';
    else if (attentionScore >= 60) attentionLevel = 'Moderate';

    const results = {
      gameName: 'Iconic Recall',
      score,
      accuracy: Math.round(accuracy),
      reactionTime: avgReactionTime.toFixed(2),
      completionTime: completionTime.toFixed(2),
      mistakes: finalMistakes,
      reactionRounds: currentReactionTimes.map((rt, idx) => ({ round: `R${idx + 1}`, reactionTime: rt })),
      focusRounds: currentReactionTimes.map((rt, idx) => ({ round: `R${idx + 1}`, focus: Math.max(30, Math.min(100, 100 - (rt * 10))) })),
      attentionScore: Math.round(attentionScore),
      attentionLevel
    };

    setTimeout(() => {
      onComplete(results);
    }, 3000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
        {gameState === 'instructions' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-blue-700 mb-6">Iconic Recall</h2>
            <div className="text-left bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Play:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Memorize the sequence of icons shown</li>
                <li>• After they disappear, select the icons in the same order</li>
                <li>• The sequence gets longer as you progress</li>
                <li>• Complete 5 levels to finish</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl text-xl font-bold hover:from-blue-600 hover:to-blue-800 transition shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'memorize' && (
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Level {level}</h3>
            <p className="text-gray-600 mb-8">Memorize these icons in order:</p>
            <div className="flex justify-center gap-6 mb-8">
              {iconSequence.map((icon, idx) => {
                const Icon = icon.Icon;
                return (
                  <div key={idx} className="bg-gray-100 p-6 rounded-2xl">
                    <Icon className={`${icon.color}`} size={64} />
                  </div>
                );
              })}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        )}

        {gameState === 'select' && (
          <div className="text-center">
            {showFeedback && (
              <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded-lg animate-bounce">
                <p className="text-red-700 font-semibold">{feedbackMessage}</p>
              </div>
            )}
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Level {level}</h3>
            <p className="text-gray-600 mb-4">Select the icons in order:</p>
            <div className="flex justify-center gap-4 mb-6">
              {userSelection.map((icon, idx) => {
                const Icon = icon.Icon;
                return (
                  <div key={idx} className="bg-green-100 p-4 rounded-xl">
                    <Icon className={`${icon.color}`} size={48} />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
              {allIcons.map((icon) => {
                const Icon = icon.Icon;
                const isDisabled = userSelection.some(s => s.id === icon.id);
                return (
                  <button
                    key={icon.id}
                    onClick={() => !isDisabled && handleIconClick(icon)}
                    disabled={isDisabled}
                    className={`p-6 rounded-xl transition transform hover:scale-110 ${
                      isDisabled
                        ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-gray-100 hover:bg-blue-100 shadow-md'
                    }`}
                  >
                    <Icon className={`${icon.color}`} size={48} />
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 mt-6">Score: {score} | Mistakes: {mistakes}</p>
          </div>
        )}

        {gameState === 'results' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-blue-700 mb-6">Game Complete!</h2>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Final Score</p>
                  <p className="text-3xl font-bold text-blue-700">{score}</p>
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

export default IconicRecallGame;
