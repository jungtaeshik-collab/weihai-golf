import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDc1cqwD3Tc7XeUwOrvOEV-PlNbUnIIPF8",
  authDomain: "weihai-golf.firebaseapp.com",
  projectId: "weihai-golf",
  storageBucket: "weihai-golf.firebasestorage.app",
  messagingSenderId: "106879634604",
  appId: "1:106879634604:web:a6397b37495ff310942309",
  measurementId: "G-4XX2YFXJ9S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
