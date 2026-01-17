"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthContextType } from "./types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<any>(null);

  useEffect(() => {
    let unsubscribe: any = null;

    async function init() {
      const { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      const { getFirestore, doc, getDoc, setDoc, Timestamp } = await import("firebase/firestore");
      const { initializeApp, getApps } = await import("firebase/app");

      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
      };

      if (!firebaseConfig.apiKey || !firebaseConfig.apiKey.startsWith("AIza") || !firebaseConfig.projectId) {
        setLoading(false);
        return;
      }

      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const db = getFirestore(app);

      setAuth(authInstance);

      unsubscribe = onAuthStateChanged(authInstance, async (user: any) => {
        setUser(user);
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const nameParts = (user.displayName || "").split(" ");
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
              profilePicture: user.photoURL || "",
              createdAt: Timestamp.now(),
            });
          }
        }
        setLoading(false);
      });
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    if (!auth) {
      console.error("Firebase auth not initialized");
      throw new Error("Firebase not configured. Please refresh the page.");
    }
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      console.error("Sign in error:", error);
      if (error.code === "auth/popup-blocked") {
        throw new Error("Popup was blocked. Please allow popups for this site.");
      }
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) throw new Error("Firebase not configured");
    const { signOut: firebaseSignOut } = await import("firebase/auth");
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
