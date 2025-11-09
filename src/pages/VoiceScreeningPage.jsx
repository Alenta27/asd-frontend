import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function VoiceScreeningPage() {
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermission(true);
        setStream(streamData);
      } catch (err) {
        alert("Mic permission denied: " + err.message);
      }
    } else {
      alert("The MediaRecorder API is not supported in your browser.");
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setResult(null);
    setAudioBlob(null);
    
    const media = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.current = media;
    mediaRecorder.current.start();
    
    let localAudioChunks = [];
    mediaRecorder.current.ondataavailable = (event) => {
      if (typeof event.data === "undefined" || event.data.size === 0) return;
      localAudioChunks.push(event.data);
    };
    audioChunks.current = localAudioChunks;
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorder.current.stop();
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      setAudioBlob(blob);
      audioChunks.current = [];
    };
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    setIsLoading(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'user_recording.webm');

    try {
      // ✅ This URL must match the address of your running Python server
      const response = await axios.post('http://localhost:5001/predict-voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error submitting audio:", error);
      setResult({ error: "Could not get a prediction. Is the Python server running?" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Voice-Based ASD Screening</h2>
        
        {!permission && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">We need permission to access your microphone for the screening.</p>
            <button onClick={getMicrophonePermission} className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700">
              Enable Microphone
            </button>
          </div>
        )}
        
        {permission && (
          <div className="space-y-6 text-center">
            <button 
              onClick={isRecording ? stopRecording : startRecording} 
              className={`w-full py-3 rounded-lg text-white font-bold text-lg transition ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            
            {audioBlob && !isRecording && (
              <button 
                onClick={handleSubmit} 
                disabled={isLoading} 
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Analyzing...' : 'Analyze My Voice'}
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Screening Result:</h3>
            {result.error ? (
              <p className="text-red-500 font-medium">{result.error}</p>
            ) : (
              <div className={`p-4 rounded-lg ${result.prediction === 'Autistic' ? 'bg-orange-100 border-orange-300' : 'bg-green-100 border-green-300'}`}>
                <p className="text-lg">
                  <span className="font-bold">Prediction:</span> 
                  <span className={`ml-2 font-semibold ${result.prediction === 'Autistic' ? 'text-orange-700' : 'text-green-700'}`}>
                    {result.prediction}
                  </span>
                </p>
                <p className="text-lg mt-2">
                  <span className="font-bold">Confidence:</span> 
                  <span className="ml-2 font-semibold text-gray-700">
                    {(result.confidence * 100).toFixed(2)}%
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}