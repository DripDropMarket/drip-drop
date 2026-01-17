import { NextRequest } from "next/server";
import admin from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminAuth: admin.auth.Auth | null = null;
let db: admin.firestore.Firestore | null = null;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }
  
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials missing. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to environment variables. " +
      "Get these from Firebase Console > Project Settings > Service Accounts > Generate new private key"
    );
  }
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    // App might already be initialized
    console.log("Firebase Admin initialization:", error);
  }
}

function getAdminAuth(): admin.auth.Auth {
  if (adminAuth) return adminAuth;
  
  initializeAdminApp();
  
  if (admin.apps.length === 0) {
    throw new Error("Firebase Admin app not initialized");
  }
  
  adminAuth = admin.auth();
  return adminAuth;
}

export function getDB(): admin.firestore.Firestore {
  if (db) return db;
  
  initializeAdminApp();
  
  if (admin.apps.length === 0) {
    throw new Error("Firebase Admin app not initialized");
  }
  
  db = getFirestore();
  return db;
}

export async function verifyAuthToken(request: NextRequest): Promise<DecodedIdToken> {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader) {
    throw new Error("No authorization header provided");
  }
  
  const [bearer, token] = authHeader.split(" ");
  
  if (bearer !== "Bearer" || !token) {
    throw new Error("Invalid authorization header format. Expected: Bearer <token>");
  }
  
  const firebaseAuth = getAdminAuth();
  
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Invalid or expired token");
  }
}

export function createAuthError(message: string = "Unauthorized") {
  return new Error(message);
}
