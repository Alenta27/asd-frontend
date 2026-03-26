import React, { useState, useEffect } from 'react';
import { BrainCircuit } from 'lucide-react';

const ChronoCodeGame = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState('instructions'); // instructions, memorize, input, results
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const generateSequence = (length) => {
    const seq = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * 10));
    }
    return seq;
  };

  const startGame = () => {
    const newSequence = generateSequence(3 + level);
    setSequence(newSequence);
    setGameState('memorize');
    if (level === 1 && !sessionStartTime) setSessionStartTime(Date.now());
    
    setTimeout(() => {
      setGameState('input');
      setStartTime(Date.now());
    }, 2000 + level * 500); // Show sequence for longer on higher levels
  };

  const handleSubmit = () => {
    const endTime = Date.now();
    const reactionTime = (endTime - startTime) / 1000;
    const newReactionTimes = [...reactionTimes, reactionTime];
    setReactionTimes(newReactionTimes);
    
    const correct = userInput === sequence.join('');
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    if (correct) {
      setScore(score + level * 10);
      if (level < 5) {
        setLevel(level + 1);
        setUserInput('');
        startGame();
      } else {
        showResults(newReactionTimes, newAttempts, mistakes);
      }
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newAttempts < 5) { // Fixed attempts check
        setFeedbackMessage('❌ Incorrect! Try again.');
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          setUserInput('');
          startGame();
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
    
    // Calculate attention score
    const attentionScore = (accuracy * 0.6) + ((100 - Math.min(avgReactionTime * 10, 100)) * 0.4);
    
    // Determine attention level
    let attentionLevel = 'Low';
    if (attentionScore >= 80) attentionLevel = 'High';
    else if (attentionScore >= 60) attentionLevel = 'Moderate';
    
    const results = {
      gameName: 'Chrono Code',
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-purple-200 p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        {gameState === 'instructions' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-purple-700 mb-6">Chrono Code</h2>
            <div className="text-left bg-purple-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Play:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• A sequence of numbers will appear on the screen</li>
                <li>• Memorize the sequence</li>
                <li>• After it disappears, type the sequence from memory</li>
                <li>• The sequence gets longer as you progress</li>
                <li>• Complete 5 levels to finish the game</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl text-xl font-bold hover:from-purple-600 hover:to-purple-800 transition shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'memorize' && (
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Level {level}</h3>
            <p className="text-gray-600 mb-8">Memorize this sequence:</p>
            <div className="text-6xl font-bold text-purple-700 mb-8 tracking-widest">
              {sequence.join(' ')}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-purple-600 h-3 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        )}

        {gameState === 'input' && (
          <div className="text-center">
            {showFeedback && (
              <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded-lg animate-bounce">
                <p className="text-red-700 font-semibold">{feedbackMessage}</p>
              </div>
            )}
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Level {level}</h3>
            <p className="text-gray-600 mb-8">Enter the sequence you memorized:</p>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="text-4xl font-bold text-center w-full border-4 border-purple-300 rounded-xl p-4 mb-6 focus:outline-none focus:border-purple-600"
              placeholder="Enter numbers..."
              autoFocus
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-800 transition shadow-lg"
              >
                Submit
              </button>
              <button
                onClick={onExit}
                className="px-8 py-3 bg-gray-300 text-gray-800 rounded-xl font-bold hover:bg-gray-400 transition"
              >
                Exit
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">Score: {score} | Mistakes: {mistakes}</p>
          </div>
        )}

        {gameState === 'results' && (
          <div className="text-center py-12">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 border-8 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">Analysis in Progress...</h2>
            <p className="text-gray-500 font-medium text-lg">
              Generating your child's cognitive attention profile and detailed analytics.
            </p>
            <div className="mt-8 flex justify-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce duration-300"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce duration-500"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce duration-700"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChronoCodeGame;
