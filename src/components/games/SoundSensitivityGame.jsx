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
  const streamRef = useRef(null);
  const audioCache = useRef({});
  
  const reactionData = useRef({
    facialExpressions: [],
    headMovement: 0,
    gazeDirection: { x: 0.5, y: 0.5 },
    earCovering: false,
    vocalization: 0,
    gazeAvoidance: false,
    headTurn: false,
    facialDiscomfort: false
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
      setIsCapturing(true);
      
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
    if (!videoRef.current || !isCapturing) return;

    const timestamp = Date.now();
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      
      try {
        const faceResults = faceLM.current?.detectForVideo(videoRef.current, timestamp);
        const handResults = handLM.current?.detectForVideo(videoRef.current, timestamp);
        const poseResults = poseLM.current?.detectForVideo(videoRef.current, timestamp);
        
        analyzeBehaviors(faceResults, handResults, poseResults);
      } catch (e) {
        console.error("Tracking error:", e);
      }
    }

    if (isCapturing) {
      requestRef.current = requestAnimationFrame(trackingLoop);
    }
  };

  const analyzeBehaviors = (face, hand, pose) => {
    // 1. Facial Expressions
    if (face && face.faceBlendshapes && face.faceBlendshapes.length > 0) {
      const blendshapes = face.faceBlendshapes[0].categories;
      
      const distressPatterns = [
        'browDownLeft', 'browDownRight', 
        'mouthPucker', 'mouthFunnel',
        'eyeWideLeft', 'eyeWideRight',
        'eyeSquintLeft', 'eyeSquintRight',
        'noseSneerLeft', 'noseSneerRight'
      ];

      const activeExpressions = blendshapes
        .filter(s => s.score > 0.3)
        .map(s => s.categoryName);
      
      if (activeExpressions.length > 0) {
        reactionData.current.facialExpressions = [
          ...new Set([...reactionData.current.facialExpressions, ...activeExpressions])
        ];
        
        if (activeExpressions.some(e => distressPatterns.includes(e))) {
            reactionData.current.facialDiscomfort = true;
        }
      }

      // Gaze Tracking (Simplified)
      if (face.faceBlendshapes[0].categories) {
        const eyeLookOutLeft = blendshapes.find(c => c.categoryName === 'eyeLookOutLeft')?.score || 0;
        const eyeLookOutRight = blendshapes.find(c => c.categoryName === 'eyeLookOutRight')?.score || 0;
        const eyeLookInLeft = blendshapes.find(c => c.categoryName === 'eyeLookInLeft')?.score || 0;
        const eyeLookInRight = blendshapes.find(c => c.categoryName === 'eyeLookInRight')?.score || 0;

        if (eyeLookOutLeft > 0.4 || eyeLookOutRight > 0.4 || eyeLookInLeft > 0.4 || eyeLookInRight > 0.4) {
            reactionData.current.gazeAvoidance = true;
        }
      }
    }

    // 2. Ear Covering
    if (hand && hand.handLandmarks && face && face.faceLandmarks && face.faceLandmarks.length > 0) {
       const leftEar = face.faceLandmarks[0][234];
       const rightEar = face.faceLandmarks[0][454];
       
       let covered = false;
       hand.handLandmarks.forEach(handMarks => {
         handMarks.forEach(mark => {
           const distLeft = Math.hypot(mark.x - leftEar.x, mark.y - leftEar.y);
           const distRight = Math.hypot(mark.x - rightEar.x, mark.y - rightEar.y);
           if (distLeft < 0.15 || distRight < 0.15) {
             covered = true;
           }
         });
       });
       
       if (covered) {
         reactionData.current.earCovering = true;
         if (!earCoveringDetected) setEarCoveringDetected(true);
       } else if (earCoveringDetected) {
         setEarCoveringDetected(false);
       }
    }

    // 3. Head Movement
    if (pose && pose.landmarks && pose.landmarks.length > 0) {
        const nose = pose.landmarks[0][0];
        if (reactionData.current.lastNose) {
            const movement = Math.hypot(nose.x - reactionData.current.lastNose.x, nose.y - reactionData.current.lastNose.y);
            reactionData.current.headMovement += movement;
            
            if (movement > 0.08) { // Sudden movement threshold
                reactionData.current.headTurn = true;
            }
        }
        reactionData.current.lastNose = nose;
    }

    // 4. Vocalization
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      if (average > 40) {
        reactionData.current.vocalization = Math.max(reactionData.current.vocalization, average);
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
      vocalization: 0,
      earCovering: false,
      gazeAvoidance: false,
      headTurn: false,
      facialDiscomfort: false,
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
    if (data.earCovering) reactions.push("Ear Covering");
    if (data.headTurn) reactions.push("Head Turn");
    if (data.gazeAvoidance) reactions.push("Gaze Avoidance");
    if (data.facialDiscomfort) reactions.push("Facial Discomfort");
    if (data.vocalization > 80) reactions.push("Vocalization");

    // 2 = Strong, 1 = Mild, 0 = None
    let score = 0;
    if (data.earCovering || data.vocalization > 100) {
      score = 2;
    } else if (reactions.length > 0 || data.headMovement > 0.3) {
      score = 1;
      if (reactions.length >= 2 || data.headMovement > 0.8) {
          score = 2;
      }
    }
    
    return {
        score,
        reactions,
        intensity: score === 2 ? "Strong" : score === 1 ? "Mild" : "None"
    };
  };

  const finishAssessment = () => {
    setIsCapturing(false);
    cleanup();
    setAssessmentComplete(true);
  };

  const cleanup = () => {
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
