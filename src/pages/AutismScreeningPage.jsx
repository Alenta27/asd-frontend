import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ScreeningQuestionnaire from '../components/ScreeningQuestionnaire';

const AutismScreeningPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const childId = searchParams.get('childId');
  
  const [child, setChild] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [screeningType, setScreeningType] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    const fetchChildData = async () => {
      if (!childId) {
        setError('No child selected. Please select a child from the dashboard.');
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/parent/children`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const children = response.data;
        const selectedChild = children.find(c => (c._id || c.id) === childId);
        
        if (!selectedChild) {
          setError('Child profile not found.');
        } else {
          setChild(selectedChild);
          determineScreeningType(selectedChild.age);
        }
      } catch (err) {
        console.error('Error fetching child data:', err);
        setError('Failed to load child data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildData();
  }, [childId]);

  const determineScreeningType = (age) => {
    // Age is in years. 
    // Age 16–30 months → M-CHAT-R/F (1.33 to 2.5 years)
    // Age 12–60 months → SACS-R / SACS-Preschool (1 to 5 years)
    // School Age Children → Social Challenges Screening Questionnaire (SCSQ)
    // Age 16+ → Autism Spectrum Quotient (AQ Test)
    
    if (age >= 1.33 && age <= 2.5) {
      setScreeningType('M-CHAT-R/F');
    } else if (age >= 1 && age <= 5) {
      setScreeningType('SACS-R');
    } else if (age > 5 && age < 16) {
      setScreeningType('SCSQ');
    } else if (age >= 16) {
      setScreeningType('AQ Test');
    } else {
      // Fallback for very young children
      setScreeningType('SACS-R'); 
    }
  };

  const handleScreeningSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/screening/submit', {
        child_id: childId,
        test_type: screeningType,
        answers: data.answers,
        score: data.score,
        risk_level: data.riskLevel
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await axios.post('http://localhost:5000/api/screening/save', {
        childName: child?.name || 'Child',
        screeningType: 'MCHAT',
        scores: {
          questionnaireScore: Number(data.score || 0),
          attentionScore: 100,
          mriPrediction: 'Unknown'
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResultData({
        ...response.data.result,
        recommendation: data.recommendation,
        explanation: data.explanation
      });
      setShowResult(true);
    } catch (err) {
      console.error('Error submitting screening:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error message:', err.message);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to submit screening results. Please try again.';
      console.error('Final error to display:', errorMsg);
      toast.error(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block">
          <FaExclamationTriangle className="inline mr-2" />
          {error}
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="block mx-auto mt-4 text-blue-600 hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold">Screening Results</h2>
            <p className="opacity-90">Assessment complete for {child.name}</p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Child Name</p>
                  <p className="text-lg font-medium text-gray-800">{child.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Screening Tool Used</p>
                  <p className="text-lg font-medium text-gray-800">{screeningType}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Total Score</p>
                  <p className="text-lg font-medium text-gray-800">{resultData.resultScore}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">Risk Level</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-1 ${
                    resultData.resultLabel.includes('High') ? 'bg-red-100 text-red-700' :
                    resultData.resultLabel.includes('Medium') || resultData.resultLabel.includes('Moderate') ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {resultData.resultLabel}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
              <h3 className="text-blue-800 font-bold mb-2 flex items-center">
                <FaInfoCircle className="mr-2" /> Explanation
              </h3>
              <p className="text-blue-700">{resultData.explanation}</p>
            </div>
            
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 mb-8 rounded-r-lg">
              <h3 className="text-indigo-800 font-bold mb-2 flex items-center">
                <FaCheckCircle className="mr-2" /> Recommendation
              </h3>
              <p className="text-indigo-700">{resultData.recommendation}</p>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600 mb-8 italic">
              <p className="font-bold mb-1">Disclaimer:</p>
              "This screening tool is not a medical diagnosis. It only identifies possible developmental concerns. Please consult a qualified healthcare professional."
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={() => setShowResult(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                Retake Test
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Autism Screening</h1>
          <p className="text-gray-600 mt-2">
            Performing <span className="font-bold text-blue-600">{screeningType}</span> assessment for <span className="font-bold">{child.name}</span> (Age: {child.age})
          </p>
        </div>
        
        <ScreeningQuestionnaire 
          type={screeningType} 
          childName={child.name}
          onSubmit={handleScreeningSubmit} 
        />
      </div>
    </div>
  );
};

export default AutismScreeningPage;
