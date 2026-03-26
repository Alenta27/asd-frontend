import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const EXERCISE_TYPES = ['Pronunciation', 'Repetition', 'Listening'];

const TherapySessions = () => {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [studentId, setStudentId] = useState('');
  const [exerciseType, setExerciseType] = useState('Pronunciation');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  const token = localStorage.getItem('token');

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teacher/students`, {
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setStudents(list);

      if (list.length > 0 && !studentId) {
        setStudentId(list[0]._id || list[0].id || '');
      }
    } catch (err) {
      setError(err.message || 'Unable to load students');
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/therapy-sessions`, {
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error('Failed to fetch therapy sessions');
      }

      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load therapy sessions');
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');
      await Promise.all([fetchStudents(), fetchSessions()]);
      setLoading(false);
    };

    loadInitialData();
  }, []);

  const getStudentName = (session) => {
    if (session.student_name) return session.student_name;
    if (session.studentName) return session.studentName;

    const sessionStudentId =
      session.student_id ||
      session.studentId ||
      session.student?._id ||
      session.student?.id ||
      '';

    const matched = students.find(
      (s) => (s._id || s.id || '') === sessionStudentId
    );

    return matched?.name || 'Unknown Student';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const numericScore = Number(score);
    if (!studentId) {
      setError('Please select a student.');
      return;
    }

    if (!exerciseType) {
      setError('Please select an exercise type.');
      return;
    }

    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      setError('Score must be between 0 and 100.');
      return;
    }

    const payload = {
      student_id: studentId,
      exercise_type: exerciseType,
      score: numericScore,
      notes,
      date: new Date().toISOString()
    };

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/therapy-sessions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save therapy session');
      }

      setScore('');
      setNotes('');
      await fetchSessions();
    } catch (err) {
      setError(err.message || 'Unable to save session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: '12px' }}>Therapy Sessions</h2>

      {error && (
        <div
          style={{
            marginBottom: '12px',
            color: '#b91c1c',
            background: '#fee2e2',
            padding: '10px',
            borderRadius: '6px'
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gap: '10px', maxWidth: '520px' }}>
          <label>
            Student
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              required
            >
              {students.length === 0 && <option value="">No students available</option>}
              {students.map((student) => {
                const id = student._id || student.id;
                return (
                  <option key={id} value={id}>
                    {student.name}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            Exercise Type
            <select
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              required
            >
              {EXERCISE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            Score (0-100)
            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              required
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              placeholder="Optional notes about the session"
            />
          </label>

          <button
            type="submit"
            disabled={saving || loading}
            style={{
              width: 'fit-content',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '6px',
              background: '#2563eb',
              color: '#ffffff',
              cursor: saving || loading ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      </form>

      <h3 style={{ marginBottom: '10px' }}>Past Sessions</h3>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '640px',
            border: '1px solid #e5e7eb'
          }}
        >
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Student Name</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Exercise</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Score</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '12px', color: '#6b7280' }}>
                  {loading ? 'Loading sessions...' : 'No sessions found'}
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const id = session._id || `${session.student_id}-${session.date}`;
                const exercise = session.exercise_type || session.exerciseType || 'N/A';
                const scoreValue = session.score ?? 'N/A';
                const dateValue = session.date ? new Date(session.date).toLocaleString() : 'N/A';

                return (
                  <tr key={id}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{getStudentName(session)}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{exercise}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{scoreValue}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{dateValue}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TherapySessions;
