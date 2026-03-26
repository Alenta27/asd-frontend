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
  const diagnosticRef = useRef(null); // Direct DOM updates to avoid re-render jitter
  
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
  const firstDetectionRef = useRef(false); // Track first face detection
  const isCapturingRef = useRef(false); // Use ref for immediate access in animation loop

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  // Update diagnostic display without React re-renders
  const updateDiagnosticDisplay = () => {
    if (!diagnosticRef.current) return;
    
    const leftEl = diagnosticRef.current.querySelector('.diag-left');
    const rightEl = diagnosticRef.current.querySelector('.diag-right');
    const totalEl = diagnosticRef.current.querySelector('.diag-total');
    const statusEl = diagnosticRef.current.querySelector('.diag-status');
    const gazeEl = diagnosticRef.current.querySelector('.diag-gaze');
    
    if (leftEl) leftEl.textContent = leftTimeRef.current.toFixed(1) + 's';
    if (rightEl) rightEl.textContent = rightTimeRef.current.toFixed(1) + 's';
    if (totalEl) totalEl.textContent = totalValidGazeTimeRef.current.toFixed(1) + 's';
    
    if (statusEl) {
      const isActive = totalValidGazeTimeRef.current >= 1;
      statusEl.textContent = isActive ? '✓ Face tracking active' : '⚠ No face detected yet';
      statusEl.style.background = isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      statusEl.style.color = isActive ? '#6ee7b7' : '#fca5a5';
    }
    
    if (gazeEl) {
      const gazeText = currentGaze === 'left' ? '← LEFT (Social)' : 
                       currentGaze === 'right' ? 'RIGHT (Non-Social) →' : 
                       '● CENTER';
      const gazeColor = currentGaze === 'left' ? '#3b82f6' : 
                        currentGaze === 'right' ? '#ef4444' : 
                        '#fbbf24';
      gazeEl.textContent = gazeText;
      gazeEl.style.color = gazeColor;
    }
  };

  useEffect(() => {
    console.log("=== SocialAttentionGame Component Mounted ===");
    initializeLandmarker();
    fetchInitialVideoSources();
    setupCamera(); // Request camera early for smoother transition
    
    return () => {
      console.log("=== SocialAttentionGame Component Unmounting - Cleanup ===");
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
      console.log("Initializing MediaPipe FaceLandmarker...");
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      console.log("FilesetResolver loaded successfully");
      
      landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });
      console.log("FaceLandmarker initialized successfully");
      setIsLoadingModel(false);
      setCameraError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error initializing MediaPipe:", err);
      let errorMessage = "Assessment service unavailable. ";
      
      if (err.message?.includes("fetch") || err.message?.includes("network")) {
        errorMessage += "Network connection issue. Please check your internet connection.";
      } else if (err.message?.includes("GPU")) {
        errorMessage += "GPU initialization failed. Try refreshing the page.";
      } else {
        errorMessage += "Model load failed. Please refresh the page and try again.";
      }
      
      setCameraError(errorMessage);
      setIsLoadingModel(false);
    }
  };

  const startTest = async () => {
    console.log("=== Starting Social Attention Test ===");
    console.log("Model loaded:", !!landmarkerRef.current);
    console.log("Student ID:", studentId);
    
    setCameraError(null);
    
    // Reset gaze counters at test start - NEVER reset during render
    leftTimeRef.current = 0;
    rightTimeRef.current = 0;
    totalValidGazeTimeRef.current = 0;
    lastTimestampRef.current = 0; 
    firstDetectionRef.current = false; // Reset first detection flag
    
    // Start debug logging every second
    if (debugLogIntervalRef.current) clearInterval(debugLogIntervalRef.current);
    debugLogIntervalRef.current = setInterval(() => {
      console.log("GAZE:", { 
        leftTime: leftTimeRef.current.toFixed(2), 
        rightTime: rightTimeRef.current.toFixed(2), 
        totalGaze: totalValidGazeTimeRef.current.toFixed(2),
        gazeX: gazeXRef.current.toFixed(3)
      });
      // Update diagnostic overlay via direct DOM manipulation (no re-render)
      updateDiagnosticDisplay();
    }, 500); // Update every 500ms to reduce jitter
    
    try {
      // Check if model is ready
      if (!landmarkerRef.current) {
        throw new Error("Face tracking model not initialized. Please refresh and try again.");
      }
      
      // Initialize session with backend (if authenticated)
      const token = localStorage.getItem('token');
      console.log("Auth token present:", !!token);
      
      if (token) {
        try {
          console.log("Creating backend session...");
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
            console.log("Backend session created:", newSessionId);
            setSessionId(newSessionId);
            
            if (leftVideo && rightVideo) {
              console.log("Using backend-provided videos");
              setVideoSources({ left: leftVideo, right: rightVideo });
            }
          } else {
            console.warn("Backend session creation returned non-OK status:", startRes.status);
          }
        } catch (backendErr) {
          console.warn("Backend session creation failed, continuing with defaults:", backendErr);
          // Continue without backend session - generate client-side ID
          setSessionId(`client-${Date.now()}`);
        }
      } else {
        // No authentication - generate client-side session ID
        console.log("No token - using guest session");
        setSessionId(`guest-${Date.now()}`);
      }

      // Setup camera for gaze tracking
      console.log("Requesting camera access...");
      let stream = cameraStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        }).catch(err => {
          console.error("Camera access denied:", err);
          throw new Error("Camera access is required for this assessment. Please allow camera permissions.");
        });
        setCameraStream(stream);
        console.log("Camera access granted");
      } else {
        console.log("Using existing camera stream");
      }
      
      if (videoRef.current) {
        console.log("Setting camera stream to videoRef");
        videoRef.current.srcObject = stream;
        
        // Ensure the video loads and plays
        videoRef.current.onloadedmetadata = async () => {
          console.log("✅ Camera video metadata loaded");
          console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
          console.log("Video readyState:", videoRef.current.readyState);
          
          try {
            await videoRef.current.play();
            console.log("✅ Webcam video playing");
          } catch (playErr) {
            console.error("Error playing webcam:", playErr);
          }
          
          // Small delay to ensure video is actually producing frames
          setTimeout(() => {
            console.log("Starting capture...");
            isCapturingRef.current = true; // Set ref immediately for animation loop
            setIsCapturing(true); // Set state for UI
            
            if (containerRef.current?.requestFullscreen) {
              containerRef.current.requestFullscreen().catch((e) => {
                console.warn("Fullscreen request failed:", e);
              });
            }

            // Start BOTH stimulus videos simultaneously
            setTimeout(() => {
              console.log("Starting stimulus videos...");
              if (leftStimulusRef.current) {
                leftStimulusRef.current.play().catch(e => console.error("Left video play error", e));
              } else {
                console.error("leftStimulusRef.current is null!");
              }
              if (rightStimulusRef.current) {
                rightStimulusRef.current.play().catch(e => console.error("Right video play error", e));
              } else {
                console.error("rightStimulusRef.current is null!");
              }
              console.log("Stimulus videos started");
            }, 500);
            
            // Start face detection loop
            console.log("🚀 Starting face detection loop...");
            const startPrediction = () => {
              console.log("🔄 First predictWebcam call");
              predictWebcam();
            };
            requestRef.current = requestAnimationFrame(startPrediction);
            
            startTimer();
            console.log("✅ Assessment started successfully");
          }, 300);
          // All gaze tracking happens locally - no backend frame streaming
        };
      } else {
        console.error("❌ videoRef.current is null!");
        throw new Error("Video element not found");
      }
    } catch (err) {
      console.error("Error starting test:", err);
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
    // Log every 100 frames (approximately every 1.5 seconds at 60fps)
    const shouldLog = Math.random() < 0.015;
    
    if (!videoRef.current || !landmarkerRef.current || !isCapturingRef.current) {
      if (shouldLog) {
        console.warn("⚠️ predictWebcam early exit:", {
          hasVideoRef: !!videoRef.current,
          hasLandmarker: !!landmarkerRef.current,
          isCapturingRef: isCapturingRef.current,
          isCapturingState: isCapturing,
          videoReadyState: videoRef.current?.readyState,
          videoWidth: videoRef.current?.videoWidth,
          videoHeight: videoRef.current?.videoHeight,
          videoSrcObject: !!videoRef.current?.srcObject,
          videoPaused: videoRef.current?.paused
        });
      }
      if (isCapturingRef.current) {
        requestRef.current = requestAnimationFrame(predictWebcam);
      }
      return;
    }

    // Check if video has valid dimensions
    if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      if (shouldLog) {
        console.warn("⚠️ Video dimensions not ready:", {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState,
          srcObject: !!videoRef.current.srcObject,
          paused: videoRef.current.paused
        });
      }
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    if (shouldLog) {
      console.log("✅ About to call MediaPipe detectForVideo");
    }

    const startTimeMs = performance.now();
    
    try {
      // For webcam, we should process every frame, not check currentTime
      // currentTime check was for video files, but webcam is a live stream
      const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (shouldLog) {
        console.log("MediaPipe returned:", {
          hasFaceLandmarks: !!results.faceLandmarks,
          numFaces: results.faceLandmarks?.length || 0
        });
      }

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        if (!firstDetectionRef.current) {
          firstDetectionRef.current = true;
          console.log("🎉🎉🎉 FIRST FACE DETECTED! Tracking started successfully! 🎉🎉🎉");
        }
        processGaze(results.faceLandmarks[0]);
      } else {
        if (shouldLog) {
          console.log("⚠ No face in frame - MediaPipe returned 0 faces");
        }
        setCurrentGaze('center');
      }
    } catch (err) {
      console.error("❌ Error in detectForVideo:", err);
    }

    if (isCapturingRef.current && timeLeft > 0) {
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
    // Compute camera-space X using average X of FaceMesh eye landmarks: 33, 133, 362, 263.
    // Convert to screen-space X because webcam coordinates are horizontally inverted
    // relative to what the child sees on-screen during the left/right stimulus task.
    const cameraGazeX = (landmarks[33].x + landmarks[133].x + landmarks[362].x + landmarks[263].x) / 4;
    const screenGazeX = 1 - cameraGazeX;
    gazeXRef.current = screenGazeX;
    
    // Track total valid gaze time (any frame where face is detected)
    totalValidGazeTimeRef.current += deltaTime;
    
    // 5. ZONE LOGIC
    let gazeZone = 'center';
    
    // LEFT (social): screenGazeX < 0.45
    if (screenGazeX < 0.45) {
      gazeZone = 'left';
      leftTimeRef.current += deltaTime;
    } 
    // RIGHT (non-social): screenGazeX > 0.55
    else if (screenGazeX > 0.55) {
      gazeZone = 'right';
      rightTimeRef.current += deltaTime;
    }
    // CENTER: 0.45 <= screenGazeX <= 0.55 → split time
    else {
      gazeZone = 'center';
      leftTimeRef.current += deltaTime * 0.5;
      rightTimeRef.current += deltaTime * 0.5;
    }
    
    setCurrentGaze(gazeZone);
  };

  const finishTest = async () => {
    isCapturingRef.current = false; // Stop animation loop immediately
    setIsCapturing(false); // Update UI
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
          totalValidTime: Math.round(totalValidTime * 1000),
          riskFlag: false,
          clinicalSummary: "Insufficient gaze data collected. Assessment could not be completed reliably.",
          insufficientData: true,
          assessmentType: 'social-attention',
          game: 'Social Attention',
          sessionId: sessionId || `local-${Date.now()}`,
          score: 0,
          metrics: {
            socialPreferenceScore: 0,
            leftTime: Math.round(leftTime * 1000),
            rightTime: Math.round(rightTime * 1000),
            leftLookTime: Math.round(leftTime * 1000),
            rightLookTime: Math.round(rightTime * 1000),
            totalValidTime: Math.round(totalValidTime * 1000)
          }
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
        totalValidTime: Math.round(totalValidTime * 1000),
        riskFlag,
        clinicalSummary,
        assessmentType: 'social-attention',
        game: 'Social Attention',
        sessionId: sessionId || `local-${Date.now()}`,
        score: preferenceScore,
        metrics: {
          socialPreferenceScore: preferenceScore,
          leftTime: Math.round(leftTime * 1000),
          rightTime: Math.round(rightTime * 1000),
          leftLookTime: Math.round(leftTime * 1000),
          rightLookTime: Math.round(rightTime * 1000),
          totalValidTime: Math.round(totalValidTime * 1000)
        }
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
              assessmentType: 'social-attention',
              game: 'Social Attention',
              sessionId: sessionId || `local-${Date.now()}`,
              metrics: {
                socialPreferenceScore: preferenceScore,
                leftTime: Math.round(leftTime * 1000), // ms
                rightTime: Math.round(rightTime * 1000), // ms
                leftLookTime: Math.round(leftTime * 1000),
                rightLookTime: Math.round(rightTime * 1000),
                totalValidTime: Math.round(totalValidTime * 1000),
                riskFlag: riskFlag
              },
              score: preferenceScore,
              sessionDuration: 30,
              rawGameData: {
                clinicalSummary: clinicalSummary,
                insufficientData: totalValidTime < 5
              }
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
        totalValidTime: Math.round(totalTime * 1000),
        riskFlag: false,
        clinicalSummary: totalTime >= 5 ? "Assessment completed with local processing." : "Insufficient gaze data collected.",
        assessmentType: 'social-attention',
        game: 'Social Attention',
        sessionId: sessionId || `local-${Date.now()}`,
        score: preferenceScore,
        metrics: {
          socialPreferenceScore: preferenceScore,
          leftTime: Math.round(leftTime * 1000),
          rightTime: Math.round(rightTime * 1000),
          leftLookTime: Math.round(leftTime * 1000),
          rightLookTime: Math.round(rightTime * 1000),
          totalValidTime: Math.round(totalTime * 1000)
        }
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
      {/* Webcam video for MediaPipe - must be rendered with real dimensions */}
      <video 
        ref={videoRef} 
        playsInline 
        muted 
        autoPlay
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '640px',
          height: '480px',
          opacity: 0.01, // Almost invisible but still rendered
          pointerEvents: 'none',
          zIndex: -1
        }} 
      />
      
      {!isCapturing ? (
        <div className="start-screen-clinical">
          <div className="clinical-header">
            <h2>Social Attention Test</h2>
            <p>Behavioural Assessment (Preferential Looking Paradigm)</p>
          </div>
          
          {/* Display errors prominently */}
          {cameraError && (
            <div style={{
              background: '#fee2e2',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              padding: '15px',
              margin: '20px 0',
              color: '#991b1b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <FiAlertTriangle size={24} />
                <div>
                  <strong>Error:</strong> {cameraError}
                </div>
              </div>
              <button
                onClick={() => {
                  setCameraError(null);
                  setIsLoadingModel(true);
                  initializeLandmarker();
                }}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Retry Initialization
              </button>
            </div>
          )}
          
          {/* Loading status display */}
          {isLoadingModel && (
            <div style={{
              background: '#dbeafe',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              padding: '15px',
              margin: '20px 0',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FiLoader className="spin" size={24} />
              <div>
                <strong>Loading...</strong> Initializing face tracking model. This may take a few moments.
              </div>
            </div>
          )}
          
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
          
          {/* Debug info */}
          <div style={{ 
            background: '#f1f5f9', 
            padding: '10px', 
            borderRadius: '8px', 
            fontSize: '12px', 
            fontFamily: 'monospace',
            marginBottom: '20px',
            color: '#475569'
          }}>
            <strong>Status:</strong> {isLoadingModel ? '⏳ Loading...' : cameraError ? '❌ Error' : '✅ Ready'} | 
            Model: {landmarkerRef.current ? '✓' : '✗'} | 
            Camera: {cameraStream ? '✓' : '✗'}
          </div>
          
          <button 
            className="clinical-start-btn" 
            onClick={(e) => {
              console.log("=== BUTTON CLICKED ===");
              console.log("isLoadingModel:", isLoadingModel);
              console.log("cameraError:", cameraError);
              console.log("isCapturing:", isCapturing);
              console.log("landmarker exists:", !!landmarkerRef.current);
              console.log("Event:", e);
              e.preventDefault();
              e.stopPropagation();
              try {
                startTest();
              } catch (err) {
                console.error("Error in startTest:", err);
              }
            }}
            disabled={isLoadingModel || !!cameraError}
            style={{
              position: 'relative',
              zIndex: 10,
              ...(cameraError ? { opacity: 0.5, cursor: 'not-allowed' } : {})
            }}
          >
            {isLoadingModel ? (
              <>
                <FiLoader className="spin" style={{ marginRight: '10px', display: 'inline-block', verticalAlign: 'middle' }} />
                Loading Model...
              </>
            ) : cameraError ? (
              "Unable to Start - See Error Above"
            ) : (
              "Start 30s Assessment"
            )}
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

          {/* Diagnostic Overlay - Shows tracking status */}
          <div 
            ref={diagnosticRef}
            style={{
              position: 'absolute',
              top: '80px',
              right: '20px',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              zIndex: 150,
              minWidth: '220px',
              border: '2px solid #10b981'
            }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#10b981', fontSize: '16px' }}>
              📊 Tracking Status
            </div>
            <div style={{ marginBottom: '6px' }}>
              Gaze: <strong className="diag-gaze" style={{ fontSize: '15px' }}>
                ● CENTER
              </strong>
            </div>
            <div style={{ marginBottom: '4px' }}>
              Left: <strong className="diag-left" style={{ color: '#3b82f6' }}>0.0s</strong>
            </div>
            <div style={{ marginBottom: '4px' }}>
              Right: <strong className="diag-right" style={{ color: '#ef4444' }}>0.0s</strong>
            </div>
            <div style={{ marginBottom: '8px' }}>
              Total: <strong className="diag-total" style={{ color: '#10b981' }}>0.0s</strong>
            </div>
            <div 
              className="diag-status"
              style={{ 
                fontSize: '12px', 
                marginTop: '10px', 
                padding: '6px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}>
              ⚠ No face detected yet
            </div>
            
            {/* Mini webcam preview */}
            <div style={{ marginTop: '10px', position: 'relative' }}>
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                Camera Feed: {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight} (Ready: {videoRef.current?.readyState})
              </div>
              <div style={{
                width: '100%',
                height: '80px',
                borderRadius: '4px',
                border: '1px solid #444',
                background: '#000',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Show the actual videoRef element used by MediaPipe */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: cameraStream ? '#4ade80' : '#ef4444'
                }}>
                  {cameraStream ? '📹 Stream Active' : '❌ No Stream'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Video ref moved to diagnostic overlay for visibility */}
    </div>
  );
};

export default SocialAttentionGame;
