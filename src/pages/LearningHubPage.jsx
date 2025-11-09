import React from 'react';
import { Link } from 'react-router-dom';

const topics = [
  {
    id: 'asd-basics',
    title: 'Understanding Autism Spectrum Disorder (ASD)',
    excerpt: 'Core traits, early signs, evidence-based interventions, and support strategies for home and school.',
    tags: ['ASD', 'Early Signs', 'Intervention'],
  },
  {
    id: 'adhd-tips',
    title: 'ADHD: Attention, Impulsivity, and Support at Home',
    excerpt: 'Practical routines, behavior supports, and collaboration tips with teachers.',
    tags: ['ADHD', 'Behavior', 'Routines'],
  },
  {
    id: 'down-syndrome',
    title: 'Down Syndrome: Milestones and Inclusive Learning',
    excerpt: 'Common developmental trajectories, speech and OT supports, and inclusive education guides.',
    tags: ['Down Syndrome', 'Milestones', 'Inclusion'],
  },
];

export default function LearningHubPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Learning Hub</h1>
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800">Back to Dashboard</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((t) => (
            <article key={t.id} className="bg-white rounded-xl shadow p-6 flex flex-col">
              <h2 className="text-xl font-semibold text-gray-800">{t.title}</h2>
              <p className="text-gray-600 mt-2 flex-1">{t.excerpt}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">{tag}</span>
                ))}
              </div>
              <button className="mt-5 px-4 py-2 rounded-lg border hover:bg-gray-50" disabled>Read Article</button>
            </article>
          ))}
        </div>

        <div className="mt-10 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800">Guides and Resources</h3>
          <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
            <li>Family-centered strategies for daily routines</li>
            <li>How to prepare for a clinical assessment</li>
            <li>Questions to ask your pediatrician or therapist</li>
          </ul>
        </div>
      </div>
    </div>
  );
}