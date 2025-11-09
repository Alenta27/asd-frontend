import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaArrowLeft, FaInfoCircle, FaFolder } from 'react-icons/fa';

const MRIScreeningPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check if file has correct extension
      if (selectedFile.name.toLowerCase().endsWith('.nii.gz') || 
          selectedFile.name.toLowerCase().endsWith('.1d') || 
          selectedFile.name.toLowerCase().endsWith('.txt')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a .nii.gz, .1D, or .txt file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('📤 Uploading MRI file...');
      const response = await fetch('http://localhost:5000/api/predict-mri', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Server error:', data);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.error) {
        console.error('❌ Prediction error:', data);
        throw new Error(data.error);
      }

      console.log('✅ MRI analysis complete:', data);
      setResult(data);
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    navigate('/screening');
  };

  // Brain icon SVG component - Anatomically inspired
  const BrainIcon = () => (
    <svg className="w-20 h-20 mx-auto mb-6" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main brain outline with hemispheres */}
      <ellipse cx="32" cy="28" rx="20" ry="22" fill="#e91e63" opacity="0.15" stroke="#e91e63" strokeWidth="2"/>
      
      {/* Left hemisphere with convolutions */}
      <path d="M 24 12 Q 20 14 18 18 Q 16 22 16 28 Q 16 34 18 38 Q 20 42 24 44" 
            stroke="#e91e63" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 22 14 Q 19 16 18 20" stroke="#e91e63" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M 21 18 Q 18 22 18 26" stroke="#e91e63" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M 22 32 Q 19 34 18 38" stroke="#e91e63" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      
      {/* Right hemisphere with convolutions */}
      <path d="M 40 12 Q 44 14 46 18 Q 48 22 48 28 Q 48 34 46 38 Q 44 42 40 44" 
            stroke="#e91e63" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 42 14 Q 45 16 46 20" stroke="#e91e63" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M 43 18 Q 46 22 46 26" stroke="#e91e63" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M 42 32 Q 45 34 46 38" stroke="#e91e63" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      
      {/* Center corpus callosum */}
      <line x1="24" y1="28" x2="40" y2="28" stroke="#e91e63" strokeWidth="2" opacity="0.5"/>
      
      {/* Brainstem */}
      <path d="M 30 44 Q 32 48 32 52" stroke="#e91e63" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 34 44 Q 32 48 32 52" stroke="#e91e63" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
      
      {/* Highlight accent */}
      <circle cx="28" cy="24" r="2.5" fill="#e91e63" opacity="0.8"/>
      <circle cx="36" cy="26" r="2.5" fill="#e91e63" opacity="0.8"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-300 to-blue-400 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center text-white mb-8 hover:opacity-80 transition-opacity font-semibold"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Header with Brain Icon */}
          <div className="text-center mb-8">
            <BrainIcon />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">MRI-Based ASD Screening</h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Upload a functional MRI scan (.nii.gz) for automated Autism Spectrum Disorder screening using brain connectivity analysis
            </p>
          </div>

          {/* Upload Drop Zone */}
          <div className="mb-8">
            <label className="block" htmlFor="file-upload">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".nii.gz,.1d,.txt"
                className="hidden"
                id="file-upload"
              />
              <div className="border-2 border-dashed border-blue-400 rounded-2xl p-10 hover:border-blue-600 hover:bg-blue-50 transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-transparent">
                <div className="text-center">
                  <FaFolder className="mx-auto text-5xl text-yellow-400 mb-4" />
                  <p className="text-gray-700 font-semibold mb-2 text-lg">
                    {file ? file.name : 'Click to select MRI scan file'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Accepted formats: .nii, .nii.gz
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* File Selected Confirmation */}
          {file && (
            <div className="mb-8 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 text-xl mr-3" />
                <div>
                  <p className="text-green-800 font-semibold">File ready for analysis</p>
                  <p className="text-green-600 text-sm">{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-500 text-xl mr-3" />
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Analyze Button with Gradient */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={
              !file || uploading ? {} : {
                background: 'linear-gradient(to right, #556B57 0%, #6B8668 100%)',
              }
            }
            className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
              !file || uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'shadow-lg hover:shadow-xl transform hover:scale-105 hover:opacity-90'
            }`}
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin text-xl" />
                Processing MRI Scan...
              </>
            ) : (
              <>
                🔍
                Analyze MRI Scan
              </>
            )}
          </button>

          {/* About This Tool Section */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="flex items-center text-blue-900 font-bold text-lg mb-4">
                <FaInfoCircle className="mr-3 text-blue-600" />
                About This Tool
              </h3>
              <div className="space-y-3 text-gray-700 text-sm">
                <p><span className="font-semibold text-gray-800">Technology:</span> Support Vector Machine (SVM) trained on fMRI connectivity data</p>
                <p><span className="font-semibold text-gray-800">Analysis:</span> Extracts brain connectivity patterns using Harvard-Oxford Atlas</p>
                <p><span className="font-semibold text-gray-800">Purpose:</span> Research and screening tool for ASD classification</p>
                <p className="text-blue-900 font-semibold mt-4">⚠️ Note: This is not a diagnostic tool. Consult healthcare professionals for clinical diagnosis</p>
              </div>
            </div>
          </div>

          {/* Results Display - User Friendly */}
          {result && (
            <div className="mt-8 space-y-6">
              {/* Diagnosis Result - Large and Clear */}
              <div className={`rounded-xl p-8 border-2 ${
                result.diagnosis === 'ASD' 
                  ? 'bg-orange-50 border-orange-300' 
                  : 'bg-green-50 border-green-300'
              }`}>
                <div className="text-center">
                  <h2 className="text-sm uppercase tracking-wider text-gray-600 font-semibold mb-2">Screening Result</h2>
                  <p className={`text-5xl font-bold ${
                    result.diagnosis === 'ASD' 
                      ? 'text-orange-600' 
                      : 'text-green-600'
                  }`}>
                    {result.diagnosis === 'ASD' ? '🔍 ASD Pattern Detected' : '✅ Control/Normal Pattern'}
                  </p>
                  <p className="text-gray-600 mt-3 text-lg">
                    {result.diagnosis === 'ASD' 
                      ? 'The brain connectivity pattern shows characteristics associated with Autism Spectrum Disorder'
                      : 'The brain connectivity pattern appears typical and does not show ASD-associated characteristics'
                    }
                  </p>
                </div>
              </div>

              {/* Confidence Level - Visual */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Model Confidence Level</h3>
                
                {/* Confidence Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-semibold">Prediction Confidence</span>
                    <span className="text-2xl font-bold text-blue-600">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        result.confidence > 0.7 ? 'bg-green-500' :
                        result.confidence > 0.5 ? 'bg-yellow-500' :
                        'bg-orange-500'
                      }`}
                      style={{ width: `${Math.min(result.confidence * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Confidence Interpretation */}
                <div className={`p-4 rounded-lg ${
                  result.confidence > 0.7 ? 'bg-green-100 text-green-800' :
                  result.confidence > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  <p className="font-semibold mb-2">
                    {result.confidence > 0.7 ? '🟢 Strong Prediction' :
                     result.confidence > 0.5 ? '🟡 Moderate Prediction' :
                     '🟠 Borderline/Weak Prediction'}
                  </p>
                  <p className="text-sm">
                    {result.confidence > 0.7 
                      ? 'The model is highly confident in this result.'
                      : result.confidence > 0.5
                      ? 'The model has moderate confidence. Additional clinical evaluation recommended.'
                      : 'The model shows low confidence. The patterns are borderline and may require further investigation.'}
                  </p>
                </div>
              </div>

              {/* Probability Breakdown */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Brain Pattern Analysis</h3>
                
                <div className="space-y-4">
                  {/* ASD Pattern */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-semibold">ASD-like Brain Connectivity</span>
                      <span className="text-xl font-bold text-orange-600">{(result.asd_probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${result.asd_probability * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Control Pattern */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-semibold">Typical Brain Connectivity</span>
                      <span className="text-xl font-bold text-green-600">{(result.control_probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${result.control_probability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Recommendations */}
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">📋 Important Notes</h3>
                <ul className="space-y-2 text-blue-900 text-sm">
                  <li>✓ This tool analyzes <strong>brain connectivity patterns</strong> from fMRI scans</li>
                  <li>✓ Results should be used as a <strong>screening aid, not a diagnosis</strong></li>
                  <li>✓ Always combine with clinical assessment and behavioral evaluation</li>
                  <li>✓ Consult with healthcare professionals for clinical diagnosis</li>
                  <li>✓ Technology: Support Vector Machine (SVM) trained on ABIDE Caltech dataset</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Analyze Another Scan
                </button>
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors"
                >
                  Back to Screening
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MRIScreeningPage;

