import React, { useState, useMemo } from 'react';
import { FaChevronRight, FaChevronLeft, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const screeningTools = {
  'M-CHAT-R/F': {
    title: 'M-CHAT-R/F (Modified Checklist for Autism in Toddlers)',
    ageRange: '16–30 months',
    questions: [
      { id: 1, text: "If you point at something across the room, does your child look at it? (e.g., if you point at a toy or an animal, does your child look at the toy or animal?)", type: 'yes_no', failIf: 'No' },
      { id: 2, text: "Have you ever wondered if your child might be deaf?", type: 'yes_no', failIf: 'Yes' },
      { id: 3, text: "Does your child play pretend or make-believe? (e.g., pretend to drink from an empty cup, pretend to talk on a phone, or pretend to feed a doll or stuffed animal?)", type: 'yes_no', failIf: 'No' },
      { id: 4, text: "Does your child like climbing on things? (e.g., furniture, playground equipment, or stairs)", type: 'yes_no', failIf: 'No' },
      { id: 5, text: "Does your child make unusual finger movements near his or her eyes? (e.g., does your child wiggle his or her fingers close to his or her eyes?)", type: 'yes_no', failIf: 'Yes' },
      { id: 6, text: "Does your child point with one finger to ask for something or to get help? (e.g., pointing to a snack or toy that is out of reach)", type: 'yes_no', failIf: 'No' },
      { id: 7, text: "Does your child point with one finger to show you something interesting? (e.g., pointing to an airplane in the sky or a big truck in the road)", type: 'yes_no', failIf: 'No' },
      { id: 8, text: "Is your child interested in other children? (e.g., does your child watch other children, smile at them, or go to them?)", type: 'yes_no', failIf: 'No' },
      { id: 9, text: "Does your child show you things by bringing them to you or holding them up for you to see – not to get help, but just to share? (e.g., showing you a flower, a stuffed animal, or a toy truck)", type: 'yes_no', failIf: 'No' },
      { id: 10, text: "Does your child respond when you call his or her name? (e.g., does he or she look up, talk or babble, or stop what he or she is doing when you call his or her name?)", type: 'yes_no', failIf: 'No' }
    ],
    getResults: (score) => {
      if (score <= 2) return { riskLevel: 'Low Risk', explanation: 'Your child is at low risk for autism.', recommendation: 'Follow up at next well-child visit.' };
      if (score <= 7) return { riskLevel: 'Medium Risk', explanation: 'Your child is at medium risk for autism.', recommendation: 'Consult a developmental specialist for further evaluation.' };
      return { riskLevel: 'High Risk', explanation: 'Your child is at high risk for autism.', recommendation: 'Seek a full diagnostic evaluation immediately.' };
    }
  },
  'SACS-R': {
    title: 'SACS-R (Social Attention and Communication Surveillance)',
    ageRange: '12–60 months',
    questions: [
      { id: 1, text: "Does your child use eye contact to get your attention or to communicate?", type: 'yes_no', failIf: 'No' },
      { id: 2, text: "Does your child use pointing to show you something of interest?", type: 'yes_no', failIf: 'No' },
      { id: 3, text: "Does your child bring items to you to show you (not just for help)?", type: 'yes_no', failIf: 'No' },
      { id: 4, text: "Does your child respond to their name consistently?", type: 'yes_no', failIf: 'No' },
      { id: 5, text: "Does your child imitate your actions (e.g., waving, clapping)?", type: 'yes_no', failIf: 'No' }
    ],
    getResults: (score) => {
      if (score <= 1) return { riskLevel: 'Low Risk', explanation: 'Minimal indicators of ASD observed.', recommendation: 'Monitor development and continue routine checkups.' };
      if (score <= 3) return { riskLevel: 'Moderate Risk', explanation: 'Some indicators of ASD detected.', recommendation: 'Refer for early intervention assessment.' };
      return { riskLevel: 'High Risk', explanation: 'Significant indicators of ASD detected.', recommendation: 'Urgent pediatric developmental consultation recommended.' };
    }
  },
  'SCSQ': {
    title: 'SCSQ (Social Challenges Screening Questionnaire)',
    ageRange: 'School Age (6–15 years)',
    questions: [
      { id: 1, text: "Does your child have difficulty initiating conversations with peers?", type: 'yes_no', failIf: 'Yes' },
      { id: 2, text: "Does your child find it hard to understand social rules (e.g., taking turns in conversation)?", type: 'yes_no', failIf: 'Yes' },
      { id: 3, text: "Does your child have intense interests that seem unusual for their age?", type: 'yes_no', failIf: 'Yes' },
      { id: 4, text: "Does your child take things very literally (difficulty with sarcasm or idioms)?", type: 'yes_no', failIf: 'Yes' },
      { id: 5, text: "Does your child struggle to make or keep friends?", type: 'yes_no', failIf: 'Yes' }
    ],
    getResults: (score) => {
      if (score <= 1) return { riskLevel: 'Low Risk', explanation: 'Social skills appear within typical range for age.', recommendation: 'Continue to support social development.' };
      if (score <= 3) return { riskLevel: 'Medium Risk', explanation: 'Noticeable social challenges detected.', recommendation: 'Consider social skills training or school counselor consultation.' };
      return { riskLevel: 'High Risk', explanation: 'Significant social and communication challenges.', recommendation: 'Clinical assessment for ASD or social communication disorder recommended.' };
    }
  },
  'AQ Test': {
    title: 'Autism Spectrum Quotient (AQ-10)',
    ageRange: 'Adolescents/Adults (16+ years)',
    questions: [
      { id: 1, text: "I often notice small sounds when others do not.", type: 'likert', options: ['Definitely Agree', 'Slightly Agree', 'Slightly Disagree', 'Definitely Disagree'], scoreIf: ['Definitely Agree', 'Slightly Agree'] },
      { id: 2, text: "When I’m reading a story, I find it difficult to work out the characters’ intentions.", type: 'likert', options: ['Definitely Agree', 'Slightly Agree', 'Slightly Disagree', 'Definitely Disagree'], scoreIf: ['Definitely Agree', 'Slightly Agree'] },
      { id: 3, text: "I find it easy to ‘read between the lines’ when someone is talking to me.", type: 'likert', options: ['Definitely Agree', 'Slightly Agree', 'Slightly Disagree', 'Definitely Disagree'], scoreIf: ['Slightly Disagree', 'Definitely Disagree'] },
      { id: 4, text: "I find it easy to do more than one thing at once.", type: 'likert', options: ['Definitely Agree', 'Slightly Agree', 'Slightly Disagree', 'Definitely Disagree'], scoreIf: ['Slightly Disagree', 'Definitely Disagree'] },
      { id: 5, text: "If there is an interruption, I can switch back to what I was doing very quickly.", type: 'likert', options: ['Definitely Agree', 'Slightly Agree', 'Slightly Disagree', 'Definitely Disagree'], scoreIf: ['Slightly Disagree', 'Definitely Disagree'] }
    ],
    getResults: (score) => {
      if (score <= 2) return { riskLevel: 'Low Risk', explanation: 'Few autistic traits identified.', recommendation: 'No further action needed unless specific concerns arise.' };
      if (score <= 4) return { riskLevel: 'Medium Risk', explanation: 'Moderate number of autistic traits identified.', recommendation: 'Review traits with a primary care physician.' };
      return { riskLevel: 'High Risk', explanation: 'High number of autistic traits identified.', recommendation: 'Refer for full diagnostic assessment.' };
    }
  }
};

const ScreeningQuestionnaire = ({ type, childName, onSubmit }) => {
  const tool = screeningTools[type] || screeningTools['M-CHAT-R/F'];
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const totalSteps = tool.questions.length;

  const handleOptionSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    tool.questions.forEach(q => {
      const answer = answers[q.id];
      if (q.type === 'yes_no') {
        if (answer === q.failIf) score += 1;
      } else if (q.type === 'likert') {
        if (q.scoreIf.includes(answer)) score += 1;
      }
    });
    return score;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const score = calculateScore();
    const results = tool.getResults(score);
    onSubmit({
      answers,
      score,
      riskLevel: results.riskLevel,
      explanation: results.explanation,
      recommendation: results.recommendation
    });
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentQuestion = tool.questions[currentStep];
  const isAnswered = answers[currentQuestion.id] !== undefined;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-indigo-600 px-8 py-4 text-white">
        <h2 className="text-xl font-bold">{tool.title}</h2>
        <div className="flex items-center mt-2">
          <div className="flex-1 bg-indigo-400 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="ml-4 text-sm font-medium">Question {currentStep + 1} of {totalSteps}</span>
        </div>
      </div>

      <div className="p-8 md:p-12">
        <div className="min-h-[250px] flex flex-col justify-center">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
            <p className="text-blue-800 text-lg font-medium leading-relaxed">
              {currentQuestion.text.replace('your child', childName)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.type === 'yes_no' ? (
              ['Yes', 'No'].map(option => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(currentQuestion.id, option)}
                  className={`px-8 py-4 text-lg font-bold rounded-xl transition-all duration-200 border-2 ${
                    answers[currentQuestion.id] === option 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {option}
                </button>
              ))
            ) : (
              currentQuestion.options.map(option => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(currentQuestion.id, option)}
                  className={`px-8 py-4 text-lg font-bold rounded-xl transition-all duration-200 border-2 ${
                    answers[currentQuestion.id] === option 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t pt-8">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center px-6 py-2 rounded-lg font-semibold transition ${
              currentStep === 0 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaChevronLeft className="mr-2" /> Previous
          </button>

          {currentStep === totalSteps - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!isAnswered}
              className={`flex items-center px-10 py-3 bg-green-600 text-white rounded-lg font-bold text-lg transition shadow-lg ${
                !isAnswered ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
              }`}
            >
              Submit Results <FaCheckCircle className="ml-2" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className={`flex items-center px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold transition shadow-lg ${
                !isAnswered ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
              }`}
            >
              Next <FaChevronRight className="ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreeningQuestionnaire;
