import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUserPlus, FaSearch, FaFilter, FaEye, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const clampDateToRange = (value) => {
  const start = '2025-08-01';
  const end = '2025-10-31';
  const fallback = '2025-09-15';
  if (!value) return fallback;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback;
    const iso = value.toISOString().split('T')[0];
    if (iso < start) return start;
    if (iso > end) return end;
    return iso;
  }
  if (typeof value === 'string') {
    const normalized = value.split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return fallback;
    if (normalized < start) return start;
    if (normalized > end) return end;
    return normalized;
  }
  return fallback;
};

const getDefaultStudent = () => ({
  name: '',
  age: '',
  grade: '',
  riskLevel: 'Low',
  lastScreening: clampDateToRange('2025-09-15'),
  gender: ''
});

const TeacherStudentsPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('All');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // New student form state
  const [newStudent, setNewStudent] = useState(getDefaultStudent());
  const [editingStudentId, setEditingStudentId] = useState(null);

  const fetchStudents = useCallback(async () => {
    setFetching(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/teacher/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const mappedStudents = data.map((student, index) => ({
          id: student._id || index + 1,
          name: student.name,
          age: student.age,
          grade: student.grade || '',
          riskLevel: student.riskLevel || 'Low',
          lastScreening: clampDateToRange(student.submittedDate),
          gender: student.gender || '',
          status: 'Active',
          _id: student._id
        }));
        setStudents(mappedStudents);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setFetching(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const openAddModal = () => {
    setEditingStudentId(null);
    setNewStudent(getDefaultStudent());
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingStudentId(null);
    setNewStudent(getDefaultStudent());
  };

  const handleEditStudent = (student) => {
    setEditingStudentId(student._id || student.id);
    setNewStudent({
      name: student.name || '',
      age: student.age ? String(student.age) : '',
      grade: student.grade || '',
      riskLevel: student.riskLevel || 'Low',
      lastScreening: clampDateToRange(student.lastScreening),
      gender: student.gender || ''
    });
    setShowAddModal(true);
  };

  // Search functionality
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === '' || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.riskLevel.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRiskFilter = selectedRiskFilter === 'All' || student.riskLevel === selectedRiskFilter;
    const matchesGradeFilter = selectedGradeFilter === 'All' || student.grade === selectedGradeFilter;
    
    return matchesSearch && matchesRiskFilter && matchesGradeFilter;
  });

  const handleSaveStudent = async () => {
    if (!newStudent.name || !newStudent.age || !newStudent.grade) {
      alert('Please fill in all required fields');
      return;
    }

    const isEditing = Boolean(editingStudentId);

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: newStudent.name,
        age: parseInt(newStudent.age, 10),
        grade: newStudent.grade,
        gender: newStudent.gender,
        riskLevel: newStudent.riskLevel,
        lastScreening: clampDateToRange(newStudent.lastScreening)
      };
      const url = isEditing
        ? `http://localhost:5000/api/teacher/students/${editingStudentId}`
        : 'http://localhost:5000/api/teacher/students';
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchStudents();
        closeModal();
        alert(isEditing ? 'Student updated successfully!' : 'Student added successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to ${isEditing ? 'update' : 'add'} student: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} student:`, error);
      alert(`Error ${isEditing ? 'updating' : 'adding'} student. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    const record = students.find((s) => s.id === studentId || s._id === studentId);
    const idToUse = record?._id || studentId;
    if (!idToUse) {
      alert('Unable to determine student identifier');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/teacher/students/${idToUse}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchStudents();
        alert('Student deleted successfully!');
      } else {
        const error = await response.json();
        alert('Failed to delete student: ' + error.message);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student. Please try again.');
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/teacher" className="text-gray-600 hover:text-gray-800">
              <FaArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
              <p className="text-gray-600">Manage your students and their screening progress</p>
            </div>
          </div>
          <button 
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FaUserPlus /> Add Student
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, grade, or risk level..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Risk Level:</label>
                <select
                  value={selectedRiskFilter}
                  onChange={(e) => setSelectedRiskFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Grade:</label>
                <select
                  value={selectedGradeFilter}
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All</option>
                  <option value="1st">1st Grade</option>
                  <option value="2nd">2nd Grade</option>
                  <option value="3rd">3rd Grade</option>
                  <option value="4th">4th Grade</option>
                  <option value="5th">5th Grade</option>
                </select>
              </div>

              {(selectedRiskFilter !== 'All' || selectedGradeFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSelectedRiskFilter('All');
                    setSelectedGradeFilter('All');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Filters
            </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {fetching && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
          </div>
        )}

        {/* Students Count */}
        {!fetching && (
          <div className="mb-4 text-gray-600">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        )}

        {/* Students Grid */}
        {!fetching && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{student.name}</h3>
                  <p className="text-gray-600">Age: {student.age} • Grade: {student.grade}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(student.riskLevel)}`}>
                  {student.riskLevel} Risk
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Screening:</span>
                  <span className="text-gray-900">{student.lastScreening}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-green-600 font-medium">{student.status}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/teacher/students/${student.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <FaEye /> View Details
                </button>
                <button 
                  onClick={() => handleEditStudent(student)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteStudent(student.id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Empty State */}
        {!fetching && filteredStudents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Students Found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRiskFilter('All');
                setSelectedGradeFilter('All');
              }}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{editingStudentId ? 'Edit Student' : 'Add New Student'}</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStudent.age}
                      onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })}
                      min="1"
                      max="18"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade *
                    </label>
                    <select
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStudent.grade}
                      onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="1st">1st Grade</option>
                      <option value="2nd">2nd Grade</option>
                      <option value="3rd">3rd Grade</option>
                      <option value="4th">4th Grade</option>
                      <option value="5th">5th Grade</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Level
                    </label>
                    <select
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStudent.riskLevel}
                      onChange={(e) => setNewStudent({ ...newStudent, riskLevel: e.target.value })}
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Screening
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStudent.lastScreening}
                      onChange={(e) => setNewStudent({ ...newStudent, lastScreening: clampDateToRange(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStudent}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (editingStudentId ? 'Saving...' : 'Adding...') : editingStudentId ? 'Save Changes' : 'Add Student'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherStudentsPage;
