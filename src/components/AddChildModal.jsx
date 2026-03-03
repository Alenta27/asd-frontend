import React, { useState } from 'react';
import { X, Baby, User, Calendar, Globe, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const AddChildModal = ({ isOpen, onClose, onSuccess, parentId }) => {
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en-US');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const languages = [
    { code: 'en-US', name: 'English (Free)', flag: '🇺🇸', isFree: true },
    { code: 'ml-IN', name: 'മലയാളം (Malayalam) - PRO', flag: '🇮🇳', isFree: false },
    { code: 'hi-IN', name: 'हिंदी (Hindi) - PRO', flag: '🇮🇳', isFree: false }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!parentId) {
        setError('Parent ID is missing. Please register as parent first.');
        setIsSubmitting(false);
        return;
      }

      const response = await axios.post('http://localhost:5000/api/speech-therapy/child', {
        childName,
        age: parseInt(age),
        preferredLanguage,
        parentId
      });

      setIsSuccess(true);
      
      setTimeout(() => {
        onSuccess(response.data.child);
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to create child profile:', err);
      setError(err.response?.data?.error || 'Failed to create child profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setChildName('');
    setAge('');
    setPreferredLanguage('en-US');
    setError(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden border border-gray-100">
        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
              <CheckCircle size={40} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Child Registered! 🎉</h3>
            <p className="text-gray-600 font-bold">Adding to your list...</p>
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-8 text-center text-white">
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                <Baby size={32} className="text-white" />
              </div>

              <h2 className="text-2xl font-black mb-2 leading-tight">
                Add Your Child
              </h2>
              <p className="text-purple-100 text-sm font-medium">
                Register a child for speech therapy
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                  Child's Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="Enter child's name"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                  Age *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    required
                    min="1"
                    max="18"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="Child's age"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                  Preferred Language *
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:bg-white outline-none transition-all font-medium appearance-none"
                    disabled={isSubmitting}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-xs text-gray-500 ml-1">
                  💡 English is free. Malayalam & Hindi require PRO subscription.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-base rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Baby size={20} />
                    Register Child
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

export default AddChildModal;
