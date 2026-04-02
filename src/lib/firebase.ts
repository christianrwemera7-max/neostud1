// @/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "neostud",
  "appId": "1:479263153154:web:bb6dd85c9990a2b1bf5b1b",
  "storageBucket": "neostud.firebasestorage.app",
  "apiKey": "AIzaSyDD4SqdMcOAbTj9aEY-Zhw6LXmc4iZMWaI",
  "authDomain": "neostud.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "479263153154"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
