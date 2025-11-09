import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaHeart, FaLightbulb, FaUsers, FaStar } from 'react-icons/fa';

const LearnMorePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/how-it-works" className="text-gray-600 hover:text-gray-800">
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Understanding Developmental Conditions</h1>
            <p className="text-gray-600 mt-2">A supportive guide for parents and caregivers</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center">
            <FaHeart className="text-pink-500 text-4xl mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Every Child is Unique and Special</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              As parents and caregivers, understanding developmental conditions helps us provide the best support for our children. 
              This guide offers clear, compassionate information about common conditions, their signs, and how early support can make a meaningful difference.
            </p>
          </div>
        </div>

        {/* Autism Spectrum Disorder */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Autism Spectrum Disorder (ASD)</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">What is ASD?</h3>
              <p className="text-gray-600 leading-relaxed">
                Autism Spectrum Disorder is a developmental condition that affects how a person communicates, interacts with others, 
                and experiences the world around them. It's called a "spectrum" because it affects each person differently, with varying strengths and challenges.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Common Signs to Look For</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Social Communication:</h4>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Difficulty making eye contact</li>
                    <li>• Challenges with back-and-forth conversation</li>
                    <li>• Limited sharing of interests or emotions</li>
                    <li>• Difficulty understanding social cues</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Behavioral Patterns:</h4>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Repetitive movements or speech</li>
                    <li>• Strong interest in specific topics</li>
                    <li>• Sensitivity to sounds, lights, or textures</li>
                    <li>• Preference for routines and structure</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Unique Strengths</h3>
              <p className="text-gray-600 leading-relaxed">
                Children with ASD often have remarkable abilities, including exceptional memory, attention to detail, 
                creative thinking, and deep knowledge in areas of interest. Many excel in visual learning, pattern recognition, and honest, direct communication.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Supportive Approach</h4>
              <p className="text-blue-700 text-sm">
                Early intervention, structured learning environments, and celebrating your child's unique strengths can help them thrive and reach their full potential.
              </p>
            </div>
          </div>
        </div>

        {/* ADHD */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <FaLightbulb className="text-green-600 text-xl" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Attention-Deficit/Hyperactivity Disorder (ADHD)</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">What is ADHD?</h3>
              <p className="text-gray-600 leading-relaxed">
                ADHD is a condition that affects a child's ability to focus, control impulses, and manage their energy levels. 
                It's not about being "lazy" or "naughty" – it's about how the brain processes information and manages attention.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Common Signs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Inattention:</h4>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Difficulty staying focused on tasks</li>
                    <li>• Easily distracted by surroundings</li>
                    <li>• Forgetfulness in daily activities</li>
                    <li>• Trouble organizing tasks</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Hyperactivity:</h4>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Constant movement or fidgeting</li>
                    <li>• Difficulty sitting still</li>
                    <li>• Excessive talking</li>
                    <li>• High energy levels</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Impulsivity:</h4>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Acting without thinking</li>
                    <li>• Interrupting conversations</li>
                    <li>• Difficulty waiting turns</li>
                    <li>• Making quick decisions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Positive Aspects</h3>
              <p className="text-gray-600 leading-relaxed">
                Children with ADHD often have incredible creativity, enthusiasm, and energy. They can be innovative thinkers, 
                natural leaders, and bring excitement and spontaneity to any situation. Their ability to think outside the box is often remarkable.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">💡 Supportive Approach</h4>
              <p className="text-green-700 text-sm">
                Structure, clear expectations, regular breaks, and positive reinforcement can help children with ADHD succeed in learning and daily activities.
              </p>
            </div>
          </div>
        </div>

        {/* Down Syndrome */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-full">
              <FaStar className="text-purple-600 text-xl" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Down Syndrome</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">What is Down Syndrome?</h3>
              <p className="text-gray-600 leading-relaxed">
                Down Syndrome is a genetic condition that occurs when a person has an extra copy of chromosome 21. 
                This affects how the body and brain develop, but it doesn't define who a person is or what they can achieve.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Common Characteristics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Physical Features:</h4>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Almond-shaped eyes</li>
                    <li>• Smaller stature</li>
                    <li>• Low muscle tone</li>
                    <li>• Single crease across palm</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Developmental Aspects:</h4>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Slower development in some areas</li>
                    <li>• Learning differences</li>
                    <li>• Strong social skills</li>
                    <li>• Unique learning style</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Amazing Strengths</h3>
              <p className="text-gray-600 leading-relaxed">
                Children with Down Syndrome often have wonderful social skills, empathy, and determination. They can learn, 
                work, and lead fulfilling lives. Many excel in areas like music, art, sports, and building meaningful relationships.
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">💡 Supportive Approach</h4>
              <p className="text-purple-700 text-sm">
                Early intervention, inclusive education, and celebrating each milestone helps children with Down Syndrome reach their full potential and live happy, independent lives.
              </p>
            </div>
          </div>
        </div>

        {/* Asperger's Syndrome */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-100 p-3 rounded-full">
              <FaUsers className="text-orange-600 text-xl" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Asperger's Syndrome</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">What is Asperger's Syndrome?</h3>
              <p className="text-gray-600 leading-relaxed">
                Asperger's Syndrome is part of the autism spectrum, typically involving challenges with social interaction and communication, 
                along with restricted and repetitive patterns of behavior. Many people with Asperger's have average or above-average intelligence.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Common Characteristics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Social Challenges:</h4>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Difficulty understanding social cues</li>
                    <li>• Challenges with small talk</li>
                    <li>• Preference for routine conversations</li>
                    <li>• Difficulty with group dynamics</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Unique Strengths:</h4>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Deep knowledge in areas of interest</li>
                    <li>• Excellent attention to detail</li>
                    <li>• Strong logical thinking</li>
                    <li>• Honest and direct communication</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Remarkable Abilities</h3>
              <p className="text-gray-600 leading-relaxed">
                People with Asperger's often have exceptional abilities in their areas of interest, whether it's technology, 
                science, art, or any other field. They can be incredibly focused, detail-oriented, and bring unique perspectives to problem-solving.
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">💡 Supportive Approach</h4>
              <p className="text-orange-700 text-sm">
                Understanding their unique perspective, providing clear communication, and supporting their interests can help individuals with Asperger's thrive in school, work, and relationships.
              </p>
            </div>
          </div>
        </div>

        {/* Encouragement Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-8 text-white text-center">
          <FaHeart className="text-4xl mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Remember, Every Child is Unique</h2>
          <p className="text-lg leading-relaxed mb-6">
            Early detection and supportive care can help every child shine. Whether your child has one of these conditions or not, 
            understanding developmental differences helps us create a more inclusive and supportive world for all children.
          </p>
          <p className="text-xl font-medium">
            "Every child is unique, and early support can help them shine."
          </p>
        </div>

        {/* Resources */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Professional Support</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Pediatricians and developmental specialists</li>
                <li>• Speech and language therapists</li>
                <li>• Occupational therapists</li>
                <li>• Educational psychologists</li>
                <li>• Support groups for families</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Next Steps</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Schedule a professional evaluation</li>
                <li>• Connect with local support services</li>
                <li>• Learn about early intervention programs</li>
                <li>• Build a support network</li>
                <li>• Celebrate your child's strengths</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Screening */}
        <div className="text-center mt-8">
          <Link 
            to="/screening-tools" 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Your Screening Journey
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LearnMorePage;
