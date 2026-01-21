import { ListingData } from "@/app/lib/types";
import { authenticatedFetch } from "./helpers";

export interface UserData {
  uid: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  schoolId: string | null;
  school: {
    id: string;
    name: string;
    state: string;
  } | null;
  listings: ListingData[];
}

export async function getUser(uid: string): Promise<UserData> {
  const response = await fetch(`/api/users/${uid}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found");
    }
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
}

export async function getCurrentUser(): Promise<UserData> {
  const response = await authenticatedFetch("/api/users/me", {
    method: "GET",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found");
    }
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
}
