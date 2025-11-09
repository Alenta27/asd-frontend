import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaFileMedicalAlt, FaHistory } from 'react-icons/fa';

// Mock data - later this will come from your database
const childrenProfiles = [
  { id: 1, name: 'Alex', age: 4 },
  { id: 2, name: 'Bella', age: 5 },
];

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Parent Dashboard</h1>
          <button className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
            <FaUserPlus className="mr-2" /> Add Child
          </button>
        </div>

        {/* Child Profiles Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {childrenProfiles.map((child) => (
            <div key={child.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-700">{child.name}</h2>
              <p className="text-gray-500 mb-4">Age: {child.age}</p>
              <div className="border-t pt-4 mt-auto space-y-3">
                <Link to="/screening" className="w-full">
                  <button className="w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-600 transition flex items-center justify-center">
                    <FaFileMedicalAlt className="mr-2" /> Start New Screening
                  </button>
                </Link>
                <button className="w-full bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition flex items-center justify-center">
                  <FaHistory className="mr-2" /> View History
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Placeholder for when no children are added */}
        {childrenProfiles.length === 0 && (
            <div className="text-center bg-white p-12 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-700">No Child Profiles Found</h2>
                <p className="text-gray-500 mt-2 mb-6">Click 'Add Child' to create a profile and begin screening.</p>
                <button className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center mx-auto">
                    <FaUserPlus className="mr-2" /> Add Your First Child
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default DashboardPage;