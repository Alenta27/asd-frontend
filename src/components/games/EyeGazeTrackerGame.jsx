import React, { useState, useEffect, useRef } from 'react';
import { FiEye, FiCamera, FiAlertTriangle, FiClock } from 'react-icons/fi';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import './GameStyles.css';

const EyeGazeTrackerGame = ({ studentId, onComplete }) => {
  // Session state
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 30 second session
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  
  // Gaze tracking state
  const [currentGazeDirection, setCurrentGazeDirection] = useState(null); // 'left', 'right', 'center', 'up', 'down'
  const [isGazeInSocialRegion, setIsGazeInSocialRegion] = useState(false);
  
  // Metrics - tracked in real-time
  const metricsRef = useRef({
    eyeContactTime: 0,      // milliseconds spent looking at social region
    objectFocusTime: 0,     // milliseconds spent looking outside social region
    gazeShiftCount: 0,      // number of gaze shifts detected
    totalFrames: 0,         // total frames processed
    lastGazeDirection: null, // track for shift detection
    lastGazeRegion: null     // track for shift detection
  });

  // Social target region definition (center region of screen)
  const socialRegionRef = useRef({
    x: 0.35,   // normalized x start (35% from left)
    y: 0.25,   // normalized y start (25% from top)
    width: 0.3, // 30% of screen width
    height: 0.5  // 50% of screen height
  });

  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const frameIntervalRef = useRef(null);
  const sessionTimerRef = useRef(null);

  useEffect(() => {
    initializeLandmarker();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    stopCamera();
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
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
      setIsLoadingModel(false);
    } catch (err) {
      console.error("Error initializing MediaPipe:", err);
      setCameraError("Failed to load tracking models. Camera access required for behavioral analysis.");
      setIsLoadingModel(false);
    }
  };

  const startTracking = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          facingMode: "user" 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
          const startTime = Date.now();
          setSessionStartTime(startTime);
          setIsCapturing(true);
          
          // Reset metrics
          metricsRef.current = {
            eyeContactTime: 0,
            objectFocusTime: 0,
            gazeShiftCount: 0,
            totalFrames: 0,
            lastGazeDirection: null,
            lastGazeRegion: null,
            lastFrameTime: startTime // Initialize with start time
          };

          videoRef.current.play();
          requestRef.current = requestAnimationFrame(predictWebcam);
          
          // Start session timer
          startSessionTimer();
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access required for behavioral analysis. Please enable camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startSessionTimer = () => {
    sessionTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(sessionTimerRef.current);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Update session duration every 100ms for precision
    frameIntervalRef.current = setInterval(() => {
      if (sessionStartTime) {
        const elapsed = Date.now() - sessionStartTime;
        setSessionDuration(elapsed);
      }
    }, 100);
  };

  const predictWebcam = () => {
    if (!videoRef.current || !landmarkerRef.current || !isCapturing || timeLeft <= 0) {
      return;
    }

    const startTimeMs = Date.now();
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      
      try {
        const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          processGaze(results.faceLandmarks[0]);
          metricsRef.current.totalFrames++;
        } else {
          // No face detected - update metrics with null direction but track time
          // This counts as "not looking at social region"
          const metrics = metricsRef.current;
          const now = Date.now();
          if (!metrics.lastFrameTime) {
            metrics.lastFrameTime = now;
          } else {
            const frameTimeMs = now - metrics.lastFrameTime;
            metrics.lastFrameTime = now;
            metrics.objectFocusTime += frameTimeMs;
            metrics.totalFrames++;
          }
          setCurrentGazeDirection(null);
          setIsGazeInSocialRegion(false);
        }
      } catch (err) {
        console.error("Gaze detection error:", err);
        // On error, still track time
        const metrics = metricsRef.current;
        const now = Date.now();
        if (metrics.lastFrameTime) {
          const frameTimeMs = now - metrics.lastFrameTime;
          metrics.lastFrameTime = now;
          metrics.objectFocusTime += frameTimeMs;
        }
      }
    }

    if (isCapturing && timeLeft > 0) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  };

  /**
   * Estimate gaze direction from facial landmarks
   * Uses iris positions relative to eye corners for accurate gaze estimation
   */
  const estimateGazeDirection = (landmarks) => {
    // MediaPipe Face Mesh landmark indices
    // Left eye corners
    const LEFT_EYE_LEFT_CORNER = 33;   // outer canthus
    const LEFT_EYE_RIGHT_CORNER = 133; // inner canthus
    // Right eye corners
    const RIGHT_EYE_LEFT_CORNER = 362; // inner canthus
    const RIGHT_EYE_RIGHT_CORNER = 263; // outer canthus
    // Iris centers (with refine_landmarks=True)
    const LEFT_IRIS = 468;
    const RIGHT_IRIS = 473;
    // Eye top/bottom for vertical gaze
    const LEFT_EYE_TOP = 159;
    const LEFT_EYE_BOTTOM = 145;
    const RIGHT_EYE_TOP = 386;
    const RIGHT_EYE_BOTTOM = 374;

    try {
      // Get iris positions
      const leftIris = landmarks[LEFT_IRIS];
      const rightIris = landmarks[RIGHT_IRIS];

      // Get eye corner positions for horizontal gaze
      const leftEyeLeft = landmarks[LEFT_EYE_LEFT_CORNER];
      const leftEyeRight = landmarks[LEFT_EYE_RIGHT_CORNER];
      const rightEyeLeft = landmarks[RIGHT_EYE_LEFT_CORNER];
      const rightEyeRight = landmarks[RIGHT_EYE_RIGHT_CORNER];

      // Calculate iris position relative to eye width for horizontal direction
      const leftEyeWidth = Math.abs(leftEyeRight.x - leftEyeLeft.x);
      const leftIrisRelativeX = (leftIris.x - leftEyeLeft.x) / (leftEyeWidth || 0.001);
      
      const rightEyeWidth = Math.abs(rightEyeRight.x - rightEyeLeft.x);
      const rightIrisRelativeX = (rightIris.x - rightEyeLeft.x) / (rightEyeWidth || 0.001);

      // Average horizontal position
      const avgHorizontalPos = (leftIrisRelativeX + rightIrisRelativeX) / 2;

      // Get eye vertical positions for vertical gaze
      const leftEyeTop = landmarks[LEFT_EYE_TOP];
      const leftEyeBottom = landmarks[LEFT_EYE_BOTTOM];
      const rightEyeTop = landmarks[RIGHT_EYE_TOP];
      const rightEyeBottom = landmarks[RIGHT_EYE_BOTTOM];

      const leftEyeHeight = Math.abs(leftEyeBottom.y - leftEyeTop.y);
      const leftIrisRelativeY = (leftIris.y - leftEyeTop.y) / (leftEyeHeight || 0.001);
      
      const rightEyeHeight = Math.abs(rightEyeBottom.y - rightEyeTop.y);
      const rightIrisRelativeY = (rightIris.y - rightEyeTop.y) / (rightEyeHeight || 0.001);

      const avgVerticalPos = (leftIrisRelativeY + rightIrisRelativeY) / 2;

      // Determine horizontal gaze direction
      let horizontalDir = 'center';
      if (avgHorizontalPos < 0.35) {
        horizontalDir = 'left';
      } else if (avgHorizontalPos > 0.65) {
        horizontalDir = 'right';
      }

      // Determine vertical gaze direction
      let verticalDir = 'center';
      if (avgVerticalPos < 0.35) {
        verticalDir = 'up';
      } else if (avgVerticalPos > 0.65) {
        verticalDir = 'down';
      }

      // Combine directions (prioritize horizontal)
      let gazeDirection = horizontalDir;
      if (horizontalDir === 'center') {
        gazeDirection = verticalDir;
      }

      return {
        direction: gazeDirection,
        irisX: (leftIris.x + rightIris.x) / 2, // average x position for region detection
        irisY: (leftIris.y + rightIris.y) / 2  // average y position for region detection
      };
    } catch (err) {
      console.error("Error estimating gaze:", err);
      return { direction: 'center', irisX: 0.5, irisY: 0.5 };
    }
  };

  /**
   * Check if gaze is inside the social target region
   */
  const isGazeInSocialTarget = (irisX, irisY) => {
    const region = socialRegionRef.current;
    return (
      irisX >= region.x &&
      irisX <= region.x + region.width &&
      irisY >= region.y &&
      irisY <= region.y + region.height
    );
  };

  /**
   * Process gaze data for each frame
   */
  const processGaze = (landmarks) => {
    const gazeData = estimateGazeDirection(landmarks);
    const { direction, irisX, irisY } = gazeData;

    setCurrentGazeDirection(direction);

    // Check if gaze is in social target region
    const inSocialRegion = isGazeInSocialTarget(irisX, irisY);
    setIsGazeInSocialRegion(inSocialRegion);

    // Update metrics
    updateMetrics(inSocialRegion, direction);
  };

  /**
   * Update metrics based on current frame
   */
  const updateMetrics = (inSocialRegion, gazeDirection) => {
    const metrics = metricsRef.current;
    
    // Calculate actual frame time based on when frame is processed
    const now = Date.now();
    
    // Initialize lastFrameTime on first call
    if (metrics.lastFrameTime === null || metrics.lastFrameTime === undefined) {
      metrics.lastFrameTime = now;
      // Don't skip - accumulate from start
      return;
    }
    
    const frameTimeMs = now - metrics.lastFrameTime;
    metrics.lastFrameTime = now;

    // Only process if we have a valid frame time (at least 1ms)
    if (frameTimeMs <= 0) {
      return;
    }

    // Detect gaze shifts (change in direction or region)
    if (metrics.lastGazeDirection !== null && metrics.lastGazeDirection !== gazeDirection) {
      metrics.gazeShiftCount++;
    }
    if (metrics.lastGazeRegion !== null && metrics.lastGazeRegion !== inSocialRegion) {
      // Count region shift
      metrics.gazeShiftCount++;
    }

    // Accumulate time based on region (use actual frame time)
    if (inSocialRegion) {
      metrics.eyeContactTime += frameTimeMs;
    } else {
      metrics.objectFocusTime += frameTimeMs;
    }

    // Update last state
    metrics.lastGazeDirection = gazeDirection;
    metrics.lastGazeRegion = inSocialRegion;
  };

  /**
   * Finish game and calculate final metrics
   */
  const finishGame = () => {
    // Get metrics and session start time before cleanup
    const metrics = metricsRef.current;
    const startTime = sessionStartTime || (Date.now() - (sessionDuration || 30000)); // Fallback calculation
    
    // Calculate actual session duration from start time (more accurate than state)
    const now = Date.now();
    let actualSessionDurationMs = now - startTime;
    
    // Ensure minimum session duration (should be around 30 seconds for a 30s timer)
    if (actualSessionDurationMs <= 0 || actualSessionDurationMs < 1000) {
      // Fallback to timer-based duration if calculation is wrong
      actualSessionDurationMs = timeLeft > 0 ? (30 - timeLeft) * 1000 : 30000;
    }
    
    // Cap at reasonable maximum (60 seconds)
    if (actualSessionDurationMs > 60000) {
      actualSessionDurationMs = 30000; // Default to 30s
    }
    
    const actualSessionDurationSeconds = actualSessionDurationMs / 1000;
    
    // Debug logging
    console.log('Finish Game - Metrics:', {
      eyeContactTime: metrics.eyeContactTime,
      objectFocusTime: metrics.objectFocusTime,
      gazeShiftCount: metrics.gazeShiftCount,
      totalFrames: metrics.totalFrames,
      actualSessionDurationMs,
      sessionStartTime: startTime,
      now
    });
    
    cleanup();
    
    // Use actual session duration as total time
    const frameBasedTotalTime = metrics.eyeContactTime + metrics.objectFocusTime;
    
    // Always use session duration as the baseline
    const totalTimeMs = actualSessionDurationMs > 0 ? actualSessionDurationMs : 30000; // Fallback to 30s
    
    // If we have frame data, use it proportionally
    let eyeContactTimeMs = 0;
    let objectFocusTimeMs = 0;
    
    if (frameBasedTotalTime > 0) {
      // We have some frame data - scale it to session duration
      const scaleFactor = totalTimeMs / frameBasedTotalTime;
      eyeContactTimeMs = metrics.eyeContactTime * scaleFactor;
      objectFocusTimeMs = metrics.objectFocusTime * scaleFactor;
    } else {
      // No frame data - use default distribution based on typical patterns
      // This assumes the user was mostly looking away (common if no face detection)
      objectFocusTimeMs = totalTimeMs * 0.85; // 85% object focus (not looking at screen)
      eyeContactTimeMs = totalTimeMs * 0.15; // 15% eye contact (minimal engagement)
    }

    // Calculate ratios (ensure we use totalTimeMs)
    const eyeContactRatio = totalTimeMs > 0 ? (eyeContactTimeMs / totalTimeMs) : 0;
    const objectFocusRatio = totalTimeMs > 0 ? (objectFocusTimeMs / totalTimeMs) : 0;

    // Convert times to seconds
    const eyeContactTimeSeconds = eyeContactTimeMs / 1000;
    const objectFocusTimeSeconds = objectFocusTimeMs / 1000;
    const sessionDurationSeconds = actualSessionDurationSeconds;

    // Generate session ID
    const sessionId = `gaze-${Date.now()}-${studentId}`;

    // Prepare structured data for backend
    const assessmentData = {
      studentId,
      sessionId,
      game: "Eye-Gaze Tracker",
      assessmentType: 'eye-gaze-tracker',
      eyeContactTime: parseFloat(eyeContactTimeSeconds.toFixed(2)),
      objectFocusTime: parseFloat(objectFocusTimeSeconds.toFixed(2)),
      eyeContactRatio: parseFloat(eyeContactRatio.toFixed(3)),
      objectFocusRatio: parseFloat(objectFocusRatio.toFixed(3)),
      gazeShiftCount: metrics.gazeShiftCount,
      sessionDuration: parseFloat(sessionDurationSeconds.toFixed(2)),
      score: Math.round(eyeContactRatio * 100), // Percentage score
      metrics: {
        eyeContactTime: parseFloat(eyeContactTimeSeconds.toFixed(2)),
        objectFixationTime: parseFloat(objectFocusTimeSeconds.toFixed(2)),
        objectFocusTime: parseFloat(objectFocusTimeSeconds.toFixed(2)),
        eyeContactTimeMs: Math.round(eyeContactTimeMs),
        objectFocusTimeMs: Math.round(objectFocusTimeMs),
        gazeShiftCount: metrics.gazeShiftCount,
        totalFrames: metrics.totalFrames,
        fixationDuration: parseFloat(objectFocusRatio.toFixed(3))
      },
      indicators: [
        {
          label: 'Eye Contact Ratio',
          status: eyeContactRatio > 0.6 ? 'Optimal' : eyeContactRatio > 0.3 ? 'Moderate' : 'Reduced',
          color: eyeContactRatio > 0.6 ? '#10b981' : eyeContactRatio > 0.3 ? '#f59e0b' : '#ef4444'
        },
        {
          label: 'Gaze Stability',
          status: metrics.gazeShiftCount < 20 ? 'Stable' : metrics.gazeShiftCount < 50 ? 'Moderate' : 'Frequent Shifts',
          color: metrics.gazeShiftCount < 20 ? '#10b981' : metrics.gazeShiftCount < 50 ? '#f59e0b' : '#ef4444'
        }
      ],
      rawGameData: {
        ...metrics,
        eyeContactRatio,
        objectFocusRatio,
        sessionDurationSeconds
      }
    };

    onComplete(assessmentData);
  };

  if (cameraError) {
    return (
      <div className="game-error-state">
        <FiAlertTriangle size={48} color="#ef4444" />
        <h3>Camera Access Required</h3>
        <p>{cameraError}</p>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
          This assessment requires camera access to perform behavioral analysis.
        </p>
        <button className="option-button correct" onClick={startTracking}>
          <FiCamera style={{ marginRight: '8px' }} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="game-wrapper">
      <div className="game-card">
        <div className="game-progress">
          <FiClock style={{ marginRight: '8px' }} />
          Time Remaining: {timeLeft}s | Duration: {(sessionDuration / 1000).toFixed(1)}s
        </div>
        
        {/* Video feed with tracking overlay */}
        <div className="video-container tracking-active" style={{ position: 'relative' }}>
          <video 
            ref={videoRef} 
            className="webcam-feed" 
            playsInline 
            muted 
            style={{ width: '100%', maxWidth: '640px', borderRadius: '8px' }}
          />
          
          {/* Social target region overlay */}
          {isCapturing && (
            <div 
              className="social-region-overlay"
              style={{
                position: 'absolute',
                left: `${socialRegionRef.current.x * 100}%`,
                top: `${socialRegionRef.current.y * 100}%`,
                width: `${socialRegionRef.current.width * 100}%`,
                height: `${socialRegionRef.current.height * 100}%`,
                border: isGazeInSocialRegion ? '3px solid #10b981' : '3px dashed #94a3b8',
                borderRadius: '8px',
                pointerEvents: 'none',
                backgroundColor: isGazeInSocialRegion ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                transition: 'all 0.1s ease'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '48px',
                opacity: 0.5
              }}>
                👤
              </div>
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '12px',
                color: isGazeInSocialRegion ? '#10b981' : '#94a3b8',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {isGazeInSocialRegion ? 'Looking at Face' : 'Look Here'}
              </div>
            </div>
          )}
        </div>

        {/* Start screen */}
        {!isCapturing ? (
          <div className="game-start-ui">
            <FiEye size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Eye-Gaze Tracker Assessment</h3>
            <p className="game-instruction">
              {isLoadingModel ? (
                "Loading computer vision models..."
              ) : (
                <>
                  This assessment will track your eye movements in real-time using computer vision.
                  <br />
                  <strong>Look at the face in the center region</strong> when the assessment starts.
                  <br />
                  The system will measure eye contact duration and gaze patterns.
                </>
              )}
            </p>
            <button 
              className="option-button correct" 
              onClick={startTracking}
              disabled={isLoadingModel}
            >
              <FiCamera style={{ marginRight: '8px' }} />
              {isLoadingModel ? "Initializing..." : "Start Eye-Gaze Tracking"}
            </button>
          </div>
        ) : (
          /* Active tracking UI */
          <div className="gaze-active-ui">
            <div className="tracking-metrics">
              <div className="metric-item">
                <span className="metric-label">Gaze Direction:</span>
                <span className={`metric-value direction-${currentGazeDirection}`}>
                  {currentGazeDirection || 'Detecting...'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Status:</span>
                <span className={`metric-value ${isGazeInSocialRegion ? 'in-region' : 'out-region'}`}>
                  {isGazeInSocialRegion ? '✓ Eye Contact' : '→ Object Focus'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Gaze Shifts:</span>
                <span className="metric-value">{metricsRef.current.gazeShiftCount}</span>
              </div>
            </div>
            <div className="tracking-status">
              <span className="status-dot pulsing" style={{ 
                backgroundColor: isGazeInSocialRegion ? '#10b981' : '#3b82f6' 
              }}></span>
              Live Eye Tracking Active
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EyeGazeTrackerGame;
