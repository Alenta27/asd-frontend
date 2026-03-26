import React, { useState } from 'react';
import { FaArrowLeft, FaCamera, FaUpload, FaSpinner, FaBrain, FaChartLine } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const FacialScreeningPage = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBack = () => {
    navigate('/');
  };

  // Handle file selection and preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('📸 File selected:', file);
    
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        console.error('❌ Invalid file type:', file.type);
        setError('Please select a valid image file');
        return;
      }

      console.log('✅ Valid image file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      setSelectedFile(file);
      setError(null);
      setPrediction(null);
      setConfidence(null);

      // Create image preview
      console.log('🖼️  Creating image preview...');
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('✅ Image preview ready');
        setImagePreview(reader.result);
      };
      reader.onerror = (error) => {
        console.error('❌ Failed to read file:', error);
        setError('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle analyze button click
  const handleAnalyze = async () => {
    console.log('🔍 Analyze button clicked');
    
    if (!selectedFile) {
      console.warn('⚠️  No file selected');
      setError('Please upload an image first');
      return;
    }

    console.log('🚀 Starting analysis for:', selectedFile.name);
    setLoading(true);
    setError(null);
    setPrediction(null);
    setConfidence(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Get patientId if available from localStorage
      const patientId = localStorage.getItem('activePatientId');
      if (patientId) {
        formData.append('patientId', patientId);
        console.log('👤 Patient ID:', patientId);
      }

      console.log('📤 Sending POST request to http://localhost:5000/api/predict');
      const startTime = Date.now();

      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        body: formData,
      });

      const requestTime = Date.now() - startTime;
      console.log(`⏱️  Request completed in ${requestTime}ms`);

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (response.ok) {
        if (data.error) {
          console.warn('⚠️  Server returned error:', data.error);
          setError(data.error);
        } else {
          console.log('✅ Prediction successful:', {
            prediction: data.prediction,
            confidence: data.confidence
          });
          setPrediction(data.prediction);
          setConfidence(data.confidence);
        }
      } else {
        console.error('❌ Server error:', response.status, data);
        setError(data.error || 'Failed to analyze image');
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      setError('Network error: Unable to connect to server');
    } finally {
      setLoading(false);
      console.log('🏁 Analysis complete');
    }
  };

  // Reset the form
  const handleReset = () => {
    console.log('🔄 Resetting form');
    setSelectedFile(null);
    setImagePreview(null);
    setPrediction(null);
    setConfidence(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FaBrain className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-800">
                CORTEXA
              </span>
              <span className="ml-3 text-sm text-gray-500">
                / Facial Screening
              </span>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
              >
                <FaArrowLeft />
                <span className="hidden sm:inline">Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Facial Screening</h1>
          <p className="text-gray-600 text-lg">Upload a facial image for ASD detection analysis</p>
        </div>
            {/* Information Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg mb-8">
              <div className="flex items-start gap-3">
                <FaCamera className="text-blue-500 text-2xl mt-1" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">About Facial Screening</h3>
                  <p className="text-gray-700">
                    This tool uses computer vision and deep learning to analyze facial features for ASD detection. 
                    Please upload a clear, frontal photograph of the face. This analysis provides supportive insights 
                    and is <span className="font-bold">not a formal diagnosis</span>. Always consult with qualified 
                    healthcare professionals for official assessments.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Upload Section */}
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Image</h2>
                
                {/* File Input */}
                <div className="mb-6">
                  <label 
                    htmlFor="file-upload" 
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaUpload className="text-gray-400 text-5xl mb-4" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG, JPEG (MAX. 10MB)</p>
                      </div>
                    )}
                    <input 
                      id="file-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {/* Selected File Name */}
                {selectedFile && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Selected file:</p>
                    <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={!selectedFile || loading}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold inline-flex items-center justify-center gap-2 transition ${
                      !selectedFile || loading
                        ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        : 'bg-pink-200 text-pink-800 hover:bg-pink-300'
                    }`}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FaCamera />
                        Analyze
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold disabled:opacity-50"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Right Side - Results Section */}
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Screening Result</h2>
                
                {!prediction && !loading && !error && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <FaChartLine className="text-6xl mb-4" />
                    <p className="text-lg">Results will appear here after analysis</p>
                  </div>
                )}

                {loading && (
                  <div className="flex flex-col items-center justify-center h-64 text-blue-500">
                    <FaSpinner className="text-6xl mb-4 animate-spin" />
                    <p className="text-lg">Analyzing image...</p>
                  </div>
                )}

                {prediction && confidence !== null && (
                  <div className="space-y-6">
                    {/* Prediction Result */}
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                      <p className="text-sm text-gray-600 mb-2">Prediction:</p>
                      <p className={`text-3xl font-bold ${
                        prediction.toLowerCase().includes('autistic') && !prediction.toLowerCase().includes('non') 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {prediction}
                      </p>
                    </div>

                    {/* Confidence Score */}
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
                      <p className="text-sm text-gray-600 mb-2">Confidence Score:</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {(confidence * 100).toFixed(2)}%
                      </p>
                      
                      {/* Confidence Bar */}
                      <div className="mt-4 w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">Important Note:</p>
                      <p className="text-sm text-gray-700">
                        This screening result is based on AI analysis and should not be used as a sole basis 
                        for diagnosis. Please consult with qualified healthcare professionals for a comprehensive 
                        assessment.
                      </p>
                    </div>

                    {/* Risk Level Indicator */}
                    <div className="p-6 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-3">Risk Level:</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${
                          confidence >= 0.7 ? 'bg-red-500' : 
                          confidence >= 0.4 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}></div>
                        <p className="font-semibold text-gray-800">
                          {confidence >= 0.7 ? 'High Risk' : 
                           confidence >= 0.4 ? 'Moderate Risk' : 
                           'Low Risk'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => navigate('/screening-center')}
                className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
              >
                Back to Screening Center
              </button>
            </div>
      </div>
    </div>
  );
};

export default FacialScreeningPage;
