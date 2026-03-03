import React, { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FiCamera, FiAlertTriangle, FiLoader, FiCheckCircle } from 'react-icons/fi';
import './GameStyles.css';

// Configurable video URLs for Social Attention Test
// Research-appropriate stimuli for unbiased ASD screening
// Social video (LEFT): Human face with direct eye contact and social engagement
// Non-social video (RIGHT): Abstract motion-matched patterns (no social cues)
const SOCIAL_VIDEO_URL = process.env.REACT_APP_SOCIAL_VIDEO_URL || 
  "https://videos.pexels.com/video-files/4440954/4440954-sd_640_360_25fps.mp4";
const NON_SOCIAL_VIDEO_URL = process.env.REACT_APP_NON_SOCIAL_VIDEO_URL || 
  "https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_25fps.mp4";

const SocialAttentionGame = ({ studentId, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [currentGaze, setCurrentGaze] = useState('center');
  const [testResults, setTestResults] = useState(null);
  const [videosReady, setVideosReady] = useState({ left: false, right: false });
  const [videoSources, setVideoSources] = useState({
    left: SOCIAL_VIDEO_URL,
    right: NON_SOCIAL_VIDEO_URL
  });
  
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const leftStimulusRef = useRef(null);
  const rightStimulusRef = useRef(null);
  const logIntervalRef = useRef(null);
  const containerRef = useRef(null);
  
  // Persistent refs for gaze accumulation - NEVER reset during render
  const leftTimeRef = useRef(0);
  const rightTimeRef = useRef(0);
  const totalValidGazeTimeRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const gazeXRef = useRef(0.5); 
  const debugLogIntervalRef = useRef(null);

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    initializeLandmarker();
    fetchInitialVideoSources();
    setupCamera(); // Request camera early for smoother transition
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);
      if (debugLogIntervalRef.current) clearInterval(debugLogIntervalRef.current);
      stopCamera();
    };
  }, []);

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access deferred or denied:", err);
      // We don't set error here yet, let startTest handle it if they click start
    }
  };

  // Pre-fetch video URLs - allow backend to override defaults if needed
  const fetchInitialVideoSources = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // No authentication required - use default video URLs
        console.log("No token found - using default video URLs");
        return;
      }
      
      const res = await fetch(`${API_BASE}/api/social-attention/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId, dryRun: true }) // Dry run to just get URLs
      });
      if (res.ok) {
        const { leftVideo, rightVideo } = await res.json();
        if (leftVideo && rightVideo) {
          console.log("Backend-provided videos detected:", { leftVideo, rightVideo });
          setVideoSources({ left: leftVideo, right: rightVideo });
        }
      }
    } catch (err) {
      console.warn("Could not fetch backend video URLs, using defaults:", err);
      // Continue with default URLs - no error thrown
    }
  };

  const initializeLandmarker = async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });
      setIsLoadingModel(false);
    } catch (err) {
      console.error("Error initializing MediaPipe:", err);
      setCameraError("Assessment service unavailable. (Model Load Failed)");
      setIsLoadingModel(false);
    }
  };

  const startTest = async () => {
    setCameraError(null);
    
    // Reset gaze counters at test start - NEVER reset during render
    leftTimeRef.current = 0;
    rightTimeRef.current = 0;
    totalValidGazeTimeRef.current = 0;
    lastTimestampRef.current = 0; 
    
    // Start debug logging every second
    if (debugLogIntervalRef.current) clearInterval(debugLogIntervalRef.current);
    debugLogIntervalRef.current = setInterval(() => {
      console.log("GAZE:", { 
        leftTime: leftTimeRef.current.toFixed(2), 
        rightTime: rightTimeRef.current.toFixed(2), 
        totalGaze: totalValidGazeTimeRef.current.toFixed(2),
        gazeX: gazeXRef.current.toFixed(3)
      });
    }, 1000);
    try {
      // Initialize session with backend (if authenticated)
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const startRes = await fetch(`${API_BASE}/api/social-attention/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ studentId })
          });

          if (startRes.ok) {
            const { sessionId: newSessionId, leftVideo, rightVideo } = await startRes.json();
            setSessionId(newSessionId);
            
            if (leftVideo && rightVideo) {
              setVideoSources({ left: leftVideo, right: rightVideo });
            }
          }
        } catch (backendErr) {
          console.warn("Backend session creation failed, continuing with defaults:", backendErr);
          // Continue without backend session - generate client-side ID
          setSessionId(`client-${Date.now()}`);
        }
      } else {
        // No authentication - generate client-side session ID
        setSessionId(`guest-${Date.now()}`);
      }

      // Setup camera for gaze tracking
      let stream = cameraStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        }).catch(err => {
          throw new Error("Camera Required for assessment.");
        });
        setCameraStream(stream);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCapturing(true);
          videoRef.current.play();
          
          if (containerRef.current?.requestFullscreen) {
            containerRef.current.requestFullscreen().catch(() => {});
          }

          // Start BOTH stimulus videos simultaneously
          setTimeout(() => {
            if (leftStimulusRef.current) {
              leftStimulusRef.current.play().catch(e => console.error("Left video play error", e));
            }
            if (rightStimulusRef.current) {
              rightStimulusRef.current.play().catch(e => console.error("Right video play error", e));
            }
          }, 800);
          
          requestRef.current = requestAnimationFrame(predictWebcam);
          startTimer();
          // All gaze tracking happens locally - no backend frame streaming
        };
      }
    } catch (err) {
      console.error(err);
      setCameraError(err.message);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // All gaze tracking is done locally in processGaze - no backend frame streaming

  const predictWebcam = () => {
    if (!videoRef.current || !landmarkerRef.current || !isCapturing) return;

    const startTimeMs = Date.now();
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        processGaze(results.faceLandmarks[0]);
      } else {
        if (Math.random() < 0.05) console.log("No face detected in frame");
        setCurrentGaze('center');
      }
    } else {
       // If currentTime is not advancing, log it occasionally
       if (Math.random() < 0.01) console.log("Video currentTime not advancing:", videoRef.current.currentTime);
    }

    if (isCapturing && timeLeft > 0) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  };

  const processGaze = (landmarks) => {
    // Return immediately if no face detected or insufficient landmarks
    if (!landmarks || landmarks.length < 363) {
      if (Math.random() < 0.05) console.log("Insufficient landmarks:", landmarks?.length);
      return;
    }
    
    // 3. TIMING LOGIC (MANDATORY) - Use performance.now()
    const currentTimestamp = performance.now();
    
    // Initialize on first frame
    if (lastTimestampRef.current === 0) {
      console.log("Gaze processing started - first frame received");
      lastTimestampRef.current = currentTimestamp;
      return; 
    }
    
    // deltaTime = (now - lastTimestamp) / 1000
    const deltaTime = (currentTimestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = currentTimestamp;
    
    // Sanity check: ignore frames with unreasonable deltaTime (> 1 second gap)
    if (deltaTime > 1 || deltaTime <= 0) {
      return;
    }
    
    // 4. GAZE CALCULATION
    // Compute gazeX using average X of FaceMesh eye landmarks: 33, 133, 362, 263
    const gazeX = (landmarks[33].x + landmarks[133].x + landmarks[362].x + landmarks[263].x) / 4;
    gazeXRef.current = gazeX;
    
    // Track total valid gaze time (any frame where face is detected)
    totalValidGazeTimeRef.current += deltaTime;
    
    // 5. ZONE LOGIC
    let gazeZone = 'center';
    
    // LEFT (social): gazeX < 0.33
    if (gazeX < 0.33) {
      gazeZone = 'left';
      leftTimeRef.current += deltaTime;
    } 
    // RIGHT (non-social): gazeX > 0.66
    else if (gazeX > 0.66) {
      gazeZone = 'right';
      rightTimeRef.current += deltaTime;
    }
    // CENTER: 0.33 <= gazeX <= 0.66 → split time
    else {
      gazeZone = 'center';
      leftTimeRef.current += deltaTime * 0.5;
      rightTimeRef.current += deltaTime * 0.5;
    }
    
    setCurrentGaze(gazeZone);
  };

  const finishTest = async () => {
    setIsCapturing(false);
    stopCamera();
    if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    if (debugLogIntervalRef.current) clearInterval(debugLogIntervalRef.current);
    
    if (leftStimulusRef.current) leftStimulusRef.current.pause();
    if (rightStimulusRef.current) rightStimulusRef.current.pause();

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    try {
      const token = localStorage.getItem('token');
      
      // Get accumulated gaze times (in seconds)
      const leftTime = leftTimeRef.current;
      const rightTime = rightTimeRef.current;
      const totalValidTime = totalValidGazeTimeRef.current;
      
      console.log("[GAZE FINAL] LEFT:", leftTime.toFixed(1), "s | RIGHT:", rightTime.toFixed(1), "s | TOTAL_VALID:", totalValidTime.toFixed(1), "s");
      
      // 5. MINIMUM DATA RULE (Update to 5 seconds valid gaze)
      if (totalValidTime < 5) {
        setTestResults({
          socialPreferenceScore: 0,
          leftLookTime: Math.round(leftTime * 1000), 
          rightLookTime: Math.round(rightTime * 1000),
          leftTime: Math.round(leftTime * 1000),
          rightTime: Math.round(rightTime * 1000),
          riskFlag: false,
          clinicalSummary: "Insufficient gaze data collected. Assessment could not be completed reliably.",
          insufficientData: true
        });
        return;
      }
      
      // preferenceScore = (leftTime / totalValidGazeTime) * 100
      const preferenceScore = Number(((leftTime / totalValidTime) * 100).toFixed(1));
      
      // Determine clinical interpretation (only if totalValidTime >= 10 seconds)
      let clinicalSummary = "";
      let riskFlag = false;
      
      if (totalValidTime >= 10) {
        if (preferenceScore < 40) {
          clinicalSummary = "Significant preference for non-social stimuli detected. This pattern is often observed in children with social-communication challenges.";
          riskFlag = true;
        } else if (preferenceScore < 50) {
          clinicalSummary = "Reduced social preference noted. Visual attention is split between social and non-social stimuli.";
          riskFlag = true;
        } else {
          clinicalSummary = "Typical social preference pattern. The child showed sustained interest in the social stimulus.";
          riskFlag = false;
        }
      } else {
        // Not enough data for clinical interpretation
        clinicalSummary = "No reliable social preference could be determined.";
        riskFlag = false;
      }

      const localResults = {
        socialPreferenceScore: preferenceScore,
        leftLookTime: Math.round(leftTime * 1000), // Convert to ms
        rightLookTime: Math.round(rightTime * 1000),
        leftTime: Math.round(leftTime * 1000),
        rightTime: Math.round(rightTime * 1000),
        riskFlag,
        clinicalSummary
      };

      // Submit final summary to backend (not frame-by-frame)
      if (token && studentId) {
        try {
          await fetch(`${API_BASE}/api/behavioral/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              studentId,
              testType: 'social-attention',
              leftTime: Math.round(leftTime * 1000), // ms
              rightTime: Math.round(rightTime * 1000), // ms
              preferenceScore,
              duration: 30,
              timestamp: new Date().toISOString()
            })
          });
          console.log("[BACKEND] Final results submitted successfully");
        } catch (submitErr) {
          console.warn("[BACKEND] Could not submit results:", submitErr);
          // Continue anyway - results are valid locally
        }
      }

      // Always show local results (backend submission is for storage only)
      setTestResults(localResults);
    } catch (err) {
      console.error("Error finishing test:", err);
      // Show local results on error
      const leftTime = leftTimeRef.current;
      const rightTime = rightTimeRef.current;
      const totalTime = leftTime + rightTime;
      const preferenceScore = totalTime > 0 ? Number(((leftTime / totalTime) * 100).toFixed(1)) : 0;
      
      setTestResults({
        socialPreferenceScore: preferenceScore,
        leftLookTime: Math.round(leftTime * 1000),
        rightLookTime: Math.round(rightTime * 1000),
        leftTime: Math.round(leftTime * 1000),
        rightTime: Math.round(rightTime * 1000),
        riskFlag: false,
        clinicalSummary: totalTime >= 5 ? "Assessment completed with local processing." : "Insufficient gaze data collected."
      });
    }
  };

  if (testResults) {
    return (
      <div className="social-attention-results-view">
        <div className="results-card">
          <FiCheckCircle size={64} color="#10b981" />
          <h2>Social Attention Result</h2>
          <div className="results-stats">
            <div className="stat-row">
              <span>Social Preference Score:</span>
              <strong style={{ color: testResults.riskFlag ? '#ef4444' : '#10b981' }}>
                {testResults.socialPreferenceScore.toFixed(1)}%
              </strong>
            </div>
            <div className="stat-row">
              <span>Social (Left) Time:</span>
              <strong>{(testResults.leftLookTime / 1000).toFixed(1)}s</strong>
            </div>
            <div className="stat-row">
              <span>Non-Social (Right) Time:</span>
              <strong>{(testResults.rightLookTime / 1000).toFixed(1)}s</strong>
            </div>
          </div>
          <div className="interpretation-box">
             <p><strong>Interpretation:</strong> {testResults.clinicalSummary}</p>
          </div>
          <button className="finish-btn" onClick={() => onComplete(testResults)}>
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="game-error-state">
        <FiAlertTriangle size={48} color="#ef4444" />
        <h3>Assessment Error</h3>
        <p>{cameraError}</p>
        <button className="option-button correct" onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  return (
    <div className="social-attention-test-fullscreen" ref={containerRef}>
      {!isCapturing ? (
        <div className="start-screen-clinical">
          <div className="clinical-header">
            <h2>Social Attention Test</h2>
            <p>Behavioural Assessment (Preferential Looking Paradigm)</p>
          </div>
          <div className="clinical-instructions">
            <p>Two videos will play side by side for 30 seconds. Gaze tracking will measure social preference.</p>
            <div className="video-previews">
                <div className="preview-box">
                    <span>SOCIAL VIDEO (LEFT)</span>
                    <video 
                        src={videoSources.left}
                        muted 
                        loop
                        playsInline 
                        autoPlay
                        onCanPlay={() => setVideosReady(v => ({...v, left: true}))}
                        onError={(e) => {
                          console.error("Left Video Load Error:", e);
                          // Fallback to another stable social video if default fails
                          if (videoSources.left.includes("3819352")) {
                            setVideoSources(prev => ({...prev, left: "https://videos.pexels.com/video-files/4440954/4440954-sd_640_360_25fps.mp4"}));
                          }
                        }}
                        style={{ width: '100%', borderRadius: '8px', marginTop: '10px', background: '#000', minHeight: '180px' }}
                    />
                </div>
                <div className="preview-box">
                    <span>NON-SOCIAL VIDEO (RIGHT)</span>
                    <video 
                        src={videoSources.right}
                        muted 
                        loop
                        playsInline 
                        autoPlay
                        onCanPlay={() => setVideosReady(v => ({...v, right: true}))}
                        onError={(e) => {
                          console.error("Right Video Load Error:", e);
                          if (videoSources.right.includes("8733062")) {
                             setVideoSources(prev => ({...prev, right: "https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_25fps.mp4"}));
                          }
                        }}
                        style={{ width: '100%', borderRadius: '8px', marginTop: '10px', background: '#000', minHeight: '180px' }}
                    />
                </div>
            </div>
            <p className="highlight-instruction">"Please let the child watch naturally. Assessment will begin in fullscreen."</p>
          </div>
          <button 
            className="clinical-start-btn" 
            onClick={startTest}
            disabled={isLoadingModel}
          >
            {isLoadingModel ? <FiLoader className="spin" /> : "Start 30s Assessment"}
          </button>
        </div>
      ) : (
        <div className="clinical-test-active">
          <div className="test-top-bar" style={{ zIndex: 100 }}>
            <h3>Social Attention Test</h3>
            <div className="test-progress-container">
                <div className="test-progress-bar" style={{ width: `${(30 - timeLeft) / 30 * 100}%` }}></div>
            </div>
            <span className="test-timer">{timeLeft}s</span>
          </div>

          <div className="clinical-video-panels" style={{ display: 'flex', width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
            <div className="video-panel left-social" style={{ flex: 1, overflow: 'hidden' }}>
                <video 
                  ref={leftStimulusRef}
                  src={videoSources.left}
                  muted 
                  playsInline 
                  loop
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
            </div>
            <div className="video-panel right-non-social" style={{ flex: 1, overflow: 'hidden' }}>
                <video 
                  ref={rightStimulusRef}
                  src={videoSources.right}
                  muted 
                  playsInline 
                  loop
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
            </div>
          </div>

          <div className="clinical-bottom-instruction" style={{ zIndex: 100, position: 'absolute', bottom: '20px', width: '100%', textAlign: 'center', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            "Please let the child watch naturally. Gaze Tracking Active."
          </div>
        </div>
      )}
      {/* Hidden video for MediaPipe processing - MUST be always present in DOM for refs to work */}
      <video 
        ref={videoRef} 
        playsInline 
        muted 
        style={{ 
          position: 'absolute', 
          opacity: 0, 
          pointerEvents: 'none', 
          width: '1px', 
          height: '1px', 
          left: '-10px' 
        }} 
      />
    </div>
  );
};

export default SocialAttentionGame;
