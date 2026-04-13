import { initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

function canInitializeFirebase(config: Record<string, unknown>): boolean {
  return typeof config.apiKey === "string" && config.apiKey.length > 0 && typeof config.projectId === "string" && config.projectId.length > 0;
}

let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (canInitializeFirebase(firebaseConfig as unknown as Record<string, unknown>)) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
  }
} catch {
  db = null;
  auth = null;
}

export { db, auth };
