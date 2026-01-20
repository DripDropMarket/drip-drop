import { SchoolData, CreateSchoolInput } from "@/app/lib/types";
import { authenticatedFetch } from "./helpers";

async function getClientIdToken(): Promise<string> {
  const { auth } = await import("@/app/lib/firebase");
  const token = await auth?.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return token;
}

export async function getSchools(): Promise<SchoolData[]> {
  const response = await fetch("/api/schools", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch schools: ${response.statusText}`);
  }

  return response.json();
}

export async function createSchool(input: CreateSchoolInput): Promise<SchoolData> {
  const response = await authenticatedFetch("/api/schools", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create school");
  }

  return response.json();
}

export async function assignUserToSchool(schoolId: string): Promise<void> {
  const response = await authenticatedFetch("/api/users/school", {
    method: "POST",
    body: JSON.stringify({ schoolId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to assign school");
  }
}

export async function getUserSchoolId(): Promise<string | null> {
  const token = await getClientIdToken();

  const response = await fetch("/api/users/school", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user school: ${response.statusText}`);
  }

  const data = await response.json();
  return data.schoolId;
}
