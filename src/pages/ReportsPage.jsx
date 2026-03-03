import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// Placeholder data; replace with API results
const mockReports = [
  { id: 'r1', childId: 'demo-1', childName: 'Alex', date: '2025-05-10', summary: 'ASD screening indicates Medium risk concerns. Recommend professional assessment.' },
  { id: 'r2', childId: 'demo-2', childName: 'Bella', date: '2025-05-20', summary: 'ADHD checklist suggests monitoring and teacher feedback.' },
];

export default function ReportsPage() {
  const [params] = useSearchParams();
  const childId = params.get('childId');

  const filtered = useMemo(() => {
    if (!childId) return mockReports;
    return mockReports.filter(r => r.childId === childId);
  }, [childId]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800">Back to Dashboard</Link>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-700">No reports available yet.</p>
            <p className="text-sm text-gray-500 mt-2">Complete a screening to generate reports.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">{r.childName}</h2>
                  <p className="text-sm text-gray-500">{new Date(r.date).toLocaleDateString()}</p>
                </div>
                <p className="text-gray-700 mt-2">{r.summary}</p>
                <div className="mt-4 flex gap-3">
                  <button className="px-4 py-2 rounded-lg border hover:bg-gray-50" disabled>Download PDF</button>
                  <button className="px-4 py-2 rounded-lg border hover:bg-gray-50" disabled>Share</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}