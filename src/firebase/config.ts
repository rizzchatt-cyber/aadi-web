import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCqhFVmnnFhC4OnLr698IzRNA31MvDLEbo",
    authDomain: "aditya-abe51.firebaseapp.com",
    projectId: "aditya-abe51",
    storageBucket: "aditya-abe51.firebasestorage.app",
    messagingSenderId: "726465840155",
    appId: "1:726465840155:web:2fae50a299f1c73a7464be",
    measurementId: "G-183F964K90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
