import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle, FaArrowLeft, FaInfoCircle, FaFolder, FaFilePdf, FaDownload } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';

const MRIScreeningPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check if file has correct extension
      if (selectedFile.name.toLowerCase().endsWith('.nii.gz') || 
          selectedFile.name.toLowerCase().endsWith('.1d') || 
          selectedFile.name.toLowerCase().endsWith('.txt')) {
        setFile(selectedFile);
        if (selectedFile.type && selectedFile.type.startsWith('image/')) {
          setFilePreviewUrl(URL.createObjectURL(selectedFile));
        } else {
          setFilePreviewUrl(null);
        }
        setError(null);
      } else {
        setError('Please upload a .nii.gz, .1D, or .txt file');
        setFile(null);
        setFilePreviewUrl(null);
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
    formData.append('mri_scan', file);

    try {
      console.log('📤 Uploading MRI file...');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/predict-mri`, {
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

      const token = localStorage.getItem('token');
      const selectedChildName = localStorage.getItem('selectedChildName') || 'Child';
      const predictionRaw = String(data.prediction || data.diagnosis || '').toUpperCase();
      const mriPrediction = predictionRaw.includes('ASD') && !predictionRaw.includes('NO ASD') ? 'ASD' : 'No ASD';

      if (token) {
        try {
          await fetch('http://localhost:5000/api/screening/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              childName: selectedChildName,
              screeningType: 'MRI',
              scores: {
                questionnaireScore: 0,
                attentionScore: 100,
                mriPrediction
              }
            })
          });
        } catch (saveError) {
          console.error('Failed to save unified MRI screening result:', saveError);
          toast.error('MRI analysis complete, but dashboard summary sync failed.');
        }
      }
      
      // Auto-trigger PDF download after successful scan
      setTimeout(() => {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();
        const predictionRaw = String(data.prediction || data.diagnosis || '').toUpperCase();
        const isASD = predictionRaw.includes('ASD') && !predictionRaw.includes('NO ASD');

        doc.setFillColor(233, 30, 99); 
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('CORTEXA - ASD Screening Report', 20, 25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Automated MRI Brain Connectivity Analysis', 20, 32);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Report Information', 20, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date generated: ${timestamp}`, 20, 65);
        doc.text(`File analyzed: ${file?.name || 'Unknown'}`, 20, 72);
        doc.text(`File size: ${file ? (file.size / (1024 * 1024)).toFixed(2) : 'N/A'} MB`, 20, 79);
        doc.setFont('helvetica', 'bold');
        doc.text('Screening Result', 20, 95);
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 98, 190, 98);
        doc.setFontSize(18);
        if (isASD) {
          doc.setTextColor(230, 81, 0); 
          doc.text(data.prediction || 'ASD Detected', 20, 110);
        } else {
          doc.setTextColor(46, 125, 50); 
          doc.text('No ASD Detected', 20, 110);
        }
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const description = isASD 
          ? 'The brain connectivity pattern shows characteristics associated with Autism Spectrum Disorder'
          : 'The brain connectivity pattern appears typical and does not show ASD-associated characteristics';
        doc.text(description, 20, 120);
        doc.setFont('helvetica', 'bold');
        doc.text('Statistical Analysis', 20, 140);
        doc.setFont('helvetica', 'normal');
        doc.text(`Model Confidence: ${(data.confidence * 100).toFixed(1)}%`, 20, 150);
        doc.text(`ASD-like connectivity probability: ${(data.asd_probability * 100).toFixed(1)}%`, 20, 157);
        doc.text(`Typical connectivity probability: ${(data.control_probability * 100).toFixed(1)}%`, 20, 164);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        const disclaimer = 'Note: This report is generated by an automated AI screening tool for research purposes only. It is not a clinical diagnosis. Please consult with a healthcare professional for clinical assessment and diagnosis.';
        const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
        doc.text(splitDisclaimer, 20, 190);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Generated by CORTEXA AI - ASD Detection & Support System', 105, 285, { align: 'center' });
        doc.save(`Cortexa_ASD_Report_${file?.name?.split('.')[0] || 'mri'}.pdf`);
      }, 500);
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

  const generatePDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    const predictionRaw = String(result.prediction || result.diagnosis || '').toUpperCase();
    const isASD = predictionRaw.includes('ASD') && !predictionRaw.includes('NO ASD');

    // Header
    doc.setFillColor(233, 30, 99); // Pink theme color
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CORTEXA - ASD Screening Report', 20, 25);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Automated MRI Brain Connectivity Analysis', 20, 32);

    // Report Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Information', 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date generated: ${timestamp}`, 20, 65);
    doc.text(`File analyzed: ${file?.name || 'Unknown'}`, 20, 72);
    doc.text(`File size: ${file ? (file.size / (1024 * 1024)).toFixed(2) : 'N/A'} MB`, 20, 79);

    // Result Section
    doc.setFont('helvetica', 'bold');
    doc.text('Screening Result', 20, 95);
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 98, 190, 98);

    doc.setFontSize(18);
    if (isASD) {
      doc.setTextColor(230, 81, 0); // Orange
      doc.text(result.prediction || 'ASD Detected', 20, 110);
    } else {
      doc.setTextColor(46, 125, 50); // Green
      doc.text('No ASD Detected', 20, 110);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const description = isASD 
      ? 'The brain connectivity pattern shows characteristics associated with Autism Spectrum Disorder'
      : 'The brain connectivity pattern appears typical and does not show ASD-associated characteristics';
    doc.text(description, 20, 120);

    // Probability Section
    doc.setFont('helvetica', 'bold');
    doc.text('Statistical Analysis', 20, 140);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Model Confidence: ${(result.confidence * 100).toFixed(1)}%`, 20, 150);
    doc.text(`ASD-like connectivity probability: ${(result.asd_probability * 100).toFixed(1)}%`, 20, 157);
    doc.text(`Typical connectivity probability: ${(result.control_probability * 100).toFixed(1)}%`, 20, 164);

    // Disclaimer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    const disclaimer = 'Note: This report is generated by an automated AI screening tool for research purposes only. It is not a clinical diagnosis. Please consult with a healthcare professional for clinical assessment and diagnosis.';
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
    doc.text(splitDisclaimer, 20, 190);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Generated by CORTEXA AI - ASD Detection & Support System', 105, 285, { align: 'center' });

    doc.save(`Cortexa_ASD_Report_${file?.name?.split('.')[0] || 'mri'}.pdf`);
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

  const isResultASD = result ? 
    (String(result.prediction || result.diagnosis || '').toUpperCase().includes('ASD') && 
     !String(result.prediction || result.diagnosis || '').toUpperCase().includes('NO ASD')) : 
    false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-300 to-blue-400 py-12 px-4">
      <div className="max-w-4xl mx-auto">
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
                <p><span className="font-semibold text-gray-800">Technology:</span> Convolutional Neural Network (CNN) trained on MRI scan images</p>
                <p><span className="font-semibold text-gray-800">Analysis:</span> Deep learning classification of brain structural/functional patterns</p>
                <p><span className="font-semibold text-gray-800">Model:</span> asd_mri_model_best_56.h5 (TensorFlow/Keras)</p>
                <p><span className="font-semibold text-gray-800">Purpose:</span> Research and screening tool for ASD classification</p>
                <p className="text-blue-900 font-semibold mt-4">⚠️ Note: This is not a diagnostic tool. Consult healthcare professionals for clinical diagnosis</p>
              </div>
            </div>
          </div>

          {/* Results Display - User Friendly */}
          {result && (
            <div className="mt-8 space-y-6">
              {/* Uploaded Scan Preview / Context */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Uploaded MRI Scan</h3>
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 min-h-[180px] flex items-center justify-center">
                    {filePreviewUrl ? (
                      <img
                        src={filePreviewUrl}
                        alt="Uploaded MRI scan"
                        className="max-h-64 w-auto rounded-md object-contain"
                      />
                    ) : (
                      <div className="text-center text-gray-600">
                        <p className="font-semibold">Preview not available for this MRI format</p>
                        <p className="text-sm mt-1">File: {file?.name || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-semibold">Filename:</span> {file?.name || 'N/A'}</p>
                    <p><span className="font-semibold">Size:</span> {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</p>
                    <p><span className="font-semibold">Model Result:</span> {result.prediction || (isResultASD ? 'ASD Detected' : 'No ASD Detected')}</p>
                    <p><span className="font-semibold">Confidence:</span> {(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Diagnosis Result - Large and Clear */}
              <div className={`rounded-xl p-8 border-2 ${
                isResultASD
                  ? 'bg-orange-50 border-orange-300' 
                  : 'bg-green-50 border-green-300'
              }`}>
                <div className="text-center">
                  <h2 className="text-sm uppercase tracking-wider text-gray-600 font-semibold mb-2">Screening Result</h2>
                  <p className={`text-5xl font-bold ${
                    isResultASD
                      ? 'text-orange-600' 
                      : 'text-green-600'
                  }`}>
                    {isResultASD
                      ? (result.prediction === 'ASD Pattern Detected' ? '🔍 ASD Pattern Detected' : '🔍 ASD Detected')
                      : '✅ No ASD Detected'}
                  </p>
                  <p className="text-gray-600 mt-3 text-lg">
                    {isResultASD
                      ? 'The brain connectivity pattern shows characteristics associated with Autism Spectrum Disorder'
                      : 'The brain connectivity pattern appears typical and does not show ASD-associated characteristics'
                    }
                  </p>
                  
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={generatePDF}
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                    >
                      <FaFilePdf className="text-red-500 text-xl" />
                      Download PDF Report
                    </button>
                  </div>
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
                  <li>✓ Technology: Support Vector Machine (SVM) trained on ABIDE multi-site dataset (Stanford, UCLA, Caltech, Oregon, Michigan)</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setFilePreviewUrl(null);
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

