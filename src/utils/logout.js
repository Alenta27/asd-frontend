export const handleLogout = (navigate) => {
  // Clear all localStorage items related to authentication and user data
  localStorage.removeItem('token');
  
  // Clear any cached user-specific data
  const token = localStorage.getItem('token');
  if (!token) {
    // Remove all keys that start with children_, students_, etc.
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('children_') || key.startsWith('user_') || key.startsWith('cache_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
  
  // Redirect to login page
  navigate('/login');
};
