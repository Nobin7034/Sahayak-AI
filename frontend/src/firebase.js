// Firebase initialization
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAV8m725BRO_l8HzB87fPMSrdyr0x_Uj8",
  authDomain: "nobinrajeev-dd51a.firebaseapp.com",
  projectId: "nobinrajeev-dd51a",
  storageBucket: "nobinrajeev-dd51a.firebasestorage.app",
  messagingSenderId: "998181795622",
  appId: "1:998181795622:web:f87ad62b5f3b5ffe58b3e7",
  measurementId: "G-VR9SEJ4S68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase Auth and Google provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;