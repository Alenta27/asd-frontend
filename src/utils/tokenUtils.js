// JWT Token Validation Utilities

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - true if expired, false if valid
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded) return true;
  
  // Check if token has expiry
  if (!decoded.exp) {
    // No expiry means token is valid (shouldn't happen with proper JWT)
    return false;
  }
  
  // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
  const currentTime = Date.now() / 1000;
  const isExpired = currentTime >= decoded.exp;
  
  return isExpired;
};

/**
 * Check if JWT token is valid and not expired
 * @param {string} token - JWT token
 * @returns {boolean} - true if valid, false if expired or invalid
 */
export const isTokenValid = (token) => {
  if (!token) return false;
  
  const decoded = decodeToken(token);
  if (!decoded) return false;
  
  return !isTokenExpired(token);
};

/**
 * Get time remaining until token expires
 * @param {string} token - JWT token
 * @returns {number} - Seconds remaining, or -1 if expired/invalid
 */
export const getTokenTimeRemaining = (token) => {
  if (!token) return -1;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return -1;
  
  const currentTime = Date.now() / 1000;
  const timeRemaining = decoded.exp - currentTime;
  
  return Math.max(0, Math.floor(timeRemaining));
};

/**
 * Get user info from token
 * @param {string} token - JWT token
 * @returns {object|null} - User info (id, email, role) or null
 */
export const getUserFromToken = (token) => {
  if (!token) return null;
  
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    iat: decoded.iat ? new Date(decoded.iat * 1000) : null,
    exp: decoded.exp ? new Date(decoded.exp * 1000) : null
  };
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  console.log('Authentication data cleared');
};

/**
 * Check and log token status (for debugging)
 */
export const logTokenStatus = () => {
  const token = localStorage.getItem('token');
  
  console.group('🔐 Token Status');
  
  if (!token) {
    console.warn('No token found in localStorage');
    console.groupEnd();
    return;
  }
  
  const decoded = decodeToken(token);
  if (!decoded) {
    console.error('Failed to decode token');
    console.groupEnd();
    return;
  }
  
  const expired = isTokenExpired(token);
  const timeRemaining = getTokenTimeRemaining(token);
  
  console.log('Token found:', '✓');
  console.log('User ID:', decoded.id);
  console.log('Email:', decoded.email);
  console.log('Role:', decoded.role);
  console.log('Issued at:', new Date(decoded.iat * 1000).toLocaleString());
  console.log('Expires at:', new Date(decoded.exp * 1000).toLocaleString());
  console.log('Status:', expired ? '❌ EXPIRED' : '✓ Valid');
  
  if (!expired) {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    console.log('Time remaining:', `${hours}h ${minutes}m`);
  }
  
  console.groupEnd();
};
