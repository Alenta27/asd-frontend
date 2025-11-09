import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import './PaymentPage.css';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Get payment details from state
  const paymentData = location.state?.paymentData;

  useEffect(() => {
    if (!paymentData) {
      navigate('/parent/appointments');
    }
  }, [paymentData, navigate]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setPaymentProcessing(true);
      setError(null);

      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay. Please check your internet connection.');
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount * 100, // Amount in paise
        currency: 'INR',
        order_id: paymentData.orderId,
        name: 'ASD Therapy Appointment',
        description: `Appointment with ${paymentData.therapistName} for ${paymentData.childName}`,
        image: '/logo.svg',
        handler: async (response) => {
          try {
            console.log('Payment response:', response);
            
            // Verify payment on backend
            const token = localStorage.getItem('token');
            const verifyResponse = await fetch('http://localhost:5000/api/parent/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                appointmentId: paymentData.appointmentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              console.log('Payment verified:', verifyData);
              setPaymentSuccess(true);
              
              // Redirect to appointments page after 2 seconds
              setTimeout(() => {
                navigate('/parent/appointments', { 
                  state: { successMessage: 'Appointment booked successfully!' }
                });
              }, 2000);
            } else {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verified but failed to confirm appointment: ' + err.message);
          }
        },
        prefill: {
          email: paymentData.parentEmail || '',
          contact: paymentData.parentPhone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setError('Payment cancelled by user');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('Payment failed:', response);
        setPaymentProcessing(false);
        setError(`Payment failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (err) {
      console.error('Error in payment process:', err);
      setPaymentProcessing(false);
      setError(err.message || 'An error occurred during payment');
    }
  };

  if (!paymentData) {
    return (
      <div className="payment-container">
        <div className="loading-state">
          <FiLoader className="loading-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="payment-container">
        <div className="payment-card payment-success">
          <div className="success-icon">
            <FiCheck className="icon" />
          </div>
          <h2>Payment Successful!</h2>
          <p>Your appointment has been confirmed.</p>
          <div className="appointment-summary">
            <p><strong>Child:</strong> {paymentData.childName}</p>
            <p><strong>Therapist:</strong> {paymentData.therapistName}</p>
            <p><strong>Date:</strong> {paymentData.appointmentDate}</p>
            <p><strong>Time:</strong> {paymentData.appointmentTime}</p>
            <p><strong>Amount Paid:</strong> ₹{paymentData.amount}</p>
          </div>
          <p className="redirect-text">Redirecting to appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      {/* Header */}
      <div className="payment-header">
        <button className="back-btn" onClick={() => navigate('/parent/appointments')}>
          <FiArrowLeft className="icon" />
          Back
        </button>
        <h1>Complete Your Payment</h1>
      </div>

      {/* Payment Card */}
      <div className="payment-card">
        {/* Appointment Summary */}
        <div className="appointment-summary-section">
          <h2>Appointment Details</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <label>Child Name</label>
              <p>{paymentData.childName}</p>
            </div>
            <div className="summary-item">
              <label>Therapist</label>
              <p>{paymentData.therapistName}</p>
            </div>
            <div className="summary-item">
              <label>Date</label>
              <p>{paymentData.appointmentDate}</p>
            </div>
            <div className="summary-item">
              <label>Time</label>
              <p>{paymentData.appointmentTime}</p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="payment-summary-section">
          <h2>Payment Summary</h2>
          <div className="payment-breakdown">
            <div className="breakdown-item">
              <span>Appointment Fee</span>
              <span>₹{paymentData.amount}</span>
            </div>
            <div className="breakdown-divider"></div>
            <div className="breakdown-item total">
              <span>Total Amount</span>
              <span>₹{paymentData.amount}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <FiX className="icon" />
            <p>{error}</p>
          </div>
        )}

        {/* Payment Button */}
        <button
          className="pay-button"
          onClick={handlePayment}
          disabled={paymentProcessing}
        >
          {paymentProcessing ? (
            <>
              <FiLoader className="spinner" />
              Processing...
            </>
          ) : (
            `Pay ₹${paymentData.amount} with Razorpay`
          )}
        </button>

        {/* Payment Info */}
        <div className="payment-info">
          <p>🔒 Your payment is secure and encrypted</p>
          <p>Powered by Razorpay</p>
        </div>
      </div>

      {/* Security Badge */}
      <div className="security-badge">
        <p>✓ SSL Secure | ✓ PCI Compliant</p>
      </div>
    </div>
  );
};

export default PaymentPage;