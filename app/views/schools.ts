import { SchoolData, CreateSchoolInput, SchoolWithData } from "@/app/lib/types";
import { authenticatedFetch, getClientIdToken } from "./helpers";

export type { SchoolWithData };

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

export async function getSchool(schoolId: string): Promise<SchoolWithData> {
  const response = await fetch(`/api/schools/${schoolId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("School not found");
    }
    throw new Error(`Failed to fetch school: ${response.statusText}`);
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
  const response = await authenticatedFetch("/api/users/school", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user school: ${response.statusText}`);
  }

  const data = await response.json();
  return data.schoolId;
}
