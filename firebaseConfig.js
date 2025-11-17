import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCi6V-X43Xnru2dYm4cSZmVl4H3u09UhdY",
  authDomain: "remedios-de-notas.firebaseapp.com",
  projectId: "remedios-de-notas",
  storageBucket: "remedios-de-notas.firebasestorage.app",
  messagingSenderId: "883538633460",
  appId: "1:883538633460:web:cfdc8880d3cf3c0eccb4a1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // ← Firestore ativado
