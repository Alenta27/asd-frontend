import React, { useState, useEffect } from 'react';
import { checkAuthStatus, testBackendAuth } from '../utils/authDebug';

const AuthDebugPanel = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Run auth check on mount
    const hasToken = checkAuthStatus();
    setAuthStatus(hasToken);
  }, []);

  const handleTestAuth = async () => {
    setTestResult('Testing...');
    const result = await testBackendAuth();
    setTestResult(result ? 'Success ✅' : 'Failed ❌');
  };

  const handleCreateOrder = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('No token found. Please login first.');
      return;
    }

    try {
      console.log('Testing create-order endpoint...');
      const response = await fetch('http://localhost:5000/api/subscription/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (response.ok) {
        alert('✅ Order created successfully!\nOrder ID: ' + data.id);
      } else {
        alert('❌ Failed to create order\n' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Request failed: ' + error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'white',
      border: '2px solid #ccc',
      borderRadius: 10,
      padding: 20,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      maxWidth: 300
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: 16 }}>🔐 Auth Debug Panel</h3>
      
      <div style={{ marginBottom: 10 }}>
        <strong>Token Status:</strong>{' '}
        <span style={{ color: authStatus ? 'green' : 'red' }}>
          {authStatus ? '✅ Found' : '❌ Missing'}
        </span>
      </div>

      <button 
        onClick={handleTestAuth}
        style={{
          width: '100%',
          padding: '8px 12px',
          marginBottom: 8,
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
          fontSize: 14
        }}
      >
        Test Backend Auth
      </button>

      <button 
        onClick={handleCreateOrder}
        style={{
          width: '100%',
          padding: '8px 12px',
          marginBottom: 8,
          background: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
          fontSize: 14
        }}
      >
        Test Create Order
      </button>

      <button 
        onClick={() => checkAuthStatus()}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
          fontSize: 14
        }}
      >
        Check Console
      </button>

      {testResult && (
        <div style={{ 
          marginTop: 10, 
          padding: 8, 
          background: '#f0f0f0', 
          borderRadius: 5,
          fontSize: 12
        }}>
          {testResult}
        </div>
      )}
    </div>
  );
};

export default AuthDebugPanel;
