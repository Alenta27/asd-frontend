import React, { useState } from 'react';
import { X, Check, Shield, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { isTokenValid, isTokenExpired, clearAuthData, decodeToken } from '../utils/tokenUtils';
import { sanitizeUserObject } from '../utils/subscriptionUtils';

const SubscriptionModal = ({ isOpen, onClose, onUpgrade, autoStart = false, childId }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Auto-trigger payment flow if speechParentId exists and autoStart is true
  React.useEffect(() => {
    if (isOpen && autoStart && localStorage.getItem('speechParentId')) {
      handleUnlockClick();
    }
  }, [isOpen, autoStart]);

  if (!isOpen) return null;

  const handleUnlockClick = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const speechParentId = localStorage.getItem('speechParentId');
      let token = localStorage.getItem('token');
      
      // Validate token - if invalid/expired, clear it
      if (token && !isTokenValid(token)) {
        console.warn('Token is expired or invalid, clearing it');
        clearAuthData();
        token = null;
      }
      
      if (!speechParentId && !token) {
        setIsProcessing(false);
        setError('Please create a Speech Therapy profile to continue');
        return;
      }

      // CRITICAL: Validate childId is provided
      if (!childId) {
        setIsProcessing(false);
        setError('Please select a child profile before upgrading');
        return;
      }

      // Fetch parent info if we only have speechParentId
      let parentName = 'Parent';
      let parentEmail = '';
      
      if (speechParentId) {
        try {
          const res = await axios.get(`http://localhost:5000/api/speech-therapy/parent-status/${speechParentId}`);
          parentName = res.data.parent.parentName;
          parentEmail = res.data.parent.parentEmail;
        } catch (e) {
          console.error('Failed to fetch parent info for payment prefill');
        }
      } else if (token) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        parentName = user.username || 'User';
        parentEmail = user.email || '';
      }

      console.log('✓ Authorization check passed. Creating Razorpay order...');
      
      const orderConfig = {
        headers: { 'Content-Type': 'application/json' }
      };
      
      const orderData = {
        email: parentEmail,
        name: parentName,
        isSpeechOnly: !!speechParentId
      };
      
      const { data: order } = await axios.post('http://localhost:5000/api/subscription/create-order', orderData, orderConfig);

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      if (!order.key) {
        throw new Error('Razorpay configuration error. Please contact support.');
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'Speech Therapy Pro',
        description: 'Annual Subscription - 7 Day Free Trial + ₹999/year',
        image: '/logo192.png',
        order_id: order.id,
        handler: async (response) => {
          try {
            console.log('✓ Payment successful, verifying...');
            
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              childId: childId,
              parentId: speechParentId
            };

            console.log('Sending verification request with:', { childId, parentId: speechParentId });

            // Verify Payment on Backend
            const { data: verificationResult } = await axios.post('http://localhost:5000/api/subscription/verify-payment', verifyData, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            console.log('✓ Payment verified successfully!', verificationResult);
            
            if (!verificationResult.success) {
              throw new Error(verificationResult.message || 'Verification failed');
            }
            
            setIsSuccess(true);
            setIsProcessing(false);
            
            setTimeout(() => {
              // Pass verification result to parent component
              onUpgrade(verificationResult);
              onClose();
              setIsSuccess(false);
            }, 2000);
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            setError(verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed. Please contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: parentName,
          email: parentEmail,
          contact: ''
        },
        theme: {
          color: '#58cc02',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (err) {
      console.error('Payment Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initiate payment.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-[90%] max-w-[460px]">
        {isSuccess ? (
          // Success State
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-[#58cc02] rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
              <Check size={40} className="text-white" strokeWidth={4} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Payment Successful!</h3>
            <p className="text-gray-500 font-bold">Welcome to Speech Therapy Pro!</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-center text-white rounded-t-3xl">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                <Sparkles size={32} className="text-yellow-300 fill-yellow-300" />
              </div>
              
              <h2 className="text-2xl font-black mb-3 leading-tight">
                Speech Therapy Pro
              </h2>
              <p className="text-white/90 text-sm font-medium">
                Unlock unlimited AI-powered speech practice
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Features */}
              <div className="mb-6 space-y-3">
                <FeatureItem text="✨ Unlimited Practice Sessions" />
                <FeatureItem text="🎯 AI-Powered Feedback" />
                <FeatureItem text="📊 Detailed Progress Reports" />
                <FeatureItem text="🌐 Multilingual Support" />
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-5 mb-6 border-2 border-green-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Annual Plan</p>
                    <p className="text-3xl font-black text-gray-900">₹999<span className="text-sm text-gray-500">/year</span></p>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase">
                      7-Day Free Trial
                    </div>
                    <p className="text-xs text-gray-500 font-bold mt-1">Cancel anytime</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button 
                onClick={handleUnlockClick}
                disabled={isProcessing}
                className="w-full bg-[#58cc02] hover:bg-[#46a302] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl shadow-[0_4px_0_0_#46a302] active:shadow-none active:translate-y-1 transition-all text-lg uppercase tracking-wide flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Opening Razorpay...
                  </>
                ) : (
                  "Unlock Everything"
                )}
              </button>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-red-600 text-xs font-bold">{error}</p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 flex justify-center gap-4 text-gray-400 text-xs font-bold">
                <div className="flex items-center gap-1">
                  <Shield size={12} />
                  <span>Secure Payment</span>
                </div>
                <span>•</span>
                <span>Powered by Razorpay</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const FeatureItem = ({ text }) => (
  <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
    <span>{text}</span>
  </div>
);

export default SubscriptionModal;
