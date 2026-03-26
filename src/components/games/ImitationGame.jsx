import React, { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, HandLandmarker, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { FiCamera, FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi';
import './GameStyles.css';

// Actions definition (9 total)
const ACTIONS = [
  { id: 'clap', name: 'Clap', emoji: '👏', timeLimit: 10 },
  { id: 'wave', name: 'Wave', emoji: '👋', timeLimit: 8 },
  { id: 'smile', name: 'Smile', emoji: '😊', timeLimit: 6 },
  { id: 'hands-up', name: 'Raise Both Hands', emoji: '🙌', timeLimit: 8 },
  { id: 'point-left', name: 'Point Left', emoji: '👈', timeLimit: 8 },
  { id: 'point-right', name: 'Point Right', emoji: '👉', timeLimit: 8 },
  { id: 'finger-lips', name: 'Finger on Lips', emoji: '🤫', timeLimit: 8 },
  { id: 'thumbs-up', name: 'Thumbs Up', emoji: '👍', timeLimit: 8 },
  { id: 'prayer', name: 'Hands Together (Prayer)', emoji: '🤲', timeLimit: 8 }
];

// Thresholds - stricter to reduce false positives on wrong gestures
const SUSTAIN_FRAMES = 10; // Require a slightly longer stable match window
const CONFIDENCE_CORRECT = 0.75;
const CONFIDENCE_PARTIAL = 0.5;
const WINDOW_SIZE = 24; // Smoother, shorter temporal averaging window

const ImitationGame = ({ studentId, onComplete }) => {
  // State machine: idle → camera_ready → demo_action → imitate → validating → feedback → next_action → final_results
  const [phase, setPhase] = useState('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const [feedbackText, setFeedbackText] = useState(''); // live UI feedback
  const [detectionState, setDetectionState] = useState('none'); // 'none', 'partial', 'correct'
  const [confidencePct, setConfidencePct] = useState(0);
  const [actionResults, setActionResults] = useState([]);
  const actionResultsRef = useRef([]);
  const currentIndexRef = useRef(0);

  // Session timing
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [actionStartTime, setActionStartTime] = useState(null);
  const actionStartTimeRef = useRef(null);

  // MediaPipe refs
  const videoRef = useRef(null);
  const poseLM = useRef(null);
  const handLM = useRef(null);
  const faceLM = useRef(null);
  const streamRef = useRef(null);

  // Animation/timers
  const rafRef = useRef(null);
  const actionTimerRef = useRef(null);
  const demoTimerRef = useRef(null);
  const phaseRef = useRef('idle');

  // Gesture tracking
  const lastVideoTimeRef = useRef(-1);
  const frameCounterRef = useRef({ correct: 0, partial: 0 }); 
  const historyRef = useRef([]); // last N frame detections for the current action
  const waveDirRef = useRef({ lastX: null, lastDir: null, changes: 0 });
  const clapCycleRef = useRef({ lastDist: null, cycles: 0 });
  const handsRaisedRef = useRef({ start: null });
  const neutralSmileBaselineRef = useRef(null);
  const processFrameLoggedRef = useRef(false);

  useEffect(() => {
    initModels();
    return () => cleanupAll();
  }, []);

  const initModels = async () => {
    try {
      setIsLoadingModel(true);
      const fileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
      poseLM.current = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1
      });
      handLM.current = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2
      });
      faceLM.current = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 1
      });
      setIsLoadingModel(false);
      console.log('[ImitationGame] MediaPipe models loaded successfully');
    } catch (e) {
      console.error('Model init failed', e);
      setIsLoadingModel(false);
      setCameraError('Failed to load tracking models. Please refresh and try again.');
    }
  };

  const startGame = async () => {
    setCameraError(null);
    setActionResults([]);
    actionResultsRef.current = [];
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    phaseRef.current = 'camera_ready';
    setPhase('camera_ready');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setCameraReady(true);
            setSessionStartTime(Date.now());
            console.log('[ImitationGame] Camera ready, starting demo phase');
            // proceed to demo
            nextPhaseDemo();
          }).catch(err => {
            console.error('Video play error', err);
            setCameraError('Could not start video. Please try again.');
            phaseRef.current = 'idle';
            setPhase('idle');
          });
        };
      }
    } catch (e) {
      console.error('Camera error', e);
      setCameraError('Camera access denied or unavailable. Please allow access and retry.');
      phaseRef.current = 'idle';
      setPhase('idle');
    }
  };

  const cleanupAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (actionTimerRef.current) clearInterval(actionTimerRef.current);
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // Phase transitions
  const nextPhaseDemo = (nextIndex = null, currentResults = null) => {
    // Use provided nextIndex or current state
    const indexToUse = nextIndex !== null ? nextIndex : currentIndexRef.current;
    
    if (indexToUse >= ACTIONS.length) {
      console.log('[ImitationGame] All actions complete, finalizing results');
      finalizeResults(currentResults);
      return;
    }
    
    // Sync current index state and ref
    if (nextIndex !== null) {
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
    }
    
    phaseRef.current = 'demo_action';
    setPhase('demo_action');
    setFeedbackText('Get ready...');
    setDetectionState('none');
    setConfidencePct(0);
    historyRef.current = [];
    frameCounterRef.current = { correct: 0, partial: 0 };
    waveDirRef.current = { lastX: null, lastDir: null, changes: 0 };
    clapCycleRef.current = { lastDist: null, cycles: 0 };
    handsRaisedRef.current = { start: null };
    // rebaseline smile at start of smile action
    if (ACTIONS[indexToUse].id === 'smile') neutralSmileBaselineRef.current = null;

    let c = 3;
    setCountdown(c);
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    demoTimerRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
        startImitation();
      }
    }, 1000);
  };

  const startImitation = () => {
    const action = ACTIONS[currentIndexRef.current];
    
    // Safety check
    if (!action) {
      console.error('[ImitationGame] No action at index', currentIndexRef.current);
      finalizeResults();
      return;
    }
    
    phaseRef.current = 'imitate';
    setPhase('imitate');
    const now = Date.now();
    actionStartTimeRef.current = now;
    setActionStartTime(now);
    setTimeLeft(action.timeLimit);
    setFeedbackText('Detecting gesture…');
    setConfidencePct(0);
    processFrameLoggedRef.current = false; // Reset for new action

    console.log(`[ImitationGame] Starting detection for action: ${action.id} (${action.name}) at index ${currentIndexRef.current}`);

    if (actionTimerRef.current) clearInterval(actionTimerRef.current);
    let t = action.timeLimit;
    actionTimerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(actionTimerRef.current);
        actionTimerRef.current = null;
        // time out: fail if not already validated
        concludeAction('fail', 0);
      }
    }, 1000);

    lastVideoTimeRef.current = -1;
    rafRef.current = requestAnimationFrame(processFrame);
  };

  const processFrame = () => {
    if (!videoRef.current || phaseRef.current !== 'imitate') return;

    // Log first frame for debugging
    if (!processFrameLoggedRef.current) {
      console.log('[ImitationGame] processFrame started, phase:', phaseRef.current, 'currentIndex:', currentIndexRef.current);
      processFrameLoggedRef.current = true;
    }

    // Use performance.now() for MediaPipe timestamp (monotonic, not epoch-based)
    const timestamp = performance.now();
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;

      try {
        const pose = poseLM.current?.detectForVideo(videoRef.current, timestamp);
        const hands = handLM.current?.detectForVideo(videoRef.current, timestamp);
        const face = faceLM.current?.detectForVideo(videoRef.current, timestamp);

        // Debug logging - check data structure
        if (Math.random() < 0.05) { // ~5% of frames
          console.log('[ImitationGame] MediaPipe Raw Data Structure:', {
            pose: { 
              hasLandmarks: !!pose?.landmarks, 
              landmarksLength: pose?.landmarks?.length
            },
            hands: { 
              hasLandmarks: !!hands?.landmarks, 
              landmarksLength: hands?.landmarks?.length
            },
            face: { 
              hasLandmarks: !!face?.landmarks, 
              landmarksLength: face?.landmarks?.length
            },
            currentAction: ACTIONS[currentIndexRef.current].id
          });
        }

        const action = ACTIONS[currentIndexRef.current];
        const det = detectAction(action.id, pose, hands, face);
        
        const conf = Math.max(0, Math.min(1, det.confidence || 0));
        
        // Debug log confidence (occasionally) with more details
        if (Math.random() < 0.1) { // 10% of frames for more visibility
          console.log(`[ImitationGame] ${action.id} detection result:`, {
            rawConfidence: det.confidence,
            clampedConf: conf
          });
        }
        
        // Accumulate in temporal window
        historyRef.current.push(conf);
        if (historyRef.current.length > WINDOW_SIZE) {
          historyRef.current.shift();
        }

        // Calculate average confidence over the last 1 second (roughly SUSTAIN_FRAMES)
        const recentHistory = historyRef.current.slice(-SUSTAIN_FRAMES);
        const avgConf = recentHistory.length > 0 
          ? recentHistory.reduce((a, b) => a + b, 0) / recentHistory.length 
          : 0;

        setConfidencePct(Math.round(avgConf * 100));

        // State & Frame Validation
        if (avgConf >= CONFIDENCE_CORRECT) {
          setDetectionState('correct');
          setFeedbackText('Detected ✅');
          
          // If we have enough frames and high confidence, we can conclude early
          if (recentHistory.length >= SUSTAIN_FRAMES) {
            console.log(`[ImitationGame] ${action.id} detected successfully with ${(avgConf * 100).toFixed(1)}% confidence`);
            concludeAction('correct', avgConf);
            return;
          }
        } else if (avgConf >= CONFIDENCE_PARTIAL) {
          setDetectionState('partial');
          setFeedbackText('Partially Detected ⚠️');
        } else {
          setDetectionState('none');
          setFeedbackText('Not Detected ❌');
        }
      } catch (e) {
        console.error('Frame process error', e);
      }
    }

    rafRef.current = requestAnimationFrame(processFrame);
  };

  // Conclude one action and move forward
  const concludeAction = (status, finalConf) => {
    // Safety check to prevent double-concluding the same action
    if (phaseRef.current === 'feedback' || phaseRef.current === 'demo_action') {
        console.warn('[ImitationGame] Action already concluding/concluded');
        return;
    }

    phaseRef.current = 'feedback';
    setPhase('feedback');
    
    // If status is 'fail' (timeout), we calculate the best average confidence we had
    let displayStatus = status;
    let actualConf = finalConf;

    if (status === 'fail') {
        const recentHistory = historyRef.current.slice(-SUSTAIN_FRAMES);
        const avgConf = recentHistory.length > 0 
          ? recentHistory.reduce((a, b) => a + b, 0) / recentHistory.length 
          : 0;
        
        actualConf = avgConf;
        if (avgConf >= CONFIDENCE_CORRECT) {
            displayStatus = 'correct';
        } else if (avgConf >= CONFIDENCE_PARTIAL) {
            displayStatus = 'partial';
        } else {
            displayStatus = 'incorrect';
        }
    }

    setFeedbackText(
        displayStatus === 'correct' ? 'Detected ✅' : 
        displayStatus === 'partial' ? 'Partially Detected ⚠️' : 'Not Detected ❌'
    );
    setDetectionState(displayStatus === 'correct' ? 'correct' : displayStatus === 'partial' ? 'partial' : 'none');

    const action = ACTIONS[currentIndexRef.current];
    const result = {
      actionName: action.name,
      status: displayStatus, 
      success: displayStatus === 'correct',
      confidenceScore: Number((actualConf || 0).toFixed(2)),
      reactionTimeMs: actionStartTimeRef.current ? Date.now() - actionStartTimeRef.current : 0
    };
    
    const updatedResults = [...actionResultsRef.current, result];
    actionResultsRef.current = updatedResults;
    setActionResults(updatedResults);

    if (actionTimerRef.current) clearInterval(actionTimerRef.current);
    actionTimerRef.current = null;

    // short feedback pause then next action
    setTimeout(() => {
      const nextIndex = currentIndexRef.current + 1;
      console.log(`[ImitationGame] Moving from action ${nextIndex + 1} of ${ACTIONS.length}`);
      nextPhaseDemo(nextIndex, updatedResults);
    }, 1500);
  };

  // Detector dispatcher
  const detectAction = (id, pose, hands, face) => {
    switch (id) {
      case 'clap':
        return detectClap(hands);
      case 'wave':
        return detectWave(hands);
      case 'smile':
        return detectSmile(face);
      case 'hands-up':
        return detectHandsUp(pose);
      case 'point-left':
        return detectPoint(hands, 'left');
      case 'point-right':
        return detectPoint(hands, 'right');
      case 'finger-lips':
        return detectFingerOnLips(hands, face);
      case 'thumbs-up':
        return detectThumbsUp(hands);
      case 'prayer':
        return detectPrayer(hands);
      default:
        return { confidence: 0, validNow: false, biomechanicsOK: false };
    }
  };

  // Utility helpers
  const getHands = (hands) => {
    // Try both possible property names from MediaPipe
    if (hands?.landmarks && Array.isArray(hands.landmarks)) {
      return hands.landmarks;
    }
    if (hands?.handLandmarks && Array.isArray(hands.handLandmarks)) {
      return hands.handLandmarks;
    }
    return [];
  };

  // 1) Clap – distance reduction cycles and contact
  const detectClap = (hands) => {
    const hl = getHands(hands);
    
    // Debug logging to diagnose the issue
    if (Math.random() < 0.05) {
      console.log('[ImitationGame] Clap - getHands result:', {
        handsDetectedLength: hl.length,
        firstHandLength: hl[0]?.length,
        handsRawStructure: hands ? Object.keys(hands) : 'null'
      });
    }
    
    if (hl.length < 2) {
      return { confidence: 0 };
    }
    
    const l = hl[0][0]; // left wrist
    const r = hl[1][0];
    if (!l || !r) return { confidence: 0 };

    // Use relative distance based on hand size (distance between wrist and middle MCP)
    const lHandSize = Math.hypot(hl[0][0].x - hl[0][9].x, hl[0][0].y - hl[0][9].y);
    const rHandSize = Math.hypot(hl[1][0].x - hl[1][9].x, hl[1][0].y - hl[1][9].y);
    const avgHandSize = (lHandSize + rHandSize) / 2;

    const dist = Math.hypot(l.x - r.x, l.y - r.y);
    const relativeDist = dist / (avgHandSize || 0.1);

    // Debug logging occasionally
    if (Math.random() < 0.1) {
      console.log('[ImitationGame] Clap detection:', {
        dist: dist.toFixed(3),
        relativeDist: relativeDist.toFixed(2),
        avgHandSize: avgHandSize.toFixed(3)
      });
    }

    // Clapping requires both hands coming very close.
    let conf = 0;
    if (relativeDist < 1.6) conf = 0.95;
    else if (relativeDist < 2.3) conf = 0.6;
    
    return { confidence: conf };
  };

  // 2) Wave – oscillation of the hand
  const detectWave = (hands) => {
    const hl = getHands(hands);
    if (hl.length < 1) {
      if (Math.random() < 0.05) {
        console.log('[ImitationGame] Wave: No hands detected');
      }
      return { confidence: 0 };
    }
    
    const wrist = hl[0][0];
    const indexMCP = hl[0][5];
    
    // Debug structure
    if (Math.random() < 0.05) {
      console.log('[ImitationGame] Wave - hand structure:', {
        handCount: hl.length,
        firstHandType: Array.isArray(hl[0]) ? 'array' : typeof hl[0],
        firstHandLength: hl[0]?.length,
        wristExists: !!wrist,
        indexMCPExists: !!indexMCP,
        wristType: typeof wrist
      });
    }
    
    if (!wrist || !indexMCP) return { confidence: 0 };

    const handSize = Math.hypot(wrist.x - indexMCP.x, wrist.y - indexMCP.y);
    const prevX = waveDirRef.current.lastX;
    
    if (prevX !== null) {
      const dx = wrist.x - prevX;
      const relativeDx = dx / (handSize || 0.1);
      
      // Detection of movement direction change
      const dir = relativeDx > 0.05 ? 'R' : relativeDx < -0.05 ? 'L' : waveDirRef.current.lastDir;
      if (dir && waveDirRef.current.lastDir && dir !== waveDirRef.current.lastDir) {
        waveDirRef.current.changes += 1;
      }
      waveDirRef.current.lastDir = dir;
    }
    waveDirRef.current.lastX = wrist.x;

    // Debug logging
    if (Math.random() < 0.1) {
      console.log('[ImitationGame] Wave detection:', {
        changes: waveDirRef.current.changes,
        direction: waveDirRef.current.lastDir,
        wristX: wrist.x.toFixed(3)
      });
    }

    // A wave needs multiple direction changes.
    const changes = waveDirRef.current.changes;
    const conf = changes >= 2 ? 0.95 : changes >= 1 ? 0.45 : 0;
    return { confidence: conf };
  };

  // 3) Smile – elevation above baseline
  const detectSmile = (face) => {
    if (!face || !face.faceBlendshapes || face.faceBlendshapes.length === 0) {
      console.log('[ImitationGame] Smile: No face blendshapes detected', {
        hasFace: !!face,
        hasBlendshapes: !!face?.faceBlendshapes,
        blendshapesLength: face?.faceBlendshapes?.length || 0
      });
      return { confidence: 0 };
    }

    const shapes = face.faceBlendshapes[0].categories || [];
    const left = shapes.find(c => c.categoryName === 'mouthSmileLeft');
    const right = shapes.find(c => c.categoryName === 'mouthSmileRight');
    
    if (!left || !right) {
      console.log('[ImitationGame] Smile: No smile categories found in blendshapes');
      return { confidence: 0 };
    }

    const smileScore = (left.score + right.score) / 2;

    // Build a neutral baseline for the current smile action to avoid false positives.
    if (neutralSmileBaselineRef.current === null) {
      neutralSmileBaselineRef.current = smileScore;
      return { confidence: 0 };
    }

    const delta = Math.max(0, smileScore - neutralSmileBaselineRef.current);

    if (Math.random() < 0.1) {
      console.log('[ImitationGame] Smile detection:', { smileScore: smileScore.toFixed(3), delta: delta.toFixed(3) });
    }

    let conf = 0;
    if (delta > 0.12 || smileScore > 0.45) conf = 0.95;
    else if (delta > 0.07 || smileScore > 0.3) conf = 0.6;
    
    return { confidence: conf };
  };

  // 4) Raise Hands – wrists above shoulders or near ears
  const detectHandsUp = (pose) => {
    const lms = pose?.landmarks?.[0];
    if (!lms) return { confidence: 0 };
    const leftWrist = lms[15], rightWrist = lms[16], leftShoulder = lms[11], rightShoulder = lms[12];
    const leftEar = lms[7], rightEar = lms[8];
    
    if (!leftWrist || !rightWrist) return { confidence: 0 };

    // Use relative height based on shoulder-to-shoulder distance if available
    let shoulderDist = 0.2;
    if (leftShoulder && rightShoulder) {
        shoulderDist = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
    }

    // Wrists should be higher than shoulders (lower Y value)
    const leftRaised = (leftShoulder && (leftShoulder.y - leftWrist.y) > shoulderDist * 0.18) || (leftEar && (leftEar.y - leftWrist.y) > 0.03);
    const rightRaised = (rightShoulder && (rightShoulder.y - rightWrist.y) > shoulderDist * 0.18) || (rightEar && (rightEar.y - rightWrist.y) > 0.03);
    
    if (Math.random() < 0.1) {
      console.log('[ImitationGame] HandsUp detection:', {
        leftRaised,
        rightRaised,
        leftWristY: leftWrist.y.toFixed(2),
        leftShoulderY: leftShoulder?.y.toFixed(2),
        shoulderDist: shoulderDist.toFixed(2)
      });
    }

    let conf = 0;
    if (leftRaised && rightRaised) conf = 0.95;
    else if (leftRaised || rightRaised) conf = 0.45;
    
    return { confidence: conf };
  };

  // 5) Point (left/right) – index extended, direction
  const detectPoint = (hands, dir) => {
    const hl = getHands(hands);
    if (hl.length < 1) return { confidence: 0 };
    
    let bestConf = 0;

    hl.forEach(h => {
      const wrist = h[0];
      const indexTip = h[8];
      const indexMCP = h[5];
      
      if (!wrist || !indexTip || !indexMCP) return;

      const handSize = Math.hypot(wrist.x - indexMCP.x, wrist.y - indexMCP.y);
      const indexLen = Math.hypot(indexTip.x - indexMCP.x, indexTip.y - indexMCP.y);
      
      const indexExtended = indexLen > handSize * 0.65;
      
      // Front-facing camera coordinates are mirrored from the child's perspective,
      // so invert horizontal delta to map left/right instructions correctly.
      const dx = wrist.x - indexTip.x;
      const pointingLeft = dx < -handSize * 0.45;
      const pointingRight = dx > handSize * 0.45;
      const matchesDir = dir === 'left' ? pointingLeft : pointingRight;
      const oppositeDir = dir === 'left' ? pointingRight : pointingLeft;

      let conf = 0;
      if (indexExtended && matchesDir) conf = 0.95;
      else if (matchesDir) conf = 0.55;
      else if (indexExtended && oppositeDir) conf = 0;

      if (conf > bestConf) bestConf = conf;
    });

    return { confidence: bestConf };
  };

  // 6) Finger on Lips – index tip near mouth center
  const detectFingerOnLips = (hands, face) => {
    const hl = getHands(hands);
    // Try both landmarks and faceLandmarks
    const landmarks = face?.landmarks?.[0] || face?.faceLandmarks?.[0];
    
    if (!landmarks || hl.length < 1) {
      return { confidence: 0 };
    }

    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    const mouthX = (upperLip.x + lowerLip.x) / 2;
    const mouthY = (upperLip.y + lowerLip.y) / 2;

    const h0 = hl[0];
    const indexTip = h0[8];
    const wrist = h0[0];
    const indexMCP = h0[5];
    if (!indexTip || !wrist || !indexMCP) return { confidence: 0 };

    const handSize = Math.hypot(wrist.x - indexMCP.x, wrist.y - indexMCP.y);
    const dist = Math.hypot(indexTip.x - mouthX, indexTip.y - mouthY);
    
    const near = dist < handSize * 0.9;
    const conf = near ? 0.95 : dist < handSize * 1.2 ? 0.5 : 0;
    return { confidence: conf };
  };

  // 7) Thumbs Up – thumb extended upward, others curled
  const detectThumbsUp = (hands) => {
    const hl = getHands(hands);
    if (hl.length < 1) return { confidence: 0 };
    
    let bestConf = 0;

    hl.forEach(h => {
      const wrist = h[0];
      const thumbTip = h[4];
      const thumbMCP = h[2];
      const indexTip = h[8];
      
      if (!wrist || !thumbTip || !thumbMCP || !indexTip) return;

      const handSize = Math.hypot(wrist.x - indexTip.x, wrist.y - indexTip.y);
      const thumbLen = Math.hypot(thumbTip.x - thumbMCP.x, thumbTip.y - thumbMCP.y);
      
      const thumbExtended = thumbLen > handSize * 0.4;
      const upward = (wrist.y - thumbTip.y) > handSize * 0.35;

      const middleTip = h[12];
      const ringTip = h[16];
      const pinkyTip = h[20];
      const middleMCP = h[9];
      const ringMCP = h[13];
      const pinkyMCP = h[17];

      const fingersCurled = middleTip && ringTip && pinkyTip && middleMCP && ringMCP && pinkyMCP
        ? (middleTip.y > middleMCP.y && ringTip.y > ringMCP.y && pinkyTip.y > pinkyMCP.y)
        : false;

      let conf = 0;
      if (thumbExtended && upward && fingersCurled) conf = 0.95;
      else if (thumbExtended && upward) conf = 0.55;

      if (conf > bestConf) bestConf = conf;
    });

    return { confidence: bestConf };
  };

  // 8) Prayer – palms/wrists close
  const detectPrayer = (hands) => {
    const hl = getHands(hands);
    if (hl.length < 2) return { confidence: 0 };
    const l = hl[0][0];
    const r = hl[1][0];
    if (!l || !r) return { confidence: 0 };
    
    const lHandSize = Math.hypot(hl[0][0].x - hl[0][9].x, hl[0][0].y - hl[0][9].y);
    const rHandSize = Math.hypot(hl[1][0].x - hl[1][9].x, hl[1][0].y - hl[1][9].y);
    const avgHandSize = (lHandSize + rHandSize) / 2;

    const dist = Math.hypot(l.x - r.x, l.y - r.y);
    const near = dist < avgHandSize * 1.9;
    const touching = dist < avgHandSize * 1.2;
    
    let conf = 0;
    if (touching) conf = 0.95;
    else if (near) conf = 0.5;

    return { confidence: conf };
  };

  // Final aggregation and backend payload
  const finalizeResults = (finalResults = null) => {
    const resultsToUse = finalResults || actionResultsRef.current;
    console.log('[ImitationGame] Finalizing results with', resultsToUse.length, 'actions');
    phaseRef.current = 'final_results';
    setPhase('final_results');

    const totalActions = ACTIONS.length;
    const successfulActions = resultsToUse.filter(r => r.success).length;
    const imitationAccuracy = totalActions ? Math.round((successfulActions / totalActions) * 100) : 0;
    const avgRt = resultsToUse.length
      ? resultsToUse.reduce((s, r) => s + (r.reactionTimeMs || 0), 0) / resultsToUse.length
      : 0;

    const payload = {
      studentId,
      assessmentType: 'imitation',
      game: 'Imitation',
      score: imitationAccuracy,
      totalActions,
      correctImitations: successfulActions,
      imitationAccuracy,
      averageReactionTime: Math.round(avgRt),
      metrics: {
        accuracy: imitationAccuracy,
        responseTime: Math.round(avgRt),
        totalActions,
        correctImitations: successfulActions,
        imitationAccuracy,
        averageReactionTime: Math.round(avgRt),
        meanSimilarityScore: Number((resultsToUse.reduce((acc, r) => acc + (r.confidenceScore || 0), 0) / (resultsToUse.length || 1)).toFixed(2))
      },
      rawGameData: resultsToUse
    };

    // Send to parent/backend
    onComplete && onComplete(payload);
  };

  // RENDER
  if (cameraError) {
    return (
      <div className="game-error-state">
        <FiAlertTriangle size={48} color="#ef4444" />
        <h3>Camera Required</h3>
        <p>{cameraError}</p>
        <button className="option-button correct" onClick={startGame} disabled={isLoadingModel}>
          <FiCamera style={{ marginRight: 8 }} /> Try Again
        </button>
      </div>
    );
  }

  const action = ACTIONS[currentIndex];
  const progressText = `Action ${Math.min(currentIndex + 1, ACTIONS.length)} of ${ACTIONS.length}`;
  
  // Safety check for out of bounds index during transition to results
  if (!action && phase !== 'final_results' && phase !== 'idle') {
    console.log('[ImitationGame] Action out of bounds, showing results');
    // Trigger finalize if we somehow got here
    if (actionResults.length > 0) {
      setTimeout(() => finalizeResults(actionResults), 100);
    }
    return <div className="imitation-game">Loading results...</div>;
  }

  return (
    <div className="imitation-game">
      <div className="game-header">
        <h3>Imitation Game</h3>
      </div>

      {phase === 'idle' && (
        <div className="game-start-ui">
          <p className="game-instruction">
            {isLoadingModel ? 'Loading tracking models…' : 'Watch the action and imitate it as shown. Strict validation is used.'}
          </p>
          <button className="option-button correct" onClick={startGame} disabled={isLoadingModel}>
            <FiCamera style={{ marginRight: 8 }} /> {isLoadingModel ? 'Initializing…' : 'Start Assessment'}
          </button>
        </div>
      )}

      {phase !== 'idle' && (
        <div className="imitation-play">
          <div className={`video-container ${cameraReady ? 'tracking-active' : ''}`}>
            <video ref={videoRef} className="webcam-feed" playsInline muted />
            {phase !== 'final_results' && (
              <div className="detection-overlay">
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${confidencePct}%` }} />
                </div>
                <p>Match: {confidencePct}%</p>
              </div>
            )}
          </div>

          {phase !== 'final_results' && (
            <div className="action-display">
              <div className="action-top">
                <div className="progress-text">{progressText}</div>
                {phase === 'demo_action' || phase === 'imitate' ? (
                  <div className={`action-timer ${timeLeft < 3 ? 'low' : ''}`}>
                    <FiClock /> {phase === 'demo_action' ? countdown : timeLeft}s
                  </div>
                ) : null}
              </div>

              {action && (
                <>
                  <span className="action-emoji" style={{ fontSize: 64 }}>{action.emoji}</span>
                  <h3 style={{ marginTop: 8 }}>{action.name}</h3>
                </>
              )}

              <div className="detection-feedback" style={{ marginTop: 8 }}>
                <p>
                  {phase === 'imitate' && feedbackText}
                  {phase === 'feedback' && feedbackText}
                  {phase === 'demo_action' && 'Get ready to imitate…'}
                </p>
              </div>
            </div>
          )}

          {phase === 'final_results' && (
            <FinalResults actions={ACTIONS} results={actionResults} />
          )}
        </div>
      )}
    </div>
  );
};

const FinalResults = ({ actions, results }) => {
  const totalActions = actions.length;
  const successful = results.filter(r => r.success).length;
  const accuracy = totalActions ? Math.round((successful / totalActions) * 100) : 0;
  const avgRt = results.length ? results.reduce((s, r) => s + (r.reactionTimeMs || 0), 0) / results.length : 0;
  const avgRtSec = (avgRt / 1000).toFixed(1);
  const level = accuracy >= 75 ? { label: 'Normal', color: '#10b981' } : accuracy >= 40 ? { label: 'Borderline', color: '#f59e0b' } : { label: 'Low', color: '#ef4444' };

  return (
    <div className="results-screen" style={{ padding: 24 }}>
      <FiCheckCircle size={56} color="#10b981" style={{ marginBottom: 16 }} />
      <h2 style={{ marginBottom: 16 }}>Imitation Assessment Result</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        <MetricBox label="Actions Attempted" value={totalActions} />
        <MetricBox label="Actions Successfully Imitated" value={successful} />
        <MetricBox label="Imitation Accuracy" value={`${accuracy}%`} />
        <MetricBox label="Average Reaction Time" value={`${avgRtSec} s`} />
      </div>

      <h3 style={{ marginTop: 24, marginBottom: 8 }}>Action Breakdown</h3>
      <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
        {actions.map((a, i) => {
          const r = results[i];
          return (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < actions.length - 1 ? '1px solid #eee' : 'none' }}>
              <span>{a.name}</span>
              <span style={{ 
                fontWeight: 600, 
                color: r?.status === 'correct' ? '#10b981' : r?.status === 'partial' ? '#f59e0b' : '#ef4444' 
              }}>
                {r?.status === 'correct' ? 'Detected ✅' : r?.status === 'partial' ? 'Partially Detected ⚠️' : 'Not Detected ❌'}
                <small style={{ marginLeft: 8, color: '#666', fontWeight: 400 }}>({Math.round((r?.confidenceScore || 0) * 100)}%)</small>
              </span>
            </div>
          );
        })}
      </div>

      <h3 style={{ marginTop: 24, marginBottom: 8 }}>Imitation Ability Level</h3>
      <div style={{ border: `2px solid ${level.color}`, borderRadius: 8, padding: 12, color: level.color, fontWeight: 600 }}>
        {level.label}
      </div>
    </div>
  );
};

const MetricBox = ({ label, value }) => (
  <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
    <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
  </div>
);

export default ImitationGame;
