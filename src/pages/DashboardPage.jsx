import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FaUserPlus, FaUserEdit, FaTrash, FaFileMedicalAlt, FaHistory, FaGraduationCap, FaClipboardList, FaUsers, FaLightbulb, FaHeart, FaHome, FaCalendar, FaChartLine, FaFileAlt, FaUserTie, FaBook, FaCog, FaBell, FaSearch } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import SurveyInsights from '../components/SurveyInsights';

function ChildFormModal({ isOpen, onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name || '');
  const [age, setAge] = useState(initial?.age || '');
  const [gender, setGender] = useState(initial?.gender || '');
  const [history, setHistory] = useState(initial?.history || '');
  const [birthCert, setBirthCert] = useState(initial?.birthCert || null);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState({ name: '', age: '', gender: '' });
  const [touched, setTouched] = useState({ name: false, age: false, gender: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name || '');
      setAge(initial?.age || '');
      setGender(initial?.gender || '');
      setHistory(initial?.history || '');
      setBirthCert(initial?.birthCert || null);
      setFileError('');
      setErrors({ name: '', age: '', gender: '' });
      setTouched({ name: false, age: false, gender: false });
    }
  }, [isOpen, initial]);

  const validate = () => {
    const ageNum = Number(age);
    const next = {
      name: !name.trim() ? 'Name is required.' : '',
      age: age === '' || Number.isNaN(ageNum)
        ? 'Age is required.'
        : ageNum < 0 || ageNum > 25
        ? 'Enter an age between 0 and 25.'
        : '',
      gender: !gender ? 'Gender is required.' : '',
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    validate();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const childData = {
        name: name.trim(),
        age: Number(age),
        gender,
      };
      if (history.trim()) childData.medical_history = history.trim();

      const response = await fetch('http://localhost:5000/api/parent/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(childData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save child');
      }
      const savedChild = await response.json();
      onSave(savedChild);
    } catch (error) {
      console.error('Error saving child:', error);
      alert(`Failed to save child profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBirthCertChange = (e) => {
    setFileError('');
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only PDF, JPG, PNG, or WEBP files are allowed.');
      return;
    }
    if (file.size > maxBytes) {
      setFileError('File is too large. Max size is 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBirthCert({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: String(reader.result),
      });
    };
    reader.onerror = () => setFileError('Failed to read the file. Please try again.');
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {initial ? 'Edit Child Profile' : 'Add Child Profile'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                min="0"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onBlur={() => handleBlur('age')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {touched.age && errors.age && (
                <p className="mt-1 text-xs text-red-600">{errors.age}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                onBlur={() => handleBlur('gender')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="others">Others</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              {touched.gender && errors.gender && (
                <p className="mt-1 text-xs text-red-600">{errors.gender}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical/Developmental History
            </label>
            <textarea
              rows="4"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., prior assessments, therapies, milestones, concerns"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Birth Certificate
            </label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => {
                handleBirthCertChange(e);
                setTouched((t) => ({ ...t, birthCert: true }));
              }}
              onBlur={() => handleBlur('birthCert')}
              className="w-full"
            />
            {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
            {touched.birthCert && errors.birthCert && !fileError && (
              <p className="text-xs text-red-600 mt-1">{errors.birthCert}</p>
            )}
            {birthCert && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate max-w-[70%]" title={birthCert.name}>
                  {birthCert.name}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={birthCert.dataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => setBirthCert(null)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Accepted: PDF, JPG, PNG, WEBP. Max 5MB.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [children, setChildren] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedChild, setSelectedChild] = useState(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [parentInfo, setParentInfo] = useState({ name: '', email: '' });
  const [isSurveyInsightsOpen, setIsSurveyInsightsOpen] = useState(false);

  const childIdParam = useMemo(() => searchParams.get('childId'), [searchParams]);

  useEffect(() => {
    const fetchChildrenAndParent = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setChildren([]);
        setParentInfo({ name: '', email: '' });
        setIsLoadingChildren(false);
        return;
      }

      try {
        setIsLoadingChildren(true);
        const headers = { Authorization: `Bearer ${token}` };
        const [childrenRes, parentRes] = await Promise.all([
          fetch('http://localhost:5000/api/parent/children', { headers }),
          fetch('http://localhost:5000/api/parent/profile', { headers })
        ]);

        if (childrenRes.ok) {
          const childData = await childrenRes.json();
          setChildren(childData);
          if (childData.length > 0) setSelectedChild(childData[0]);
        } else {
          setChildren([]);
        }

        if (parentRes.ok) {
          const parentData = await parentRes.json();
          setParentInfo({
            name: parentData.name || parentData.fullName || parentData.username || '',
            email: parentData.email || parentData.contactEmail || ''
          });
        } else {
          setParentInfo({ name: '', email: '' });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoadingChildren(false);
      }
    };

    fetchChildrenAndParent();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/parent/appointments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const data = await response.json();
        setAppointments(data);
      } catch (error) {
        setAppointments([]);
      }
    };

    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!children.length) return;

    if (childIdParam) {
      const match = children.find((child) => (child._id || String(child.id)) === childIdParam || (child._id || child.id)?.toString() === childIdParam);
      if (match && (selectedChild?._id || selectedChild?.id)?.toString() !== (match._id || match.id)?.toString()) {
        setSelectedChild(match);
      }
      return;
    }

    if (!selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [childIdParam, children, selectedChild]);

  const handleAddClick = () => {
    setEditingChild(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (child) => {
    setEditingChild(child);
    setIsModalOpen(true);
  };

  const handleDelete = async (childId) => {
    if (window.confirm('Delete this child profile?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/parent/children/${childId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete child');
        setChildren((prev) => prev.filter((c) => c._id !== childId));
        setSelectedChild((prev) => (prev?._id === childId ? null : prev));
      } catch (error) {
        console.error('Error deleting child:', error);
        alert('Failed to delete child profile.');
      }
    }
  };

  const handleViewChild = (child) => {
    setSelectedChild(child);
  };

  const handleSaveChild = (child) => {
    setChildren((prev) => {
      const exists = prev.some((c) => (c._id || c.id) === (child._id || child.id));
      if (exists) {
        return prev.map((c) => ((c._id || c.id) === (child._id || child.id) ? child : c));
      }
      return [child, ...prev];
    });
    setSelectedChild(child);
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.clear();
    // Navigate to home page instead of login
    navigate('/');
  };

  const parentName = parentInfo.name?.trim() || parentInfo.email?.split('@')[0] || 'Parent';
  const parentInitial = parentName?.[0]?.toUpperCase() || 'P';

  const navItems = useMemo(() => (
    [
      { id: 'dashboard', label: 'Dashboard', icon: FaHome, path: '/dashboard' },
      { id: 'appointments', label: 'Appointments', icon: FaCalendar, path: '/parent/appointments' },
      { id: 'screening', label: 'Screening Results', icon: FaChartLine, path: '/parent/screening-results' },
      { id: 'reports', label: 'Progress Reports', icon: FaFileAlt, path: '/parent/progress-reports' },
      { id: 'care-team', label: 'Care Team', icon: FaUserTie, path: '/parent/care-team' },
      { id: 'resources', label: 'Resources', icon: FaBook, path: '/parent/resources' },
      { id: 'settings', label: 'Settings', icon: FaCog, path: '/parent/settings' },
    ]
  ), []);

  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = navItems.find((item) => item.path === currentPath);
    if (activeItem) {
      setActiveNav(activeItem.id);
    }
  }, [location.pathname, navItems]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-200 shadow-lg flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-blue-300">
          <h1 className="text-2xl font-bold text-blue-800">CORTEXA</h1>
          <p className="text-xs text-blue-600 mt-1">ASD Detection & Support</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeNav === item.id
                    ? 'bg-blue-300 text-blue-900 font-semibold shadow-md'
                    : 'text-blue-700 hover:bg-blue-250'
                }`}
              >
                <Icon className="text-blue-600" size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-300">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 bg-red-300 text-red-900 px-4 py-2 rounded-lg hover:bg-red-400 transition font-semibold"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Welcome, {parentName}!</h1>
              <p className="text-gray-500 text-sm mt-1">Track and manage your child's development journey</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <FaBell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-300 to-blue-400 rounded-full flex items-center justify-center text-white font-bold" title={parentName}>
                {parentInitial}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            {/* Updates & Messages Widget */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Updates & Messages</h2>
              <div className="border-l-4 border-blue-400 pl-4 py-2">
                <p className="text-gray-500">No updates at this time</p>
              </div>
            </div>

            {/* Survey Insights Widget */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Survey Insights</h2>
                  <p className="text-sm text-gray-600">Analyze parent questionnaire responses using AI decision tree classification</p>
                </div>
                <button
                  onClick={() => setIsSurveyInsightsOpen(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold whitespace-nowrap ml-4"
                >
                  Start Survey
                </button>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upcoming Appointments */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Upcoming Appointments</h2>
                  <button 
                    onClick={() => {
                      setActiveNav('appointments');
                      navigate('/parent/appointments');
                    }}
                    className="text-sm text-pink-600 hover:text-pink-800 font-semibold"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {(() => {
                    const upcomingAppointments = appointments.filter(apt => {
                      return apt.status !== 'cancelled' && apt.status !== 'completed';
                    });
                    
                    return upcomingAppointments.length === 0 ? (
                      <div className="text-center py-6">
                        <FaCalendar className="text-4xl text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">No appointments scheduled</p>
                        <button 
                          onClick={() => {
                            setActiveNav('appointments');
                            navigate('/parent/appointments');
                          }}
                          className="text-pink-600 hover:text-pink-800 text-sm font-semibold mt-2"
                        >
                          Book an appointment
                        </button>
                      </div>
                    ) : (
                      upcomingAppointments.slice(0, 3).map((apt) => (
                      <div key={apt._id} className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex-shrink-0">
                          <FaCalendar className="text-blue-400 mt-1" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{apt.childId?.name || 'Child'}</p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-blue-600">{apt.therapistId?.username || apt.therapistId?.name || 'Therapist'}</span>
                            {apt.therapistId?.specialty && <span className="text-gray-500"> • {apt.therapistId.specialty}</span>}
                          </p>
                          <p className="text-sm text-gray-500">{new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                              {apt.status}
                            </span>
                            {apt.type && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {apt.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                    );
                  })()}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Children</p>
                    <p className="text-3xl font-bold text-blue-800">{children.length}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Upcoming Appointments</p>
                    <p className="text-3xl font-bold text-pink-800">
                      {appointments.filter(apt => {
                        return apt.status !== 'cancelled' && apt.status !== 'completed';
                      }).length}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Profile Status</p>
                    <p className="text-sm font-semibold text-green-800">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Child Profile Selector */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Children</h2>
              {children.length === 0 ? (
                <div className="text-center py-8">
                  <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No child profiles yet</p>
                  <button
                    onClick={handleAddClick}
                    className="px-6 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold inline-flex items-center gap-2"
                  >
                    <FaUserPlus /> Add Your First Child
                  </button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((child) => (
                      <div
                        key={child._id || child.id}
                        className={`p-4 bg-gray-50 rounded-lg border ${selectedChild && (selectedChild._id || selectedChild.id) === (child._id || child.id) ? 'border-blue-300 ring-2 ring-blue-200' : 'border-gray-200'} hover:shadow-md transition`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-800">{child.name}</h3>
                            <p className="text-xs text-gray-600">Age {child.age} · {child.gender}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditClick(child)}
                              className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition"
                            >
                              <FaUserEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(child._id)}
                              className="p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded transition"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-3">
                          <button
                            onClick={() => handleViewChild(child)}
                            className="w-full px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm"
                          >
                            View {child.name}'s Profile
                          </button>
                          <button
                            onClick={() => {
                              setActiveNav('reports');
                              navigate(`/parent/progress-reports?childId=${child._id || child.id}`);
                            }}
                            className="w-full px-4 py-2 bg-blue-200 text-blue-800 rounded-lg hover:bg-blue-300 transition font-semibold text-sm"
                          >
                            Progress Reports
                          </button>
                          <button
                            onClick={() => {
                              setActiveNav('care-team');
                              navigate(`/parent/care-team?childId=${child._id || child.id}`);
                            }}
                            className="w-full px-4 py-2 bg-purple-200 text-purple-800 rounded-lg hover:bg-purple-300 transition font-semibold text-sm"
                          >
                            Care Team
                          </button>
                          <button
                            onClick={() => {
                              setActiveNav('appointments');
                              navigate(`/parent/appointments?childId=${child._id || child.id}`);
                            }}
                            className="w-full px-4 py-2 bg-green-200 text-green-800 rounded-lg hover:bg-green-300 transition font-semibold text-sm"
                          >
                            Manage Appointments
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleAddClick}
                      className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-gray-600 font-semibold"
                    >
                      <FaUserPlus /> Add Child
                    </button>
                  </div>
                  {selectedChild && (
                    <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-200">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-xl font-bold text-gray-800">{selectedChild.name}'s Profile</h3>
                        <span className="text-xs sm:text-sm text-gray-500">ID: {selectedChild._id || selectedChild.id}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-700">Age</p>
                          <p>{selectedChild.age ?? 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Gender</p>
                          <p className="capitalize">{selectedChild.gender || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Medical History</p>
                          <p>{selectedChild.medical_history || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Added On</p>
                          <p>{selectedChild.createdAt ? new Date(selectedChild.createdAt).toLocaleString() : 'Not available'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChildFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChild}
        initial={editingChild}
      />

      {isSurveyInsightsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full my-8">
            <SurveyInsights
              childId={selectedChild?._id || selectedChild?.id}
              onClose={() => setIsSurveyInsightsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
