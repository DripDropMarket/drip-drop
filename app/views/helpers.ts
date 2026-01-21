import { auth } from "@/app/lib/firebase";

export async function getClientIdToken(): Promise<string> {
  if (!auth?.currentUser) {
    throw new Error("User must be authenticated");
  }
  return auth.currentUser.getIdToken();
}

export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!auth) {
    throw new Error("Firebase auth not initialized");
  }

  let token: string;

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User must be authenticated to perform this action");
    }
    token = await currentUser.getIdToken();
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
