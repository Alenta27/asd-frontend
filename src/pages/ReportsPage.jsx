import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';

// Placeholder data; replace with API results
const mockReports = [
  {
    id: 'r1',
    childId: 'demo-1',
    childName: 'Alex',
    date: '2025-05-10',
    summary: 'ASD screening indicates Medium risk concerns. Recommend professional assessment.',
    screeningResult: 'Medium Risk',
    therapyProgress: 'Improved eye contact and task completion over 4 weeks.',
    teacherNotes: 'Responds better with visual cues and structured routines.'
  },
  {
    id: 'r2',
    childId: 'demo-2',
    childName: 'Bella',
    date: '2025-05-20',
    summary: 'ADHD checklist suggests monitoring and teacher feedback.',
    screeningResult: 'Needs Monitoring',
    therapyProgress: '',
    teacherNotes: 'Shows strong participation in one-on-one sessions.'
  },
];

const generatePDF = (reportData) => {
  const doc = new jsPDF();

  const studentName = reportData?.childName || 'N/A';
  const screeningResult = reportData?.screeningResult || reportData?.summary || 'N/A';
  const therapyProgress = reportData?.therapyProgress || 'Not available';
  const teacherNotes = reportData?.teacherNotes || reportData?.notes || 'Not available';
  const reportDate = reportData?.date ? new Date(reportData.date).toLocaleDateString() : 'N/A';

  let y = 20;
  const lineHeight = 8;
  const contentX = 14;
  const contentWidth = 182;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('ASD Screening Report', contentX, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Date: ${reportDate}`, contentX, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Student Name', contentX, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(studentName, contentX, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Screening Result', contentX, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const screeningLines = doc.splitTextToSize(String(screeningResult), contentWidth);
  doc.text(screeningLines, contentX, y);
  y += screeningLines.length * 6 + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Therapy Progress', contentX, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const therapyLines = doc.splitTextToSize(String(therapyProgress), contentWidth);
  doc.text(therapyLines, contentX, y);
  y += therapyLines.length * 6 + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Teacher Notes', contentX, y);
  y += lineHeight;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const notesLines = doc.splitTextToSize(String(teacherNotes), contentWidth);
  doc.text(notesLines, contentX, y);

  const filename = `asd-screening-report-${studentName.replace(/\s+/g, '-').toLowerCase() || 'student'}.pdf`;
  doc.save(filename);
};

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
                  <button
                    className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                    onClick={() => generatePDF(r)}
                  >
                    Download PDF
                  </button>
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