import React, { useState } from 'react';
import './GameStyles.css';

const STORIES = [
  {
    id: 1,
    text: "Maya is playing with a toy. Her friend Sam wants to play too. Sam says 'Can I have a turn?'",
    question: "How does Sam feel?",
    options: ["Excited to play", "Angry at Maya", "Sad", "Sleepy"],
    correct: "Excited to play"
  },
  {
    id: 2,
    text: "Leo accidentally trips and falls down. His classmates start laughing.",
    question: "How does Leo likely feel?",
    options: ["Happy", "Embarrassed", "Proud", "Funny"],
    correct: "Embarrassed"
  }
];

const StoryUnderstandingGame = ({ studentId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionClick = (option) => {
    const isCorrect = option === STORIES[currentStep].correct;
    setSelectedOption(option);
    
    const newResults = [...results, { storyId: STORIES[currentStep].id, isCorrect }];
    setResults(newResults);

    setTimeout(() => {
      if (currentStep < STORIES.length - 1) {
        setCurrentStep(prev => prev + 1);
        setSelectedOption(null);
      } else {
        finishGame(newResults);
      }
    }, 1500);
  };

  const finishGame = (finalResults) => {
    const accuracy = (finalResults.filter(r => r.isCorrect).length / finalResults.length) * 100;

    const assessmentData = {
      studentId,
      assessmentType: 'story-understanding',
      score: Math.round(accuracy),
      metrics: {
        socialResponseCorrectness: Math.round(accuracy)
      },
      indicators: [
        {
          label: 'Theory of Mind',
          status: accuracy > 75 ? 'Strong' : accuracy > 40 ? 'Developing' : 'Limited',
          color: accuracy > 75 ? '#10b981' : accuracy > 40 ? '#f59e0b' : '#ef4444'
        },
        {
          label: 'Social Context',
          status: accuracy > 50 ? 'Understands' : 'Needs Support',
          color: accuracy > 50 ? '#10b981' : '#ef4444'
        }
      ],
      rawGameData: finalResults
    };

    onComplete(assessmentData);
  };

  return (
    <div className="game-wrapper">
      <div className="game-card">
        <div className="game-progress">Story {currentStep + 1} of {STORIES.length}</div>
        
        <div className="story-content">
          <div className="story-text-box">
            <p>{STORIES[currentStep].text}</p>
          </div>
          <h3 className="game-question">{STORIES[currentStep].question}</h3>
          
          <div className="options-grid">
            {STORIES[currentStep].options.map((option, idx) => (
              <button
                key={idx}
                className={`option-button ${selectedOption === option ? (option === STORIES[currentStep].correct ? 'correct' : 'incorrect') : ''}`}
                onClick={() => handleOptionClick(option)}
                disabled={selectedOption !== null}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryUnderstandingGame;
