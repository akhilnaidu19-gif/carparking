import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";

import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD-zcUfPLdlpEZCdHz6QULbgHOlmtOCmK4",

  authDomain: "carparking-f65bf.firebaseapp.com",

  projectId: "carparking-f65bf",

  storageBucket: "carparking-f65bf.firebasestorage.app",

  messagingSenderId: "124435045479",

  appId: "1:124435045479:web:83a0ead77364e64b2988c2",
};  

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const storage = getStorage(
  app,
  "gs://carparking-f65bf.firebasestorage.app"
);