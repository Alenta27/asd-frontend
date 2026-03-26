import React, { useEffect, useMemo, useState } from 'react';
import { FaArrowLeft, FaCalendarAlt, FaClipboardCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ParentScreeningResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const childId = searchParams.get('childId');

  const [results, setResults] = useState([]);
  const [childName, setChildName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      if (!childId) {
        setError('No child selected. Please return to dashboard and choose a child.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        const [childrenResponse, historyResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/parent/children', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/screening/results/${childId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const children = Array.isArray(childrenResponse.data) ? childrenResponse.data : [];
        const selectedChild = children.find((c) => (c._id || c.id) === childId);
        setChildName(selectedChild?.name || 'Selected Child');

        const history = Array.isArray(historyResponse.data) ? historyResponse.data : [];
        setResults(history);
      } catch (err) {
        console.error('Error loading screening history:', err);
        setError(err?.response?.data?.error || 'Failed to load screening history.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [childId]);

  const stats = useMemo(() => {
    const total = results.length;
    const high = results.filter((r) => (r.resultLabel || '').includes('High')).length;
    const moderate = results.filter((r) => {
      const label = r.resultLabel || '';
      return label.includes('Moderate') || label.includes('Medium');
    }).length;
    const low = results.filter((r) => (r.resultLabel || '').includes('Low')).length;
    return { total, high, moderate, low };
  }, [results]);

  const getRiskBadgeClasses = (label) => {
    if (!label) return 'bg-gray-100 text-gray-700';
    if (label.includes('High')) return 'bg-red-100 text-red-700';
    if (label.includes('Moderate') || label.includes('Medium')) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-blue-500">
          <h1 className="text-2xl font-bold text-gray-800">Screening History</h1>
          <p className="text-gray-600 mt-1">
            Previous autism screening tests for <span className="font-semibold">{childName || 'selected child'}</span>
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-gray-600">Loading screening history...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 flex items-start gap-3">
            <FaExclamationTriangle className="mt-1" />
            <div>{error}</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold">Total Tests</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-red-100">
                <p className="text-xs text-red-500 uppercase font-semibold">High Risk</p>
                <p className="text-2xl font-bold text-red-700 mt-1">{stats.high}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-orange-100">
                <p className="text-xs text-orange-500 uppercase font-semibold">Moderate Risk</p>
                <p className="text-2xl font-bold text-orange-700 mt-1">{stats.moderate}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-green-100">
                <p className="text-xs text-green-500 uppercase font-semibold">Low Risk</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{stats.low}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              {results.length === 0 ? (
                <div className="text-gray-600">No screening history found yet for this child.</div>
              ) : (
                <div className="space-y-3">
                  {results.map((item) => (
                    <div
                      key={item._id || item.screeningId}
                      className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <FaClipboardCheck className="text-blue-600" />
                          <p className="font-bold text-gray-800">{item.screeningType || 'Questionnaire'}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <FaCalendarAlt />
                          <span>
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date unavailable'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${getRiskBadgeClasses(item.resultLabel)}`}>
                          {item.resultLabel || 'N/A'}
                        </span>
                        <span className="text-sm text-gray-600">
                          Score: <span className="font-semibold">{typeof item.resultScore === 'number' ? item.resultScore.toFixed(3) : 'N/A'}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ParentScreeningResultsPage;
