import { ListingData, CreateListingInput, UpdateListingInput, FilterOptions } from "@/app/lib/types";
import { authenticatedFetch } from "./helpers";

export async function getListings(filters?: FilterOptions): Promise<ListingData[]> {
  const params = new URLSearchParams();
  
  if (filters?.type) params.set("type", filters.type);
  if (filters?.clothingType) params.set("clothingType", filters.clothingType);
  if (filters?.condition) params.set("condition", filters.condition);
  if (filters?.size) params.set("size", filters.size);
  if (filters?.minPrice !== undefined) params.set("minPrice", filters.minPrice.toString());
  if (filters?.maxPrice !== undefined) params.set("maxPrice", filters.maxPrice.toString());
  if (filters?.search) params.set("search", filters.search);
  if (filters?.scope) params.set("scope", filters.scope);
  
  const url = `/api/listings${params.toString() ? `?${params.toString()}` : ""}`;
  
  const token = await import("@/app/lib/firebase").then((firebase) => {
    const firebaseAuth = firebase.auth;
    return firebaseAuth?.currentUser?.getIdToken();
  });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch listings: ${response.statusText}`);
  }

  return response.json();
}

export async function getListing(id: string): Promise<ListingData> {
  const response = await fetch(`/api/listings/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Listing not found");
    }
    throw new Error(`Failed to fetch listing: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserListings(userId: string): Promise<ListingData[]> {
  const response = await fetch(`/api/listings/user/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user listings: ${response.statusText}`);
  }

  return response.json();
}

export async function createListing(input: CreateListingInput): Promise<ListingData> {
  const response = await authenticatedFetch("/api/listings", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create listing");
  }

  return response.json();
}

export async function updateListing(
  id: string,
  input: UpdateListingInput
): Promise<ListingData> {
  const response = await authenticatedFetch(`/api/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update listing");
  }

  return response.json();
}

export async function deleteListing(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/listings/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete listing");
  }
}

export async function markListingAsSold(id: string): Promise<ListingData> {
  const response = await authenticatedFetch(`/api/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify({ isSold: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark listing as sold");
  }

  return response.json();
}

export async function markListingAsAvailable(id: string): Promise<ListingData> {
  const response = await authenticatedFetch(`/api/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify({ isSold: false }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark listing as available");
  }

  return response.json();
}
