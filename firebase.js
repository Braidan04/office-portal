
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9iRRgcAx0qSGVX-bFMBjUh2xyDmIgbGI",
  authDomain: "office-portal-client.firebaseapp.com",
  projectId: "office-portal-client",
  storageBucket: "office-portal-client.firebasestorage.app",
  messagingSenderId: "969237062096",
  appId: "1:969237062096:web:5103a383c1f0436686d9d5",
  measurementId: "G-D579YP8T45"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
