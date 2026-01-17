import { Timestamp } from "firebase/firestore";

export type ListingType = "clothes" | "textbooks" | "tech" | "furniture" | "tickets" | "services" | "other";

export interface Listing {
  id: string;
  title: string;
  description: string;
  type: ListingType;
  userId: string;
  createdAt: Timestamp;
}

export interface ListingData {
  id: string;
  title: string;
  description: string;
  type: ListingType;
  userId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export interface CreateListingInput {
  title: string;
  description: string;
  type: ListingType;
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  type?: ListingType;
}

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
  createdAt: Timestamp;
}

export interface AuthContextType {
  user: import("firebase/auth").User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface UserData {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}
