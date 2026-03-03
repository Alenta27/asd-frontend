import React from 'react';
import { Link } from 'react-router-dom';
import { FaFileMedicalAlt, FaClipboardList } from 'react-icons/fa';

export default function ScreeningTools() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Screening Tools</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/screening" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition">
            <div className="flex items-center gap-3 text-indigo-700">
              <FaFileMedicalAlt className="text-2xl" />
              <h2 className="text-xl font-semibold">ASD Image Screening</h2>
            </div>
            <p className="text-gray-600 mt-2 text-sm">
              Upload a facial image for a preliminary ASD screening result.
            </p>
          </Link>

          <Link to="/questionnaire" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition">
            <div className="flex items-center gap-3 text-blue-700">
              <FaClipboardList className="text-2xl" />
              <h2 className="text-xl font-semibold">ASD Questionnaires</h2>
            </div>
            <p className="text-gray-600 mt-2 text-sm">
              Answer a series of questions to get a preliminary screening result.
            </p>
          </Link>

          <Link to="/live-gaze-analysis" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition">
            <div className="flex items-center gap-3 text-purple-700">
              <FaFileMedicalAlt className="text-2xl" />
              <h2 className="text-xl font-semibold">Live Gaze Analysis</h2>
            </div>
            <p className="text-gray-600 mt-2 text-sm">
              Real-time monitoring of patient attention and gaze patterns.
            </p>
          </Link>

          <Link to="/speech-therapy" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition">
            <div className="flex items-center gap-3 text-green-700">
              <FaClipboardList className="text-2xl" />
              <h2 className="text-xl font-semibold">Speech Therapy</h2>
            </div>
            <p className="text-gray-600 mt-2 text-sm">
              Practice communication skills with guided feedback and progress tracking.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}