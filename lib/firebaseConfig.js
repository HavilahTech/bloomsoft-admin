import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  getMetadata,
} from "firebase/storage";

// Ensure that your Firebase configuration object contains these fields
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase is already initialized, otherwise initialize it
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig); // Initialize Firebase if not already initialized
} else {
  app = getApps()[0]; // Use the already initialized app if Firebase is initialized
}

// Initialize Firestore, Auth, and Storage
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export default db;
export { storage, auth, ref, uploadBytes, getDownloadURL, getMetadata };
