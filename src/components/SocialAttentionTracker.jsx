import React, { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FiCamera, FiAlertCircle, FiLoader, FiCheckCircle, FiClock, FiActivity, FiX } from 'react-icons/fi';
import './SocialAttentionTracker.css';

const SocialAttentionTracker = ({ patientId, onClose, onComplete }) => {
  const [sessionPhase, setSessionPhase] = useState('ready'); // ready, active, finished, error
  const [timeLeft, setTimeLeft] = useState(30);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [videoSources, setVideoSources] = useState({
    left: "https://videos.pexels.com/video-files/4440954/4440954-sd_640_360_25fps.mp4",
    right: "https://videos.pexels.com/video-files/3129957/3129957-sd_640_360_25fps.mp4"
  });

  const videoRef = useRef(null);
  const leftVideoRef = useRef(null);
  const rightVideoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const streamRef = useRef(null);
  
  // Accumulators
  const leftTimeRef = useRef(0);
  const rightTimeRef = useRef(0);
  const totalTimeRef = useRef(0);
  const lastTimestampRef = useRef(performance.now());
  const logTimerRef = useRef(0);

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    initializeMediaPipe();
    fetchVideoSources();
    return () => {
      stopSession();
    };
  }, []);

  const fetchVideoSources = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/social-attention/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: patientId, dryRun: true })
      });
      if (res.ok) {
        const { leftVideo, rightVideo } = await res.json();
        if (leftVideo && rightVideo) {
          setVideoSources({ left: leftVideo, right: rightVideo });
        }
      }
    } catch (err) {
      console.warn("Using default video sources:", err);
    }
  };

  const initializeMediaPipe = async () => {
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
      console.error("MediaPipe Init Error:", err);
      setError("Failed to initialize tracking service.");
      setIsLoadingModel(false);
    }
  };

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setSessionPhase('active');
          lastTimestampRef.current = performance.now();
          logTimerRef.current = performance.now();
          
          // Start stimulus videos
          setTimeout(() => {
            if (leftVideoRef.current) leftVideoRef.current.play();
            if (rightVideoRef.current) rightVideoRef.current.play();
          }, 500);

          requestRef.current = requestAnimationFrame(predictFrame);
        };
      }
    } catch (err) {
      setError("Camera access denied.");
    }
  };

  const stopSession = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (leftVideoRef.current) leftVideoRef.current.pause();
    if (rightVideoRef.current) rightVideoRef.current.pause();
  };

  const predictFrame = (now) => {
    if (!videoRef.current || !landmarkerRef.current || sessionPhase !== 'active') return;

    const deltaTime = (now - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = now;

    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const detections = landmarkerRef.current.detectForVideo(videoRef.current, now);

      if (detections.faceLandmarks && detections.faceLandmarks.length > 0) {
        const landmarks = detections.faceLandmarks[0];
        
        // Use Iris landmarks (468, 473) for high-precision gaze
        const leftIris = landmarks[468];
        const rightIris = landmarks[473];
        const gazeX = (leftIris.x + rightIris.x) / 2;

        // Apply fixed thresholds (0.45 and 0.55 with dead-zone)
        if (gazeX < 0.45) {
          leftTimeRef.current += deltaTime;
        } else if (gazeX > 0.55) {
          rightTimeRef.current += deltaTime;
        }
        
        totalTimeRef.current = leftTimeRef.current + rightTimeRef.current;
      }
    }

    // Log every second
    if (now - logTimerRef.current >= 1000) {
      console.log("L:", leftTimeRef.current.toFixed(1), "R:", rightTimeRef.current.toFixed(1));
      logTimerRef.current = now;
    }

    // Continue loop
    requestRef.current = requestAnimationFrame(predictFrame);
  };

  // Timer useEffect for the 30s session
  useEffect(() => {
    let timer;
    if (sessionPhase === 'active') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionPhase]);

  const handleComplete = async () => {
    setSessionPhase('finished');
    stopSession();

    const totalTime = totalTimeRef.current;
    const leftTime = leftTimeRef.current;
    const rightTime = rightTimeRef.current;
    
    if (totalTime < 5) {
      setResults({ insufficient: true });
      return;
    }

    const socialPreference = (leftTime / totalTime) * 100;
    const calculatedConfidence = (totalTime / 30) * 100;

    const sessionResult = {
      socialPreferenceScore: socialPreference,
      socialTime: leftTime,
      nonSocialTime: rightTime,
      totalTime: totalTime,
      confidence: calculatedConfidence,
      timestamp: new Date().toISOString(),
      patientId: patientId
    };

    setResults(sessionResult);
    setConfidence(calculatedConfidence);

    // Store in backend
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/social-attention/therapist/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sessionResult)
      });
    } catch (err) {
      console.error("Failed to save results:", err);
    }
    
    if (onComplete) onComplete(sessionResult);
  };

  return (
    <div className="social-tracker-overlay">
      <div className="social-tracker-modal">
        <div className="social-tracker-header">
          <h3>Social Attention Scoring</h3>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>

        <div className="social-tracker-body">
          {sessionPhase === 'ready' && (
            <div className="phase-ready">
              <FiActivity className="icon-large" />
              <p>Ready to start 30-second Social Attention assessment.</p>
              <button className="start-btn" onClick={startSession} disabled={isLoadingModel}>
                {isLoadingModel ? <FiLoader className="spin" /> : 'Start Assessment'}
              </button>
            </div>
          )}

          {sessionPhase === 'active' && (
            <div className="phase-active-clinical">
              <div className="stimulus-panels">
                <div className="stimulus-panel left">
                  <video ref={leftVideoRef} src={videoSources.left} muted loop playsInline />
                  <div className="panel-label">SOCIAL</div>
                </div>
                <div className="stimulus-panel right">
                  <video ref={rightVideoRef} src={videoSources.right} muted loop playsInline />
                  <div className="panel-label">NON-SOCIAL</div>
                </div>
              </div>
              
              <div className="monitor-overlay">
                <video ref={videoRef} className="monitor-feed" muted />
                <div className="monitor-timer">
                  <FiClock /> {timeLeft}s
                </div>
              </div>
              <p className="tracking-hint-clinical">Tracking child's gaze patterns...</p>
            </div>
          )}

          {sessionPhase === 'finished' && results && (
            <div className="phase-finished">
              {results.insufficient ? (
                <div className="insufficient-data">
                  <FiAlertCircle className="icon-error" />
                  <h4>Insufficient gaze data</h4>
                  <p>Total tracking time was less than 10 seconds. Please try again.</p>
                  <button className="retry-btn" onClick={() => {
                    setSessionPhase('ready');
                    setTimeLeft(30);
                    leftTimeRef.current = 0;
                    rightTimeRef.current = 0;
                    totalTimeRef.current = 0;
                  }}>Retry</button>
                </div>
              ) : (
                <div className="results-display">
                  <FiCheckCircle className="icon-success" />
                  <h4>Assessment Complete</h4>
                  <div className="metrics-grid">
                    <div className="metric-card highlight">
                      <label>Social Preference</label>
                      <span>{results.socialPreferenceScore.toFixed(1)}%</span>
                    </div>
                    <div className="metric-card">
                      <label>Social Time</label>
                      <span>{results.socialTime.toFixed(1)}s</span>
                    </div>
                    <div className="metric-card">
                      <label>Non-Social Time</label>
                      <span>{results.nonSocialTime.toFixed(1)}s</span>
                    </div>
                    <div className="metric-card">
                      <label>Confidence</label>
                      <span>{results.confidence.toFixed(1)}%</span>
                    </div>
                  </div>
                  <button className="done-btn" onClick={onClose}>Finish</button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-display">
              <FiAlertCircle />
              <p>{error}</p>
              <button onClick={onClose}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialAttentionTracker;
