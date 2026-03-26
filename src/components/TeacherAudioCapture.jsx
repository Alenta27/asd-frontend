import React, { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const TeacherAudioCapture = ({ studentId }) => {
  const [error, setError] = useState('');
  const [recordings, setRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const stopRequestedRef = useRef(false);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, []);

  const cleanMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const fetchRecordings = useCallback(async () => {
    if (!studentId) return;

    setLoadingRecordings(true);
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${studentId}`, {
        headers: {
          ...authHeaders()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }

      const data = await response.json();
      setRecordings(Array.isArray(data.recordings) ? data.recordings : []);
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load recordings');
    } finally {
      setLoadingRecordings(false);
    }
  }, [authHeaders, studentId]);

  const uploadBlob = useCallback(async (blob) => {
    if (!studentId || !blob || blob.size === 0) return;

    const formData = new FormData();
    const filename = `${studentId}_${Date.now()}.webm`;
    formData.append('audio', blob, filename);
    formData.append('studentId', studentId);

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload recording');
    }
  }, [authHeaders, studentId]);

  const stopSession = useCallback(() => {
    if (stopRequestedRef.current) {
      return;
    }

    stopRequestedRef.current = true;

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      return;
    }

    cleanMediaStream();
  }, [cleanMediaStream]);

  const startCapture = useCallback(async () => {
    if (!studentId) return;

    setError('');
    stopRequestedRef.current = false;
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser does not support microphone capture');
      }

      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const chunks = audioChunksRef.current;
          audioChunksRef.current = [];
          if (!chunks.length) {
            return;
          }

          const blob = new Blob(chunks, { type: 'audio/webm' });
          await uploadBlob(blob);
          await fetchRecordings();
        } catch (uploadError) {
          setError(uploadError.message || 'Upload failed');
        } finally {
          cleanMediaStream();
        }
      };

      recorder.start(1000);
    } catch (startError) {
      cleanMediaStream();
      if (startError?.name === 'NotAllowedError') {
        setError('Microphone permission denied');
      } else {
        setError(startError.message || 'Could not start recording');
      }
    }
  }, [cleanMediaStream, fetchRecordings, studentId, uploadBlob]);

  const deleteRecording = useCallback(async (filename) => {
    try {
      const response = await fetch(`${API_BASE}/api/recordings/${studentId}/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete recording');
      }

      await fetchRecordings();
    } catch (deleteError) {
      setError(deleteError.message || 'Delete failed');
    }
  }, [authHeaders, fetchRecordings, studentId]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  useEffect(() => {
    startCapture();

    const onBeforeUnload = () => {
      stopSession();
    };

    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      stopSession();
      cleanMediaStream();
    };
  }, [cleanMediaStream, startCapture, stopSession]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Behavioral Audio Capture</h2>
        <button
          onClick={stopSession}
          className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Stop Session
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-700">Previous Recordings</h3>
        {loadingRecordings && <span className="text-xs text-gray-500">Loading...</span>}
      </div>

      {recordings.length === 0 && !loadingRecordings ? (
        <p className="text-sm text-gray-500">No recordings available for this student yet.</p>
      ) : (
        <div className="space-y-3">
          {recordings.map((item) => (
            <div key={item.filename} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {new Date(item.uploadedAt || item.timestamp).toLocaleString()}
                </span>
                <button
                  onClick={() => deleteRecording(item.filename)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
              <audio controls loop className="w-full" src={`${API_BASE}${item.url}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherAudioCapture;
