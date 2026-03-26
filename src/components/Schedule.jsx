import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const SESSION_TYPES = ['Therapy', 'Assessment'];

const Schedule = () => {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('Therapy');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teacher/students`, { headers });
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
      const response = await fetch(`${API_BASE_URL}/api/schedule`, { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load schedule');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      await Promise.all([fetchStudents(), fetchSessions()]);
      setLoading(false);
    };

    load();
  }, []);

  const getStudentName = (session) => {
    const id = session.student_id || session.studentId || '';
    const student = students.find((s) => (s._id || s.id || '') === id);
    return student?.name || 'Unknown Student';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!studentId || !date || !type) {
      setError('Please fill all fields.');
      return;
    }

    const payload = {
      student_id: studentId,
      date,
      type
    };

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/schedule`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to add session');
      }

      setDate('');
      setType('Therapy');
      await fetchSessions();
    } catch (err) {
      setError(err.message || 'Unable to add session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ marginBottom: '12px' }}>Schedule</h2>

      {error && (
        <div
          style={{
            marginBottom: '12px',
            color: '#991b1b',
            background: '#fee2e2',
            borderRadius: '6px',
            padding: '10px'
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
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              required
            />
          </label>

          <label>
            Session Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              required
            >
              {SESSION_TYPES.map((sessionType) => (
                <option key={sessionType} value={sessionType}>
                  {sessionType}
                </option>
              ))}
            </select>
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
            {saving ? 'Adding...' : 'Add Session'}
          </button>
        </div>
      </form>

      <h3 style={{ marginBottom: '10px' }}>Scheduled Sessions</h3>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '520px',
            border: '1px solid #e5e7eb'
          }}
        >
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Student</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '12px', color: '#6b7280' }}>
                  {loading ? 'Loading schedule...' : 'No sessions scheduled'}
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const id = session._id || `${session.student_id}-${session.date}-${session.type}`;
                return (
                  <tr key={id}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{getStudentName(session)}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                      {session.date ? new Date(session.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{session.type || 'N/A'}</td>
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

export default Schedule;
