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

  const handlePayment = async () => {
    try {
      setPaymentProcessing(true);
      setError(null);

      // Check if Razorpay SDK is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      if (!paymentData.keyId) {
        throw new Error('Razorpay configuration error. Please contact support.');
      }

      // Get user info for prefill
      const token = localStorage.getItem('token');
      let userName = 'User';
      let userEmail = paymentData.parentEmail || '';
      let userPhone = paymentData.parentPhone || '';

      try {
        const userResponse = await fetch('http://localhost:5000/api/parent/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userName = userData.username || 'User';
          userEmail = userData.email || userEmail;
          userPhone = userData.phone || userPhone;
        }
      } catch (e) {
        console.error('Failed to fetch user info for payment prefill');
      }

      // Create Razorpay options
      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount * 100, // Convert to paise
        currency: 'INR',
        name: 'Cortexa - ASD Detection',
        description: 'Appointment Booking Fee',
        image: '/logo192.png',
        order_id: paymentData.orderId,
        handler: async (response) => {
          try {
            console.log('✓ Payment successful, verifying...');
            
            // Verify payment on backend
            const verifyResponse = await fetch('http://localhost:5000/api/parent/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                appointmentId: paymentData.appointmentId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              console.log('✓ Payment verified successfully!', verifyData);
              setPaymentSuccess(true);
              setPaymentProcessing(false);
              
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
            setError('Payment verification failed: ' + err.message);
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setError('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
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
              Opening Razorpay...
            </>
          ) : (
            `Pay ₹${paymentData.amount}`
          )}
        </button>

        {/* Payment Info */}
        <div className="payment-info">
          <p>🔒 Secure payment powered by Razorpay</p>
          <p>All transactions are encrypted and secure</p>
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