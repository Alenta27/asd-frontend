import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';

const getKeys = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    const decoded = JSON.parse(atob(token.split('.')[1]));
    if (!decoded.id) {
      throw new Error('Invalid token format. Please log in again.');
    }
    return {
      CHILDREN_KEY: `children_${decoded.id}`,
      REPORTS_KEY: `screening_reports_${decoded.id}`
    };
  } catch (error) {
    console.error('Token parsing error:', error);
    localStorage.clear();
    window.location.href = '/login';
    throw error;
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
    const [predictionResult, setPredictionResult] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState('No file chosen');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
            setPredictionResult(null);
            setError('');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            setError('Please select an image file first.');
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await axios.post('http://localhost:5000/api/predict', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const result = response.data;
            setPredictionResult(result);
            setError('');

            // Save to reports
            const report = {
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              tool: 'ASD Image Screening',
              prediction: result?.prediction ?? 'Unknown',
              confidence: typeof result?.confidence === 'number' ? result.confidence : undefined,
              childId: child?.id || null,
              childName: child?.name || 'Unassigned',
              notes: `File: ${fileName}`,
            };
            saveReport(report);
        } catch (err) {
            setError('An error occurred during prediction. Please try again.');
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
                            <div className={`p-4 rounded-lg ${predictionResult.prediction === 'Autistic' ? 'bg-orange-100 border border-orange-300' : 'bg-green-100 border border-green-300'}`}>
                                <p className="text-lg">
                                    <span className="font-bold">Prediction:</span> 
                                    <span className={`ml-2 font-semibold ${predictionResult.prediction === 'Autistic' ? 'text-orange-700' : 'text-green-700'}`}>
                                        {predictionResult.prediction}
                                    </span>
                                </p>
                                <p className="text-lg mt-2">
                                    <span className="font-bold">Confidence:</span> 
                                    <span className="ml-2 font-semibold text-gray-700">
                                        {typeof predictionResult.confidence === 'number' ? (predictionResult.confidence * 100).toFixed(2) + '%' : '—'}
                                    </span>
                                </p>
                                <p className="text-sm text-gray-600 mt-4">
    <strong>Note on Confidence:</strong> The confidence score reflects the model's certainty in its prediction based on the patterns it has learned from the data. It is not a measure of the likelihood of having ASD.
</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ScreeningPage;