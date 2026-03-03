// Utility to debug authentication issues

export const checkAuthStatus = () => {
  const token = localStorage.getItem('token');
  
  console.group('🔐 Auth Debug Info');
  console.log('Token exists:', !!token);
  
  if (token) {
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 30) + '...');
    
    // Try to decode JWT (without verification)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('Decoded payload:', payload);
        console.log('User ID:', payload.id);
        console.log('User role:', payload.role);
        console.log('Token issued:', new Date(payload.iat * 1000).toLocaleString());
        console.log('Token expires:', payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Never');
        
        // Check if expired
        if (payload.exp) {
          const isExpired = Date.now() >= payload.exp * 1000;
          console.log('Is expired:', isExpired);
          if (isExpired) {
            console.warn('⚠️ TOKEN IS EXPIRED! User needs to login again.');
          }
        }
      } else {
        console.error('Invalid JWT format');
      }
    } catch (e) {
      console.error('Failed to decode token:', e.message);
    }
  } else {
    console.warn('⚠️ No token found. User is not logged in.');
  }
  console.groupEnd();
  
  return !!token;
};

export const testBackendAuth = async () => {
  const token = localStorage.getItem('token');
  
  console.group('🧪 Testing Backend Authentication');
  
  if (!token) {
    console.error('❌ No token available for testing');
    console.groupEnd();
    return false;
  }
  
  try {
    console.log('Sending test request to /api/subscription/status...');
    const response = await fetch('http://localhost:5000/api/subscription/status', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Authentication working!');
      console.log('Current plan:', data.plan);
      console.log('Plan expiry:', data.planExpiry);
      console.log('Trial used:', data.trialUsed);
      console.groupEnd();
      return true;
    } else {
      console.error('❌ Authentication failed:', data.message);
      console.groupEnd();
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.groupEnd();
    return false;
  }
};
