import React from 'react';
import { Link } from 'react-router-dom';

const tools = [
  {
    id: 'asd',
    name: 'ASD Screening',
    description: 'Parent-friendly questionnaires and observation-based checklists for Autism Spectrum Disorder.',
    color: 'bg-rose-600 hover:bg-rose-700',
  },
  {
    id: 'adhd',
    name: 'ADHD Screening',
    description: 'Attention and behavior checklists tailored to different age groups.',
    color: 'bg-amber-600 hover:bg-amber-700',
  },
  {
    id: 'down',
    name: 'Down Syndrome Developmental Checks',
    description: 'Milestone tracking and developmental follow-up prompts.',
    color: 'bg-emerald-600 hover:bg-emerald-700',
  },
];

export default function ScreeningToolsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Screening Tools</h1>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800">Back to Dashboard</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow p-6 flex flex-col">
              <h2 className="text-xl font-semibold text-gray-800">{t.name}</h2>
              <p className="text-gray-600 mt-2 flex-1">{t.description}</p>
              <div className="mt-6 flex gap-3">
                <Link to="/screening" className={`text-white px-4 py-2 rounded-lg ${t.color}`}>Start</Link>
                <button className="px-4 py-2 rounded-lg border hover:bg-gray-50" disabled>Learn More</button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-6">Note: Tool content is illustrative. Integrate with your backend screening flows as needed.</p>
      </div>
    </div>
  );
}