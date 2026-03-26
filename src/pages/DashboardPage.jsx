import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FaUserPlus, FaUserEdit, FaTrash, FaUsers, FaLightbulb, FaHeart, FaHome, FaCalendar, FaChartLine, FaUserTie, FaBook, FaCog, FaBell, FaSearch, FaBrain, FaCheckCircle, FaArrowRight, FaMoon, FaSmile, FaInfoCircle, FaExternalLinkAlt, FaFileAlt, FaShieldAlt } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { toast } from 'react-toastify';
import SurveyInsights from '../components/SurveyInsights';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

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

      const response = await fetch(`${API_BASE_URL}/api/parent/children`, {
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
      toast.success('Child profile saved successfully');
    } catch (error) {
      console.error('Error saving child:', error);
      toast.error(`Failed to save child profile: ${error.message}`);
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

const DEFAULT_MOOD_CHECKIN = { mood: 'Calm', attention: 'Medium', sleep: 'Good' };

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [moodCheckIn, setMoodCheckIn] = useState(DEFAULT_MOOD_CHECKIN);
  const [recentActivityFeed, setRecentActivityFeed] = useState([]);
  const [childScreenings, setChildScreenings] = useState([]);
  const [isSavingMoodCheckIn, setIsSavingMoodCheckIn] = useState(false);
  const [recentDoctorReplies, setRecentDoctorReplies] = useState([]);
  const [isLoadingDoctorReplies, setIsLoadingDoctorReplies] = useState(false);
  const [latestScreening, setLatestScreening] = useState(null);
  const [isLoadingLatestScreening, setIsLoadingLatestScreening] = useState(false);

  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const skipMoodAutoSaveRef = useRef(true);

  const childIdParam = useMemo(() => searchParams.get('childId'), [searchParams]);

  const dailyTips = useMemo(() => ([
    'Use short, clear sentences and pause for 5-8 seconds to give your child extra processing time.',
    'Offer two simple choices during routines to build communication and reduce overwhelm.',
    'Use visual schedules for transitions so your child can predict what comes next.',
    'Name emotions out loud and model calm breathing together during difficult moments.',
    'Create a quiet sensory corner with familiar textures, soft light, and one preferred toy.',
    'Celebrate small social attempts with immediate praise to reinforce positive interaction.'
  ]), []);

  const currentTip = useMemo(() => {
    const dayIndex = new Date().getDate() % dailyTips.length;
    return dailyTips[dayIndex];
  }, [dailyTips]);

  const normalizeMetricToPercent = (value) => {
    if (value === null || value === undefined) return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    const scaled = numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric;
    return Math.max(0, Math.min(100, Math.round(scaled)));
  };

  const findLatestScreeningByType = (type) => {
    return childScreenings.find((screening) => screening.screeningType === type) || null;
  };

  const developmentMilestones = useMemo(() => {
    const latestBehavioral = findLatestScreeningByType('behavioral');
    const latestGaze = findLatestScreeningByType('gaze');
    const latestSpeech = findLatestScreeningByType('speech');
    const latestQuestionnaire = findLatestScreeningByType('questionnaire');

    const communication = normalizeMetricToPercent(
      latestBehavioral?.behavioralMetrics?.communication
      ?? latestSpeech?.speechMetrics?.language
      ?? (latestQuestionnaire?.resultScore !== undefined ? 1 - Number(latestQuestionnaire.resultScore) : null)
    );

    const social = normalizeMetricToPercent(
      latestBehavioral?.behavioralMetrics?.socialInteraction
      ?? (latestGaze?.resultScore !== undefined ? 1 - Number(latestGaze.resultScore) : null)
    );

    const attention = normalizeMetricToPercent(
      latestGaze?.gazeMetrics?.attentionScore
      ?? (latestGaze?.resultScore !== undefined ? 1 - Number(latestGaze.resultScore) : null)
    );

    const behavior = normalizeMetricToPercent(
      latestBehavioral?.behavioralMetrics?.repetitiveBehavior !== undefined
        ? 1 - Number(latestBehavioral.behavioralMetrics.repetitiveBehavior)
        : (latestBehavioral?.resultScore !== undefined ? 1 - Number(latestBehavioral.resultScore) : null)
    );

    return [
      { key: 'communication', label: 'Communication', value: communication },
      { key: 'social', label: 'Social Interaction', value: social },
      { key: 'attention', label: 'Attention Span', value: attention },
      { key: 'behavior', label: 'Behavior Regulation', value: behavior }
    ];
  }, [childScreenings]);

  const getRecommendedTest = (age) => {
    if (age >= 1.33 && age <= 2.5) {
      return { 
        name: 'M-CHAT-R/F', 
        description: 'The Modified Checklist for Autism in Toddlers is a validated developmental screening tool for toddlers between 16 and 30 months of age.' 
      };
    } else if (age >= 1 && age <= 5) {
      return { 
        name: 'SACS-R', 
        description: 'Social Attention and Communication Surveillance is used for identifying infants and toddlers at risk for autism (12-60 months).' 
      };
    } else if (age > 5 && age < 16) {
      return { 
        name: 'SCSQ', 
        description: 'The Social Challenges Screening Questionnaire is designed for school-age children to identify social and communication challenges.' 
      };
    } else if (age >= 16) {
      return { 
        name: 'AQ Test', 
        description: 'The Autism Spectrum Quotient is a diagnostic questionnaire designed to measure autistic traits in adults and adolescents.' 
      };
    } else {
      return { 
        name: 'SACS-R', 
        description: 'Standard social communication surveillance for young children.' 
      };
    }
  };

  const recentActivities = useMemo(() => {
    const toRelative = (isoDate) => {
      if (!isoDate) return 'Unknown time';
      const now = new Date();
      const then = new Date(isoDate);
      const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
      if (days <= 0) return 'Today';
      if (days === 1) return 'Yesterday';
      return `${days} days ago`;
    };

    return recentActivityFeed.map((activity) => ({
      id: activity.id,
      title: activity.message || 'Recent update',
      when: toRelative(activity.date),
      icon: activity.type?.includes('appointment') ? FaCalendar : FaCheckCircle
    }));
  }, [recentActivityFeed]);

  const guidanceItems = useMemo(() => ([
    {
      id: 'guidance-1',
      title: 'Early Signs of Autism',
      text: 'Watch for differences in eye contact, social response, language pacing, and repetitive behaviors across daily routines.'
    },
    {
      id: 'guidance-2',
      title: 'Improving Communication',
      text: 'Pair words with gestures, visual cues, and predictable routines to support expression and understanding.'
    },
    {
      id: 'guidance-3',
      title: 'Sensory Sensitivity Tips',
      text: 'Reduce sensory load in noisy spaces and prepare comfort tools like headphones, fidgets, or familiar objects.'
    }
  ]), []);

  const resourceHighlights = useMemo(() => ([
    {
      id: 'resource-1',
      type: 'Parenting Article',
      title: 'Building Communication Through Play',
      description: 'Practical play-based ideas to strengthen turn-taking, requesting, and shared attention at home.',
      path: '/parent/resources'
    },
    {
      id: 'resource-2',
      type: 'Therapy Guidance',
      title: 'Home Routine Support Guide',
      description: 'Simple structure templates to make mornings, meals, and bedtime easier and more predictable.',
      path: '/parent/resources'
    },
    {
      id: 'resource-3',
      type: 'Support Organization',
      title: 'Autism Family Network Directory',
      description: 'Explore local and online support groups, parent communities, and service directories.',
      path: '/parent/resources'
    }
  ]), []);

  const upcomingReminders = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((appointment) => {
        const rawDate = appointment.appointmentDate || appointment.date;
        return rawDate && new Date(rawDate) >= now;
      })
      .sort((a, b) => new Date(a.appointmentDate || a.date) - new Date(b.appointmentDate || b.date))
      .slice(0, 5)
      .map((appointment) => ({
        id: appointment._id || appointment.id,
        title: `Therapy session: ${appointment.childId?.name || selectedChild?.name || 'Child'}`,
        time: new Date(appointment.appointmentDate || appointment.date).toLocaleDateString(),
        type: 'session'
      }));
  }, [appointments, selectedChild]);

  const motivationalMessage = useMemo(() => {
    const childName = selectedChild?.name || 'your child';
    return `Every small step matters. Your steady support for ${childName} is building confidence, connection, and long-term growth.`;
  }, [selectedChild]);

  const developmentalStage = useMemo(() => {
    const age = Number(selectedChild?.age ?? 0);
    if (age <= 3) return 'Early Childhood';
    if (age <= 6) return 'Preschool';
    if (age <= 12) return 'School Age';
    return 'Adolescent';
  }, [selectedChild]);

  const latestRiskClasses = useMemo(() => {
    const risk = String(latestScreening?.riskLevel || '').toLowerCase();
    if (risk === 'high') {
      return {
        badge: 'bg-red-100 text-red-700',
        border: 'border-red-200',
        panel: 'from-red-50 to-rose-50'
      };
    }
    if (risk === 'medium') {
      return {
        badge: 'bg-orange-100 text-orange-700',
        border: 'border-orange-200',
        panel: 'from-orange-50 to-amber-50'
      };
    }
    return {
      badge: 'bg-green-100 text-green-700',
      border: 'border-green-200',
      panel: 'from-green-50 to-emerald-50'
    };
  }, [latestScreening]);

  const latestScreeningTypeLabel = useMemo(() => {
    const type = String(latestScreening?.screeningType || '').toUpperCase();
    if (type === 'MCHAT') return 'M-CHAT';
    if (type === 'ATTENTION') return 'Attention Analysis';
    if (type === 'MRI') return 'MRI Screening';
    return latestScreening?.screeningType || 'Unknown';
  }, [latestScreening]);

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
          fetch(`${API_BASE_URL}/api/parent/children`, { headers }),
          fetch(`${API_BASE_URL}/api/parent/profile`, { headers })
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
        const response = await fetch(`${API_BASE_URL}/api/parent/appointments`, {
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
    const fetchActivity = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setRecentActivityFeed([]);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/parent/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch activity');
        const data = await response.json();
        setRecentActivityFeed(Array.isArray(data) ? data : []);
      } catch (error) {
        setRecentActivityFeed([]);
      }
    };

    fetchActivity();
  }, []);

  useEffect(() => {
    const fetchScreeningsForChild = async () => {
      try {
        const childId = selectedChild?._id || selectedChild?.id;
        if (!childId) {
          setChildScreenings([]);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setChildScreenings([]);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/patients/${childId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          setChildScreenings([]);
          return;
        }

        const data = await response.json();
        setChildScreenings(Array.isArray(data?.screenings) ? data.screenings : []);
      } catch (error) {
        setChildScreenings([]);
      }
    };

    fetchScreeningsForChild();
  }, [selectedChild]);

  useEffect(() => {
    const fetchLatestScreeningResult = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLatestScreening(null);
          return;
        }

        setIsLoadingLatestScreening(true);
        const response = await fetch(`${API_BASE_URL}/api/screening/latest`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 404) {
          setLatestScreening(null);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch latest screening result');
        }

        const payload = await response.json();
        setLatestScreening(payload || null);
      } catch (error) {
        console.error('Error fetching latest screening result:', error);
        setLatestScreening(null);
      } finally {
        setIsLoadingLatestScreening(false);
      }
    };

    fetchLatestScreeningResult();
  }, []);

  useEffect(() => {
    const fetchDoctorReplies = async () => {
      try {
        const childId = selectedChild?._id || selectedChild?.id;
        console.log('fetchDoctorReplies - selectedChildId:', childId);
        
        if (!childId) {
          setRecentDoctorReplies([]);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('fetchDoctorReplies - No token found');
          setRecentDoctorReplies([]);
          return;
        }

        setIsLoadingDoctorReplies(true);
        console.log('fetchDoctorReplies - Fetching from:', `http://localhost:5000/api/parent/care-team/messages?childId=${childId}`);
        
        const response = await fetch(`http://localhost:5000/api/parent/care-team/messages?childId=${childId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          console.error('fetchDoctorReplies - Response not OK:', response.status);
          setRecentDoctorReplies([]);
          return;
        }

        const payload = await response.json();
        console.log('fetchDoctorReplies - Payload received:', payload);
        
        const messages = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload?.messages) ? payload.messages : []);

        console.log('fetchDoctorReplies - Processed messages count:', messages.length);

        const replies = messages
          .flatMap((entry) => {
            const threadReplies = Array.isArray(entry?.replies) ? entry.replies : [];
            return threadReplies
              .filter((reply) => reply?.senderRole === 'therapist')
              .map((reply) => ({
                id: `${entry._id}-${reply.createdAt || Math.random()}`,
                queryId: entry._id,
                subject: entry.subject || 'No subject',
                message: reply.message || '',
                createdAt: reply.createdAt,
                providerName: entry?.provider?.name || 'Doctor'
              }));
          })
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5);

        console.log('fetchDoctorReplies - Filtered replies count:', replies.length);
        setRecentDoctorReplies(replies);
      } catch (error) {
        console.error('fetchDoctorReplies - Error:', error);
        setRecentDoctorReplies([]);
      } finally {
        setIsLoadingDoctorReplies(false);
      }
    };

    fetchDoctorReplies();
  }, [selectedChild]);

  useEffect(() => {
    const fetchLatestMoodCheckIn = async () => {
      try {
        const childId = selectedChild?._id || selectedChild?.id;
        if (!childId) {
          setMoodCheckIn(DEFAULT_MOOD_CHECKIN);
          skipMoodAutoSaveRef.current = true;
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setMoodCheckIn(DEFAULT_MOOD_CHECKIN);
          skipMoodAutoSaveRef.current = true;
          return;
        }

        const response = await fetch(`http://localhost:5000/api/parent/mood-checkin/${childId}/latest`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          setMoodCheckIn(DEFAULT_MOOD_CHECKIN);
          skipMoodAutoSaveRef.current = true;
          return;
        }

        const latest = await response.json();
        setMoodCheckIn(
          latest
            ? {
                mood: latest.mood || DEFAULT_MOOD_CHECKIN.mood,
                attention: latest.attention || DEFAULT_MOOD_CHECKIN.attention,
                sleep: latest.sleep || DEFAULT_MOOD_CHECKIN.sleep
              }
            : DEFAULT_MOOD_CHECKIN
        );
        skipMoodAutoSaveRef.current = true;
      } catch (error) {
        setMoodCheckIn(DEFAULT_MOOD_CHECKIN);
        skipMoodAutoSaveRef.current = true;
      }
    };

    fetchLatestMoodCheckIn();
  }, [selectedChild]);

  useEffect(() => {
    const childId = selectedChild?._id || selectedChild?.id;
    if (!childId) return;

    if (skipMoodAutoSaveRef.current) {
      skipMoodAutoSaveRef.current = false;
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        setIsSavingMoodCheckIn(true);

        await fetch(`${API_BASE_URL}/api/parent/mood-checkin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            childId,
            mood: moodCheckIn.mood,
            attention: moodCheckIn.attention,
            sleep: moodCheckIn.sleep
          })
        });
      } catch (error) {
        // Keep UI responsive even if save fails.
      } finally {
        setIsSavingMoodCheckIn(false);
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [moodCheckIn, selectedChild]);

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

  useEffect(() => {
    const selectedId = (selectedChild?._id || selectedChild?.id)?.toString();
    if (selectedId) {
      localStorage.setItem('selectedChildId', selectedId);
    }
    if (selectedChild?.name) {
      localStorage.setItem('selectedChildName', selectedChild.name);
    }
  }, [selectedChild]);

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
        toast.success('Child profile deleted');
      } catch (error) {
        console.error('Error deleting child:', error);
        toast.error('Failed to delete child profile.');
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

  const upcomingNotifications = useMemo(() => {
    const appointmentNotifs = appointments
      .filter(a => (a.appointmentDate || a.date) && new Date(a.appointmentDate || a.date) >= new Date())
      .map(a => ({
        id: a._id || a.id,
        text: `Appointment with Dr. ${a.therapistId?.username || a.doctorName || a.doctor || 'Doctor'} on ${new Date(a.appointmentDate || a.date).toLocaleDateString()}`,
        type: 'appointment',
        date: new Date(a.appointmentDate || a.date)
      }));

    const replyNotifs = recentDoctorReplies.map(r => ({
      id: r.id,
      text: `New message from ${r.providerName}: ${r.subject}`,
      type: 'reply',
      date: new Date(r.createdAt)
    }));

    return [...appointmentNotifs, ...replyNotifs]
      .sort((a, b) => b.date - a.date)
      .slice(0, 8);
  }, [appointments, recentDoctorReplies]);

  const navItems = useMemo(() => (
    [
      { id: 'dashboard', label: 'Dashboard', icon: FaHome, path: '/dashboard' },
      { id: 'appointments', label: 'Appointments', icon: FaCalendar, path: '/parent/appointments' },
      { id: 'screening', label: 'Start Screening', icon: FaChartLine, path: '/parent/screening-results' },
      { id: 'autism-screening', label: 'Autism Screening', icon: FaCheckCircle, path: '/parent/autism-screening' },
      { id: 'attention', label: 'Attention Analysis', icon: FaBrain, path: '/parent/attention-analysis' },
      { id: 'care-team', label: 'Care Team', icon: FaUserTie, path: '/parent/care-team' },
      { id: 'resources', label: 'Resources', icon: FaBook, path: '/parent/resources' },
      { id: 'settings', label: 'Settings', icon: FaCog, path: '/parent/settings' },
    ]
  ), []);

  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return navItems.filter(item => item.label.toLowerCase().includes(q));
  }, [searchQuery, navItems]);

  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return children.filter(c => c.name?.toLowerCase().includes(q));
  }, [searchQuery, children]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                  const childId = selectedChild?._id || selectedChild?.id;
                  const path = childId && item.id !== 'dashboard' && item.id !== 'settings'
                    ? `${item.path}${item.path.includes('?') ? '&' : '?'}childId=${childId}`
                    : item.path;
                  navigate(path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeNav === item.id
                    ? 'bg-blue-300 text-blue-900 font-semibold shadow-md'
                    : 'text-blue-700 hover:bg-blue-250'
                }`}
              >
                <Icon className="text-blue-600" size={20} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'care-team' && recentDoctorReplies.length > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {recentDoctorReplies.length}
                  </span>
                )}
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
              {/* Search */}
              <div className="relative hidden sm:block" ref={searchRef}>
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(e.target.value.trim().length > 0); }}
                  onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-56"
                />
                {showSearchResults && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {filteredNavItems.length === 0 && filteredChildren.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
                    ) : (
                      <>
                        {filteredNavItems.length > 0 && (
                          <div>
                            <p className="px-3 pt-2 pb-1 text-xs text-gray-400 font-semibold uppercase tracking-wide">Pages</p>
                            {filteredNavItems.map(item => (
                              <button
                                key={item.id}
                                onClick={() => { setActiveNav(item.id); navigate(item.path); setShowSearchResults(false); setSearchQuery(''); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left text-sm text-gray-700"
                              >
                                <item.icon size={13} className="text-blue-500" /> {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {filteredChildren.length > 0 && (
                          <div>
                            <p className="px-3 pt-2 pb-1 text-xs text-gray-400 font-semibold uppercase tracking-wide">Children</p>
                            {filteredChildren.map(c => (
                              <button
                                key={c._id || c.id}
                                onClick={() => { setSelectedChild(c); setShowSearchResults(false); setSearchQuery(''); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left text-sm text-gray-700"
                              >
                                <FaUsers size={13} className="text-blue-500" /> {c.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => { setShowNotifications(prev => !prev); setShowProfileMenu(false); }}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <FaBell size={20} />
                  {upcomingNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {upcomingNotifications.length > 0 ? (
                        upcomingNotifications.map(n => (
                          <div key={n.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 text-sm text-gray-700">{n.text}</div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">No new notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => { setShowProfileMenu(prev => !prev); setShowNotifications(false); }}
                  className="w-10 h-10 bg-gradient-to-br from-blue-300 to-blue-400 rounded-full flex items-center justify-center text-white font-bold hover:opacity-90 transition"
                  title={parentName}
                >
                  {parentInitial}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800 text-sm">{parentName}</p>
                      <p className="text-xs text-gray-500 truncate">{parentInfo.email}</p>
                    </div>
                    <button
                      onClick={() => { navigate('/parent/settings'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FaCog size={14} /> Settings
                    </button>
                    <button
                      onClick={() => { handleLogout(); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                    >
                      <FiLogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            {/* Motivational / Support Message */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">You Are Making a Difference</h2>
                  <p className="text-blue-50 leading-relaxed">{motivationalMessage}</p>
                </div>
                <FaHeart className="text-blue-100 text-2xl flex-shrink-0" />
              </div>
            </div>

            {/* Top Utility Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Child Overview Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center text-blue-800 font-bold text-2xl">
                    {selectedChild?.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedChild?.name || 'No child selected'}</h3>
                    <p className="text-sm text-gray-500">Age: {selectedChild?.age ?? '-'} years</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Developmental Stage</p>
                    <p className="text-sm font-semibold text-blue-800">{developmentalStage}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Last Activity</p>
                    <p className="text-sm font-semibold text-green-800">Today</p>
                  </div>
                </div>
                <button
                  onClick={() => selectedChild && handleViewChild(selectedChild)}
                  className="mt-4 w-full px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition font-semibold text-sm"
                >
                  View Profile
                </button>
              </div>

              {/* Daily Development Tip */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FaLightbulb className="text-amber-500" />
                  <h3 className="text-lg font-bold text-gray-800">Daily Development Tip</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{currentTip}</p>
                <p className="text-xs text-gray-400 mt-4">New tip updates every day</p>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                  <button
                    onClick={() => { setActiveNav('screening'); navigate('/parent/screening-results'); }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 transition font-semibold text-sm"
                  >
                    <span>Start Screening</span>
                    <FaArrowRight size={12} />
                  </button>
                  <button
                    onClick={() => { setActiveNav('attention'); navigate(`/parent/attention-analysis${selectedChild ? `?childId=${selectedChild._id || selectedChild.id}` : ''}`); }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-cyan-50 text-cyan-800 rounded-lg hover:bg-cyan-100 transition font-semibold text-sm"
                  >
                    <span>Start Attention Analysis</span>
                    <FaArrowRight size={12} />
                  </button>
                  <button
                    onClick={() => { setActiveNav('appointments'); navigate('/parent/appointments'); }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-green-50 text-green-800 rounded-lg hover:bg-green-100 transition font-semibold text-sm"
                  >
                    <span>Book Appointment</span>
                    <FaArrowRight size={12} />
                  </button>
                  <button
                    onClick={() => { setActiveNav('resources'); navigate('/parent/resources'); }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 transition font-semibold text-sm"
                  >
                    <span>View Resources</span>
                    <FaArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Doctor Replies - Prominent Location */}
            {recentDoctorReplies.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-md p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <FaBell />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">New Messages from Doctor</h3>
                  </div>
                  <button
                    onClick={() => {
                      setActiveNav('care-team');
                      const childId = selectedChild?._id || selectedChild?.id;
                      const params = new URLSearchParams();
                      if (childId) params.set('childId', childId);
                      params.set('section', 'messages');
                      navigate(`/parent/care-team?${params.toString()}`);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    View All Messages <FaArrowRight size={10} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentDoctorReplies.map((reply) => (
                    <div key={reply.id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition cursor-pointer"
                      onClick={() => {
                        setActiveNav('care-team');
                        const childId = selectedChild?._id || selectedChild?.id;
                        const params = new URLSearchParams();
                        if (childId) params.set('childId', childId);
                        if (reply.queryId) params.set('queryId', reply.queryId);
                        params.set('section', 'messages');
                        navigate(`/parent/care-team?${params.toString()}`);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">Therapist Reply</span>
                        <span className="text-[10px] text-gray-400">{reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 truncate mb-1">{reply.subject}</p>
                      <p className="text-xs text-gray-600 line-clamp-2 italic">"{reply.message}"</p>
                      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-gray-50">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {reply.providerName?.[0] || 'D'}
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500">{reply.providerName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Autism Screening Section */}
            {selectedChild && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FaCheckCircle className="text-blue-600" />
                      Autism Screening
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Recommended test based on {selectedChild.name}'s profile</p>
                  </div>
                  <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm border border-blue-100">
                    Recommended: {getRecommendedTest(selectedChild.age).name}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <h4 className="font-bold text-gray-800 mb-2">About this assessment</h4>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {getRecommendedTest(selectedChild.age).description}
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={() => {
                            setActiveNav('autism-screening');
                            navigate(`/parent/autism-screening?childId=${selectedChild._id || selectedChild.id}`);
                          }}
                          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold shadow-lg shadow-blue-200 flex items-center gap-2"
                        >
                          Start {getRecommendedTest(selectedChild.age).name}
                          <FaArrowRight size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            setActiveNav('screening');
                            const selectedChildId = selectedChild?._id || selectedChild?.id;
                            const params = new URLSearchParams();
                            if (selectedChildId) {
                              params.set('childId', selectedChildId);
                            }
                            navigate(`/parent/screening-results${params.toString() ? `?${params.toString()}` : ''}`);
                          }}
                          className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-semibold"
                        >
                          View History
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <FaInfoCircle className="text-blue-500" />
                      Important Note
                    </h4>
                    <p className="text-xs text-blue-700 leading-relaxed mb-4 italic">
                      "This screening tool is not a medical diagnosis. It only identifies possible developmental concerns. Please consult a qualified healthcare professional."
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-blue-800">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        <span>Takes about 5-10 minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-800">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        <span>Results available immediately</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mood Check-in + Upcoming Reminders */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 xl:col-span-2">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Child Mood / Behavior Check-in</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="text-sm text-gray-600">
                    Mood
                    <select
                      value={moodCheckIn.mood}
                      onChange={(e) => setMoodCheckIn((prev) => ({ ...prev, mood: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option>Calm</option>
                      <option>Happy</option>
                      <option>Anxious</option>
                      <option>Irritable</option>
                    </select>
                  </label>
                  <label className="text-sm text-gray-600">
                    Attention Level
                    <select
                      value={moodCheckIn.attention}
                      onChange={(e) => setMoodCheckIn((prev) => ({ ...prev, attention: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </label>
                  <label className="text-sm text-gray-600">
                    Sleep Quality
                    <select
                      value={moodCheckIn.sleep}
                      onChange={(e) => setMoodCheckIn((prev) => ({ ...prev, sleep: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option>Poor</option>
                      <option>Fair</option>
                      <option>Good</option>
                      <option>Excellent</option>
                    </select>
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                    <FaSmile /> Mood: {moodCheckIn.mood}
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    <FaBrain /> Attention: {moodCheckIn.attention}
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                    <FaMoon /> Sleep: {moodCheckIn.sleep}
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  {isSavingMoodCheckIn ? 'Saving check-in...' : 'Check-in is saved automatically for this child.'}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Upcoming Reminders</h3>
                <div className="space-y-3">
                  {upcomingReminders.map((reminder) => (
                    <div key={reminder.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-800">{reminder.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{reminder.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Development Tracker + Recent Activities */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Development Milestones Tracker</h3>
                <div className="space-y-4">
                  {developmentMilestones.map((milestone) => (
                    <div key={milestone.key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{milestone.label}</span>
                        <span className="text-gray-500">{milestone.value === null ? 'N/A' : `${milestone.value}%`}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2.5 rounded-full"
                          style={{ width: `${milestone.value || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {developmentMilestones.every((milestone) => milestone.value === null) && (
                  <p className="text-xs text-gray-400 mt-3">
                    No screening metrics available yet for this child.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activities</h3>
                <div className="space-y-3">
                  {recentActivities.map((activity) => {
                    const ActivityIcon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <ActivityIcon className="text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.when}</p>
                        </div>
                      </div>
                    );
                  })}
                  {recentActivities.length === 0 && (
                    <p className="text-sm text-gray-500">No recent activity yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Parent Guidance + Resource Highlights */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Parent Guidance</h3>
                <div className="space-y-4">
                  {guidanceItems.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                      <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Resource Highlights</h3>
                  <button
                    onClick={() => { setActiveNav('resources'); navigate('/parent/resources'); }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Browse All
                  </button>
                </div>
                <div className="space-y-3">
                  {resourceHighlights.map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => { setActiveNav('resources'); navigate(resource.path); }}
                      className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{resource.type}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{resource.title}</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{resource.description}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-blue-700 mt-2 font-medium">
                        Open resource <FaExternalLinkAlt size={10} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Survey Insights Widget */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Survey Insights</h2>
                  <p className="text-sm text-gray-600">Analyze parent questionnaire responses using AI decision tree classification</p>
                </div>
                <button
                  onClick={() => setIsSurveyInsightsOpen(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold whitespace-nowrap"
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
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Latest Screening Result</h3>
                  {isLoadingLatestScreening ? (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                      Loading latest result...
                    </div>
                  ) : latestScreening ? (
                    <div className={`p-4 bg-gradient-to-r ${latestRiskClasses.panel} rounded-lg border ${latestRiskClasses.border}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Screening Type</p>
                          <p className="text-sm font-bold text-gray-800 mt-1">{latestScreeningTypeLabel}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${latestRiskClasses.badge}`}>
                          {latestScreening.riskLevel} Risk
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        <div className="bg-white/70 rounded-md p-2">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Confidence</p>
                          <p className="text-sm font-bold text-gray-800">{Math.round(Number(latestScreening.confidence || 0))}%</p>
                        </div>
                        <div className="bg-white/70 rounded-md p-2">
                          <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Date</p>
                          <p className="text-sm font-bold text-gray-800">
                            {latestScreening.createdAt ? new Date(latestScreening.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 bg-white/70 rounded-md p-2">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Recommendation</p>
                        <p className="text-sm text-gray-700 mt-1">{latestScreening.recommendation}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                      No screening result found yet. Complete a screening to see the latest risk summary.
                    </div>
                  )}
                </div>

                {/* Screening Results Summary Card */}
                {selectedChild && (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Screening History</h3>
                    <div className="space-y-3">
                      {['M-CHAT-R/F', 'SACS-R', 'SCSQ', 'AQ Test'].map(type => {
                        const result = findLatestScreeningByType(type);
                        return (
                          <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                              <p className="text-xs font-bold text-gray-700">{type}</p>
                              <p className="text-[11px] text-gray-500">
                                {result ? new Date(result.createdAt).toLocaleDateString() : 'Not taken'}
                              </p>
                            </div>
                            {result ? (
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                result.resultLabel?.includes('High') ? 'bg-red-100 text-red-700' :
                                result.resultLabel?.includes('Medium') || result.resultLabel?.includes('Moderate') ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {result.resultLabel}
                              </span>
                            ) : (
                              <button 
                                onClick={() => {
                                  setActiveNav('autism-screening');
                                  navigate(`/parent/autism-screening?childId=${selectedChild._id || selectedChild.id}`);
                                }}
                                className="text-[10px] text-blue-600 hover:underline font-bold"
                              >
                                Take Now
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                              setActiveNav('attention');
                              navigate(`/parent/attention-analysis?childId=${child._id || child.id}`);
                            }}
                            className="w-full px-4 py-2 bg-blue-200 text-blue-800 rounded-lg hover:bg-blue-300 transition font-semibold text-sm"
                          >
                            Attention Analysis
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
                          <button
                            onClick={() => navigate(`/live-gaze-analysis?patientId=${child._id || child.id}`)}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm"
                          >
                            Live Gaze Analysis
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
