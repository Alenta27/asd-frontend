import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaFilter, FaEye, FaCheck, FaClock, FaFileAlt } from 'react-icons/fa';

const TherapistQuestionnairesPage = () => {
  const questionnaires = [
    { id: 1, patientName: 'Keziah Thompson', questionnaireType: 'Social Skills Assessment', submittedDate: '2024-01-15', status: 'Completed', score: 78 },
    { id: 2, patientName: 'Yannik Rodriguez', questionnaireType: 'Communication Assessment', submittedDate: '2024-01-14', status: 'Under Review', score: null },
    { id: 3, patientName: 'Sophia Chen', questionnaireType: 'Behavioral Assessment', submittedDate: '2024-01-13', status: 'Completed', score: 65 },
    { id: 4, patientName: 'Marcus Johnson', questionnaireType: 'Social Skills Assessment', submittedDate: '2024-01-12', status: 'Pending Review', score: null },
    { id: 5, patientName: 'Lily Anderson', questionnaireType: 'Communication Assessment', submittedDate: '2024-01-11', status: 'Completed', score: 82 },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Under Review': return 'bg-blue-100 text-blue-800';
      case 'Pending Review': return 'bg-yellow-100 text-yellow-800';
      case 'Incomplete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/therapist" className="text-gray-600 hover:text-gray-800">
              <FaArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Questionnaire Results</h1>
              <p className="text-gray-600">Review and analyze patient questionnaire responses</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questionnaires by patient name or type..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <FaFilter /> Filter
            </button>
          </div>
        </div>

        {/* Questionnaires Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Questionnaires ({questionnaires.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questionnaire Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questionnaires.map((questionnaire) => (
                  <tr key={questionnaire.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaFileAlt className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{questionnaire.patientName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{questionnaire.questionnaireType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {questionnaire.submittedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(questionnaire.status)}`}>
                        {questionnaire.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getScoreColor(questionnaire.score)}`}>
                        {questionnaire.score ? `${questionnaire.score}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        <FaEye />
                      </button>
                      {questionnaire.status === 'Under Review' && (
                        <button className="text-green-600 hover:text-green-900">
                          <FaCheck />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistQuestionnairesPage;
