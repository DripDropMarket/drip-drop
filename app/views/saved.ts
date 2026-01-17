import { authenticatedFetch } from "./helpers";

export async function getSavedListings(): Promise<{ listingId: string; savedAt: { seconds: number; nanoseconds: number } }[]> {
  const response = await authenticatedFetch("/api/saved", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch saved listings: ${response.statusText}`);
  }

  return response.json();
}

export async function toggleSavedListing(listingId: string): Promise<{ saved: boolean }> {
  const response = await authenticatedFetch("/api/saved", {
    method: "POST",
    body: JSON.stringify({ listingId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to toggle saved listing");
  }

  return response.json();
}
