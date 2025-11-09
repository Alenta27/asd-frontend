import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const TherapistPendingApprovalPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('therapistId');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <FaClock className="text-3xl text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You for Your Application!</h1>
          <p className="text-gray-600 text-sm">Your registration is complete and pending approval</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            Your registration is complete. Your account is now <strong>pending approval</strong>.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            Our admin team is manually reviewing your submitted credentials (Doctoral Degree and License Number). This process typically takes <strong>1-3 business days</strong>.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">
            You will receive an email as soon as your account is activated. Until then, you will not be able to access the therapist dashboard.
          </p>
        </div>

        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <FaEnvelope className="text-green-600 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800 mb-1">Check Your Email</p>
            <p className="text-xs text-green-700">We've sent a confirmation email to the address you registered with. Keep an eye on your inbox for our approval notification.</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors mb-3"
        >
          <FaArrowLeft />
          Return to Login
        </button>

        <p className="text-center text-xs text-gray-500">
          Application Status: <span className="font-semibold text-yellow-600">Pending Review</span>
        </p>
      </div>
    </div>
  );
};

export default TherapistPendingApprovalPage;
