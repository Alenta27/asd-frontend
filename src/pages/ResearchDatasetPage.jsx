import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaDatabase, FaDownload, FaUpload, FaTrash, FaEye, FaChartBar } from 'react-icons/fa';

const ResearchDatasetPage = () => {
  const datasets = [
    { id: 1, name: 'ASD Image Dataset v2.1', type: 'Images', size: '2.3 GB', records: 12480, lastUpdated: '2024-01-15', status: 'Active' },
    { id: 2, name: 'Questionnaire Responses v1.8', type: 'Text', size: '850 MB', records: 9050, lastUpdated: '2024-01-14', status: 'Active' },
    { id: 3, name: 'Speech Samples v1.5', type: 'Audio', size: '1.2 GB', records: 4210, lastUpdated: '2024-01-13', status: 'Active' },
    { id: 4, name: 'Behavioral Observations v1.2', type: 'Text', size: '320 MB', records: 2150, lastUpdated: '2024-01-12', status: 'Archived' },
    { id: 5, name: 'Demographic Data v2.0', type: 'Structured', size: '45 MB', records: 8900, lastUpdated: '2024-01-11', status: 'Active' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Archived': return 'bg-gray-100 text-gray-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Images': return 'bg-blue-100 text-blue-800';
      case 'Text': return 'bg-green-100 text-green-800';
      case 'Audio': return 'bg-purple-100 text-purple-800';
      case 'Structured': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/research" className="text-gray-600 hover:text-gray-800">
              <FaArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dataset Management</h1>
              <p className="text-gray-600">Manage and analyze research datasets</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-600 rounded-full p-3 mr-4">
                <FaDatabase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500">Total Datasets</p>
                <p className="text-2xl font-bold">{datasets.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-green-100 text-green-600 rounded-full p-3 mr-4">
                <FaChartBar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500">Total Records</p>
                <p className="text-2xl font-bold">{datasets.reduce((sum, dataset) => sum + dataset.records, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-purple-100 text-purple-600 rounded-full p-3 mr-4">
                <FaDatabase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500">Total Size</p>
                <p className="text-2xl font-bold">4.7 GB</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-orange-100 text-orange-600 rounded-full p-3 mr-4">
                <FaDatabase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500">Active Datasets</p>
                <p className="text-2xl font-bold">{datasets.filter(d => d.status === 'Active').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dataset Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Datasets ({datasets.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dataset Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {datasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaDatabase className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{dataset.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(dataset.type)}`}>
                        {dataset.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dataset.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dataset.records.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dataset.lastUpdated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(dataset.status)}`}>
                        {dataset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        <FaEye />
                      </button>
                      <button className="text-green-600 hover:text-green-900 mr-3">
                        <FaDownload />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <FaTrash />
                      </button>
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

export default ResearchDatasetPage;
