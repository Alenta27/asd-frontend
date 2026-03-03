import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Your personal Client ID from the Google Cloud Console
const googleClientId = (process.env.REACT_APP_GOOGLE_CLIENT_ID || "3074679378-fbmg47osjqajq7u4cv0qja7svo00pv3m.apps.googleusercontent.com").trim();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* This provider makes Google Auth available to your entire app */}
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);


reportWebVitals();

