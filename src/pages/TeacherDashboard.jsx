import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiClipboard, FiBarChart2, FiSettings, FiLogOut } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ASDRiskEstimator from '../components/ASDRiskEstimator';
import './TeacherDashboard.css';

const progressChartData = [
  { month: 'Aug', progress: 45 },
  { month: 'Sep', progress: 52 },
  { month: 'Oct', progress: 58 },
  { month: 'Nov', progress: 65 },
  { month: 'Dec', progress: 72 },
  { month: 'Jan', progress: 78 },
];

const Sidebar = ({ activeNav, onNavClick, onLogout }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: FiHome, path: '/teacher' },
    { id: 'students', label: 'My Students', icon: FiUsers, path: '/teacher/students' },
    { id: 'screenings', label: 'Student Screenings', icon: FiClipboard, path: '/teacher/screenings' },
    { id: 'reports', label: 'Progress Reports', icon: FiBarChart2, path: '/teacher/reports' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">CX</div>
        <div>
          <h2>CORTEXA</h2>
          <p>Educational Platform</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavClick(item.path)}
            className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <hr className="sidebar-divider" />
        <button onClick={() => onNavClick('/teacher/settings')} className="nav-item">
          <FiSettings className="nav-icon" />
          <span>Settings</span>
        </button>
        <button onClick={onLogout} className="nav-item logout-btn">
          <FiLogOut className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const MainContent = ({
  username,
  teacherName,
  teacherInstitution,
  stats,
  students,
  loading,
  onViewStudents = () => {},
  onReviewScreenings = () => {},
  onViewStudent = () => {},
  onCreateReport = () => {},
  onAccessResources = () => {},
  showRiskEstimator = false,
  onToggleRiskEstimator = () => {},
}) => {
  const recentActivities = Array.isArray(students)
    ? students.slice(0, 3).map((student, idx) => {
        const rawId = student?._id || student?.id || student?.patientId;
        const id = rawId ? String(rawId) : undefined;
        const name = student?.name || 'Student';
        return {
          id,
          name,
          activity: idx === 0 ? 'Completed questionnaire' : idx === 1 ? 'New observation added by parent' : 'New progress report drafted',
          date: new Date(student?.updatedAt || Date.now()).toLocaleDateString(),
        };
      })
    : [];

  return (
    <div className="main-content">
      <div className="welcome-header">
        <h1 className="welcome-title">Welcome {username || 'User'}! 👋</h1>
        <p className="welcome-subtitle">Nice to have you back. What an exciting day! Get ready and continue managing student progress today.</p>
      </div>

      <div className="profile-banner">
        <div className="profile-avatar">
          <span>{(teacherName || 'T').charAt(0).toUpperCase()}</span>
        </div>
        <div className="profile-info">
          <h2>{teacherName || 'Teacher'}</h2>
          <p>{teacherInstitution || 'Educational Institution'}</p>
        </div>
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.totalStudents || 0}</span>
            <span className="stat-label">Active Students</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.pendingScreenings || 0}</span>
            <span className="stat-label">Screenings Reviewed</span>
          </div>
        </div>
      </div>

      <div className="cards-grid">
        <div className="quick-card card-primary">
          <h3>My Active Students</h3>
          <div className="card-value">{stats.totalStudents || 0} Students</div>
          <button className="card-btn" onClick={onViewStudents}>View All Students</button>
        </div>

        <div className="quick-card card-secondary">
          <h3>Screenings to Review</h3>
          <div className="card-value">{stats.pendingScreenings || 0} Pending</div>
          <button className="card-btn" onClick={onReviewScreenings}>Review Now</button>
        </div>
      </div>

      <div className="content-grid">
        <div className="widget">
          <div className="widget-header">
            <h3 className="widget-title">Recent Student Activity</h3>
          </div>
          <div className="activity-list">
            {loading ? (
              <div className="loading-message">Loading activities...</div>
            ) : recentActivities.length === 0 ? (
              <div className="empty-message">No recent student activity</div>
            ) : (
              recentActivities.map((activity, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-info">
                    <h4 className="activity-name">{activity.name}</h4>
                    <p className="activity-action">{activity.activity}</p>
                  </div>
                  <div className="activity-footer">
                    <span className="activity-date">{activity.date}</span>
                    <button className="activity-btn" onClick={() => onViewStudent(activity.id)}>
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="widget">
          <div className="widget-header">
            <h3 className="widget-title">Overall Class Progress</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={progressChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="progress" stroke="#ff1493" strokeWidth={2} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="quick-links-section">
        <h3 className="section-title">Quick Links</h3>
        <div className="quick-links-grid">
          <button className="quick-link-btn" onClick={onCreateReport}>
            <span className="link-icon">📋</span>
            <span>Create New Progress Report</span>
          </button>
          <button className="quick-link-btn" onClick={onAccessResources}>
            <span className="link-icon">📚</span>
            <span>Access Professional Resources</span>
          </button>
          <button className="quick-link-btn" onClick={onToggleRiskEstimator}>
            <span className="link-icon">🧠</span>
            <span>ASD Risk Estimator</span>
          </button>
        </div>
      </div>

      {showRiskEstimator && (
        <ASDRiskEstimator onClose={onToggleRiskEstimator} />
      )}
    </div>
  );
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('home');
  const [username, setUsername] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherInstitution, setTeacherInstitution] = useState('');
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingScreenings: 0,
    completedReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showRiskEstimator, setShowRiskEstimator] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const profileRes = await fetch('http://localhost:5000/api/teacher/profile', { headers });
        const studentsRes = await fetch('http://localhost:5000/api/teacher/students', { headers });
        const statsRes = await fetch('http://localhost:5000/api/teacher/class-stats', { headers });

        let profileData = {};
        let studentsData = [];
        let statsData = { totalStudents: 0, pendingScreenings: 0, completedReports: 0 };

        if (profileRes.ok) {
          profileData = await profileRes.json();
          setUsername(profileData.username || profileData.email?.split('@')[0] || '');
          setTeacherName(profileData.lastName || profileData.name || '');
          setTeacherInstitution(profileData.institution || '');
        }

        if (studentsRes.ok) {
          studentsData = await studentsRes.json();
          setStudents(Array.isArray(studentsData) ? studentsData : []);
        }

        if (statsRes.ok) {
          statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleNavClick = (path) => {
    const navMap = {
      '/teacher': 'home',
      '/teacher/students': 'students',
      '/teacher/screenings': 'screenings',
      '/teacher/reports': 'reports',
    };
    let navKey = navMap[path];
    if (!navKey) {
      if (path.startsWith('/teacher/students')) {
        navKey = 'students';
      } else if (path.startsWith('/teacher/screenings')) {
        navKey = 'screenings';
      } else if (path.startsWith('/teacher/reports')) {
        navKey = 'reports';
      } else if (path.startsWith('/teacher')) {
        navKey = 'home';
      }
    }
    setActiveNav(navKey || 'home');
    navigate(path);
  };

  const goToStudents = () => handleNavClick('/teacher/students');
  const goToScreenings = () => handleNavClick('/teacher/screenings');
  const goToReports = () => handleNavClick('/teacher/reports');
  const goToStudentProfile = (studentId) => {
    if (!studentId) {
      goToStudents();
      return;
    }
    const targetId = String(studentId);
    setActiveNav('students');
    navigate(`/teacher/students/${targetId}`);
  };
  const goToResources = () => {
    setActiveNav('home');
    navigate('/learning');
  };

  const handleToggleRiskEstimator = () => {
    setShowRiskEstimator(!showRiskEstimator);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="teacher-dashboard">
      <Sidebar 
        activeNav={activeNav} 
        onNavClick={handleNavClick}
        onLogout={handleLogout}
      />
      <MainContent 
        username={username}
        teacherName={teacherName}
        teacherInstitution={teacherInstitution}
        stats={stats}
        students={students}
        loading={loading}
        onViewStudents={goToStudents}
        onReviewScreenings={goToScreenings}
        onViewStudent={goToStudentProfile}
        onCreateReport={goToReports}
        onAccessResources={goToResources}
        showRiskEstimator={showRiskEstimator}
        onToggleRiskEstimator={handleToggleRiskEstimator}
      />
    </div>
  );
}
