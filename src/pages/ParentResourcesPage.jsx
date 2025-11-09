import React, { useState } from 'react';
import { FaArrowLeft, FaBook, FaSearch, FaFile, FaFilePdf, FaVideo, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ParentResourcesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const resources = [
    {
      id: 1,
      title: "Understanding Your Child's Diagnosis",
      category: 'Understanding ASD',
      type: 'PDF Guide',
      description: 'Comprehensive guide to understanding ASD diagnosis and what to expect.',
      icon: FaFilePdf,
      url: 'https://www.autismspeaks.org/sites/default/files/2018-08/100_day_kit.pdf',
    },
    {
      id: 2,
      title: 'Early Intervention Strategies',
      category: 'Therapy Strategies',
      type: 'Article',
      description: 'Evidence-based strategies for early intervention in young children with ASD.',
      icon: FaFile,
      url: 'https://www.cdc.gov/ncbddd/autism/features/understanding-early-intervention.html',
    },
    {
      id: 3,
      title: 'Introduction to Sensory Processing',
      category: 'Understanding ASD',
      type: 'Video',
      description: 'Visual guide explaining sensory processing differences in autism.',
      icon: FaVideo,
      url: 'https://www.youtube.com/watch?v=d7xSLugA9XY',
    },
    {
      id: 4,
      title: 'Speech & Language Development Tips',
      category: 'Therapy Strategies',
      type: 'Guide',
      description: 'Practical tips for supporting language development at home.',
      icon: FaFile,
      url: 'https://www.autismspeaks.org/tool-kit/skills-language-development',
    },
    {
      id: 5,
      title: 'Local Autism Support Groups',
      category: 'Local Support Groups',
      type: 'Directory',
      description: 'Directory of local support groups and parent networks.',
      icon: FaMapMarkerAlt,
      url: 'https://www.autismsociety.org/find-support/',
    },
    {
      id: 6,
      title: 'Parental Wellness & Self-Care',
      category: 'Parental Wellness Guides',
      type: 'Article',
      description: 'Resources for managing stress and maintaining wellness as a parent of a child with ASD.',
      icon: FaFile,
      url: 'https://childmind.org/article/self-care-for-parents-of-children-with-special-needs/',
    },
  ];

  const categories = ['All', 'Understanding ASD', 'Therapy Strategies', 'Local Support Groups', 'Parental Wellness Guides'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredResources = resources.filter(r => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-200 shadow-lg flex flex-col overflow-hidden">
        <div className="p-6 border-b border-blue-300 flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 transition"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-blue-800">CORTEXA</h1>
            <p className="text-xs text-blue-600">ASD Detection & Support</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-800">Resource Library</h1>
          <p className="text-gray-600 text-sm mt-1">Curated support materials and vetted information</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="space-y-8 max-w-5xl">
            {/* Search Bar */}
            <div className="relative">
              <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for articles, videos, or local support..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-blue-400 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.length > 0 ? (
                filteredResources.map((resource) => {
                  const Icon = resource.icon;
                  return (
                    <div
                      key={resource.id}
                      className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-400 hover:shadow-lg transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-blue-600">
                          <Icon size={24} />
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {resource.type}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 mb-2">{resource.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{resource.description}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-xs font-semibold text-gray-600">{resource.category}</span>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-pink-200 text-pink-800 rounded-lg hover:bg-pink-300 transition font-semibold text-xs"
                        >
                          Access
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600 text-lg">No resources found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentResourcesPage;
