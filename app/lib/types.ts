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
  schoolId?: string;
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
  schoolId?: string;
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
  imageUrl?: string;
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
  imageUrl?: string;
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
  needsSchoolSelection: boolean;
  refreshUserData: () => Promise<void>;
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
  schoolId?: string;
}

export interface FilterOptions {
  type?: ListingType;
  clothingType?: ClothingType;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  scope?: "school" | "state" | "all";
}

export type USState =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY" | "DC";

export interface School {
  id: string;
  name: string;
  state: USState;
  memberCount: number;
  createdAt: Timestamp;
}

export interface SchoolData {
  id: string;
  name: string;
  state: USState;
  memberCount: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export interface CreateSchoolInput {
  name: string;
  state: USState;
}

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
  createdAt: Timestamp;
  schoolId?: string;
}
