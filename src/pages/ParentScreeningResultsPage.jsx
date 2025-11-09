import React, { useState } from 'react';
import { FaArrowLeft, FaCamera, FaClipboardList, FaChartLine, FaDownload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ParentScreeningResultsPage = () => {
  const navigate = useNavigate();
  const [step1Complete, setStep1Complete] = useState(false);
  const [step2Complete, setStep2Complete] = useState(false);
  const [pastReports] = useState([
    { id: 1, date: '25 Oct 2025', type: 'Combined Screening Report' },
    { id: 2, date: '18 Oct 2025', type: 'Facial & Eye-Tracking Screening' },
  ]);

  const handleStartScreening = () => {
    setStep1Complete(true);
    navigate('/screening-tools');
  };

  const handleBeginQuestionnaire = () => {
    setStep2Complete(true);
    navigate('/screening-tools');
  };

  const canAnalyze = step1Complete && step2Complete;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-200 shadow-lg flex flex-col overflow-hidden">
        <div className="p-6 border-b border-blue-300 flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 transition"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-blue-800">CORTEXA</h1>
            <p className="text-xs text-blue-600">ASD Detection & Support</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-800">New Screening Center</h1>
          <p className="text-gray-600 text-sm mt-2">
            To generate a new preliminary report for your child, please complete the two sections below. This analysis provides supportive insights and is not a formal diagnosis.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="space-y-8 max-w-4xl">
            {/* Step 1: Facial & Eye-Tracking */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-400">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <h2 className="text-2xl font-bold text-gray-800">Facial & Eye-Tracking Screening</h2>
                  </div>
                  
                  <div className="flex items-start gap-3 mb-4">
                    <FaCamera size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 font-semibold">Camera-Based Analysis</p>
                      <p className="text-gray-600 text-sm mt-1">
                        This tool will use your device's camera to present short videos and stimuli. It analyzes observational data related to facial expressions and eye-tracking patterns. Please ensure your child is in a quiet, well-lit area.
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
                    <span className="font-semibold">Status:</span> {step1Complete ? '✓ Complete' : 'Not Started'}
                  </div>
                </div>
                <button
                  onClick={handleStartScreening}
                  className="px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm whitespace-nowrap ml-4"
                >
                  {step1Complete ? '✓ Started' : 'Start Screening'}
                </button>
              </div>
            </div>

            {/* Step 2: Parent Questionnaire */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-400">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <h2 className="text-2xl font-bold text-gray-800">Parent Observational Questionnaire</h2>
                  </div>
                  
                  <div className="flex items-start gap-3 mb-4">
                    <FaClipboardList size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 font-semibold">M-CHAT-R™ Based Questions</p>
                      <p className="text-gray-600 text-sm mt-1">
                        This is a standardized questionnaire (based on the M-CHAT-R™) about your child's behaviors. Please answer based on your observations over the past few weeks.
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
                    <span className="font-semibold">Status:</span> {step2Complete ? '✓ Complete' : 'Not Started'}
                  </div>
                </div>
                <button
                  onClick={handleBeginQuestionnaire}
                  className="px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm whitespace-nowrap ml-4"
                >
                  {step2Complete ? '✓ Started' : 'Begin Questionnaire'}
                </button>
              </div>
            </div>

            {/* Step 3: Analyze & Generate Report */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-400">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <h2 className="text-2xl font-bold text-gray-800">Analyze & Generate Report</h2>
                  </div>
                  
                  <div className="flex items-start gap-3 mb-4">
                    <FaChartLine size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 text-sm">
                      Once both screening sections are complete, our system will analyze the combined data and generate a comprehensive report with insights and recommendations.
                    </p>
                  </div>

                  <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <span className="font-semibold">Status:</span> {canAnalyze ? 'Ready to Analyze' : 'Complete Steps 1 & 2 to proceed'}
                  </div>
                </div>
                <button
                  disabled={!canAnalyze}
                  onClick={() => navigate('/screening-report')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ml-4 transition ${
                    canAnalyze
                      ? 'bg-pink-200 text-pink-800 hover:bg-pink-300'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Analyze & View Report
                </button>
              </div>
            </div>

            {/* Past Reports */}
            {pastReports.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Past Reports</h2>
                <div className="space-y-3">
                  {pastReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-800">{report.type}</p>
                        <p className="text-xs text-gray-600 mt-1">{report.date}</p>
                      </div>
                      <button className="px-4 py-2 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-sm flex items-center gap-2">
                        <FaDownload size={14} /> View PDF
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentScreeningResultsPage;
