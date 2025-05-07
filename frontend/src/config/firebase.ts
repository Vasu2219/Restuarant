import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAGIfdk4h3lFeGrmaSfWTdEDHUbHMxmUdI",
  authDomain: "resturant-4df6e.firebaseapp.com",
  projectId: "resturant-4df6e",
  storageBucket: "resturant-4df6e.firebasestorage.app",
  messagingSenderId: "928465874974",
  appId: "1:928465874974:web:266d950dae9fb2d4483e0f",
  measurementId: "G-3QN3LG1600"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app; 