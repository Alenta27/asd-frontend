import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { PlayCircle, Mic, Square, Upload, AlertCircle, CheckCircle, Volume2, Star, Award, Trophy, Info, LineChart, Lock, Zap, User as UserIcon, Loader2 } from 'lucide-react';
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SubscriptionModal from '../components/SubscriptionModal';
import ParentRegistrationModal from '../components/ParentRegistrationModal';
import AddChildModal from '../components/AddChildModal';

/**
 * SPEECH THERAPY REDESIGN - CORE ARCHITECTURE
 * 
 * CRITICAL RULES (MUST FOLLOW):
 * ================================
 * 
 * 1. ENGLISH IS FREE
 *    - No login required
 *    - No child registration required
 *    - No payment required
 *    - Immediate access
 * 
 * 2. MALAYALAM & HINDI ARE PREMIUM
 *    - Require: Parent Profile → Child Profile → Valid Payment
 *    - Payment tied to childId (NOT user)
 *    - Backend is single source of truth
 * 
 * 3. NO PERSISTENCE BUGS - FIXED ARCHITECTURE
 *    - NEVER store isPro in localStorage ✓
 *    - NEVER store subscriptionStatus in localStorage ✓
 *    - ONLY store: parentId, selectedChildId ✓
 *    - ALWAYS verify with backend on child selection ✓
 *    - Backend GET /api/speech-therapy/subscription-status is ONLY source ✓
 * 
 * 4. SUBSCRIPTION VERIFICATION
 *    - Run once per child selection
 *    - Have timeout (prevent infinite loaders)
 *    - Fallback to FREE on timeout/error
 *    - Never block UI forever
 *    - NO localStorage caching of subscription state
 * 
 * 5. CHILD-CENTRIC MODEL
 *    Each child has:
 *    {
 *      childId,
 *      parentId,
 *      subscriptionStatus: 'NONE' | 'ACTIVE' | 'EXPIRED',
 *      subscriptionExpiry: Date | null
 *    }
 * 
 * 6. PAYMENT FLOW
 *    - User pays → Razorpay success
 *    - POST /api/subscription/verify-payment with childId
 *    - Backend saves subscription with childId and expiry
 *    - Frontend re-fetches GET /api/speech-therapy/subscription-status
 *    - UI updates based on backend response ONLY
 */

export default function SpeechTherapyChildPage() {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  
  // Child & Parent Management
  const [selectedChild, setSelectedChild] = useState('');
  const [children, setChildren] = useState([]);
  const [parentId, setParentId] = useState(''); // NEVER use localStorage as source of truth
  const [parentInfo, setParentInfo] = useState(null);
  
  // Subscription State (Reset on reload - backend is source of truth)
  // CRITICAL: Default is NONE - Pro badge will ONLY show after backend confirms ACTIVE
  const [childSubscription, setChildSubscription] = useState({
    status: 'NONE', // 'NONE' | 'ACTIVE' | 'EXPIRED'
    expiry: null,
    isVerifying: false,
    lastChecked: null
  });
  
  // Audio Recording
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  // Speech Practice
  const [practicePrompt, setPracticePrompt] = useState('');
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [recognizedText, setRecognizedText] = useState('');
  const [matchScore, setMatchScore] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interimText, setInterimText] = useState('');
  
  // UI State
  const [showCelebration, setShowCelebration] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [activeTab, setActiveTab] = useState('practice');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [dailySessionCount, setDailySessionCount] = useState(0);
  
  // Modal Control
  const [showParentRegModal, setShowParentRegModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // App Initialization State
  const [isAppInitialized, setIsAppInitialized] = useState(false);
  
  // Refs
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const sampleAudioRef = useRef(null);
  const audioBlobUrl = useRef(null);
  const recognitionRef = useRef(null);
  const recognitionResultsRef = useRef([]);
  const subscriptionTimeoutRef = useRef(null);

  const sessionLimit = 5;

  // ============================================================
  // LANGUAGE CONFIGURATIONS
  // ============================================================
  
  const languages = [
    { code: 'en-US', name: 'English', flag: '🇺🇸', isFree: true },
    { code: 'ml-IN', name: 'മലയാളം (Malayalam)', flag: '🇮🇳', isFree: false },
    { code: 'hi-IN', name: 'हिंदी (Hindi)', flag: '🇮🇳', isFree: false }
  ];

  // Language-specific practice prompts
  const languagePrompts = {
    'en-US': [
      { text: 'Hello', description: 'Say "Hello"', icon: '👋', color: 'blue' },
      { text: 'Thank you', description: 'Say "Thank you"', icon: '🙏', color: 'purple' },
      { text: 'Good morning', description: 'Say "Good morning"', icon: '☀️', color: 'yellow' },
      { text: 'I am happy', description: 'Say "I am happy"', icon: '😊', color: 'pink' },
      { text: 'Can I play?', description: 'Say "Can I play?"', icon: '⚽', color: 'green' },
      { text: 'I like this', description: 'Say "I like this"', icon: '👍', color: 'indigo' },
      { text: 'Help me please', description: 'Say "Help me please"', icon: '🙋', color: 'teal' },
      { text: 'My name is', description: 'Say "My name is..."', icon: '🆔', color: 'cyan' }
    ],
    'ml-IN': [
      { text: 'നമസ്കാരം', description: 'Say "നമസ്കാരം" (Hello)', icon: '👋', color: 'blue' },
      { text: 'നന്ദി', description: 'Say "നന്ദി" (Thank you)', icon: '🙏', color: 'purple' },
      { text: 'സുപ്രഭാതം', description: 'Say "സുപ്രഭാതം" (Good morning)', icon: '☀️', color: 'yellow' },
      { text: 'എനിക്ക് സന്തോഷമാണ്', description: 'Say "എനിക്ക് സന്തോഷമാണ്" (I am happy)', icon: '😊', color: 'pink' },
      { text: 'എനിക്ക് കളിക്കാമോ?', description: 'Say "എനിക്ക് കളിക്കാമോ?" (Can I play?)', icon: '⚽', color: 'green' },
      { text: 'എനിക്കിത് ഇഷ്ടമാണ്', description: 'Say "എനിക്കിത് ഇഷ്ടമാണ്" (I like this)', icon: '👍', color: 'indigo' },
      { text: 'എന്നെ സഹായിക്കുക', description: 'Say "എന്നെ സഹായിക്കുക" (Help me)', icon: '🙋', color: 'teal' },
      { text: 'എന്റെ പേര്', description: 'Say "എന്റെ പേര്" (My name)', icon: '🆔', color: 'cyan' }
    ],
    'hi-IN': [
      { text: 'नमस्ते', description: 'Say "नमस्ते" (Hello)', icon: '👋', color: 'blue' },
      { text: 'धन्यवाद', description: 'Say "धन्यवाद" (Thank you)', icon: '🙏', color: 'purple' },
      { text: 'सुप्रभात', description: 'Say "सुप्रभात" (Good morning)', icon: '☀️', color: 'yellow' },
      { text: 'मैं खुश हूँ', description: 'Say "मैं खुश हूँ" (I am happy)', icon: '😊', color: 'pink' },
      { text: 'क्या मैं खेल सकता हूँ?', description: 'Say "क्या मैं खेल सकता हूँ?" (Can I play?)', icon: '⚽', color: 'green' },
      { text: 'मुझे यह पसंद है', description: 'Say "मुझे यह पसंद है" (I like this)', icon: '👍', color: 'indigo' },
      { text: 'मेरी मदद करें', description: 'Say "मेरी मदद करें" (Help me)', icon: '🙋', color: 'teal' },
      { text: 'मेरा नाम', description: 'Say "मेरा नाम" (My name)', icon: '🆔', color: 'cyan' }
    ]
  };

  // Language-specific phonemes
  const languagePhonemes = {
    'en-US': [
      { text: 'BA', icon: '🐑', color: 'blue' },
      { text: 'MA', icon: '👩', color: 'pink' },
      { text: 'PA', icon: '👨', color: 'purple' },
      { text: 'TA', icon: '🥁', color: 'orange' },
      { text: 'DA', icon: '🦆', color: 'yellow' },
      { text: 'LA', icon: '🍭', color: 'red' },
      { text: 'SA', icon: '🐍', color: 'green' },
      { text: 'KA', icon: '🔑', color: 'teal' }
    ],
    'ml-IN': [
      { text: 'അ', icon: '🎵', color: 'blue' },
      { text: 'ആ', icon: '🌟', color: 'pink' },
      { text: 'ഇ', icon: '✨', color: 'purple' },
      { text: 'ഈ', icon: '💫', color: 'orange' },
      { text: 'ക', icon: '🦆', color: 'yellow' },
      { text: 'മ', icon: '👩', color: 'red' },
      { text: 'പ', icon: '👨', color: 'green' },
      { text: 'ത', icon: '🥁', color: 'teal' }
    ],
    'hi-IN': [
      { text: 'अ', icon: '🎵', color: 'blue' },
      { text: 'आ', icon: '🌟', color: 'pink' },
      { text: 'इ', icon: '✨', color: 'purple' },
      { text: 'ई', icon: '💫', color: 'orange' },
      { text: 'क', icon: '🔑', color: 'yellow' },
      { text: 'म', icon: '👩', color: 'red' },
      { text: 'प', icon: '👨', color: 'green' },
      { text: 'त', icon: '🥁', color: 'teal' }
    ]
  };

  // Get current language prompts and phonemes
  const practicePrompts = languagePrompts[selectedLanguage] || languagePrompts['en-US'];
  const phonemes = languagePhonemes[selectedLanguage] || languagePhonemes['en-US'];

  const colorMap = {
    blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-blue-700',
    purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300 text-purple-700',
    yellow: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 hover:border-yellow-300 text-yellow-700',
    pink: 'bg-pink-50 hover:bg-pink-100 border-pink-200 hover:border-pink-300 text-pink-700',
    green: 'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300 text-green-700',
    indigo: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-300 text-indigo-700',
    teal: 'bg-teal-50 hover:bg-teal-100 border-teal-200 hover:border-teal-300 text-teal-700',
    cyan: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 hover:border-cyan-300 text-cyan-700',
    orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-300 text-orange-700',
    red: 'bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300 text-red-700'
  };

  // ============================================================
  // ACCESS CONTROL LOGIC
  // ============================================================
  
  /**
   * WHY: Determines if user can access current language
   * 
   * RULES:
   * - English (en-US) = ALWAYS FREE (no checks needed)
   * - Malayalam/Hindi = Requires childSubscription.status === 'ACTIVE'
   * 
   * CRITICAL SAFETY: Pro badge only shows when:
   * 1. selectedChild exists
   * 2. Backend has verified (not isVerifying)
   * 3. Backend returned status === 'ACTIVE'
   * 
   * NEVER uses localStorage or persisted flags
   * 
   * DEBUG: Log subscription state for troubleshooting
   */
  const isEnglish = selectedLanguage === 'en-US';
  const isPremiumLanguage = !isEnglish;
  // CRITICAL: Pro badge requires backend confirmation AND child selection
  const hasActiveSubscription = (
    selectedChild && 
    !childSubscription.isVerifying && 
    childSubscription.status === 'ACTIVE'
  );
  const canAccessCurrentLanguage = isEnglish || hasActiveSubscription;
  
  // Debug logging for subscription access
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 [SUBSCRIPTION STATE] Current Status:');
    console.log('  👶 Selected Child:', selectedChild || 'NONE');
    console.log('  🌍 Selected Language:', selectedLanguage);
    console.log('  📋 Subscription Status:', childSubscription.status);
    console.log('  📅 Subscription Expiry:', childSubscription.expiry);
    console.log('  🔄 Is Verifying:', childSubscription.isVerifying);
    console.log('  ✅ Has Active Subscription:', hasActiveSubscription);
    console.log('  🔓 Can Access Current Language:', canAccessCurrentLanguage);
    
    if (hasActiveSubscription) {
      console.log('  🎖️  WILL SHOW PRO BADGE: YES ✅');
      console.log('  ⚠️  PRO SOURCE: Backend database (NOT localStorage)');
      console.log('  💡 This child has a valid subscription from payment');
    } else {
      console.log('  🎖️  WILL SHOW PRO BADGE: NO ❌');
      console.log('  💡 Showing FREE mode - no active subscription');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, [selectedChild, selectedLanguage, childSubscription.status, childSubscription.isVerifying, hasActiveSubscription]);

  // ============================================================
  // APP INITIALIZATION
  // ============================================================
  
  /**
   * WHY: On app load, we RESET state and load parent data
   * 
   * CRITICAL FIX: NO caching of subscription status
   * Backend is the ONLY source of truth
   */
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [APP INITIALIZATION] Starting...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // STEP 0: AGGRESSIVE CLEANUP - Remove ALL subscription cache keys
    console.log('🧹 [CLEANUP] Removing cached subscription data...');
    const subscriptionKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('subscription_') || 
      key === 'isPro' || 
      key === 'subscriptionStatus' ||
      key === 'speech_user' ||
      key === 'hasPro'
    );
    subscriptionKeys.forEach(key => {
      console.log('  ❌ Removing:', key);
      localStorage.removeItem(key);
    });
    console.log('✅ [CLEANUP] Complete - No cached subscription data');
    
    // STEP 1: Check localStorage for saved IDs
    const savedChildId = localStorage.getItem('selectedChildId');
    const savedParentId = localStorage.getItem('parentId');
    const storedParentData = localStorage.getItem('speech_parent');
    
    console.log('📦 [LOCALSTORAGE CHECK]:');
    console.log('  └─ selectedChildId:', savedChildId || 'NOT FOUND');
    console.log('  └─ parentId:', savedParentId || 'NOT FOUND');
    console.log('  └─ speech_parent:', storedParentData ? 'FOUND' : 'NOT FOUND');
    
    // STEP 2: Restore child selection from localStorage
    // WHY: User shouldn't have to re-select after refresh
    if (savedChildId) {
      console.log('📌 Restoring selected child:', savedChildId);
      console.log('⚠️  IMPORTANT: Subscription will be verified from BACKEND (NO cache used)');
      setSelectedChild(savedChildId);
      // Subscription will be verified from backend in separate useEffect
    } else {
      console.log('ℹ️  No saved child found - starting fresh');
    }
    
    // STEP 3: Check if parent is registered (from localStorage)
    // WHY: Parent registration is persistent (doesn't expire)
    if (savedParentId) {
      console.log('📌 Restoring parent:', savedParentId);
      setParentId(savedParentId);
      fetchChildren(savedParentId);
      
      // Also restore parent info if available
      if (storedParentData) {
        try {
          const parentData = JSON.parse(storedParentData);
          setParentInfo(parentData);
          console.log('✅ Parent info restored:', parentData.parentName);
        } catch (e) {
          console.error('❌ Failed to parse parent data:', e);
        }
      }
    } else {
      console.log('ℹ️  No saved parent found - starting fresh');
    }
    
    // STEP 4: Mark app as initialized
    setIsAppInitialized(true);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [APP INITIALIZATION] Complete');
    console.log('   → Subscription Status: NONE (will verify from backend)');
    console.log('   → Pro Badge: HIDDEN (until backend confirms)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, []);

  // ============================================================
  // SUBSCRIPTION VERIFICATION
  // ============================================================
  
  /**
   * WHY: When child is selected, verify their subscription from backend
   * 
   * CRITICAL IMPROVEMENTS:
   * 1. Timeout after 10 seconds (prevents infinite loader)
   * 2. Fallback to FREE on error (never block UI)
   * 3. Only runs when child changes (not on every render)
   * 4. Clears previous timeout to prevent memory leaks
   * 5. NO localStorage caching - backend is single source of truth
   */
  useEffect(() => {
    if (!selectedChild) {
      // No child selected - reset to NONE
      setChildSubscription({
        status: 'NONE',
        expiry: null,
        isVerifying: false,
        lastChecked: null
      });
      // Clear from localStorage
      localStorage.removeItem('selectedChildId');
      return;
    }
    
    // Save ONLY childId to localStorage for persistence across refreshes
    // DO NOT save subscription status
    localStorage.setItem('selectedChildId', selectedChild);
    console.log('💾 Saved selected child to localStorage:', selectedChild);
    
    // Verify subscription from backend
    verifyChildSubscription(selectedChild);
    
    // Cleanup timeout on unmount or child change
    return () => {
      if (subscriptionTimeoutRef.current) {
        clearTimeout(subscriptionTimeoutRef.current);
      }
    };
  }, [selectedChild]);

  /**
   * WHY: Fetches subscription status from backend with timeout protection
   * 
   * BACKEND CONTRACT:
   * GET /api/speech-therapy/subscription-status?childId=xxx
   * 
   * Returns:
   * {
   *   status: 'ACTIVE' | 'EXPIRED' | 'NONE',
   *   expiry: 'ISO_DATE' | null
   * }
   * 
   * CRITICAL: NO localStorage caching - backend is single source of truth
   */
  const verifyChildSubscription = async (childId) => {
    console.log(`🔍 Verifying subscription for child: ${childId}`);
    console.log('⚠️ Backend is SINGLE source of truth - no cache used');
    
    setChildSubscription(prev => ({
      ...prev,
      isVerifying: true
    }));
    
    // CRITICAL: Set timeout to prevent infinite loader
    // WHY: If backend is down or slow, we fallback to FREE after 10 seconds
    subscriptionTimeoutRef.current = setTimeout(() => {
      console.warn('⏱️ Subscription verification timeout - falling back to FREE');
      setChildSubscription({
        status: 'NONE',
        expiry: null,
        isVerifying: false,
        lastChecked: new Date()
      });
    }, 10000); // 10 second timeout
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/speech-therapy/subscription-status?childId=${childId}`,
        { timeout: 8000 } // 8 second request timeout
      );
      
      // Clear timeout on successful response
      clearTimeout(subscriptionTimeoutRef.current);
      
      const { status, expiry } = response.data;
      
      console.log(`✅ Subscription verified from backend: ${status}`, expiry ? `(expires: ${expiry})` : '');
      
      const newSubscription = {
        status: status, // 'ACTIVE' | 'EXPIRED' | 'NONE'
        expiry: expiry ? new Date(expiry) : null,
        isVerifying: false,
        lastChecked: new Date()
      };
      
      setChildSubscription(newSubscription);
      
      // DO NOT cache subscription status in localStorage
      // Backend is the ONLY source of truth
      
      // Fetch progress data
      if (status === 'ACTIVE') {
        fetchProgress(childId);
      }
      
    } catch (error) {
      console.error('❌ Subscription verification failed:', error);
      
      // Clear timeout on error
      clearTimeout(subscriptionTimeoutRef.current);
      
      // CRITICAL: Fallback to FREE on error (never block UI)
      setChildSubscription({
        status: 'NONE',
        expiry: null,
        isVerifying: false,
        lastChecked: new Date()
      });
    }
  };

  // ============================================================
  // LANGUAGE SELECTION HANDLER
  // ============================================================
  
  /**
   * WHY: Handle language changes with proper access control
   * 
   * FLOW:
   * 1. If English → Allow immediately (FREE)
   * 2. If Malayalam/Hindi:
   *    a. Check if parent exists → Show Parent Modal
   *    b. Check if child exists → Show Child Modal
   *    c. Check if subscription active → Show Payment Modal
   *    d. If all good → Allow access
   */
  const handleLanguageChange = (languageCode) => {
    const selectedLang = languages.find(l => l.code === languageCode);
    
    // RULE: English is ALWAYS FREE - no checks needed
    if (selectedLang.isFree) {
      console.log('🆓 Switching to English (FREE)');
      setSelectedLanguage(languageCode);
      return;
    }
    
    // RULE: Premium languages require full flow
    console.log(`🔒 Attempting to access premium language: ${selectedLang.name}`);
    console.log('Current subscription status:', childSubscription);
    
    // Step 1: Check Parent
    if (!parentId) {
      console.log('❌ No parent - showing registration modal');
      alert('Premium languages require registration. Please create a parent profile.');
      setShowParentRegModal(true);
      return;
    }
    
    // Step 2: Check Child
    if (!selectedChild) {
      console.log('❌ No child selected - showing child modal');
      alert('Please select or add a child to access premium languages.');
      setShowAddChildModal(true);
      return;
    }
    
    // Step 2.5: Handle verification in progress
    if (childSubscription.isVerifying) {
      console.log('⏳ Subscription verification in progress, please wait...');
      alert('Checking your subscription status. Please wait a moment and try again.');
      return;
    }
    
    // Step 3: Check Subscription (with detailed logging)
    if (childSubscription.status !== 'ACTIVE') {
      console.log('❌ No active subscription');
      console.log('Subscription status:', childSubscription.status);
      console.log('Subscription expiry:', childSubscription.expiry);
      
      // Check if subscription just expired
      if (childSubscription.status === 'EXPIRED') {
        alert(`Your subscription has expired. Please renew to access ${selectedLang.name}.`);
      } else {
        alert(`${selectedLang.name} requires a PRO subscription. Upgrade to access premium languages.`);
      }
      setShowSubscriptionModal(true);
      return;
    }
    
    // All checks passed - allow access
    console.log(`✅ Access granted to ${selectedLang.name}`);
    console.log('Subscription expiry:', childSubscription.expiry);
    setSelectedLanguage(languageCode);
  };

  // ============================================================
  // DATA FETCHING
  // ============================================================
  
  const fetchChildren = async (pId) => {
    try {
      const pid = pId || parentId;
      if (!pid) return;

      const response = await axios.get(`http://localhost:5000/api/speech-therapy/children/${pid}`);
      setChildren(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren([]);
    }
  };

  const fetchProgress = async (childId) => {
    if (!childId || !parentId) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/speech-therapy/progress/${childId}?parentId=${parentId}`);

      if (response.data.sessions && response.data.sessions.length > 0) {
        setProgressData(response.data.sessions.map(s => ({
          name: new Date(s.date).toLocaleDateString(),
          score: s.rating === 'Good' ? 3 : s.rating === 'Average' ? 2 : s.rating === 'Poor' ? 1 : 0
        })));

        // Calculate daily session count
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todaySessions = response.data.sessions.filter(s => new Date(s.date) >= startOfDay);
        setDailySessionCount(todaySessions.length);
      } else {
        setProgressData([
          { name: 'Day 1', score: 1 },
          { name: 'Day 2', score: 1.5 },
          { name: 'Day 3', score: 2 },
          { name: 'Day 4', score: 2.5 },
          { name: 'Day 5', score: 3 },
        ]);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  // ============================================================
  // REGISTRATION HANDLERS
  // ============================================================
  
  const handleParentRegistered = (data) => {
    console.log('✅ Parent registered:', data.parentId);
    setParentId(data.parentId);
    setParentInfo(data.parent);
    
    // Store ONLY parentId and parent info (not subscription status)
    localStorage.setItem('parentId', data.parentId);
    localStorage.setItem('speech_parent', JSON.stringify(data.parent));
    // Keep legacy keys for compatibility
    localStorage.setItem('speech_parent_id', data.parentId);
    localStorage.setItem('speechParentId', data.parentId);
    
    setShowParentRegModal(false);
    fetchChildren(data.parentId);
  };

  const handleChildSelect = (e) => {
    const value = e.target.value;
    if (value === 'add-new') {
      if (!parentId) {
        alert('Please create a parent profile first');
        setShowParentRegModal(true);
        return;
      }
      setShowAddChildModal(true);
    } else {
      setSelectedChild(value);
    }
  };

  const handleAddChildSuccess = (newChild) => {
    console.log('✅ Child added:', newChild._id);
    setChildren([...children, newChild]);
    setSelectedChild(newChild._id);
    setShowAddChildModal(false);
  };

  const handleUpgrade = async (verificationResult) => {
    console.log('✅ Payment successful - refreshing subscription', verificationResult);
    setShowSubscriptionModal(false);
    
    // CRITICAL: Re-fetch subscription from backend after payment
    // DO NOT trust the verification result directly, always verify with backend
    if (selectedChild) {
      console.log('🔄 Re-fetching subscription status from backend after payment...');
      
      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Re-verify subscription from backend (single source of truth)
      await verifyChildSubscription(selectedChild);
      
      // Show success message with instructions
      alert(`🎉 Premium features unlocked!\n\nYou can now select Malayalam or Hindi from the language selector above.`);
    } else {
      console.warn('No child selected after payment');
    }
  };

  // ============================================================
  // SPEECH RECOGNITION
  // ============================================================
  
  // Initialize/Update speech recognition when language changes
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
      console.log('Speech recognition initialized for language:', selectedLanguage);
    } else {
      console.warn('Speech Recognition API not supported');
    }
    
    // Reset selected prompt when language changes
    setPracticePrompt('');
    setRecognizedText('');
    setMatchScore(null);
    setInterimText('');
  }, [selectedLanguage]);

  // Cleanup: Stop media stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        console.log('Media stream stopped');
      }
      if (audioBlobUrl.current) {
        URL.revokeObjectURL(audioBlobUrl.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }
    };
  }, [stream]);

  // Calculate similarity between two strings (0-100%)
  const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;
    
    // Levenshtein distance algorithm
    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    
    return Math.round(similarity);
  };
  
  // Language-specific feedback messages
  const feedbackMessages = {
    'en-US': {
      excellent: "Amazing! Perfect pronunciation! 🌟",
      great: "Great job! Very close! 👏",
      good: "Good try! Keep practicing! 💪",
      almost: "Almost there! Try again! 🙂",
      keep: "Keep going! You can do it! 🌈"
    },
    'ml-IN': {
      excellent: "അതിശയം! മികച്ച ഉച്ചാരണം! 🌟",
      great: "നല്ല പ്രവർത്തനം! വളരെ അടുത്തു! 👏",
      good: "നല്ല ശ്രമം! തുടർന്ന് പരിശീലിക്കുക! 💪",
      almost: "ഏതാണ്ട് എത്തി! വീണ്ടും ശ്രമിക്കുക! 🙂",
      keep: "തുടരുക! നിങ്ങൾക്ക് ചെയ്യാൻ കഴിയും! 🌈"
    },
    'hi-IN': {
      excellent: "अद्भुत! एकदम सही उच्चारण! 🌟",
      great: "बहुत अच्छा! बहुत करीब! 👏",
      good: "अच्छी कोशिश! अभ्यास जारी रखें! 💪",
      almost: "लगभग पहुँच गए! फिर से कोशिश करें! 🙂",
      keep: "जारी रखें! आप कर सकते हैं! 🌈"
    }
  };
  
  const generateFeedback = (score) => {
    const messages = feedbackMessages[selectedLanguage] || feedbackMessages['en-US'];
    
    if (score >= 90) {
      return {
        message: messages.excellent,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        icon: '🎉'
      };
    } else if (score >= 75) {
      return {
        message: messages.great,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        icon: '👍'
      };
    } else if (score >= 60) {
      return {
        message: messages.good,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        icon: '⭐'
      };
    } else if (score >= 40) {
      return {
        message: messages.almost,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        icon: '💫'
      };
    } else {
      return {
        message: messages.keep,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300',
        icon: '🌟'
      };
    }
  };

  const getMicrophonePermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording. Please use Chrome, Firefox, or Edge.");
      return;
    }

    try {
      const streamData = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      setPermission(true);
      setStream(streamData);
      console.log('Microphone access granted');
    } catch (err) {
      console.error('Microphone permission error:', err);
      if (err.name === 'NotAllowedError') {
        alert("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (err.name === 'NotFoundError') {
        alert("No microphone found. Please connect a microphone and try again.");
      } else {
        alert("Error accessing microphone: " + err.message);
      }
    }
  };

  const playSampleAudio = (textToPlay = practicePrompt) => {
    if (!textToPlay) {
      alert('Please select a practice prompt first!');
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(textToPlay);
    utterance.rate = playbackSpeed;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => setIsPlayingSample(true);
    utterance.onend = () => setIsPlayingSample(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const startSpeechRecognition = () => {
    if (!recognitionRef.current) {
      console.warn('Speech recognition not available');
      return;
    }

    recognitionResultsRef.current = [];
    setRecognizedText('');
    setInterimText('');
    setMatchScore(null);

    const recognition = recognitionRef.current;

    recognition.onstart = () => {
      console.log('Speech recognition started');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          recognitionResultsRef.current.push(transcript);
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript);
      }
      
      if (finalTranscript) {
        const allText = recognitionResultsRef.current.join(' ');
        console.log('Final transcript so far:', allText);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        console.log('No speech detected, but continuing...');
      } else if (event.error !== 'aborted') {
        setFeedbackMessage('Speech recognition error: ' + event.error);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
    };

    try {
      recognition.start();
      console.log('Speech recognition started successfully');
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  const stopSpeechRecognition = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      
      setTimeout(() => {
        const finalText = recognitionResultsRef.current.join(' ').trim();
        console.log('Final recognized text:', finalText);
        
        if (finalText) {
          setRecognizedText(finalText);
          
          const score = calculateSimilarity(finalText, practicePrompt);
          setMatchScore(score);
          
          const feedback = generateFeedback(score);
          setFeedbackMessage(feedback.message);
          
          if (score >= 90) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
          }
        } else {
          setRecognizedText('(No speech detected)');
          setMatchScore(0);
          setFeedbackMessage('Try speaking louder or closer to the microphone.');
        }
        
        setInterimText('');
      }, 500);
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  };

  /**
   * WHY: Recording start with proper access control
   * 
   * CRITICAL FLOW:
   * 1. If English → Start immediately (NO checks)
   * 2. If Malayalam/Hindi:
   *    - Check parent → Show parent modal
   *    - Check child → Show child modal  
   *    - Check subscription → Show payment modal
   *    - If all pass → Start recording
   */
  const startRecording = () => {
    // RULE: English is FREE - no checks needed
    if (isEnglish) {
      console.log('🆓 English recording - starting immediately');
      beginRecording();
      return;
    }
    
    // RULE: Premium languages require full authentication flow
    console.log('🔒 Premium language recording - checking access...');
    
    // Step 1: Check Parent
    if (!parentId) {
      console.log('❌ No parent - showing registration modal');
      setShowParentRegModal(true);
      return;
    }
    
    // Step 2: Check Child
    if (!selectedChild) {
      console.log('❌ No child selected');
      alert('Please select a child first');
      setShowAddChildModal(true);
      return;
    }
    
    // Step 3: Check Subscription
    if (childSubscription.status !== 'ACTIVE') {
      console.log('❌ No active subscription');
      alert('Premium languages require an active subscription');
      setShowSubscriptionModal(true);
      return;
    }
    
    // All checks passed - start recording
    console.log('✅ Access granted - starting recording');
    beginRecording();
  };

  /**
   * WHY: Actual recording logic (separated from access control)
   */
  const beginRecording = () => {
    if (!practicePrompt) {
      alert('Please select a practice prompt first!');
      return;
    }

    if (!stream) {
      alert('Microphone not initialized. Please enable microphone first.');
      return;
    }

    try {
      audioChunks.current = [];
      recognitionResultsRef.current = [];
      setAudioBlob(null);
      setUploadStatus(null);
      setRecognizedText('');
      setInterimText('');
      setMatchScore(null);
      setFeedbackMessage('');
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const media = new MediaRecorder(stream, { mimeType });
      mediaRecorder.current = media;

      media.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.current.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      media.onstop = () => {
        console.log('Recording stopped. Total chunks:', audioChunks.current.length);
        if (audioChunks.current.length > 0) {
          const blob = new Blob(audioChunks.current, { type: mimeType });
          console.log('Audio blob created:', blob.size, 'bytes');
          setAudioBlob(blob);
        } else {
          console.error('No audio data captured');
          alert('No audio was recorded. Please try again.');
        }
      };

      media.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        alert('Recording error: ' + event.error);
        setIsRecording(false);
      };

      media.start();
      setIsRecording(true);
      console.log('Recording started with MIME type:', mimeType);
      
      setTimeout(() => {
        startSpeechRecognition();
      }, 100);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Failed to start recording: ' + err.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder.current) {
      console.error('No active recording');
      return;
    }

    try {
      if (mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
        setIsRecording(false);
        console.log('Stopping recording...');
        
        stopSpeechRecognition();
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      alert('Error stopping recording: ' + err.message);
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) {
      alert('Please record audio first!');
      return;
    }

    // For English: Allow guest uploads (no authentication required)
    // For Premium: Require parent and child
    if (isPremiumLanguage) {
      if (!parentId) {
        setShowParentRegModal(true);
        return;
      }

      if (!selectedChild) {
        setShowAddChildModal(true);
        return;
      }
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'speech-recording.webm');
      formData.append('practicePrompt', practicePrompt);
      formData.append('language', selectedLanguage);
      
      // Only include auth data for premium languages
      if (isPremiumLanguage && parentId && selectedChild) {
        formData.append('childId', selectedChild);
        formData.append('parentId', parentId);
      }

      const response = await axios.post(
        'http://localhost:5000/api/speech-therapy/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const aiResult = response.data.session?.aiSimilarityScore ? {
        aiSimilarityScore: response.data.session.aiSimilarityScore,
        aiFeedback: response.data.session.aiFeedback
      } : null;

      setUploadStatus({ 
        type: 'success', 
        message: 'Great job! Recording sent for review.',
        aiResult
      });
      setAudioBlob(null);
      setPracticePrompt('');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
      
      if (selectedChild) {
        fetchProgress(selectedChild);
      }
      
    } catch (error) {
      console.error('Error uploading recording:', error);
      setUploadStatus({ type: 'error', message: 'Failed to upload recording. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================================
  // RENDER: Loading State
  // ============================================================
  
  /**
   * WHY: Show loader ONLY when verifying subscription for selected child
   * 
   * NEVER show loader on initial app load
   */
  if (!isAppInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 font-bold">Loading Speech Therapy...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: Main UI
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block bg-white rounded-3xl shadow-sm px-8 py-6 mb-6">
            <h1 className="text-4xl font-bold text-gray-700 mb-2 flex items-center justify-center gap-3">
              <span className="text-5xl">🎤</span>
              Speech Practice
            </h1>
            <p className="text-gray-500 text-base font-medium">
              Practice speaking in a fun and calm way!
            </p>
            
            {/* Subscription Status Badge */}
            <div className="mt-4 flex justify-center gap-2 flex-wrap">
              {hasActiveSubscription && selectedChild ? (
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Star size={12} fill="currentColor" />
                  SPEECH THERAPY PRO
                </span>
              ) : (
                <>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    🆓 ENGLISH IS FREE
                  </span>
                  <button 
                    onClick={() => setShowSubscriptionModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg"
                  >
                    <Zap size={12} fill="currentColor" />
                    UPGRADE TO PRO
                  </button>
                </>
              )}
              
              {/* Verification Status */}
              {childSubscription.isVerifying && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Loader2 size={12} className="animate-spin" />
                  Verifying...
                </span>
              )}
              
              {/* Manual Refresh Button for PRO users */}
              {selectedChild && hasActiveSubscription && (
                <button
                  onClick={() => verifyChildSubscription(selectedChild)}
                  disabled={childSubscription.isVerifying}
                  className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm transition-all"
                  title="Refresh subscription status"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              )}
              
              {parentId && selectedChild && !hasActiveSubscription && !isEnglish && (
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                  Sessions: {dailySessionCount}/{sessionLimit} today
                </span>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex justify-center gap-3 mb-6">
            <button 
              onClick={() => setActiveTab('practice')}
              className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-sm ${
                activeTab === 'practice' 
                  ? 'bg-blue-100 text-blue-700 shadow-md scale-105' 
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Practice
            </button>
            <button 
              onClick={() => {
                if (!canAccessCurrentLanguage && isPremiumLanguage) {
                  setShowSubscriptionModal(true);
                } else {
                  setActiveTab('progress');
                }
              }}
              className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-sm ${
                activeTab === 'progress' 
                  ? 'bg-indigo-100 text-indigo-700 shadow-md scale-105' 
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              } ${!canAccessCurrentLanguage && isPremiumLanguage ? 'relative' : ''}`}
            >
              My Progress
              {!canAccessCurrentLanguage && isPremiumLanguage && <Lock size={12} className="absolute top-2 right-2 text-gray-400" />}
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex justify-center">
            <div className="inline-flex bg-white rounded-2xl shadow-sm p-2 gap-2">
              {languages.map((lang) => {
                const isCurrentlySelected = selectedLanguage === lang.code;
                const canAccess = lang.isFree || hasActiveSubscription;
                
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                      isCurrentlySelected
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    } ${!canAccess ? 'opacity-70' : ''}`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                    {!lang.isFree && !canAccess && (
                      <Lock size={16} className="ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Celebration Modal */}
        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-10 backdrop-blur-sm">
            <div className="bg-white p-10 rounded-3xl shadow-2xl border-4 border-yellow-200 flex flex-col items-center animate-bounce">
              <Trophy size={80} className="text-yellow-400 mb-4" />
              <h2 className="text-4xl font-bold text-gray-700">Amazing!</h2>
              <p className="text-xl text-gray-500 mt-2">You earned a Gold Star! ⭐</p>
              <div className="flex gap-2 mt-6">
                <Star className="text-yellow-400 fill-yellow-400" size={36} />
                <Star className="text-yellow-400 fill-yellow-400" size={36} />
                <Star className="text-yellow-400 fill-yellow-400" size={36} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'practice' ? (
          <div className="space-y-6">
            
            {/* Child Selection - Only show for premium languages */}
            {isPremiumLanguage && (
              <div className="bg-white rounded-3xl shadow-sm p-8">
                <label className="block text-lg font-semibold text-gray-600 mb-4">
                  👤 Who is practicing today?
                </label>
                <select
                  value={selectedChild}
                  onChange={handleChildSelect}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl text-lg focus:border-blue-300 focus:outline-none transition-all bg-gray-50"
                >
                  <option value="">-- Select a child --</option>
                  {children.map((child) => (
                    <option key={child._id} value={child._id}>
                      {child.childName || child.name} ({child.age} years old)
                    </option>
                  ))}
                  <option value="add-new" className="font-bold text-purple-600">
                    ➕ Add new child
                  </option>
                </select>
              </div>
            )}

            {/* Phoneme Section */}
            <div className="bg-white rounded-3xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <Volume2 size={28} className="text-purple-400" />
                <h2 className="text-2xl font-bold text-gray-700">Basic Sounds</h2>
              </div>
              <p className="text-gray-500 mb-6 text-sm">Click a sound to hear it!</p>
              
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {phonemes.map((ph, idx) => (
                  <button
                    key={idx}
                    onClick={() => playSampleAudio(ph.text)}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 hover:shadow-md ${colorMap[ph.color]}`}
                  >
                    <span className="text-3xl mb-2">{ph.icon}</span>
                    <span className="font-bold text-sm">{ph.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Practice Prompt Selection */}
            <div className="bg-white rounded-3xl shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-700">
                  Choose a Word or Phrase
                </h2>
                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                  <span className="text-sm font-semibold text-blue-600">Speed:</span>
                  <button 
                    onClick={() => setPlaybackSpeed(1.0)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      playbackSpeed === 1.0 ? 'bg-blue-500 text-white shadow-sm' : 'text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    Normal
                  </button>
                  <button 
                    onClick={() => setPlaybackSpeed(0.5)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      playbackSpeed === 0.5 ? 'bg-blue-500 text-white shadow-sm' : 'text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    Slow
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {practicePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPracticePrompt(prompt.text)}
                    className={`p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 transform hover:scale-105 ${
                      practicePrompt === prompt.text
                        ? `${colorMap[prompt.color]} shadow-lg scale-105`
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-4xl">{prompt.icon}</span>
                    <div className="font-bold text-sm">{prompt.text}</div>
                  </button>
                ))}
              </div>
              
              {/* Selected Prompt Display */}
              {practicePrompt && (
                <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-100">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-5xl shadow-sm">
                        {practicePrompts.find(p => p.text === practicePrompt)?.icon}
                      </div>
                      <div>
                        <p className="text-sm text-indigo-500 font-semibold uppercase tracking-wide mb-1">
                          Let's practice:
                        </p>
                        <p className="text-4xl font-black text-indigo-700">"{practicePrompt}"</p>
                      </div>
                    </div>
                    <button
                      onClick={() => playSampleAudio()}
                      disabled={isPlayingSample}
                      className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold shadow-lg transition-all duration-200 transform hover:scale-105 ${
                        isPlayingSample ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'
                      }`}
                    >
                      <Volume2 size={24} />
                      {isPlayingSample ? 'Playing...' : 'Hear it'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recording Interface */}
            <div className="bg-white rounded-3xl shadow-sm p-10">
              <h2 className="text-3xl font-bold text-gray-700 mb-8 text-center">
                🎙️ Record Your Voice
              </h2>

              {!permission ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-8 text-lg">
                    We need permission to use your microphone
                  </p>
                  <button
                    onClick={getMicrophonePermission}
                    className="bg-blue-500 text-white font-semibold py-5 px-10 rounded-3xl hover:bg-blue-600 transition-all duration-200 text-lg inline-flex items-center gap-3 shadow-lg transform hover:scale-105"
                  >
                    <Mic size={28} />
                    Enable Microphone
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  
                  {/* Large Recording Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!practicePrompt}
                      className={`w-48 h-48 rounded-full text-white font-bold text-2xl transition-all duration-300 transform shadow-2xl flex flex-col items-center justify-center ${
                        !practicePrompt
                          ? 'bg-gray-300 cursor-not-allowed'
                          : isRecording
                          ? 'bg-red-400 hover:bg-red-500 scale-110 animate-pulse ring-8 ring-red-200'
                          : 'bg-green-400 hover:bg-green-500 hover:scale-110 ring-8 ring-green-100'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <Square size={64} strokeWidth={3} />
                          <span className="text-base mt-3 font-black uppercase tracking-wider">Stop</span>
                        </>
                      ) : (
                        <>
                          <Mic size={64} strokeWidth={3} />
                          <span className="text-base mt-3 font-black uppercase tracking-wider">Record</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Recording Indicator */}
                  {isRecording && (
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-3 bg-red-50 px-6 py-3 rounded-3xl border-2 border-red-200">
                        <span className="w-4 h-4 bg-red-400 rounded-full animate-ping"></span>
                        <p className="text-xl font-bold text-red-600 uppercase tracking-wider">
                          Recording...
                        </p>
                      </div>
                      <p className="text-gray-600 mt-6 text-2xl font-medium">Say: "{practicePrompt}"</p>
                      
                      {/* Live Recognition Feedback */}
                      {interimText && (
                        <div className="mt-6 bg-blue-50 rounded-3xl p-6 border-2 border-blue-200 animate-pulse">
                          <p className="text-sm text-blue-500 font-semibold mb-2">🎤 Listening...</p>
                          <p className="text-lg text-blue-700 font-medium italic">"{interimText}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audio Playback */}
                  {audioBlob && !isRecording && (
                    <div className="bg-green-50 rounded-3xl p-8 border-2 border-green-200">
                      <div className="flex items-center justify-center gap-3 mb-6">
                        <CheckCircle className="text-green-500" size={32} />
                        <p className="text-green-700 font-bold text-xl">
                          Recording Complete! 🎉
                        </p>
                      </div>
                      <audio
                        src={(() => {
                          if (audioBlobUrl.current) {
                            URL.revokeObjectURL(audioBlobUrl.current);
                          }
                          audioBlobUrl.current = URL.createObjectURL(audioBlob);
                          return audioBlobUrl.current;
                        })()}
                        controls
                        className="w-full mb-8 rounded-2xl"
                        style={{ height: '54px' }}
                      />

                      {/* Speech Analysis Results */}
                      {matchScore !== null && recognizedText && (
                        canAccessCurrentLanguage ? (
                        <div className={`rounded-3xl p-6 mb-6 border-2 ${generateFeedback(matchScore).bgColor} ${generateFeedback(matchScore).borderColor}`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-4xl">{generateFeedback(matchScore).icon}</span>
                              <h3 className={`text-xl font-bold ${generateFeedback(matchScore).color}`}>
                                AI Speech Analysis
                              </h3>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`text-4xl font-black ${generateFeedback(matchScore).color}`}>
                                {matchScore}%
                              </div>
                              <span className="text-xs text-gray-500 font-semibold">Match Score</span>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="bg-white rounded-2xl p-4 border-2 border-gray-200">
                              <p className="text-sm text-gray-500 font-semibold mb-2">Expected:</p>
                              <p className="text-lg font-bold text-gray-700">"{practicePrompt}"</p>
                            </div>
                            
                            <div className="bg-white rounded-2xl p-4 border-2 border-gray-200">
                              <p className="text-sm text-gray-500 font-semibold mb-2">You Said:</p>
                              <p className="text-lg font-bold text-gray-700">"{recognizedText}"</p>
                            </div>
                            
                            <div className={`rounded-2xl p-4 text-center ${generateFeedback(matchScore).bgColor}`}>
                              <p className={`text-xl font-bold ${generateFeedback(matchScore).color}`}>
                                {generateFeedback(matchScore).message}
                              </p>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-4">
                              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    matchScore >= 90 ? 'bg-green-500' : 
                                    matchScore >= 75 ? 'bg-blue-500' : 
                                    matchScore >= 60 ? 'bg-yellow-500' : 
                                    matchScore >= 40 ? 'bg-orange-500' : 
                                    'bg-purple-500'
                                  }`}
                                  style={{ width: `${matchScore}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        ) : (
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-3xl p-6 mb-6 border-2 border-indigo-100 flex flex-col items-center text-center">
                            <Lock className="text-indigo-400 mb-3" size={32} />
                            <h3 className="text-lg font-bold text-indigo-800 mb-2">AI Speech Analysis Locked</h3>
                            <p className="text-sm text-indigo-600 mb-4">
                              Unlock Speech Therapy Pro to see real-time speech similarity scores and detailed AI feedback!
                            </p>
                            <button 
                              onClick={() => setShowSubscriptionModal(true)}
                              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                              <Zap size={16} fill="currentColor" />
                              Upgrade to Pro
                            </button>
                          </div>
                        )
                      )}

                      <div className="flex flex-col md:flex-row gap-4">
                        <button
                          onClick={handleUpload}
                          disabled={isUploading}
                          className="flex-1 bg-indigo-500 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-600 disabled:bg-indigo-300 flex items-center justify-center gap-3 shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                          <Award size={28} />
                          {isUploading ? 'Sending...' : 'Send to Teacher'}
                        </button>
                        <button
                          onClick={() => {
                            if (audioBlobUrl.current) {
                              URL.revokeObjectURL(audioBlobUrl.current);
                              audioBlobUrl.current = null;
                            }
                            setAudioBlob(null);
                            setRecognizedText('');
                            setInterimText('');
                            setMatchScore(null);
                            setFeedbackMessage('');
                            recognitionResultsRef.current = [];
                          }}
                          className="md:w-48 py-5 border-2 border-gray-300 bg-white rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all duration-200"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          
          /* Progress Tab */
          <div className="bg-white rounded-3xl shadow-sm p-10">
            <div className="flex items-center gap-3 mb-8">
              <LineChart className="text-indigo-500" size={32} />
              <h2 className="text-3xl font-bold text-gray-700">Your Progress</h2>
            </div>
            
            <div className="h-[320px] w-full mb-10 bg-gray-50 rounded-2xl p-6">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis domain={[0, 3]} ticks={[1, 2, 3]} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '2px solid #e5e7eb' }} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    dot={{ r: 7, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 9 }} 
                  />
                </ReLineChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-sm text-gray-400 px-12 mt-3">
                <span>Needs Practice</span>
                <span>Getting Better</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Achievement Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl flex flex-col items-center border-2 border-green-100">
                <Star className="text-green-500 mb-3" size={40} />
                <span className="text-5xl font-bold text-green-600 mb-2">12</span>
                <span className="text-base text-green-600 font-semibold">Stars Earned</span>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-3xl flex flex-col items-center border-2 border-blue-100">
                <Award className="text-blue-500 mb-3" size={40} />
                <span className="text-5xl font-bold text-blue-600 mb-2">5</span>
                <span className="text-base text-blue-600 font-semibold">Badges Won</span>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl flex flex-col items-center border-2 border-purple-100">
                <Trophy className="text-purple-500 mb-3" size={40} />
                <span className="text-5xl font-bold text-purple-600 mb-2">3</span>
                <span className="text-base text-purple-600 font-semibold">Week Streak</span>
              </div>
            </div>
          </div>
        )}

        {/* Upload Status */}
        {uploadStatus && (
          <div className={`rounded-3xl p-6 flex items-start gap-4 shadow-sm ${
            uploadStatus.type === 'success' 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="text-green-500 shrink-0" size={32} />
            ) : (
              <AlertCircle className="text-red-500 shrink-0" size={32} />
            )}
            <div className="flex-1">
              <p className={`font-bold text-lg ${
                uploadStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {uploadStatus.message}
              </p>
              
              {/* AI Feedback - PRO Feature */}
              {uploadStatus.type === 'success' && uploadStatus.aiResult && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={18} className="text-orange-500" fill="currentColor" />
                    <span className="font-bold text-gray-700">AI Speech Feedback</span>
                  </div>
                  <div className="bg-white bg-opacity-50 rounded-xl p-3 mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Similarity Score</span>
                      <span className="font-bold text-blue-600">{uploadStatus.aiResult.aiSimilarityScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${uploadStatus.aiResult.aiSimilarityScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    "{uploadStatus.aiResult.aiFeedback}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-3xl shadow-sm p-8 border-l-8 border-indigo-300">
          <div className="flex items-center gap-3 mb-4">
            <Info className="text-indigo-500" size={24} />
            <h3 className="text-xl font-bold text-gray-700">About This Practice</h3>
          </div>
          <p className="text-gray-600 mb-6 text-base leading-relaxed">
            This tool helps children practice speaking and communication skills in a supportive way. 
            This is <strong>not a medical tool</strong> and does not provide diagnosis. 
            For professional support, please consult a speech therapist.
          </p>
          <h4 className="font-bold text-gray-700 mb-3 text-lg">How to Use:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3 items-start">
              <span className="text-2xl">1️⃣</span>
              <span className="text-gray-600">Pick a word or sound</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl">2️⃣</span>
              <span className="text-gray-600">Click "Hear it" to listen</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl">3️⃣</span>
              <span className="text-gray-600">Press RECORD button</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl">4️⃣</span>
              <span className="text-gray-600">Say the word clearly</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl">5️⃣</span>
              <span className="text-gray-600">Press STOP when done</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl">6️⃣</span>
              <span className="text-gray-600">Send to your teacher!</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ParentRegistrationModal
        isOpen={showParentRegModal}
        onClose={() => setShowParentRegModal(false)}
        onSuccess={handleParentRegistered}
      />

      <AddChildModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onSuccess={handleAddChildSuccess}
        parentId={parentId}
      />

      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)}
        onUpgrade={handleUpgrade}
        autoStart={false}
        childId={selectedChild}
      />
    </div>
  );
}
