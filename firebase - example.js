import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "your API key here",
  authDomain: "cloud-beacon-55a40.firebaseapp.com",
  projectId: "cloud-beacon-55a40",
  storageBucket: "cloud-beacon-55a40.firebasestorage.app",
  messagingSenderId: "Message sender id (12 digit number)",
  appId: "App ID here"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);