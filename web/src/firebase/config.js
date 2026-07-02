import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "sis-course-sniper-bot.firebaseapp.com",
  projectId: "sis-course-sniper-bot",
  storageBucket: "sis-course-sniper-bot.firebasestorage.app",
  messagingSenderId: "770207795447",
  appId: "1:770207795447:web:03352f425ba2a7367a2bf2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
