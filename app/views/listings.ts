import { ListingData, CreateListingInput, UpdateListingInput } from "@/app/lib/types";
import { authenticatedFetch } from "./helpers";

export async function getListings(): Promise<ListingData[]> {
  const response = await fetch("/api/listings", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
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
