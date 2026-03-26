import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const StudentNotes = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/teacher/students`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setStudents(list);

      if (list.length > 0) {
        const firstStudentId = list[0]._id || list[0].id || '';
        setSelectedStudent((prev) => prev || firstStudentId);
      }
    } catch (err) {
      setError(err.message || 'Unable to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchNotes = async (studentId) => {
    if (!studentId) {
      setNotes([]);
      return;
    }

    try {
      setLoadingNotes(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/notes/${studentId}`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load notes');
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchNotes(selectedStudent);
  }, [selectedStudent]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }

    if (!note.trim()) {
      setError('Please enter a note.');
      return;
    }

    const payload = {
      student_id: selectedStudent,
      note: note.trim(),
      date: new Date().toISOString()
    };

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      setNote('');
      await fetchNotes(selectedStudent);
    } catch (err) {
      setError(err.message || 'Unable to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '760px' }}>
      <h2 style={{ marginBottom: '12px' }}>Student Notes</h2>

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

      <form onSubmit={handleSubmit} style={{ marginBottom: '18px' }}>
        <div style={{ display: 'grid', gap: '10px' }}>
          <label>
            Student
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={loadingStudents}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              required
            >
              {students.length === 0 && <option value="">No students found</option>}
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
            Note
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Write note here"
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              required
            />
          </label>

          <button
            type="submit"
            disabled={saving || loadingStudents}
            style={{
              width: 'fit-content',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '6px',
              background: '#2563eb',
              color: '#fff',
              cursor: saving || loadingStudents ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </form>

      <h3 style={{ marginBottom: '10px' }}>Notes</h3>
      {loadingNotes ? (
        <p>Loading notes...</p>
      ) : notes.length === 0 ? (
        <p>No notes available for this student.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {notes.map((item) => (
            <div
              key={item._id || `${item.student_id}-${item.date}`}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                background: '#f9fafb'
              }}
            >
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.note}</p>
              <small style={{ color: '#6b7280' }}>
                {item.date ? new Date(item.date).toLocaleString() : 'No date'}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotes;
