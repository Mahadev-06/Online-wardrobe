import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRriL0XNkFd9PCqbfrspFzApAXTc1172A",
  authDomain: "online-wardrobe-c8ff4.firebaseapp.com",
  projectId: "online-wardrobe-c8ff4",
  storageBucket: "online-wardrobe-c8ff4.firebasestorage.app",
  messagingSenderId: "431068080048",
  appId: "1:431068080048:web:69c269dcff7a7a32579875",
  measurementId: "G-7QQM3V0JLJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Analytics initialization failed", e);
}

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, analytics };
export default app;