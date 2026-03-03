import React, { useState } from 'react';
import { X, Loader2, User, Mail, Lock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { sanitizeUserObject } from '../utils/subscriptionUtils';

const SpeechUserRegistrationModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/speech-therapy/register-parent', {
        parentName: name,
        parentEmail: email,
        phone
      });
      
      const { speech_parent_id, parent } = response.data;
      
      localStorage.setItem('speechParentId', speech_parent_id);
      
      // Store lightweight profile for UI
      const speechUser = { 
        parentName: parent.parentName, 
        email: parent.parentEmail, 
        speechParentId: speech_parent_id,
        isSpeechOnly: true 
      };
      localStorage.setItem('speech_user', JSON.stringify(speechUser));

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(speechUser);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Failed to register profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden">
        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
              <CheckCircle size={40} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Profile Created!</h3>
            <p className="text-gray-500 font-bold">Your Speech Therapy parent profile is ready.</p>
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-br from-green-500 to-teal-600 p-6 text-center text-white">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-black mb-2 leading-tight">
                Parent Profile
              </h2>
              <p className="text-white/90 text-sm font-medium">
                Create a quick profile to manage your child's speech therapy.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Parent Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Phone (Optional)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="Enter phone number"
                  />
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
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl shadow-[0_4px_0_0_#15803d] active:shadow-none active:translate-y-1 transition-all text-lg uppercase tracking-wide flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : (
                  "Create Profile"
                )}
              </button>
              
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
                By registering, you agree to our terms of service
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SpeechUserRegistrationModal;
