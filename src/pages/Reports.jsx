import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Local storage keys with user namespace
const getReportsKey = () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return `screening_reports_${decoded.id}`;
    }
  } catch {}
  return 'screening_reports';
};

const loadReports = () => {
  try {
    const REPORTS_KEY = getReportsKey();
    const raw = localStorage.getItem(REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export default function Reports() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const childIdFilter = params.get('childId') || '';

  const [reports] = useState(() => loadReports());

  const filtered = useMemo(() => {
    return childIdFilter ? reports.filter(r => r.childId === childIdFilter) : reports;
  }, [reports, childIdFilter]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
            No reports yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">{r.childName || 'Unknown Child'}</h3>
                  <span className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-3 text-gray-700">
                  <p><span className="font-semibold">Tool:</span> {r.tool}</p>
                  <p><span className="font-semibold">Prediction:</span> {r.prediction}</p>
                  {typeof r.confidence === 'number' && (
                    <p><span className="font-semibold">Confidence:</span> {(r.confidence * 100).toFixed(2)}%</p>
                  )}
                  {r.notes && (
                    <p className="mt-2 whitespace-pre-wrap"><span className="font-semibold">Notes:</span> {r.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}