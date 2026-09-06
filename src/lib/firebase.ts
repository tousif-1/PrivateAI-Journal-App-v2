import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Primary configuration loaded directly from firebase-applet-config.json (no environment variables required)
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || "AIzaSyDV16aTvtBdnIkY1K9Q2Cs9er6D5kvI4mM",
  authDomain: firebaseConfigJson.authDomain || "gen-lang-client-0967719812.firebaseapp.com",
  projectId: firebaseConfigJson.projectId || "gen-lang-client-0967719812",
  storageBucket: firebaseConfigJson.storageBucket || "gen-lang-client-0967719812.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "383738434975",
  appId: firebaseConfigJson.appId || "1:383738434975:web:2ba359cfa1bca990a599aa",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize firestore with specified databaseId if present
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || (
  firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)' 
    ? firebaseConfigJson.firestoreDatabaseId 
    : undefined
);

export const db = databaseId 
  ? getFirestore(app, databaseId) 
  : getFirestore(app);

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Sign-in error:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign-out error:', error);
    throw error;
  }
};

export type { FirebaseUser };
