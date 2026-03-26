import React, { useState } from 'react';
import { X, User, Mail, Phone, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const ParentRegistrationModal = ({ isOpen, onClose, onSuccess }) => {
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!parentName.trim()) {
      errors.parentName = 'Name is required';
    } else if (parentName.trim().length < 3) {
      errors.parentName = 'Name must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!parentEmail.trim()) {
      errors.parentEmail = 'Email is required';
    } else if (!emailRegex.test(parentEmail.trim())) {
      errors.parentEmail = 'Invalid email format';
    }

    // Phone validation (Optional but must be valid if provided)
    if (phone.trim()) {
      const phoneRegex = /^\+?[\d\s-]{10,15}$/;
      if (!phoneRegex.test(phone.trim())) {
        errors.phone = 'Invalid phone format (10-15 digits)';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/speech-therapy/parent', {
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim().toLowerCase(),
        phone: phone.trim()
      });

      // Store parent info in localStorage
      localStorage.setItem('speech_parent', JSON.stringify({
        parentId: response.data.parentId,
        parentName,
        parentEmail,
        phone
      }));

      setIsSuccess(true);
      
      setTimeout(() => {
        onSuccess(response.data);
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Parent registration failed:', err);
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setParentName('');
    setParentEmail('');
    setPhone('');
    setError(null);
    setValidationErrors({});
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[440px] overflow-hidden border border-gray-100">
        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
              <CheckCircle size={40} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Welcome! 🎉</h3>
            <p className="text-gray-600 font-bold">Parent registered successfully</p>
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white">
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                <User size={32} className="text-white" />
              </div>

              <h2 className="text-2xl font-black mb-2 leading-tight">
                Parent Registration
              </h2>
              <p className="text-blue-100 text-sm font-medium">
                Register to unlock Malayalam, Hindi, and detailed progress tracking!
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
                  Your Name *
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${validationErrors.parentName ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => {
                      setParentName(e.target.value);
                      if (validationErrors.parentName) setValidationErrors(prev => ({...prev, parentName: null}));
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border-2 ${validationErrors.parentName ? 'border-red-200' : 'border-gray-100'} rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium`}
                    placeholder="Enter your full name"
                    disabled={isSubmitting}
                  />
                </div>
                {validationErrors.parentName && <p className="mt-1 text-xs text-red-500 font-bold ml-1">{validationErrors.parentName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${validationErrors.parentEmail ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => {
                      setParentEmail(e.target.value);
                      if (validationErrors.parentEmail) setValidationErrors(prev => ({...prev, parentEmail: null}));
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border-2 ${validationErrors.parentEmail ? 'border-red-200' : 'border-gray-100'} rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium`}
                    placeholder="your.email@example.com"
                    disabled={isSubmitting}
                  />
                </div>
                {validationErrors.parentEmail && <p className="mt-1 text-xs text-red-500 font-bold ml-1">{validationErrors.parentEmail}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 ${validationErrors.phone ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (validationErrors.phone) setValidationErrors(prev => ({...prev, phone: null}));
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border-2 ${validationErrors.phone ? 'border-red-200' : 'border-gray-100'} rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium`}
                    placeholder="+1 (555) 123-4567"
                    disabled={isSubmitting}
                  />
                </div>
                {validationErrors.phone && <p className="mt-1 text-xs text-red-500 font-bold ml-1">{validationErrors.phone}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <User size={20} />
                    Register as Parent
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

export default ParentRegistrationModal;
