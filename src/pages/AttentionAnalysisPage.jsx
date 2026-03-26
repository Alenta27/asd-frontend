import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaBook,
  FaBell,
  FaBrain,
  FaCalendar,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaCog,
  FaDownload,
  FaEye,
  FaGamepad,
  FaHeart,
  FaHome,
  FaLightbulb,
  FaMemory,
  FaMousePointer,
  FaPlay,
  FaPuzzlePiece,
  FaSearch,
  FaShapes,
  FaSortNumericUp,
  FaTachometerAlt,
  FaTable,
  FaTrophy,
  FaUserTie,
  FaExclamationTriangle
} from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import jsPDF from 'jspdf';
import {
  Area,
  AreaChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { toast } from 'react-toastify';

// Import game components (will create these next)
import ChronoCodeGame from '../components/games/ChronoCodeGame';
import IconicRecallGame from '../components/games/IconicRecallGame';
import MatchMasteryGame from '../components/games/MatchMasteryGame';
import NumericShuffleGame from '../components/games/NumericShuffleGame';
import OddOneOutGame from '../components/games/OddOneOutGame';
import PatternMatchGame from '../components/games/PatternMatchGame';
import ReflexTapGame from '../components/games/ReflexTapGame';
import SignalSwitchGame from '../components/games/SignalSwitchGame';
import AttentionAnalysisResults from '../components/AttentionAnalysisResults';

const AttentionAnalysisPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const persistedChildId = localStorage.getItem('selectedChildId');
  const persistedChildName = localStorage.getItem('selectedChildName') || '';
  const resolvedChildId = childId || persistedChildId || '';
  const gameParam = searchParams.get('game');
  const [activeNav, setActiveNav] = useState('attention');
  const [activeGame, setActiveGame] = useState(null);
  const [childName, setChildName] = useState(persistedChildName);
  const [currentChildId, setCurrentChildId] = useState(resolvedChildId);
  const [parentInfo, setParentInfo] = useState({ name: '', email: '' });
  const [gameHistory, setGameHistory] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const isResultMode = location.pathname.endsWith('/result') || location.pathname.endsWith('/results');
  const isPlayMode = location.pathname.endsWith('/play');

  useEffect(() => {
    if (resolvedChildId && resolvedChildId !== currentChildId) {
      setCurrentChildId(resolvedChildId);
    }
  }, [resolvedChildId, currentChildId]);

  useEffect(() => {
    if (isPlayMode && gameParam) {
      setActiveGame(gameParam);
    } else if (isResultMode && gameParam && currentChildId) {
      // 1. Try to get result from session storage first (fresh from game session)
      const freshResult = sessionStorage.getItem('lastAttentionResult');
      if (freshResult) {
        try {
          const parsed = JSON.parse(freshResult);
          const parsedChildId = (parsed.childId || '').toString();
          const matchesGame = parsed.gameType === gameParam || parsed.gameId === gameParam;
          const matchesChild = !currentChildId || parsedChildId === currentChildId.toString();

          if (matchesGame && matchesChild) {
            console.log('Using fresh result from session storage');
            setSelectedReport(parsed);
            if (parsed.childName) {
              setChildName(parsed.childName);
            }
            setLoading(false);
            // Clear it so it doesn't persist forever
            sessionStorage.removeItem('lastAttentionResult');
            return;
          }
        } catch (e) {
          console.error('Error parsing fresh result:', e);
        }
      }

      // 2. If we already have a report for this game and it's fresh (from a game session), don't fetch
      if (
        selectedReport &&
        (selectedReport.gameType === gameParam || selectedReport.gameId === gameParam) &&
        (!currentChildId || (selectedReport.childId || '').toString() === currentChildId.toString())
      ) {
        console.log('Using optimistic report, skipping fetch');
        setLoading(false);
      } else {
        fetchLatestResult(gameParam);
      }
    } else {
      setActiveGame(null);
    }
  }, [isPlayMode, isResultMode, gameParam, currentChildId, selectedReport?.gameId, selectedReport?.gameType, selectedReport?.childId]);

  const fetchLatestResult = async (gameType) => {
    if (!currentChildId) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/attention-results?childId=${currentChildId}&gameType=${gameType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedReport(data);
      } else if (response.status === 404) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error fetching latest result:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchParentInfo = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await fetch('http://localhost:5000/api/parent/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setParentInfo({
            name: data.name || data.fullName || data.username || '',
            email: data.email || data.contactEmail || ''
          });
        }
      } catch (error) {
        console.error('Error fetching parent info:', error);
      }
    };

    fetchParentInfo();
  }, []);

  useEffect(() => {
    const fetchChildInfo = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        // Always fetch children and resolve active child with priority: URL -> persisted -> first child
        const response = await fetch('http://localhost:5000/api/parent/children', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          let child = null;

          if (Array.isArray(data) && data.length > 0) {
            const targetId = (resolvedChildId || '').toString();
            child = data.find(c => (c._id || c.id)?.toString() === targetId) || data[0];
          }
          
          if (child) {
            const normalizedChildId = (child._id || child.id)?.toString();
            setChildName(child.name);
            setCurrentChildId(normalizedChildId);
            if (normalizedChildId) {
              localStorage.setItem('selectedChildId', normalizedChildId);
            }
            if (child.name) {
              localStorage.setItem('selectedChildName', child.name);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching child info:', error);
      }
    };

    fetchChildInfo();
  }, [resolvedChildId]);

  useEffect(() => {
    const fetchGameHistory = async () => {
      if (!currentChildId) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        // Use the new API or keep the history API
        const response = await fetch(`http://localhost:5000/api/parent/attention-games/history/${currentChildId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setGameHistory(data);
          // Only set selectedReport if not in result mode (which fetches its own)
          if (!location.pathname.endsWith('/result') && !location.pathname.endsWith('/results') && !selectedReport && Array.isArray(data) && data.length > 0) {
            setSelectedReport(data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching game history:', error);
      }
    };

    fetchGameHistory();
  }, [currentChildId, location.pathname]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome, path: '/dashboard' },
    { id: 'appointments', label: 'Appointments', icon: FaCalendar, path: '/parent/appointments' },
    { id: 'screening', label: 'Screening Results', icon: FaChartLine, path: '/parent/screening-results' },
    { id: 'attention', label: 'Attention Analysis', icon: FaBrain, path: '/parent/attention-analysis' },
    { id: 'care-team', label: 'Care Team', icon: FaUserTie, path: '/parent/care-team' },
    { id: 'resources', label: 'Resources', icon: FaBook, path: '/parent/resources' },
    { id: 'settings', label: 'Settings', icon: FaCog, path: '/parent/settings' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const parentName = parentInfo.name?.trim() || parentInfo.email?.split('@')[0] || 'Parent';
  const parentInitial = parentName?.[0]?.toUpperCase() || 'P';

  const games = [
    // Memory Category
    {
      id: 'chrono-code',
      name: 'Chrono Code',
      category: 'Memory',
      description: 'Remember and recall number sequences',
      difficulty: 'Medium',
      icon: FaClock,
      color: 'from-purple-400 to-purple-600',
      component: ChronoCodeGame
    },
    {
      id: 'iconic-recall',
      name: 'Iconic Recall',
      category: 'Memory',
      description: 'Remember icons and symbols',
      difficulty: 'Easy',
      icon: FaMemory,
      color: 'from-blue-400 to-blue-600',
      component: IconicRecallGame
    },
    {
      id: 'match-mastery',
      name: 'Match Mastery',
      category: 'Memory',
      description: 'Find matching pairs',
      difficulty: 'Easy',
      icon: FaPuzzlePiece,
      color: 'from-green-400 to-green-600',
      component: MatchMasteryGame
    },
    // Logic Category
    {
      id: 'numeric-shuffle',
      name: 'Numeric Shuffle',
      category: 'Logic',
      description: 'Arrange numbers in correct order',
      difficulty: 'Medium',
      icon: FaSortNumericUp,
      color: 'from-orange-400 to-orange-600',
      component: NumericShuffleGame
    },
    {
      id: 'odd-one-out',
      name: 'Odd One Out',
      category: 'Logic',
      description: 'Identify the item that doesn\'t belong',
      difficulty: 'Hard',
      icon: FaLightbulb,
      color: 'from-yellow-400 to-yellow-600',
      component: OddOneOutGame
    },
    {
      id: 'pattern-match',
      name: 'Pattern Match',
      category: 'Logic',
      description: 'Recognize and complete patterns',
      difficulty: 'Medium',
      icon: FaShapes,
      color: 'from-pink-400 to-pink-600',
      component: PatternMatchGame
    },
    // Focus Category
    {
      id: 'reflex-tap',
      name: 'Reflex Tap',
      category: 'Focus',
      description: 'Tap when target appears',
      difficulty: 'Easy',
      icon: FaMousePointer,
      color: 'from-red-400 to-red-600',
      component: ReflexTapGame
    },
    {
      id: 'signal-switch',
      name: 'Signal Switch',
      category: 'Focus',
      description: 'Respond to color signal changes',
      difficulty: 'Medium',
      icon: FaEye,
      color: 'from-indigo-400 to-indigo-600',
      component: SignalSwitchGame
    }
  ];

  const handleGameComplete = async (gameId, results) => {
    // 1. Immediately update UI to show results (Optimistic Update)
    const game = games.find(g => g.id === gameId);
    const reportData = {
      ...results,
      gameType: gameId,
      gameId,
      childId: currentChildId,
      childName: childName || persistedChildName || 'Child',
      gameName: game ? game.name : results.gameName,
      playedAt: new Date().toISOString()
    };
    
    setSelectedReport(reportData);
    setActiveGame(null);
    
    // Save to session storage to persist across navigation/unmount
    sessionStorage.setItem('lastAttentionResult', JSON.stringify(reportData));

    // 2. Perform background save if possible
    if (!currentChildId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/attention-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          childId: currentChildId,
          gameType: gameId,
          ...results,
          gameName: game ? game.name : results.gameName // Ensure gameName is sent
        })
      });

      if (response.ok) {
        const savedResult = await response.json();
        // Use the saved result but keep our gameId/gameType just in case
        const fullResult = { ...reportData, ...savedResult };
        setSelectedReport(fullResult);
        setGameHistory(prev => [fullResult, ...prev]);

        // Store this attention outcome in the unified screening result pipeline.
        try {
          await fetch('http://localhost:5000/api/screening/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              childName: childName || persistedChildName || 'Child',
              screeningType: 'ATTENTION',
              scores: {
                questionnaireScore: 0,
                attentionScore: Number(fullResult.attentionScore || results.attentionScore || 0),
                mriPrediction: 'Unknown'
              }
            })
          });
        } catch (screeningSaveError) {
          console.error('Failed to save unified attention screening result:', screeningSaveError);
          toast.error('Attention result saved, but dashboard summary sync failed.');
        }
        
        // Update session storage with full result (with ID)
        sessionStorage.setItem('lastAttentionResult', JSON.stringify(fullResult));
        
        // Redirect to results page
        navigate(`/parent/attention-analysis/result?game=${gameId}${currentChildId ? `&childId=${currentChildId}` : ''}`);
      }
    } catch (error) {
      console.error('Background save failed:', error);
    }
  };

  const categories = ['Memory', 'Logic', 'Focus'];

  const getDifficultyColor = (difficulty) => {
    switch(difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const statusClass = (status, inverse = false) => {
    if (inverse) {
      if (status === 'Low') return 'bg-emerald-100 text-emerald-700';
      if (status === 'Moderate') return 'bg-amber-100 text-amber-700';
      return 'bg-rose-100 text-rose-700';
    }
    if (status === 'High') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Moderate') return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  const metricTone = (value, type = 'higher-is-better') => {
    if (type === 'lower-is-better') {
      if (value <= 1.1) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      if (value <= 1.8) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    }

    if (value >= 80) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (value >= 60) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  };

  const reportMetrics = useMemo(() => {
    if (!selectedReport) return null;

    const accuracy = Number(selectedReport.accuracy || 0);
    const reactionTime = Number(selectedReport.reactionTime || 0);
    const mistakes = Number(selectedReport.mistakes || 0);
    const attentionScore = Number(selectedReport.attentionScore || 0);
    const score = Number(selectedReport.score || 0);

    const sustainedAttentionScore = clamp(Math.round(attentionScore), 0, 100);
    const responseSpeedScore = clamp(Math.round(100 - reactionTime * 28), 0, 100);
    const focusStabilityScore = clamp(Math.round((accuracy * 0.7) + ((100 - mistakes * 10) * 0.3)), 0, 100);
    const impulsivityRiskScore = clamp(Math.round((mistakes * 12) + (reactionTime < 0.6 ? 25 : 0)), 0, 100);

    const toLevel = (value) => {
      if (value >= 75) return 'High';
      if (value >= 50) return 'Moderate';
      return 'Low';
    };

    const sustainedAttention = toLevel(sustainedAttentionScore);
    const responseSpeed = toLevel(responseSpeedScore);
    const focusStability = toLevel(focusStabilityScore);
    const impulsivityRisk = impulsivityRiskScore >= 70 ? 'High' : impulsivityRiskScore >= 40 ? 'Moderate' : 'Low';

    return {
      summary: {
        score,
        accuracy,
        reactionTime,
        mistakes,
        attentionScore
      },
      indicators: [
        { key: 'sustained', label: 'Sustained Attention', value: sustainedAttentionScore, status: sustainedAttention, inverse: false },
        { key: 'speed', label: 'Response Speed', value: responseSpeedScore, status: responseSpeed, inverse: false },
        { key: 'stability', label: 'Focus Stability', value: focusStabilityScore, status: focusStability, inverse: false },
        { key: 'impulsivity', label: 'Impulsivity Risk', value: impulsivityRiskScore, status: impulsivityRisk, inverse: true }
      ],
      insight: {
        sustainedAttention,
        responseSpeed,
        focusStability,
        impulsivityRisk
      }
    };
  }, [selectedReport]);

  const chartData = useMemo(() => {
    if (!selectedReport || !reportMetrics) {
      return {
        reactionRounds: [],
        focusRounds: [],
        accuracyPie: []
      };
    }

    const rounds = Array.from({ length: 10 }, (_, idx) => idx + 1);
    const baseRt = Number(selectedReport.reactionTime || 1.2);
    const baseFocus = Number(reportMetrics.indicators.find((i) => i.key === 'stability')?.value || 50);

    const reactionRounds = (selectedReport.reactionRounds && selectedReport.reactionRounds.length > 0)
      ? selectedReport.reactionRounds
      : rounds.map((round) => {
          const trend = (round - 5) * 0.05;
          const wave = Math.sin((round + Number(selectedReport.score || 0)) * 0.8) * 0.2;
          const reaction = clamp(Number((baseRt + trend + wave).toFixed(2)), 0.35, Math.max(3.2, baseRt + 1));
          return { round: `R${round}`, reactionTime: reaction };
        });

    const focusRounds = (selectedReport.focusRounds && selectedReport.focusRounds.length > 0)
      ? selectedReport.focusRounds
      : rounds.map((round, index) => {
          const wave = Math.cos((round + Number(selectedReport.mistakes || 0)) * 0.7) * 9;
          const slope = (index - 4) * 1.5;
          const focus = clamp(Math.round(baseFocus + wave - slope), 25, 98);
          return { round: `R${round}`, focus };
        });

    const accuracyValue = clamp(Number(selectedReport.accuracy || 0), 0, 100);
    const accuracyPie = [
      { name: 'Correct Responses', value: accuracyValue, color: '#34d399' },
      { name: 'Inaccurate Responses', value: 100 - accuracyValue, color: '#fda4af' }
    ];

    return { reactionRounds, focusRounds, accuracyPie };
  }, [selectedReport, reportMetrics]);

  const generatedInsightText = useMemo(() => {
    if (!reportMetrics) return '';

    const { sustainedAttention, responseSpeed, focusStability, impulsivityRisk } = reportMetrics.insight;
    const speedDescription = responseSpeed === 'High'
      ? 'quick and efficient response speed'
      : responseSpeed === 'Moderate'
      ? 'steady response speed with occasional delays'
      : 'slower response speed that may reflect processing delay';

    const sustainedDescription = sustainedAttention === 'High'
      ? 'strong sustained attention'
      : sustainedAttention === 'Moderate'
      ? 'moderate sustained attention'
      : 'reduced sustained attention';

    const stabilityDescription = focusStability === 'High'
      ? 'stable focus consistency across rounds'
      : focusStability === 'Moderate'
      ? 'some fluctuations in focus consistency'
      : 'marked variability in focus consistency';

    const impulseDescription = impulsivityRisk === 'Low'
      ? 'minimal impulsive behavior'
      : impulsivityRisk === 'Moderate'
      ? 'intermittent impulsive responses'
      : 'elevated impulsive responding';

    return `The child demonstrated ${sustainedDescription}, with ${speedDescription}. The session showed ${stabilityDescription} and ${impulseDescription}.`; 
  }, [reportMetrics]);

  const aiObservationText = useMemo(() => {
    if (!reportMetrics || !selectedReport) return '';

    const accuracy = Number(selectedReport.accuracy || 0);
    const mistakes = Number(selectedReport.mistakes || 0);
    const rt = Number(selectedReport.reactionTime || 0);

    if (accuracy >= 85 && mistakes <= 1) {
      return 'Based on this attention activity, the child maintained consistent focus and inhibitory control throughout the task, with highly reliable response accuracy.';
    }

    if (accuracy >= 70 && rt <= 1.8) {
      return 'AI observation suggests balanced performance with appropriate attentional control. Minor consistency shifts were detected, but overall task engagement remained stable.';
    }

    return 'AI observation indicates variable attention regulation during this session. Supportive repetition, paced prompts, and shorter task blocks may improve consistency in future rounds.';
  }, [reportMetrics, selectedReport]);

  const downloadReport = () => {
    if (!selectedReport || !reportMetrics) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('CORTEXA Attention Cognitive Assessment Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Child: ${childName || 'Child'}`, 14, 32);
    doc.text(`Game: ${selectedReport.gameName || 'Attention Game'}`, 14, 39);
    doc.text(`Date: ${new Date(selectedReport.playedAt || Date.now()).toLocaleString()}`, 14, 46);

    doc.text(`Final Score: ${selectedReport.score}`, 14, 58);
    doc.text(`Accuracy: ${selectedReport.accuracy}%`, 14, 65);
    doc.text(`Avg Reaction Time: ${selectedReport.reactionTime}s`, 14, 72);
    doc.text(`Mistakes: ${selectedReport.mistakes}`, 14, 79);

    doc.text('Behavioral Insights:', 14, 92);
    doc.text(doc.splitTextToSize(generatedInsightText, 180), 14, 99);

    doc.text('AI Observation:', 14, 122);
    doc.text(doc.splitTextToSize(aiObservationText, 180), 14, 129);

    doc.save(`attention_report_${childName || 'child'}_${Date.now()}.pdf`);
  };

  const playAgain = () => {
    if (!selectedReport?.gameId) return;
    setActiveGame(selectedReport.gameId);
  };

  const reportMeta = useMemo(() => {
    if (!selectedReport) {
      return {
        dateLabel: new Date().toLocaleString(),
        sessionId: 'N/A'
      };
    }

    return {
      dateLabel: new Date(selectedReport.playedAt || Date.now()).toLocaleString(),
      sessionId: selectedReport._id || `ATTN-${new Date(selectedReport.playedAt || Date.now()).getTime()}`
    };
  }, [selectedReport]);

  // If a game is active, render the game component
  if (activeGame) {
    const game = games.find(g => g.id === activeGame);
    if (game) {
      const GameComponent = game.component;
      return (
        <div className="min-h-screen bg-gray-100">
          <div className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{game.name}</h2>
              <p className="text-sm text-gray-600">{childName ? `Playing as ${childName}` : 'Attention Game'}</p>
            </div>
            <button
              onClick={() => setActiveGame(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Exit Game
            </button>
          </div>
          <GameComponent 
            onComplete={(results) => handleGameComplete(activeGame, results)}
            onExit={() => setActiveGame(null)}
          />
        </div>
      );
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-200 shadow-lg flex flex-col">
        <div className="p-6 border-b border-blue-300">
          <h1 className="text-2xl font-bold text-blue-800">CORTEXA</h1>
          <p className="text-xs text-blue-600 mt-1">ASD Detection & Support</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  navigate(item.path + (currentChildId ? `?childId=${currentChildId}` : ''));
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
              <h1 className="text-3xl font-bold text-gray-800">Attention Behaviour Analysis</h1>
              <p className="text-gray-500 text-sm mt-1">
                {childName ? `Interactive cognitive games for ${childName}` : 'Interactive cognitive training games'}
              </p>
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
            {isResultMode && selectedReport && reportMetrics ? (
              <AttentionAnalysisResults 
                data={{
                  score: selectedReport.score,
                  accuracy: selectedReport.accuracy,
                  reactionTime: `${selectedReport.reactionTime}s`,
                  mistakes: selectedReport.mistakes,
                  attentionScore: reportMetrics.summary.attentionScore,
                  reactionRounds: chartData.reactionRounds
                }}
                childName={childName || selectedReport.childName || persistedChildName || "Child"}
                gameName={games.find(g => g.id === (selectedReport.gameType || selectedReport.gameId))?.name || selectedReport.gameName || "Attention Test"}
                sessionDate={new Date(selectedReport.playedAt || Date.now()).toLocaleDateString()}
                testDuration={selectedReport.completionTime ? `${Math.floor(selectedReport.completionTime / 60)}m ${Math.round(selectedReport.completionTime % 60)}s` : "0m 0s"}
                onPlayAgain={playAgain}
                onReturnHome={() => navigate(`/dashboard${currentChildId ? `?childId=${currentChildId}` : ''}`)}
                onDownload={downloadReport}
              />
            ) : (
              <>
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-4">
                    <FaBrain size={48} className="text-white opacity-90" />
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Welcome to Attention Analysis</h2>
                      <p className="text-cyan-50">
                        These interactive mini-games evaluate attention, memory, logic, and focus through structured cognitive challenges.
                        Complete a game to generate a full professional assessment report.
                      </p>
                    </div>
                  </div>
                </div>

                {gameHistory.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Average Accuracy</p>
                        <p className="text-3xl font-bold text-green-700">
                          {Math.round(gameHistory.reduce((sum, h) => sum + h.accuracy, 0) / gameHistory.length)}%
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Games Played</p>
                        <p className="text-3xl font-bold text-blue-700">{gameHistory.length}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Attention Level</p>
                        <p className="text-3xl font-bold text-purple-700">
                          {(gameHistory.length > 0 && gameHistory[0].attentionLevel) || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {categories.map((category) => (
                  <div key={category} className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      {category === 'Memory' && <FaMemory className="text-purple-600" />}
                      {category === 'Logic' && <FaLightbulb className="text-orange-600" />}
                      {category === 'Focus' && <FaEye className="text-red-600" />}
                      {category}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {games.filter((game) => game.category === category).map((game) => {
                        const Icon = game.icon;
                        return (
                          <div
                            key={game.id}
                            onClick={() => navigate(`/parent/attention-analysis/play?game=${game.id}${currentChildId ? `&childId=${currentChildId}` : ''}`)}
                            className="cursor-pointer bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-blue-300 transition-all transform hover:-translate-y-1"
                          >
                            <div className={`w-16 h-16 bg-gradient-to-br ${game.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                              <Icon className="text-white" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{game.name}</h3>
                            <p className="text-sm text-gray-600 mb-3">{game.description}</p>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getDifficultyColor(game.difficulty)}`}>
                                {game.difficulty}
                              </span>
                              <FaGamepad className="text-gray-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttentionAnalysisPage;
