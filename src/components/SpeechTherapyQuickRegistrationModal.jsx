import React, { useState } from 'react';
import axios from 'axios';
import { X, User, Mail, Globe, Baby, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { sanitizeUserObject } from '../utils/subscriptionUtils';

const SpeechTherapyQuickRegistrationModal = ({ isOpen, onClose, onSuccess, isForPayment = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [childName, setChildName] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Call backend to save parent info and get speechParentId
      const response = await axios.post('http://localhost:5000/api/speech-therapy/parent-info', {
        name,
        email
      });

      const { speechParentId, parentName } = response.data;

      // Create speech user profile locally
      const speechUser = {
        parentName: parentName,
        email: email,
        speechParentId: speechParentId,
        childName: childName || '',
        preferredLanguage: language,
        createdAt: new Date().toISOString()
      };

      // Store in localStorage as per requirements
      localStorage.setItem('speech_user', JSON.stringify(sanitizeUserObject(speechUser)));
      localStorage.setItem('speechParentId', speechParentId);

      // If childName was provided, create the child profile too
      if (childName) {
        try {
          await axios.post('http://localhost:5000/api/speech-therapy/children', {
            name: childName,
            age: 5, // Default age
            preferredLanguage: language,
            parentId: speechParentId
          });
        } catch (childErr) {
          console.error('Failed to create initial child profile:', childErr);
          // Don't stop the main flow if child creation fails
        }
      }
      
      setIsSuccess(true);
      
      // Simulate a small delay for better UX
      setTimeout(() => {
        onSuccess(speechUser);
        setIsSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Quick registration failed:', err);
      setError(err.response?.data?.error || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden border border-gray-100">
        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
              <CheckCircle size={40} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Registration Successful!</h3>
            <p className="text-gray-600 font-bold">{isForPayment ? 'Redirecting to payment...' : 'Saving your profile...'}</p>
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                <User size={32} className="text-white" />
              </div>

              <h2 className="text-2xl font-black mb-2 leading-tight">
                Speech Therapy Profile
              </h2>
              <p className="text-blue-100 text-sm font-medium">
                {isForPayment ? 'Create a quick profile to continue to payment' : 'Create a profile to save your progress'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Parent Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Child Name (Optional)</label>
                <div className="relative">
                  <Baby className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="Child's first name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Preferred Language</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium appearance-none"
                  >
                    <option value="en-US">English</option>
                    <option value="ml-IN">Malayalam</option>
                    <option value="hi-IN">Hindi</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
                  <p className="text-red-600 text-xs font-bold">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl shadow-[0_4px_0_0_#1d4ed8] active:shadow-none active:translate-y-1 transition-all text-lg uppercase tracking-wide flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    {isForPayment ? 'Continue to Payment' : 'Save Profile'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SpeechTherapyQuickRegistrationModal;
