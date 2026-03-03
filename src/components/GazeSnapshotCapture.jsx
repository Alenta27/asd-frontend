import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FaCamera, FaSpinner, FaExclamationTriangle, FaArrowLeft, FaStop, FaPlay, FaPaperPlane, FaUser, FaEnvelope, FaTimes } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const GazeSnapshotCapture = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const webcamRef = useRef(null);
  
  // API Base URL from environment or default
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Get patientId from query params (only for authenticated users starting from dashboard)
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get('patientId');
  const token = localStorage.getItem('token');

  const [cameraActive, setCameraActive] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [localSnapshots, setLocalSnapshots] = useState([]); // Store snapshots locally
  const [sending, setSending] = useState(false);
  
  // Automatic mode states
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [autoCounter, setAutoCounter] = useState(0);
  const timeoutRef = useRef(null);
  const [sessionPhase, setSessionPhase] = useState('idle'); // 'idle' | 'recording' | 'ended' | 'submitting'
  
  // Attention Scores: Live vs Final
  const [liveAttentionScore, setLiveAttentionScore] = useState(null);
  const [finalAttentionScore, setFinalAttentionScore] = useState(null);

  // Guest details state
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [isGuest, setIsGuest] = useState(!patientId);
  const [guestInfo, setGuestInfo] = useState({
    childName: '',
    parentName: '',
    email: ''
  });
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [guestSuccessMessage, setGuestSuccessMessage] = useState('');

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleStartCamera = () => {
    setCameraActive(true);
    setError(null);
  };

  const startSession = async (guestData = null) => {
    // If no patientId provided and no guest data yet, show form
    if (!patientId && !guestData) {
      setShowGuestForm(true);
      return;
    }

    try {
      const endpoint = patientId ? `${apiBaseUrl}/api/gaze/session/start` : `${apiBaseUrl}/api/gaze/session/guest/start`;
      const body = patientId ? { patientId } : { ...guestData, sessionType: 'guest_screening' };
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to start session");
      
      const session = data;
      setSessionId(session._id);
      setIsAutoMode(true);
      setCameraActive(true);
      setAutoCounter(0);
      setShowGuestForm(false);
      setSessionPhase('recording');
      setLiveAttentionScore(null);
      setFinalAttentionScore(null);
      setError(null);
      
      // Start auto capturing
      scheduleNextCapture();
      return session._id;
    } catch (err) {
      setError(`Session failed: ${err.message}`);
      throw err;
    }
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestInfo.childName || !guestInfo.parentName) {
      setError("Please fill in mandatory fields.");
      return;
    }
    await startSession(guestInfo);
  };

  const scheduleNextCapture = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      await captureAndUpload();
      scheduleNextCapture();
    }, 4000); // Capture every 4 seconds
  };

  const stopSession = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsAutoMode(false);
    setSessionPhase('ended');
    
    // Calculate final attention score from all snapshots
    if (localSnapshots.length > 0) {
      const scores = localSnapshots.map(s => s.attentionScore).filter(s => s !== undefined);
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        setFinalAttentionScore(avgScore);
      }
    }
    
    if (sessionId) {
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        await fetch(`${apiBaseUrl}/api/gaze/session/end/${sessionId}`, {
          method: 'POST',
          headers
        });
      } catch (err) {
        console.error("Failed to end session:", err);
      }
    }
  };

  const dataURLtoBlob = (dataurl) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  };

  const captureAndUpload = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      setAutoCounter(prev => prev + 1);
      
      try {
        // 1. Analyze for immediate feedback
        const apiResponse = await fetch(`${apiBaseUrl}/api/gaze/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: imageSrc }),
        });
        const data = await apiResponse.json();
        
        if (apiResponse.ok) {
          setLiveAttentionScore(data.attention_score); // Update live score
          setResult(data);
          
          // Store locally for bulk upload if live upload fails or as backup
          const snapshotInfo = {
            image: imageSrc,
            timestamp: new Date().toISOString(),
            attentionScore: data.attention_score,
            gazeDirection: data.gaze_direction
          };
          
          setLocalSnapshots(prev => [...prev, snapshotInfo]);

          // 2. SEND LIVE TO THERAPIST DASHBOARD
          if (sessionId) {
            try {
              const blob = dataURLtoBlob(imageSrc);
              const formData = new FormData();
              formData.append('image', blob, `auto-${Date.now()}.png`);
              formData.append('analyze', 'false'); // Already analyzed
              formData.append('sessionId', sessionId);
              formData.append('attentionScore', data.attention_score);
              formData.append('gazeDirection', data.gaze_direction);

              const uploadHeaders = {};
              if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;

              await fetch(`${apiBaseUrl}/api/gaze/snapshot/${sessionId}`, {
                method: 'POST',
                headers: uploadHeaders,
                body: formData
              });
            } catch (liveErr) {
              console.error("Live upload failed, kept in localSnapshots:", liveErr);
            }
          }
        }
      } catch (err) {
        console.error("Analysis failed:", err);
        // Still store the image even if analysis failed
        setLocalSnapshots(prev => [...prev, {
          image: imageSrc,
          timestamp: new Date().toISOString()
        }]);
      }
    }
  };

  const sendForReview = async () => {
    // Validate we have data to send
    if (localSnapshots.length === 0) {
      setError("No analysis data to send. Please take a snapshot first.");
      return;
    }

    // For guest mode, ensure form is filled
    if (!token && (!guestInfo.childName || !guestInfo.parentName || !guestInfo.email)) {
      setShowGuestForm(true);
      return;
    }
    
    setSending(true);
    setSessionPhase('submitting');
    setError(null); // Clear any previous errors
    
    try {
      // Guest mode: Use dedicated unauthenticated endpoint
      if (!token) {
        const response = await fetch(`${apiBaseUrl}/api/guest/live-gaze/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestInfo: {
              childName: guestInfo.childName,
              parentName: guestInfo.parentName,
              email: guestInfo.email
            },
            snapshots: localSnapshots
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to submit session");
        }

        const result = await response.json();
        console.log('✅ Guest submission successful:', result.message);
        
        // SUCCESS: Only show success state if HTTP 200 and backend confirms
        setError(null); // Clear any error state
        setGuestSuccessMessage(result.message);
        setLocalSnapshots([]);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsAutoMode(false);
        setSessionId(null);
        setCameraActive(false);
        setSessionPhase('idle');
        setLiveAttentionScore(null);
        setFinalAttentionScore(null);
        setResult(null);
        
        // Clear message after 8 seconds
        setTimeout(() => setGuestSuccessMessage(''), 8000);
        
        setSending(false);
        return;
      }

      // Authenticated mode: Use existing session-based flow
      let currentSessionId = sessionId;
      
      if (!currentSessionId) {
        try {
          currentSessionId = await startSession(null);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setIsAutoMode(false);
        } catch (err) {
          setSending(false);
          return;
        }
      }
      
      const response = await fetch(`${apiBaseUrl}/api/gaze/session/send-for-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          patientId: patientId,
          sessionType: 'authenticated',
          assignedRole: 'therapist',
          source: 'live_gaze_analysis',
          endTime: new Date().toISOString(),
          snapshots: localSnapshots
        })
      });

      const submitResult = await response.json();
      
      if (!response.ok) {
        // ERROR: Backend failed
        throw new Error(submitResult.error || "Failed to send for review");
      }
      
      // SUCCESS: Only show modal if HTTP 200 and backend confirms save
      console.log('✅ Session submitted successfully:', submitResult.message);
      setError(null); // Clear any error state
      setShowSuccessModal(true);
      setLocalSnapshots([]);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsAutoMode(false);
      setSessionId(null);
      setSessionPhase('idle');
      setLiveAttentionScore(null);
      setFinalAttentionScore(null);
      setResult(null); 
    } catch (err) {
      // ERROR: Show single consistent error state
      console.error('❌ Submit failed:', err.message);
      setError(`Submission failed: ${err.message}`);
      setGuestSuccessMessage(''); // Clear any success message
      setShowSuccessModal(false); // Close success modal if open
      setSessionPhase(sessionId ? 'ended' : 'idle'); // Return to appropriate phase
    } finally {
      setSending(false);
    }
  };

  const handleTakeSnapshot = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setSnapshot(imageSrc);
      setCameraActive(false);
    }
  };

  const handleAnalyze = async () => {
    if (!snapshot) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // 1. Analyze for immediate feedback
      const apiResponse = await fetch(`${apiBaseUrl}/api/gaze/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: snapshot }),
      });

      const data = await apiResponse.json();
      if (!apiResponse.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);

      // Add to local snapshots so it can be sent for review
      setLocalSnapshots(prev => [...prev, {
        image: snapshot,
        timestamp: new Date().toISOString(),
        attentionScore: data.attention_score,
        gazeDirection: data.gaze_direction
      }]);

      // 2. If a session is active, upload to therapist dashboard live
      if (sessionId) {
        const blob = dataURLtoBlob(snapshot);
        const formData = new FormData();
        formData.append('image', blob, 'manual-snapshot.png');
        formData.append('analyze', 'false');
        formData.append('sessionId', sessionId);
        formData.append('attentionScore', data.attention_score);
        formData.append('gazeDirection', data.gaze_direction);

        const uploadHeaders = {};
        if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;

        await fetch(`${apiBaseUrl}/api/gaze/snapshot/${sessionId}`, {
          method: 'POST',
          headers: uploadHeaders,
          body: formData
        });
      }
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBack = () => {
    if (isAutoMode) stopSession();
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 text-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={handleBack} className="flex items-center mb-8 hover:text-indigo-400 transition-colors">
          <FaArrowLeft className="mr-2" /> Back
        </button>

        <div className="bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-700 relative">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Live Gaze Analysis</h1>
              <p className="text-slate-400">
                {sessionPhase === 'recording' ? 'Session Active - Capturing snapshots automatically' : 
                 sessionPhase === 'ended' ? 'Session ended - Review metrics and send for professional analysis' :
                 sessionPhase === 'submitting' ? 'Submitting session data...' :
                 'Capturing live gaze patterns for ASD screening'}
              </p>
              {!patientId && sessionPhase === 'idle' && (
                <div className="mt-2 inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-500/20">
                  <FaUser size={10} /> Guest Mode Enabled
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={sendForReview}
                disabled={sessionPhase === 'recording' || sessionPhase === 'submitting' || localSnapshots.length === 0}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
                title={sessionPhase === 'recording' ? 'End session before submitting' : ''}
              >
                {sessionPhase === 'submitting' ? <FaSpinner className="animate-spin" /> : <><FaPaperPlane /> Send for Review</>}
              </button>

              {isAutoMode ? (
                <button 
                  onClick={stopSession}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all animate-pulse shadow-lg shadow-red-500/20"
                >
                  <FaStop /> End Session ({autoCounter})
                </button>
              ) : (
                <button 
                  onClick={() => startSession()}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
                >
                  <FaPlay /> Start Live Session
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Camera Preview */}
            <div className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-200">
                  <FaExclamationTriangle className="flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              {guestSuccessMessage && (
                <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-xl flex items-center gap-3 text-green-200 animate-pulse">
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm font-medium">{guestSuccessMessage}</p>
                </div>
              )}
              
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-slate-700">
                {cameraActive || isAutoMode ? (
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/png"
                    className="w-full h-full object-cover"
                    videoConstraints={{ width: 1280, height: 720 }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button onClick={handleStartCamera} className="bg-slate-700 p-6 rounded-full hover:bg-slate-600 transition">
                      <FaCamera size={40} />
                    </button>
                  </div>
                )}
                
                {isAutoMode && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/80 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                    Live Recording
                  </div>
                )}
              </div>

              {!isAutoMode && cameraActive && (
                <button 
                  onClick={handleTakeSnapshot}
                  className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Manual Snapshot
                </button>
              )}
            </div>

            {/* Analysis / Results */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700">
              {analyzing ? (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <FaSpinner className="animate-spin text-4xl text-indigo-500 mb-4" />
                  <p className="text-slate-400">Processing facial landmarks...</p>
                </div>
              ) : result || liveAttentionScore !== null || finalAttentionScore !== null ? (
                <div className="space-y-6">
                  <div className="text-center">
                    {sessionPhase === 'ended' && finalAttentionScore !== null ? (
                      <>
                        <div className={`text-5xl font-bold mb-2 ${finalAttentionScore > 0.6 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {(finalAttentionScore * 100).toFixed(0)}%
                        </div>
                        <p className="text-slate-400 uppercase tracking-widest text-sm font-semibold">Final Attention Score</p>
                        <p className="text-xs text-slate-500 mt-1">Computed from {localSnapshots.length} snapshots</p>
                      </>
                    ) : liveAttentionScore !== null ? (
                      <>
                        <div className={`text-5xl font-bold mb-2 ${liveAttentionScore > 0.6 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {(liveAttentionScore * 100).toFixed(0)}%
                        </div>
                        <p className="text-slate-400 uppercase tracking-widest text-sm font-semibold">Live Attention Score</p>
                        <p className="text-xs text-slate-500 mt-1">Real-time feedback</p>
                      </>
                    ) : result ? (
                      <>
                        <div className={`text-5xl font-bold mb-2 ${result.attention_score > 0.6 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {(result.attention_score * 100).toFixed(0)}%
                        </div>
                        <p className="text-slate-400 uppercase tracking-widest text-sm font-semibold">Attention Score</p>
                      </>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Direction</p>
                      <p className="text-xl font-bold capitalize">{result.gaze_direction}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Status</p>
                      <p className="text-xl font-bold">{result.attention_score > 0.6 ? 'Engaged' : 'Distracted'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-400">Quick Tips</h3>
                    <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                      <li>Maintain natural lighting</li>
                      <li>Face the camera directly</li>
                      <li>Avoid heavy backlighting</li>
                    </ul>
                  </div>
                </div>
              ) : snapshot ? (
                <div className="space-y-4">
                  <img src={snapshot} alt="Preview" className="w-full rounded-xl border border-slate-700" />
                  <div className="flex gap-2">
                    <button onClick={() => setSnapshot(null)} className="flex-1 py-2 bg-slate-700 rounded-lg hover:bg-slate-600">Retake</button>
                    <button onClick={handleAnalyze} className="flex-1 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 font-bold">Analyze</button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                    <FaCamera size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-1">No Analysis Data</h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    Start a live session or take a manual snapshot to see gaze analysis metrics.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-slate-700 bg-green-600">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-8 text-center space-y-4">
                  <h2 className="text-2xl font-bold text-white">Session Successfully Submitted!</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Your gaze analysis session has been sent to our professional therapists for comprehensive review.
                  </p>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-left space-y-2">
                    <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      What Happens Next?
                    </h3>
                    <ul className="text-xs text-slate-400 space-y-1.5">
                      <li>✓ Therapist will review captured images and gaze metrics</li>
                      <li>✓ Professional analysis will be conducted</li>
                      <li>✓ You may be contacted for follow-up if needed</li>
                    </ul>
                  </div>
                  {!token && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-left">
                      <p className="text-xs text-slate-400">
                        <strong className="text-slate-300">Note:</strong> This was a guest session. Create an account to track your screening history and receive notifications.
                      </p>
                    </div>
                  )}
                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={() => {
                        setShowSuccessModal(false);
                        setSnapshot(null);
                        setResult(null);
                        setCameraActive(false);
                        setSessionPhase('idle');
                        setLiveAttentionScore(null);
                        setFinalAttentionScore(null);
                        setError(null);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Start New Session
                    </button>
                    {!token && (
                      <button 
                        onClick={() => {
                          setShowSuccessModal(false);
                          navigate('/');
                        }}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-all"
                      >
                        Return to Home
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guest Form Modal */}
          {showGuestForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-indigo-600">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaUser /> Guest Information
                  </h2>
                  <button onClick={() => setShowGuestForm(false)} className="text-white/80 hover:text-white transition-colors">
                    <FaTimes size={20} />
                  </button>
                </div>
                <form onSubmit={handleGuestSubmit} className="p-8 space-y-5">
                  <p className="text-slate-400 text-sm mb-6">Please provide these details so a therapist can review your session results.</p>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Child's Name *</label>
                    <div className="relative">
                      <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        required
                        type="text" 
                        value={guestInfo.childName}
                        onChange={(e) => setGuestInfo({...guestInfo, childName: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                        placeholder="John Doe Jr."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Parent/Guardian Name *</label>
                    <div className="relative">
                      <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        required
                        type="text" 
                        value={guestInfo.parentName}
                        onChange={(e) => setGuestInfo({...guestInfo, parentName: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                        placeholder="John Doe Sr."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contact Email</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="email" 
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                        placeholder="parent@example.com"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                      <FaPlay /> Start Analysis
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GazeSnapshotCapture;
