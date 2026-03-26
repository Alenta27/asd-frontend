import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';

const getKeys = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // Return guest keys instead of redirecting to login
      return {
        CHILDREN_KEY: 'children_guest',
        REPORTS_KEY: 'screening_reports_guest'
      };
    }
    const decoded = JSON.parse(atob(token.split('.')[1]));
    if (!decoded.id) {
      // Return guest keys instead of redirecting to login
      return {
        CHILDREN_KEY: 'children_guest',
        REPORTS_KEY: 'screening_reports_guest'
      };
    }
    return {
      CHILDREN_KEY: `children_${decoded.id}`,
      REPORTS_KEY: `screening_reports_${decoded.id}`
    };
  } catch (error) {
    console.error('Token parsing error:', error);
    // Return guest keys instead of redirecting to login
    return {
      CHILDREN_KEY: 'children_guest',
      REPORTS_KEY: 'screening_reports_guest'
    };
  }
};

const loadChildren = () => {
  try {
    const { CHILDREN_KEY } = getKeys();
    const raw = localStorage.getItem(CHILDREN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveReport = (report) => {
  try {
    const { REPORTS_KEY } = getKeys();
    const raw = localStorage.getItem(REPORTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
  } catch {}
};

function ScreeningPage() {
    const location = useLocation();
    const childId = location.state?.childId || null;
    const children = loadChildren();
    const child = children.find(c => c.id === childId) || null;

    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [predictionResult, setPredictionResult] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState('No file chosen');
        const [latestScreeningMeta, setLatestScreeningMeta] = useState(null);

        const formatInvalidImageMessage = (payload) => {
            const base = payload?.error || 'Invalid image: upload one clear frontal photo of a single child face.';
            const faceCount = typeof payload?.faceCount === 'number' ? payload.faceCount : null;
            if (faceCount === 0) {
                return `${base} No frontal face was detected.`;
            }
            if (faceCount && faceCount > 1) {
                return `${base} Multiple faces were detected (${faceCount}).`;
            }
            return base;
        };

        const getPredictionLabel = (rawPrediction) => {
            const value = String(rawPrediction || '').toLowerCase();
            if (value.includes('inconclusive') || value.includes('uncertain')) return 'Inconclusive';
            if (value.includes('non') || value.includes('no asd')) return 'No ASD';
            if (value.includes('autistic') || value.includes('asd')) return 'ASD Detected';
            return String(rawPrediction || 'Unknown');
        };

        const getConfidencePercent = (rawConfidence) => {
            if (typeof rawConfidence !== 'number' || Number.isNaN(rawConfidence)) return 'N/A';
            return `${(rawConfidence * 100).toFixed(2)}%`;
        };

        const formatDateTime = (dateObj = new Date()) => {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }).format(dateObj);
        };

        const getInterpretation = (label) => {
            if (label === 'No ASD') {
                return 'The model predicts that the child does not show facial patterns typically associated with ASD based on the analyzed dataset.';
            }
            if (label === 'ASD Detected') {
                return 'The model predicts that the child shows facial patterns associated with ASD in the analyzed dataset. A clinical follow-up assessment is recommended.';
            }
            return 'The model produced an indeterminate screening output. Please repeat the test with a clear frontal image and consult a clinician for further evaluation.';
        };

        const getResultClassName = (label) => {
            if (label === 'No ASD') return 'bg-green-100 border border-green-300';
            if (label === 'ASD Detected') return 'bg-orange-100 border border-orange-300';
            return 'bg-yellow-100 border border-yellow-300';
        };

        const getResultTextClassName = (label) => {
            if (label === 'No ASD') return 'text-green-700';
            if (label === 'ASD Detected') return 'text-orange-700';
            return 'text-yellow-800';
        };

        const handleDownloadPdf = () => {
            if (!predictionResult || !imagePreview) return;

            const generatedAt = new Date();
            const screeningId = latestScreeningMeta?.screeningId || `SCR-${generatedAt.getTime()}`;
            const predictionLabel = getPredictionLabel(predictionResult.prediction);
            const confidenceText = getConfidencePercent(predictionResult.confidence);

            const childInfo = {
                id: child?.cortexaId || child?.id || 'N/A',
                name: child?.name || 'N/A',
                age: child?.age || child?.childAge || 'N/A',
                gender: child?.gender || 'N/A',
                parentName: child?.parentName || child?.guardianName || child?.motherName || child?.fatherName || 'N/A',
            };

            const doc = new jsPDF({ unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const left = 14;
            const right = pageWidth - 14;
            const contentWidth = right - left;
            let y = 16;

            const ensureSpace = (requiredHeight) => {
                if (y + requiredHeight > pageHeight - 22) {
                    doc.addPage();
                    y = 16;
                }
            };

            const drawSectionTitle = (title) => {
                ensureSpace(10);
                doc.setFillColor(230, 241, 255);
                doc.rect(left, y, contentWidth, 8, 'F');
                doc.setTextColor(26, 56, 97);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text(title, left + 2, y + 5.5);
                y += 11;
            };

            const drawLineItem = (label, value) => {
                ensureSpace(7);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(40, 40, 40);
                doc.setFontSize(10);
                doc.text(`${label}:`, left + 1, y);
                doc.setFont('helvetica', 'normal');
                doc.text(String(value), left + 44, y);
                y += 6;
            };

            const drawParagraph = (text) => {
                const lines = doc.splitTextToSize(text, contentWidth - 4);
                ensureSpace(lines.length * 5 + 2);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(45, 45, 45);
                doc.setFontSize(10);
                doc.text(lines, left + 1, y);
                y += lines.length * 5 + 2;
            };

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(22, 48, 86);
            doc.text('CORTEXA - Intelligent Autism Screening System', left, y);
            y += 7;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(90, 90, 90);
            doc.text('MCA Research Project - Facial Screening Report', left, y);
            y += 6;
            doc.setDrawColor(190, 210, 235);
            doc.line(left, y, right, y);
            y += 7;

            drawSectionTitle('1. Header');
            drawLineItem('System Name', 'CORTEXA - Intelligent Autism Screening System');
            drawLineItem('Institution / Project Title', 'MCA Research Project');
            drawLineItem('Generated Date & Time', formatDateTime(generatedAt));
            drawLineItem('Unique Screening ID', screeningId);

            drawSectionTitle('2. Patient / Child Information');
            drawLineItem('Child ID', childInfo.id);
            drawLineItem('Child Name', childInfo.name);
            drawLineItem('Age', childInfo.age);
            drawLineItem('Gender', childInfo.gender);
            drawLineItem('Parent Name', childInfo.parentName);
            drawLineItem('Screening Date', formatDateTime(generatedAt));

            drawSectionTitle('3. Uploaded Image');
            ensureSpace(70);
            try {
                const imageFormat = imagePreview.includes('image/png') ? 'PNG' : 'JPEG';
                const imgW = contentWidth;
                const imgH = 60;
                doc.addImage(imagePreview, imageFormat, left, y, imgW, imgH);
                y += imgH + 4;
            } catch (imageErr) {
                drawParagraph('Unable to embed image in report. Please retry with a valid image file.');
            }

            drawSectionTitle('4. Screening Method');
            drawParagraph('This screening uses a Convolutional Neural Network (CNN) trained on publicly available ASD facial datasets to detect facial patterns associated with Autism Spectrum Disorder.');

            drawSectionTitle('5. Screening Result');
            drawLineItem('Prediction', predictionLabel);
            drawLineItem('Confidence Score', confidenceText);
            drawLineItem('Model Used', 'CNN');

            drawSectionTitle('6. Interpretation');
            drawParagraph(getInterpretation(predictionLabel));

            drawSectionTitle('7. Clinical Disclaimer');
            drawParagraph('This screening tool is intended for research and preliminary screening purposes only. It should not be used as a medical diagnosis. Professional evaluation by a licensed clinician is recommended.');

            drawSectionTitle('8. System Information');
            drawLineItem('Model Type', 'CNN');
            drawLineItem('Dataset', 'Public ASD facial datasets');
            drawLineItem('Screening Module', 'Facial Analysis');

            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i += 1) {
                doc.setPage(i);
                doc.setDrawColor(220, 220, 220);
                doc.line(left, pageHeight - 16, right, pageHeight - 16);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(9);
                doc.text('Generated by CORTEXA System | MCA Research Project', left, pageHeight - 10);
                doc.text(`Page ${i} of ${totalPages}`, right, pageHeight - 10, { align: 'right' });
            }

            doc.save(`CORTEXA_Facial_Screening_Report_${screeningId}.pdf`);
        };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
            setPredictionResult(null);
            setError('');
            
            // Create image preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            setError('Please select an image file first.');
            return;
        }

        setIsLoading(true);
        setPredictionResult(null);
        setLatestScreeningMeta(null);
        setError('');

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await axios.post('http://localhost:5000/api/predict', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

                        const result = response.data;
                        const normalizedLabel = getPredictionLabel(result?.prediction);
            setPredictionResult(result);
            setError('');

            // Save to reports
            const report = {
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              tool: 'ASD Image Screening',
                            prediction: normalizedLabel,
              confidence: typeof result?.confidence === 'number' ? result.confidence : undefined,
              childId: child?.id || null,
              childName: child?.name || 'Unassigned',
              notes: `File: ${fileName}`,
            };
            saveReport(report);
                        setLatestScreeningMeta({
                            screeningId: report.id,
                            generatedAt: Date.now(),
                        });
        } catch (err) {
            const payload = err.response?.data;
            const errorMessage = payload?.code === 'INVALID_IMAGE'
                ? formatInvalidImageMessage(payload)
                : (payload?.error || 'An error occurred during prediction. Please try again.');
            setPredictionResult(null);
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl flex">
                {/* Left Side: Image */}
                <div className="hidden md:block md:w-1/2">
                    <img 
                        src={`${process.env.PUBLIC_URL}/images/screening-image.png`}
                        alt="Child and parent" 
                        className="w-full h-full object-cover rounded-l-lg" 
                    />
                </div>

                {/* Right Side: Form and Content */}
                <div className="w-full md:w-1/2 p-8">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">ASD Screening Tool</h2>
                    <p className="text-center text-gray-600 mb-2">
                        Upload a facial image to get a preliminary screening result or <Link to="/questionnaire" className="text-blue-600 hover:underline">fill out a questionnaire</Link>.
                    </p>
                                        <p className="text-center text-sm text-amber-700 mb-4">
                                            Valid image rule: only approved dataset images are accepted, and they must show one clear frontal child face. Group photos, screenshots, scenery, and non-dataset photos are rejected.
                                        </p>
                    {child && (
                      <p className="text-center text-sm text-gray-500 mb-6">Child: <span className="font-medium">{child.name}</span></p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="file-upload" className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-l-md border border-gray-300 cursor-pointer hover:bg-gray-300">
                                Choose File
                            </label>
                            <span className="flex-1 p-2 border-t border-b border-r border-gray-300 rounded-r-md truncate">
                                {fileName}
                            </span>
                            <input id="file-upload" type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                        </div>

                        {/* Image Preview Section */}
                        {imagePreview && (
                            <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                                <p className="text-sm font-semibold text-gray-700 mb-2 text-center">Child's Photo to Analyze:</p>
                                <div className="flex justify-center">
                                    <img 
                                        src={imagePreview} 
                                        alt="Child to analyze" 
                                        className="max-h-64 rounded-lg shadow-md object-contain"
                                    />
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-300 text-lg font-semibold disabled:bg-blue-300"
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </form>

                    {error && <p className="mt-4 text-center text-red-500 font-medium">{error}</p>}
                    
                    {predictionResult && (
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Screening Result:</h3>
                            <div className={`p-4 rounded-lg ${getResultClassName(getPredictionLabel(predictionResult.prediction))}`}>
                                <p className="text-lg">
                                    <span className="font-bold">Prediction:</span> 
                                    <span className={`ml-2 font-semibold ${getResultTextClassName(getPredictionLabel(predictionResult.prediction))}`}>
                                        {getPredictionLabel(predictionResult.prediction)}
                                    </span>
                                </p>
                                <p className="text-lg mt-2">
                                    <span className="font-bold">Confidence:</span> 
                                    <span className="ml-2 font-semibold text-gray-700">
                                        {typeof predictionResult.confidence === 'number' ? (predictionResult.confidence * 100).toFixed(2) + '%' : '—'}
                                    </span>
                                </p>
                                {getPredictionLabel(predictionResult.prediction) === 'Inconclusive' && (
                                    <p className="text-sm text-yellow-900 mt-3 font-semibold">
                                        Result is inconclusive. Please upload one clear, frontal photo of only one child.
                                    </p>
                                )}
                                <p className="text-sm text-gray-600 mt-4">
    <strong>Note on Confidence:</strong> The confidence score reflects the model's certainty in its prediction based on the patterns it has learned from the data. It is not a measure of the likelihood of having ASD.
</p>
                            </div>

                                                        <button
                                                            type="button"
                                                            onClick={handleDownloadPdf}
                                                            className="mt-4 w-full bg-slate-700 text-white py-3 rounded-md hover:bg-slate-800 transition duration-300 text-base font-semibold"
                                                        >
                                                            Download PDF Report
                                                        </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ScreeningPage;