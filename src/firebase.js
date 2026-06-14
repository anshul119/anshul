import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCpkCYLIKfVjAo3Q7vfhH3eyelfZQL4YTc",
  authDomain: "anshul-art.firebaseapp.com",
  projectId: "anshul-art",
  storageBucket: "anshul-art.firebasestorage.app",
  messagingSenderId: "816756444698",
  appId: "1:816756444698:web:c002902ec635c0d0d48ba3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
