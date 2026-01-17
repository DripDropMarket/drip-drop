import { auth } from "@/app/lib/firebase";

export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!auth || !auth.currentUser) {
    throw new Error("User must be authenticated to perform this action");
  }

  let token: string;

  try {
    token = await auth.currentUser.getIdToken();
  } catch (error) {
    console.error("Error getting ID token:", error);
    throw new Error("Failed to get authentication token");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  return response;
}
