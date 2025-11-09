import React from 'react';

const articles = [
  {
    id: 'asd-basics',
    title: 'Understanding Autism Spectrum Disorder (ASD)',
    category: 'ASD',
    summary: 'Signs, early interventions, and support strategies for families.',
    link: 'https://www.cdc.gov/ncbddd/autism/index.html',
  },
  {
    id: 'adhd-guide',
    title: 'ADHD in Children: A Practical Guide for Parents',
    category: 'ADHD',
    summary: 'Symptoms, diagnosis, behavioral strategies, and school support.',
    link: 'https://www.cdc.gov/ncbddd/adhd/facts.html',
  },
  {
    id: 'down-syndrome-overview',
    title: 'Down Syndrome: Overview and Early Support',
    category: 'Down Syndrome',
    summary: 'Development, health, and inclusive learning tips.',
    link: 'https://www.ndss.org/about-down-syndrome/',
  },
  {
    id: 'parenting-resources',
    title: 'Evidence-based Parenting Resources',
    category: 'General',
    summary: 'Curated reputable links to get trustworthy information quickly.',
    link: 'https://www.aap.org/en/patient-care/',
  },
  {
    id: 'anxiety-disruptive-behavior',
    title: 'How Anxiety Can Lead to Disruptive Behavior',
    category: 'Classroom Strategy',
    summary: 'Child Mind Institute (Oct 24, 2024): Anxiety often hides behind oppositional or disruptive behavior. Learn classroom responses that calm rather than escalate.',
    link: 'https://childmind.org/article/how-anxiety-can-lead-to-disruptive-behavior/',
  },
  {
    id: 'visual-supports-afirm',
    title: 'Visual Supports (Evidence-Based Practice Module)',
    category: 'Evidence-Based Practice',
    summary: 'AFIRM (May 30, 2024): Step-by-step guidance for visual schedules, first/then boards, timers, and cues to boost predictability and reduce anxiety.',
    link: 'https://afirm.fpg.unc.edu/visual-supports',
  },
  {
    id: 'autistic-burnout-reframing',
    title: 'Autistic burnout: What is it and how to recover',
    category: 'Autistic Voices',
    summary: 'Reframing Autism (Aug 2, 2023): An Autistic-led explanation of burnout, masking, and recovery supports to better understand student experiences.',
    link: 'https://reframingautism.org.au/autistic-burnout-what-is-it-and-how-to-recover/',
  },
  {
    id: 'sensory-profile-inclusioned',
    title: 'Developing a sensory profile for your student',
    category: 'Sensory Support',
    summary: 'inclusionED (Jul 11, 2024): Practical educator guide for uncovering sensory preferences and tailoring classroom environments.',
    link: 'https://www.inclusioned.edu.au/practice/developing-sensory-profile-your-student',
  },
  {
    id: 'autism-speaks-school-toolkit',
    title: 'School Community Tool Kit',
    category: 'Inclusive Schools',
    summary: 'Autism Speaks (Jun 1, 2023): Comprehensive toolkit for school staff with actionable steps for inclusive, supportive campuses.',
    link: 'https://www.autismspeaks.org/tool-kit/school-community-tool-kit',
  },
];

export default function LearningHub() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Learning Hub</h1>
        <p className="text-gray-600 mb-6">Articles and guides on ASD, ADHD, and Down syndrome.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((a) => (
            <a key={a.id} href={a.link} target="_blank" rel="noreferrer" className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <div className="text-sm text-indigo-600 font-semibold">{a.category}</div>
              <h3 className="text-xl font-semibold text-gray-800 mt-1">{a.title}</h3>
              <p className="text-gray-600 mt-2 text-sm">{a.summary}</p>
              <div className="mt-3 text-indigo-600 text-sm font-medium">Read more →</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}