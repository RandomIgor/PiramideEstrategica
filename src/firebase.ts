import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyACn-QKEapDAWDvmKoDqd_ssdz4fyPZHCY",
  authDomain: "piramidesestrategicas.firebaseapp.com",
  projectId: "piramidesestrategicas",
  storageBucket: "piramidesestrategicas.firebasestorage.app",
  messagingSenderId: "932836807668",
  appId: "1:932836807668:web:740d2fe6b9fd44a3519fa1",
  measurementId: "G-76KGF7R987"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
