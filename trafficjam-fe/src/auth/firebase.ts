import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAloDxmSqrRQRzrOkwthe-GbzFs6d4gJAQ",
  authDomain: "trafficjam-485220.firebaseapp.com",
  projectId: "trafficjam-485220",
  storageBucket: "trafficjam-485220.firebasestorage.app",
  messagingSenderId: "496084328125",
  appId: "1:496084328125:web:73ed26c4eec7339639e1d4",
  measurementId: "G-NH43P7XQ4T",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
