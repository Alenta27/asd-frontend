import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace these placeholders with your actual Firebase project credentials.
// You can find these in your Firebase project's settings.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize your Firebase app
const app = initializeApp(firebaseConfig);

// Export the auth instance so your login page can use it
export const auth = getAuth(app);

