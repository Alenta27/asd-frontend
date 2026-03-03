import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Webcam from 'react-webcam';
import { FaCamera, FaStop, FaSave, FaExclamationTriangle, FaEye } from 'react-icons/fa';

const TherapistLiveGazeScreening = ({ patient, onClose, onSaved }) => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  
  const webcamRef = useRef(null);
  const socketRef = useRef(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [localSnapshots, setLocalSnapshots] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Real-time metrics
  const [liveMetrics, setLiveMetrics] = useState({
    attentionScore: 0,
    gazeDirection: 'unknown',
    status: 'idle'
  });

  useEffect(() => {
    // Disable body scroll when modal is mounted
    document.body.style.overflow = 'hidden';
    
    // Handle ESC key to close modal
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      // Re-enable body scroll when modal is unmounted
      document.body.style.overflow = 'unset';
      
      // Remove event listener
      document.removeEventListener('keydown', handleEscape);
      
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [onClose]);

  const handleStartCamera = () => {
    setCameraActive(true);
    setError(null);
    setLiveMetrics({ attentionScore: 0, gazeDirection: 'unknown', status: 'ready' });
  };

  const handleStopCamera = () => {
    setCameraActive(false);
    setLiveMetrics({ attentionScore: 0, gazeDirection: 'unknown', status: 'idle' });
  };

  const captureSnapshot = async () => {
    if (!webcamRef.current || !patient) {
      setError('Camera not ready or patient not selected');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      // Analyze the snapshot
      const response = await fetch(`${apiBaseUrl}/api/gaze/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageBase64: imageSrc })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result = await response.json();
      
      // Update live metrics
      setLiveMetrics({
        attentionScore: result.attention_score || 0,
        gazeDirection: result.gaze_direction || 'unknown',
        status: 'captured'
      });

      // Add to local snapshots
      const snapshot = {
        image: imageSrc,
        timestamp: new Date().toISOString(),
        attentionScore: result.attention_score || 0,
        gazeDirection: result.gaze_direction || 'unknown',
        headPitch: result.head_pitch || 0,
        headYaw: result.head_yaw || 0,
        status: 'analyzed'
      };

      setLocalSnapshots(prev => [...prev, snapshot]);
      console.log(`✅ Snapshot captured - Attention: ${(result.attention_score * 100).toFixed(1)}%, Direction: ${result.gaze_direction}`);
      
    } catch (err) {
      console.error('Error capturing snapshot:', err);
      setError(`Failed to capture snapshot: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveToPatientRecord = async () => {
    if (localSnapshots.length === 0) {
      setError('No snapshots to save. Please capture at least one snapshot.');
      return;
    }

    if (!patient || !patient._id) {
      setError('Patient information missing');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/gaze/therapist/save-to-patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: patient._id,
          snapshots: localSnapshots
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save session');
      }

      const result = await response.json();
      console.log('✅ Session saved to patient record:', result);
      
      setSuccess('Session saved to patient record successfully!');
      setLocalSnapshots([]);
      setCameraActive(false);
      
      // Auto-clear success message and close after 3 seconds
      setTimeout(() => {
        setSuccess('');
        if (onSaved) onSaved(result);
        if (onClose) onClose();
      }, 3000);

    } catch (err) {
      console.error('❌ Error saving to patient record:', err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteSnapshot = (index) => {
    setLocalSnapshots(prev => prev.filter((_, i) => i !== index));
  };

  const getAttentionColor = (score) => {
    if (score >= 0.7) return 'text-green-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getDirectionIcon = (direction) => {
    const icons = {
      'center': '👁️',
      'left': '👈',
      'right': '👉',
      'up': '👆',
      'down': '👇',
      'unknown': '❓'
    };
    return icons[direction] || '❓';
  };

  // Render modal using React Portal to document.body
  const modalContent = (
    <div 
      className="live-gaze-screening-portal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        // Close modal when clicking backdrop (not the modal content)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          width: '100%',
          maxWidth: '1400px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: 0
            }}>
              <FaEye style={{ color: '#60a5fa' }} />
              Live Gaze Screening Console
            </h2>
            {patient && (
              <p style={{
                color: '#94a3b8',
                marginTop: '6px',
                fontSize: '15px'
              }}>
                Patient: <span style={{ color: '#60a5fa', fontWeight: 500 }}>{patient.name}</span>
                {patient.age && <span style={{ marginLeft: '16px' }}>Age: {patient.age}</span>}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              color: '#94a3b8',
              background: 'transparent',
              border: 'none',
              fontSize: '32px',
              cursor: 'pointer',
              transition: 'color 0.2s',
              padding: '4px 8px',
              lineHeight: 1
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            ✕
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-200">
            <FaExclamationTriangle className="flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mx-6 mt-4 bg-green-500/20 border border-green-500/50 p-4 rounded-xl flex items-center gap-3 text-green-200">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* Real-time Metrics Dashboard */}
          {cameraActive && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Attention Score</div>
                <div className={`text-3xl font-bold ${getAttentionColor(liveMetrics.attentionScore)}`}>
                  {(liveMetrics.attentionScore * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Gaze Direction</div>
                <div className="text-3xl font-bold text-blue-400 flex items-center gap-2">
                  {getDirectionIcon(liveMetrics.gazeDirection)}
                  <span className="text-lg">{liveMetrics.gazeDirection}</span>
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">Status</div>
                <div className="text-2xl font-bold text-purple-400 capitalize">
                  {liveMetrics.status}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Camera Feed */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Camera Feed</h3>
              
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border-2 border-slate-700">
                {cameraActive ? (
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/png"
                    className="w-full h-full object-cover"
                    videoConstraints={{ width: 1280, height: 720 }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <FaCamera className="text-slate-600 text-6xl mx-auto mb-4" />
                      <p className="text-slate-400">Camera Off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex gap-3">
                {!cameraActive ? (
                  <button
                    onClick={handleStartCamera}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <FaCamera /> Start Camera
                  </button>
                ) : (
                  <>
                    <button
                      onClick={captureSnapshot}
                      disabled={analyzing || !cameraActive}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <FaCamera /> {analyzing ? 'Analyzing...' : 'Capture Snapshot'}
                    </button>
                    
                    <button
                      onClick={handleStopCamera}
                      className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <FaStop /> Stop
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Captured Snapshots */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Captured Snapshots ({localSnapshots.length})
                </h3>
                {localSnapshots.length > 0 && (
                  <button
                    onClick={saveToPatientRecord}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <FaSave /> {saving ? 'Saving...' : 'Save to Patient Record'}
                  </button>
                )}
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 max-h-[500px] overflow-y-auto space-y-3">
                {localSnapshots.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    <FaCamera className="text-5xl mx-auto mb-3 opacity-30" />
                    <p>No snapshots captured yet</p>
                    <p className="text-sm mt-1">Start camera and capture snapshots</p>
                  </div>
                ) : (
                  localSnapshots.map((snap, index) => (
                    <div key={index} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex gap-3">
                      <img
                        src={snap.image}
                        alt={`Snapshot ${index + 1}`}
                        className="w-24 h-24 object-cover rounded border border-slate-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm font-medium text-white">
                            Snapshot {index + 1}
                          </div>
                          <button
                            onClick={() => deleteSnapshot(index)}
                            className="text-red-400 hover:text-red-300 transition-colors text-lg"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Attention:</span>
                            <span className={`ml-1 font-medium ${getAttentionColor(snap.attentionScore)}`}>
                              {(snap.attentionScore * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Direction:</span>
                            <span className="ml-1 text-blue-400 font-medium">
                              {snap.gazeDirection}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500">Time:</span>
                            <span className="ml-1 text-slate-400">
                              {new Date(snap.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // Use React Portal to render at document.body level
  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};

export default TherapistLiveGazeScreening;
