import React, { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, HandLandmarker, PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FiVolume2, FiCamera, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import './GameStyles.css';

const SOUNDS = [
  { id: 'rain', type: 'Neutral', label: 'Soft Rain', url: 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg' },
  { id: 'clock', type: 'Neutral', label: 'Ticking Clock', url: 'https://actions.google.com/sounds/v1/household/clock_ticking.ogg' },
  { id: 'horn', type: 'Sudden', label: 'Car Horn', url: 'https://actions.google.com/sounds/v1/transportation/car_horn.ogg' },
  { id: 'bell', type: 'Sudden', label: 'Alarm Clock', url: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
  { id: 'wind', type: 'Continuous', label: 'Strong Wind', url: 'https://actions.google.com/sounds/v1/weather/strong_wind.ogg' },
  { id: 'alarm', type: 'Continuous', label: 'Digital Alarm', url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' }
];

const SoundSensitivityGame = ({ studentId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [results, setResults] = useState([]);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [earCoveringDetected, setEarCoveringDetected] = useState(false);
  
  const videoRef = useRef(null);
  const audioRef = useRef(new Audio());
  const faceLM = useRef(null);
  const handLM = useRef(null);
  const poseLM = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const lastTimestampMsRef = useRef(0);
  const streamRef = useRef(null);
  const isCapturingRef = useRef(false);
  const audioCache = useRef({});
  
  const reactionData = useRef({
    facialExpressions: [],
    headMovement: 0,
    gazeDirection: { x: 0.5, y: 0.5 },
    earCovering: false,
    vocalization: 0,
    vocalizationFrames: 0,
    gazeAvoidance: false,
    headTurn: false,
    facialDiscomfort: false,
    lastNose: null,
    discomfortFrames: 0,
    gazeAwayFrames: 0,
    earCoveringFrames: 0,
    headTurnFrames: 0
  });
  
  // Microphone tracking
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);

  useEffect(() => {
    initModels();
    return () => {
      cleanup();
    };
  }, []);

  const initModels = async () => {
    try {
      const fileset = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
      
      faceLM.current = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });

      handLM.current = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });

      poseLM.current = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });

      setIsLoadingModel(false);
      preloadSounds();
    } catch (err) {
      console.error("Error initializing models:", err);
      setCameraError("Failed to load tracking models");
      setIsLoadingModel(false);
    }
  };

  const preloadSounds = () => {
    SOUNDS.forEach(sound => {
      const audio = new Audio();
      audio.src = sound.url;
      audio.preload = 'auto';
      audioCache.current[sound.id] = audio;
    });
  };

  const speakInstruction = () => {
    const text = "The child will hear different sounds. Please ensure they stay facing the camera and your device volume is turned up.";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const startAssessment = async () => {
    setCameraError(null);
    speakInstruction(); // Speak instruction when starting
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      
      streamRef.current = stream;
      
      // Transition to capturing state first so video element is rendered
      isCapturingRef.current = true;
      setIsCapturing(true);
      lastVideoTimeRef.current = -1;
      lastTimestampMsRef.current = 0;
      
      // Use a small timeout or wait for next tick to ensure videoRef is populated
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(() => {
              setupAudioAnalysis(stream);
              requestRef.current = requestAnimationFrame(trackingLoop);
              // Delay first sound slightly to allow stabilization
              setTimeout(() => playNextSound(0), 2000);
            });
          };
        }
      }, 100);
    } catch (err) {
      console.error("Hardware access error:", err);
      setCameraError("Camera and Microphone access required for assessment");
    }
  };

  const setupAudioAnalysis = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
    } catch (e) {
      console.error("Audio analysis setup failed", e);
    }
  };

  const trackingLoop = () => {
    if (!videoRef.current || !isCapturingRef.current) return;

    // MediaPipe requires non-decreasing timestamps. Use a monotonic clock and force strict increment.
    const getNextTimestampMs = () => {
      const now = performance.now();
      const next = Math.max(now, lastTimestampMsRef.current + 1);
      lastTimestampMsRef.current = next;
      return next;
    };

    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      
      try {
        const timestamp = getNextTimestampMs();
        const faceResults = faceLM.current?.detectForVideo(videoRef.current, timestamp);
        const handResults = handLM.current?.detectForVideo(videoRef.current, timestamp);
        const poseResults = poseLM.current?.detectForVideo(videoRef.current, timestamp);
        
        analyzeBehaviors(faceResults, handResults, poseResults);
      } catch (e) {
        console.error("Tracking error:", e);
      }
    }

    if (isCapturingRef.current) {
      requestRef.current = requestAnimationFrame(trackingLoop);
    }
  };

  const analyzeBehaviors = (face, hand, pose) => {
    // Debug: Log detection results
    const hasDetections = (face && face.faceBlendshapes?.length > 0) || 
                         (hand && hand.handLandmarks?.length > 0) || 
                         (pose && pose.landmarks?.length > 0);
    if (hasDetections && !reactionData.current.debugLogged) {
      console.log("📊 [Detect] Face:", !!face?.faceBlendshapes?.length, 
                  "Hand:", !!hand?.handLandmarks?.length, 
                  "Pose:", !!pose?.landmarks?.length);
      reactionData.current.debugLogged = true;
    }

    // 1. Facial Expressions & Gaze Tracking
    if (face && face.faceBlendshapes && face.faceBlendshapes.length > 0) {
      const blendshapes = face.faceBlendshapes[0].categories;
      
      // Distress patterns with lower thresholds for better detection
      const distressPatterns = {
        'browDownLeft': 0.3, 'browDownRight': 0.3,
        'eyeWideLeft': 0.3, 'eyeWideRight': 0.3,
        'eyeSquintLeft': 0.3, 'eyeSquintRight': 0.3,
        'mouthPucker': 0.3, 'mouthFunnel': 0.3,
        'noseSneerLeft': 0.3, 'noseSneerRight': 0.3
      };

      const activeExpressions = [];
      const distressExpressions = [];
      
      blendshapes.forEach(bs => {
        // Capture only stronger expression signals to avoid micro-noise.
        if (bs.score > 0.25) {
          activeExpressions.push(bs.categoryName);
          // Track distress patterns
          if (distressPatterns[bs.categoryName] && bs.score > distressPatterns[bs.categoryName]) {
            distressExpressions.push(bs.categoryName);
          }
        }
      });
      
      if (activeExpressions.length > 0) {
        reactionData.current.facialExpressions = [
          ...new Set([...reactionData.current.facialExpressions, ...activeExpressions])
        ];
      }
      
      if (distressExpressions.length >= 2) {
        reactionData.current.discomfortFrames += 1;
      } else {
        reactionData.current.discomfortFrames = Math.max(0, reactionData.current.discomfortFrames - 1);
      }

      if (reactionData.current.discomfortFrames >= 6) {
        reactionData.current.facialDiscomfort = true;
      }

      // Gaze Avoidance Tracking
      const eyeLookOutLeft = blendshapes.find(c => c.categoryName === 'eyeLookOutLeft')?.score || 0;
      const eyeLookOutRight = blendshapes.find(c => c.categoryName === 'eyeLookOutRight')?.score || 0;
      const eyeLookInLeft = blendshapes.find(c => c.categoryName === 'eyeLookInLeft')?.score || 0;
      const eyeLookInRight = blendshapes.find(c => c.categoryName === 'eyeLookInRight')?.score || 0;
      const eyeLookUpLeft = blendshapes.find(c => c.categoryName === 'eyeLookUpLeft')?.score || 0;
      const eyeLookUpRight = blendshapes.find(c => c.categoryName === 'eyeLookUpRight')?.score || 0;
      const eyeLookDownLeft = blendshapes.find(c => c.categoryName === 'eyeLookDownLeft')?.score || 0;
      const eyeLookDownRight = blendshapes.find(c => c.categoryName === 'eyeLookDownRight')?.score || 0;

      const horizontalLook = Math.max(eyeLookOutLeft, eyeLookOutRight, eyeLookInLeft, eyeLookInRight);
      const verticalLook = Math.max(eyeLookUpLeft, eyeLookUpRight, eyeLookDownLeft, eyeLookDownRight);

      // Require sustained, strong off-center gaze before flagging avoidance.
      if (horizontalLook > 0.45 || verticalLook > 0.45) {
        reactionData.current.gazeAwayFrames += 1;
      } else {
        reactionData.current.gazeAwayFrames = Math.max(0, reactionData.current.gazeAwayFrames - 1);
      }

      if (reactionData.current.gazeAwayFrames >= 8) {
        reactionData.current.gazeAvoidance = true;
      }
    }

    // 2. Ear Covering Detection with improved sensitivity
    if (hand && hand.handLandmarks && hand.handLandmarks.length > 0 && 
        face && face.faceLandmarks && face.faceLandmarks.length > 0) {
      try {
        const leftEar = face.faceLandmarks[0][234];  // Left ear landmark
        const rightEar = face.faceLandmarks[0][454]; // Right ear landmark
        
        if (leftEar && rightEar) {
          let covered = false;
          let nearEarPoints = 0;
          
          // Check each hand
          for (let handIdx = 0; handIdx < Math.min(hand.handLandmarks.length, 2); handIdx++) {
            const handMarks = hand.handLandmarks[handIdx];
            
            // Check key hand points: wrist, thumb, index, middle fingers
            const keyPoints = [0, 1, 2, 3, 4]; // landmark indices for key hand points
            
            for (let point of keyPoints) {
              if (handMarks[point]) {
                const mark = handMarks[point];
                const distLeft = Math.hypot(mark.x - leftEar.x, mark.y - leftEar.y);
                const distRight = Math.hypot(mark.x - rightEar.x, mark.y - rightEar.y);
                
                // Use a tighter threshold to avoid regular hand-near-face false positives.
                if (distLeft < 0.12 || distRight < 0.12) {
                  nearEarPoints += 1;
                }
              }
            }
            
            if (nearEarPoints >= 2) {
              covered = true;
              break;
            }

            if (covered) break;
          }
          
          if (covered) {
            reactionData.current.earCoveringFrames += 1;
          } else {
            reactionData.current.earCoveringFrames = Math.max(0, reactionData.current.earCoveringFrames - 1);
          }

          if (reactionData.current.earCoveringFrames >= 5) {
            reactionData.current.earCovering = true;
            if (!earCoveringDetected) setEarCoveringDetected(true);
          } else if (earCoveringDetected) {
            setEarCoveringDetected(false);
          }
        }
      } catch (e) {
        console.error("Ear covering detection error:", e);
      }
    }

    // 3. Head Movement Tracking
    if (pose && pose.landmarks && pose.landmarks.length > 0) {
      try {
        const nose = pose.landmarks[0][0];
        if (nose) {
          if (reactionData.current.lastNose) {
            const movement = Math.hypot(
              nose.x - reactionData.current.lastNose.x, 
              nose.y - reactionData.current.lastNose.y
            );
            if (movement > 0.02) {
              reactionData.current.headMovement += movement;
            }
            
            // Require repeated larger movement before flagging head turn.
            if (movement > 0.05) {
              reactionData.current.headTurnFrames += 1;
            } else {
              reactionData.current.headTurnFrames = Math.max(0, reactionData.current.headTurnFrames - 1);
            }

            if (reactionData.current.headTurnFrames >= 4) {
              reactionData.current.headTurn = true;
            }
          }
          reactionData.current.lastNose = nose;
        }
      } catch (e) {
        console.error("Head movement detection error:", e);
      }
    }

    // 4. Vocalization Detection
    if (analyserRef.current) {
      try {
        const dataArray = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteTimeDomainData(dataArray);

        const rms = Math.sqrt(
          dataArray.reduce((sum, value) => {
            const normalized = (value - 128) / 128;
            return sum + (normalized * normalized);
          }, 0) / dataArray.length
        ) * 100;

        if (rms > 18) {
          reactionData.current.vocalization = Math.max(reactionData.current.vocalization, rms);
          reactionData.current.vocalizationFrames += 1;
        }
      } catch (e) {
        console.error("Vocalization detection error:", e);
      }
    }
  };

  const playNextSound = (index) => {
    if (index >= SOUNDS.length) {
      finishAssessment();
      return;
    }

    setCurrentStep(index);
    const sound = SOUNDS[index];
    
    // Reset reaction data for this sound
    reactionData.current = {
      facialExpressions: [],
      headMovement: 0,
      gazeDirection: { x: 0.5, y: 0.5 },
      earCovering: false,
      vocalization: 0,
      vocalizationFrames: 0,
      gazeAvoidance: false,
      headTurn: false,
      facialDiscomfort: false,
      lastNose: null,
      discomfortFrames: 0,
      gazeAwayFrames: 0,
      earCoveringFrames: 0,
      headTurnFrames: 0,
      startTime: Date.now()
    };

    const audioPlayer = audioCache.current[sound.id] || audioRef.current;
    if (audioCache.current[sound.id]) {
      audioRef.current = audioPlayer;
    } else {
      audioRef.current.src = sound.url;
    }
    
    audioRef.current.volume = 1.0;
    console.log(`Playing sound: ${sound.label} from URL: ${sound.url}`);
    
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        console.log("Playback started successfully");
      })
      .catch(e => {
        console.error("Audio playback failed", e);
        // Fallback for some browsers blocking autoplay even after interaction
        const retryPlay = () => {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.error("Retry failed", err));
        };
        setTimeout(retryPlay, 500);
      });

    setTimeout(() => {
      audioRef.current.pause();
      setIsPlaying(false);
      
      const reaction = calculateReactionScore(reactionData.current);
      
      // Debug: Log captured data
      console.log(`\n🔊 Sound: ${sound.label}`);
      console.log("  Captures:", {
        expressions: reactionData.current.facialExpressions?.length || 0,
        headMovement: parseFloat(reactionData.current.headMovement.toFixed(2)),
        earCovering: reactionData.current.earCovering,
        gazeAvoidance: reactionData.current.gazeAvoidance,
        vocalization: Math.round(reactionData.current.vocalization),
        vocalizationFrames: reactionData.current.vocalizationFrames,
        headTurn: reactionData.current.headTurn,
        facialDiscomfort: reactionData.current.facialDiscomfort
      });
      console.log("  Score:", reaction.score, "Reactions:", reaction.reactions);
      
      const soundResult = {
        soundName: sound.label,
        soundType: sound.type,
        label: sound.label,
        type: sound.type,
        reactionDetected: reaction.score > 0,
        reactionScore: reaction.score,
        reactions: reaction.reactions,
        intensity: reaction.intensity,
        details: {
          facialExpressions: reactionData.current.facialExpressions,
          headMovement: parseFloat(reactionData.current.headMovement.toFixed(3)),
          vocalization: Math.round(reactionData.current.vocalization),
          vocalizationFrames: reactionData.current.vocalizationFrames,
          earCovering: reactionData.current.earCovering,
          gazeAvoidance: reactionData.current.gazeAvoidance,
          headTurn: reactionData.current.headTurn
        }
      };
      
      setResults(prev => [...prev, soundResult]);
      
      // Gap between sounds
      setTimeout(() => playNextSound(index + 1), 2000);
    }, 5000);
  };

  const calculateReactionScore = (data) => {
    const reactions = [];
    
    // Track all behavioral indicators
    if (data.earCovering) reactions.push("Ear Covering");
    if (data.headTurn) reactions.push("Head Turn");
    if (data.gazeAvoidance) reactions.push("Gaze Avoidance");
    if (data.facialDiscomfort) reactions.push("Facial Discomfort");
    if (data.headMovement > 0.45) reactions.push("Head Movement");
    if (data.vocalization > 25 && data.vocalizationFrames >= 10) reactions.push("Vocalization");

    // Scoring logic: 2 = Strong reaction, 1 = Mild reaction, 0 = No reaction
    let score = 0;
    
    // Strong reaction indicators
    if (data.earCovering || (reactions.length >= 3) || (data.headMovement > 0.9 && data.gazeAvoidance)) {
      score = 2;
    } 
    // Mild reaction indicators
    else if (reactions.length >= 1 || data.headMovement > 0.45) {
      score = 1;
      // Upgrade to strong if multiple responses
      if (reactions.length >= 2 && (data.headMovement > 0.6 || (data.vocalization > 30 && data.vocalizationFrames >= 14))) {
        score = 2;
      }
    }
    
    return {
      score,
      reactions: [...new Set(reactions)], // Remove duplicates
      intensity: score === 2 ? "Strong" : score === 1 ? "Mild" : "None"
    };
  };

  const finishAssessment = () => {
    isCapturingRef.current = false;
    setIsCapturing(false);
    cleanup();
    setAssessmentComplete(true);
  };

  const cleanup = () => {
    isCapturingRef.current = false;
    lastTimestampMsRef.current = 0;
    lastVideoTimeRef.current = -1;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    }
    audioRef.current.pause();
  };

  const handleSubmit = () => {
    const avgScore = results.reduce((a, b) => a + b.reactionScore, 0) / results.length;
    let overallLevel = 'Low';
    if (avgScore > 1.2) {
      overallLevel = 'High';
    } else if (avgScore > 0.4) {
      overallLevel = 'Moderate';
    }

    const assessmentData = {
      studentId,
      assessmentType: 'sound-sensitivity',
      game: 'Sound Sensitivity',
      score: Math.round((avgScore / 2) * 100),
      metrics: {
        avgReactionScore: parseFloat(avgScore.toFixed(2)),
        highSensitivityCount: results.filter(r => r.reactionScore === 2).length,
        moderateSensitivityCount: results.filter(r => r.reactionScore === 1).length,
        reactionCount: results.filter(r => r.reactionDetected).length,
        overallLevel
      },
      indicators: [
        {
          label: 'Sound Sensitivity Level',
          status: overallLevel,
          color: overallLevel === 'High' ? '#ef4444' : overallLevel === 'Moderate' ? '#f59e0b' : '#10b981'
        },
        {
          label: 'Peak Reaction',
          status: results.some(r => r.reactionScore === 2) ? 'Strong' : results.some(r => r.reactionScore === 1) ? 'Moderate' : 'Typical',
          color: results.some(r => r.reactionScore === 2) ? '#ef4444' : results.some(r => r.reactionScore === 1) ? '#f59e0b' : '#10b981'
        }
      ],
      rawGameData: results,
      completedAt: new Date().toISOString()
    };

    console.log("\n✅ Assessment Complete:");
    console.log("  Total Sounds:", results.length);
    console.log("  Overall Level:", overallLevel);
    console.log("  Avg Score:", avgScore.toFixed(2));
    console.log("  Final Data:", assessmentData);
    
    onComplete(assessmentData);
  };

  if (cameraError) {
    return (
      <div className="game-error-state">
        <FiAlertTriangle size={48} color="#ef4444" />
        <h3>Hardware Access Required</h3>
        <p>{cameraError}</p>
        <button className="option-button correct" onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  if (assessmentComplete) {
    return (
      <div className="game-wrapper">
        <div className="game-card results-ready">
          <FiCheckCircle size={60} color="#10b981" />
          <h2>Assessment Complete</h2>
          <p>Sound sensitivity tracking has been completed successfully.</p>
          <div className="results-summary-mini">
            {results.map((res, i) => (
              <div key={i} className="mini-result-item">
                <span>{res.label} ({res.type})</span>
                <span className={`score-badge score-${res.reactionScore}`}>
                  {res.reactionScore === 0 ? 'None' : res.reactionScore === 1 ? 'Mild' : 'Strong'}
                </span>
              </div>
            ))}
          </div>
          <button className="option-button correct" onClick={handleSubmit}>
            Save and View Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-wrapper">
      <div className="game-card">
        {!isCapturing && <div className="game-progress">Sound Sensitivity Screening</div>}
        {isCapturing && <div className="game-progress">Assessment Progress: {Math.round((currentStep / SOUNDS.length) * 100)}%</div>}
        
        {!isCapturing ? (
          <div className="start-screen">
            <FiVolume2 style={{ fontSize: '60px', color: '#3b82f6', marginBottom: '20px' }} />
            <h2>Sound Sensitivity</h2>
            <div className="instruction-box">
               <p className="game-instruction">
                 <FiVolume2 
                   style={{ cursor: 'pointer', marginRight: '8px', color: '#3b82f6' }} 
                   onClick={speakInstruction}
                   title="Click to hear instruction"
                 />
                 <strong>“The child will hear different sounds. Please ensure they stay facing the camera and your device volume is turned up.”</strong>
               </p>
               <ul className="instruction-list">
                 <li>No response is required from the child.</li>
                 <li>Ensure the environment is quiet for better tracking.</li>
                 <li>The assessment plays 6 sounds for 5 seconds each.</li>
                 <li>Tracking: Expressions, movement, gaze & ear-covering.</li>
               </ul>
            </div>
            <button 
              className="option-button correct" 
              onClick={startAssessment}
              disabled={isLoadingModel}
            >
              <FiCamera style={{ marginRight: '8px' }} />
              {isLoadingModel ? "Initializing Models..." : "Start Assessment"}
            </button>
          </div>
        ) : (
          <div className="sound-play">
            <div className={`sound-indicator ${isPlaying ? 'active' : ''}`}>
              {isPlaying ? `🔊 Playing: ${SOUNDS[currentStep].label}` : '⌛ Preparing next sound...'}
            </div>
            <div className="video-container tracking-active">
              <video ref={videoRef} className="webcam-feed" playsInline muted />
              <div className="tracking-badge">SENSORY TRACKING ACTIVE</div>
              {earCoveringDetected && <div className="reaction-alert">Ear Covering Detected</div>}
            </div>
            <p className="game-instruction">Please stay still and face the camera.</p>
            <div className="sequence-indicator">
              {SOUNDS.map((s, i) => (
                <div key={i} className={`dot ${i === currentStep ? 'active' : i < currentStep ? 'completed' : ''}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundSensitivityGame;
