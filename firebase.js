import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZiuZtEUV5xsgZpOMt1NHB1_dQKp1AaSs",
  authDomain: "cloud-beacon-55a40.firebaseapp.com",
  projectId: "cloud-beacon-55a40",
  storageBucket: "cloud-beacon-55a40.firebasestorage.app",
  messagingSenderId: "618572521118",
  appId: "1:618572521118:web:ea76f53d16d8cf9ade258f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);