import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiBarChart2,
  FiFileText,
  FiDatabase,
  FiSettings,
  FiLogOut,
  FiEdit2,
  FiTrash2,
} from 'react-icons/fi';
import './QuestionnaireBuilder.css';

const QuestionnaireBuilder = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('Home');
  const [questionnaireTitle, setQuestionnaireTitle] = useState('');
  const [assignTo, setAssignTo] = useState('Parent Dashboard');
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: 'Does your child respond when their name is called?',
      answerType: 'Yes/No',
    },
    {
      id: 2,
      text: 'Does your child make eye contact during interactions?',
      answerType: 'Yes/No',
    },
  ]);

  const handleAddQuestion = () => {
    alert('Add New Question modal would open here');
  };

  const handleEditQuestion = (id) => {
    alert(`Edit question ${id}`);
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSaveQuestionnaire = () => {
    if (!questionnaireTitle.trim()) {
      alert('Please enter a questionnaire title');
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }
    alert(
      `Questionnaire "${questionnaireTitle}" saved and assigned to ${assignTo}`
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    navigate('/login');
  };

  return (
    <div className="questionnaire-builder">
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">CX</div>
          <h1>CORTEXA</h1>
        </div>

        <div className="sidebar-nav">
          <button
            className={`nav-item ${activeNav === 'Home' ? 'active' : ''}`}
            onClick={() => setActiveNav('Home')}
          >
            <FiHome className="nav-icon" />
            Home
          </button>
          <button
            className={`nav-item ${activeNav === 'Screenings' ? 'active' : ''}`}
            onClick={() => setActiveNav('Screenings')}
          >
            <FiBarChart2 className="nav-icon" />
            Screenings
          </button>
          <button
            className={`nav-item ${activeNav === 'Reports' ? 'active' : ''}`}
            onClick={() => setActiveNav('Reports')}
          >
            <FiFileText className="nav-icon" />
            Reports
          </button>
          <button
            className={`nav-item ${activeNav === 'Dataset' ? 'active' : ''}`}
            onClick={() => setActiveNav('Dataset')}
          >
            <FiDatabase className="nav-icon" />
            Dataset
          </button>
          <button
            className={`nav-item ${activeNav === 'Settings' ? 'active' : ''}`}
            onClick={() => setActiveNav('Settings')}
          >
            <FiSettings className="nav-icon" />
            Settings
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <FiLogOut className="nav-icon" />
            Log Out
          </button>
        </div>
      </div>

      <div className="main-content">
        <h1 className="page-title">Questionnaire Builder</h1>

        <div className="settings-card">
          <div className="settings-field">
            <label htmlFor="title">Questionnaire Title</label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Parent Observational Intake"
              value={questionnaireTitle}
              onChange={(e) => setQuestionnaireTitle(e.target.value)}
              className="title-input"
            />
          </div>

          <div className="settings-field">
            <label htmlFor="assign">Assign To</label>
            <select
              id="assign"
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="assign-select"
            >
              <option>Parent Dashboard</option>
              <option>Therapist Dashboard</option>
            </select>
          </div>
        </div>

        <div className="questions-section">
          <h2 className="section-title">Questions</h2>

          {questions.length === 0 ? (
            <div className="empty-state">
              <p>No questions added yet. Click "Add New Question" to get started.</p>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map((question, index) => (
                <div key={question.id} className="question-card">
                  <div className="question-content">
                    <span className="question-number">{index + 1}.</span>
                    <div className="question-details">
                      <p className="question-text">{question.text}</p>
                      <p className="answer-type">
                        Answer Type: <strong>{question.answerType}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="question-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditQuestion(question.id)}
                      title="Edit question"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteQuestion(question.id)}
                      title="Delete question"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="add-question-btn" onClick={handleAddQuestion}>
            + Add New Question
          </button>
        </div>

        <button className="save-questionnaire-btn" onClick={handleSaveQuestionnaire}>
          Save Questionnaire
        </button>
      </div>
    </div>
  );
};

export default QuestionnaireBuilder;
