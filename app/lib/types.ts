import { Timestamp } from "firebase/firestore";

export type ListingType = "clothes" | "textbooks" | "tech" | "furniture" | "tickets" | "services" | "other";
export type ClothingType = "tops" | "bottoms" | "outerwear" | "footwear" | "accessories" | "dresses" | "other";

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  type: ListingType;
  clothingType?: ClothingType;
  userId: string;
  createdAt: Timestamp;
  imageUrls?: string[];
}

export interface ListingData {
  id: string;
  title: string;
  description: string;
  price: number;
  type: ListingType;
  clothingType?: ClothingType;
  userId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  imageUrls?: string[];
}

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  type: ListingType;
  clothingType?: ClothingType;
  imageUrls?: string[];
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  price?: number;
  type?: ListingType;
  clothingType?: ClothingType;
  imageUrls?: string[];
}

export interface SavedListing {
  listingId: string;
  userId: string;
  savedAt: Timestamp;
}

export interface Conversation {
  id: string;
  participants: string[];
  listingId: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Timestamp;
  read: boolean;
}

export interface ConversationData {
  id: string;
  participants: string[];
  listingId: string;
  listingTitle: string;
  otherUser: {
    uid: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  lastMessage: string;
  lastMessageAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  read: boolean;
  senderFirstName: string;
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

export interface FilterOptions {
  type?: ListingType;
  clothingType?: ClothingType;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}
