export const handleLogout = (navigate) => {
  // Clear all localStorage items related to authentication and user data
  localStorage.clear();
  sessionStorage.clear();
  
  // Redirect to login page
  if (navigate) {
    navigate('/login');
    // Ensure state is reset by reloading
    window.location.reload();
  }
};
