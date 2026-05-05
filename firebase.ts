import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtIFvUAFcTQf7z_yf4eKyP2mR6LNDnlaQ",
  authDomain: "pairing-quest-app.firebaseapp.com",
  projectId: "pairing-quest-app",
  storageBucket: "pairing-quest-app.appspot.com",
  messagingSenderId: "143367116192",
  appId: "1:143367116192:web:c1b8d5444d7881511680c5"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export { app };
