import React, { useState, useEffect } from 'react';

const MatchMasteryGame = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState('instructions');
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  const emojis = ['🌟', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎹'];

  const initializeGame = () => {
    const gameEmojis = emojis.slice(0, 8);
    const cardPairs = [...gameEmojis, ...gameEmojis];
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setMistakes(0);
    setStartTime(Date.now());
  };

  const startGame = () => {
    initializeGame();
    setGameState('playing');
  };

  const handleCardClick = (index) => {
    if (
      flippedIndices.length === 2 ||
      flippedIndices.includes(index) ||
      matchedPairs.includes(index)
    ) {
      return;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [firstIndex, secondIndex] = newFlipped;
      
      if (cards[firstIndex] === cards[secondIndex]) {
        setMatchedPairs([...matchedPairs, firstIndex, secondIndex]);
        setFlippedIndices([]);
        
        if (matchedPairs.length + 2 === cards.length) {
          setTimeout(showResults, 500);
        }
      } else {
        setMistakes(mistakes + 1);
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const showResults = () => {
    setGameState('results');
    
    const completionTime = (Date.now() - startTime) / 1000;
    const accuracy = ((moves - mistakes) / moves) * 100;
    const avgReactionTime = completionTime / moves;
    
    const attentionScore = (accuracy * 0.6) + ((100 - Math.min(moves * 2, 100)) * 0.4);
    
    let attentionLevel = 'Low';
    if (attentionScore >= 80) attentionLevel = 'High';
    else if (attentionScore >= 60) attentionLevel = 'Moderate';
    
    const results = {
      gameName: 'Match Mastery',
      score: Math.max(0, 1000 - moves * 10),
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-green-200 p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
        {gameState === 'instructions' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-green-700 mb-6">Match Mastery</h2>
            <div className="text-left bg-green-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Play:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Click on cards to flip them and reveal symbols</li>
                <li>• Find matching pairs of symbols</li>
                <li>• Match all pairs to complete the game</li>
                <li>• Try to complete with the fewest moves possible</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl text-xl font-bold hover:from-green-600 hover:to-green-800 transition shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Match Mastery</h3>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Moves</p>
                <p className="text-2xl font-bold text-green-700">{moves}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Matches</p>
                <p className="text-2xl font-bold text-blue-700">{matchedPairs.length / 2}/{cards.length / 2}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Mistakes</p>
                <p className="text-2xl font-bold text-red-700">{mistakes}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto">
              {cards.map((emoji, index) => {
                const isFlipped = flippedIndices.includes(index) || matchedPairs.includes(index);
                const isMatched = matchedPairs.includes(index);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleCardClick(index)}
                    className={`aspect-square rounded-2xl text-4xl font-bold transition-all transform ${
                      isMatched
                        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-95'
                        : isFlipped
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                        : 'bg-gradient-to-br from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-transparent hover:scale-105'
                    } shadow-lg`}
                  >
                    {isFlipped ? emoji : '?'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {gameState === 'results' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-green-700 mb-6">Game Complete!</h2>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Final Score</p>
                  <p className="text-3xl font-bold text-green-700">{Math.max(0, 1000 - moves * 10)}</p>
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

export default MatchMasteryGame;
