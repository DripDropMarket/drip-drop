import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

export async function initFirebaseAdmin(): Promise<{ firestore: () => Firestore }> {
  if (!adminApp) {
    if (getApps().length === 0) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Firebase Admin SDK credentials are not set in environment variables.");
      }

      const serviceAccount = {
        projectId,
        clientEmail,
        privateKey,
      };

      try {
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
      } catch (e) {
        console.error("Firebase Admin initialization error:", e);
        throw e;
      }
    } else {
      adminApp = getApps()[0];
    }
  }
  
  if (!adminDb) {
    adminDb = getFirestore(adminApp);
  }
  
  return { firestore: () => adminDb! };
}

export function getAdminFirestore(): Firestore {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized. Call initFirebaseAdmin() first.");
  }
  return adminDb;
}
