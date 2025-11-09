import React, { useState } from 'react';
import './QuestionnairePage.css';

const questions = {
  toddler: [
    {
      section: 'Social Skills',
      questions: [
        { question: 'Does your child make eye contact with you?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child smile back when you smile at them?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child respond when you call their name?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child look to you for comfort when upset?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child imitate simple actions (clapping, waving)?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
    {
      section: 'Communication',
      questions: [
        { question: 'Does your child use gestures (e.g., pointing, waving)?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child babble or use simple words?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child try to share things of interest with you?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child follow simple instructions ("give me the ball")?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child use eye contact and sound together to get attention?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
    {
      section: 'Play & Sensory',
      questions: [
        { question: 'Does your child enjoy simple pretend play (feeding a doll)?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Is your child very sensitive to certain sounds or textures?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child line up toys or focus on parts of toys?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child enjoy being swung, hugged, or tickled?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child explore toys in different ways (not only mouthing/spinning)?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
    {
      section: 'Routines & Behavior',
      questions: [
        { question: 'How does your child handle changes in routine?', options: ['Well', 'With Some Difficulty', 'Poorly'] },
        { question: 'Does your child have repetitive movements (hand flapping, rocking)?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child fixate on specific objects/activities?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Is your child easily frustrated or difficult to soothe?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child show strong preferences for specific foods or cups?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
  ],
  child: [
    {
      section: 'Social Skills',
      questions: [
        { question: 'How well does your child interact with other children?', options: ['Very Well', 'Okay', 'Not Well'] },
        { question: 'Does your child understand other people’s feelings?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child make and keep friends?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child take turns and share during play?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child join group activities without difficulty?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
    {
      section: 'Communication',
      questions: [
        { question: 'How well can your child express their needs and wants?', options: ['Very Well', 'Okay', 'Not Well'] },
        { question: 'Does your child understand jokes or sarcasm?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child follow multi-step instructions?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child stay on topic during conversations?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child interpret figurative language literally?', options: ['Rarely', 'Sometimes', 'Often'] },
      ],
    },
    {
      section: 'Daily Routines & Flexibility',
      questions: [
        { question: 'How does your child handle changes in routine?', options: ['Well', 'With Some Difficulty', 'Poorly'] },
        { question: 'Does your child have very specific interests?', options: ['Yes', 'Somewhat', 'No'] },
        { question: 'Does your child show repetitive movements or behaviors?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Is your child sensitive to noise, clothing tags, or textures?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child get upset when plans change unexpectedly?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
    {
      section: 'Attention & Learning',
      questions: [
        { question: 'Can your child concentrate on tasks appropriate for their age?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child complete homework without extensive reminders?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child organize school materials and belongings?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child remember and follow classroom rules?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Does your child manage transitions between activities?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
  ],
  adolescent: [
    {
      section: 'Social Skills',
      questions: [
        { question: 'How comfortable are you with making new friends?', options: ['Very Comfortable', 'Okay', 'Not Comfortable'] },
        { question: 'Do you find it hard to understand what others are thinking or feeling?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you prefer spending time alone rather than with peers?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Is it hard to read facial expressions or body language?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you feel anxious in social gatherings?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
    {
      section: 'Communication',
      questions: [
        { question: 'How easy is it for you to keep a conversation going?', options: ['Very Easy', 'Okay', 'Difficult'] },
        { question: 'Do you take things very literally?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you find it hard to understand jokes, irony, or sarcasm?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you talk at length about topics you love, even if others are not interested?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you find small talk challenging?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
    {
      section: 'Flexibility & Sensory',
      questions: [
        { question: 'Do you get upset when plans change unexpectedly?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Are you sensitive to noise, lights, or textures?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you have routines you like to follow exactly?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you engage in repetitive movements (tapping, rocking)?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you focus intensely on a few specific interests?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
    {
      section: 'School & Life Skills',
      questions: [
        { question: 'Is it easy for you to stay organized with assignments and deadlines?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Can you manage time well for school, hobbies, and rest?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you remember to complete tasks without repeated reminders?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you handle group projects or team tasks comfortably?', options: ['Often', 'Sometimes', 'Rarely'] },
        { question: 'Do you ask for help when you need it?', options: ['Often', 'Sometimes', 'Rarely'] },
      ],
    },
  ],
};

const QuestionnairePage = () => {
  const [ageGroup, setAgeGroup] = useState('child');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [allAnswered, setAllAnswered] = useState(false);

  const handleAnswerChange = (sectionIndex, questionIndex, answer) => {
    const newAnswers = {
      ...answers,
      [`${sectionIndex}-${questionIndex}`]: answer,
    };
    setAnswers(newAnswers);

    const totalQuestions = questions[ageGroup].reduce((acc, section) => acc + section.questions.length, 0);
    setAllAnswered(Object.keys(newAnswers).length === totalQuestions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let score = 0;
    let maxScore = 0;

    questions[ageGroup].forEach((section, sectionIndex) => {
      section.questions.forEach((q, questionIndex) => {
        const answer = answers[`${sectionIndex}-${questionIndex}`];
        if (answer) {
          const optionIndex = q.options.indexOf(answer);
          score += optionIndex;
        }
        maxScore += q.options.length - 1;
      });
    });

    const percentage = (score / maxScore) * 100;
    let prediction = 'Low likelihood of ASD characteristics';
    let confidence = 100 - percentage;

    if (percentage > 66) {
      prediction = 'High likelihood of ASD characteristics';
      confidence = percentage;
    } else if (percentage > 33) {
      prediction = 'Some ASD characteristics';
      confidence = percentage;
    }

    const result = { prediction, confidence };
    setPredictionResult(result);
    setSubmitted(true);

    // Save to reports
    const report = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      tool: 'ASD Questionnaire',
      prediction: result.prediction,
      confidence: result.confidence / 100,
      childId: null, // Or get from context/state if available
      childName: 'Unassigned',
      notes: `Completed for age group: ${ageGroup}`,
    };
    saveReport(report);
  };

  const handleTakeAnotherTest = () => {
    setSubmitted(false);
    setAnswers({});
    setPredictionResult(null);
    setAllAnswered(false);
  };

  const handleAgeGroupChange = (newAgeGroup) => {
    if (!submitted) {
      setAgeGroup(newAgeGroup);
      setAnswers({});
      setAllAnswered(false);
    }
  };

  const getReportsKey = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        return `screening_reports_${decoded.id}`;
      }
    } catch {}
    return 'screening_reports';
  };

  const saveReport = (report) => {
    try {
      const key = getReportsKey();
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(report);
      localStorage.setItem(key, JSON.stringify(list));
    } catch {}
  };

  const renderQuestions = () => {
    return questions[ageGroup].map((section, sectionIndex) => (
      <div key={sectionIndex} className="questionnaire-section">
        <h2>{section.section}</h2>
        {section.questions.map((q, questionIndex) => (
          <div key={questionIndex} className="question">
            <p>{q.question}</p>
            <div className="options">
              {q.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className={`option ${answers[`${sectionIndex}-${questionIndex}`] === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(sectionIndex, questionIndex, option)}
                >
                  <span role="img" aria-label={option}>{
                    option === 'Often' || option === 'Very Well' || option === 'Very Comfortable' || option === 'Very Easy' ? '😊' :
                    option === 'Sometimes' || option === 'Okay' ? '😐' :
                    '😕'
                  }</span>
                  <p>{option}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div className="questionnaire-container">
      <h1>ASD Detection Questionnaire</h1>
      {!submitted && (
        <div className="age-selector">
          <label>Select Age Group:</label>
          <select value={ageGroup} onChange={(e) => handleAgeGroupChange(e.target.value)}>
            <option value="toddler">Toddler (1-3 years)</option>
            <option value="child">Child (4-11 years)</option>
            <option value="adolescent">Adolescent (12-18 years)</option>
          </select>
        </div>
      )}

      {submitted ? (
        <div className="guidance">
          <h2>Screening Result</h2>
          <div className={`result-card ${predictionResult.prediction.includes('High') ? 'high-risk' : 'low-risk'}`}>
            <p className="prediction">
              {predictionResult.prediction}
            </p>
            <p className="confidence">
              Confidence: {predictionResult.confidence.toFixed(1)}%
            </p>
          </div>
          <div className="note">
            <p>
              <strong>Note:</strong> The confidence score reflects the model's certainty in it's prediction based on the patterns it has learned from the data. It is not a measure of the likelihood of having ASD.
            </p>
          </div>
          <div className="disclaimer">
            <p>
              <strong>Important:</strong> This is not a medical diagnosis. The results are intended to help you understand behavioral patterns and decide if professional support may be useful.
            </p>
            <p>
              If you have any concerns, please consult a healthcare professional for a comprehensive evaluation.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {renderQuestions()}
          <div className="submit-container">
            {!allAnswered && <p className="error-message">Please answer all questions before submitting.</p>}
            <button type="submit" disabled={!allAnswered}>Submit</button>
          </div>
        </form>
      )}
      {submitted && (
        <div className="action-buttons">
          <button onClick={handleTakeAnotherTest} className="take-another-test-btn">
            Take Another Test
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionnairePage;
