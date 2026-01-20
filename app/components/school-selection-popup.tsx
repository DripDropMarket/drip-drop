"use client";

import { useState, useEffect } from "react";
import { SchoolData } from "@/app/lib/types";
import { US_STATES, USState } from "@/app/lib/constants";

interface SchoolSelectionPopupProps {
  onComplete: () => void;
}

async function getIdToken(): Promise<string | null> {
  const { getAuth } = await import("firebase/auth");
  const auth = getAuth();
  return auth.currentUser?.getIdToken() || null;
}

export default function SchoolSelectionPopup({ onComplete }: SchoolSelectionPopupProps) {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<USState | "">("");
  const [createName, setCreateName] = useState("");
  const [createState, setCreateState] = useState<USState>("CA");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    let filtered = schools;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.state.toLowerCase().includes(query)
      );
    }

    if (filterState) {
      filtered = filtered.filter(s => s.state === filterState);
    }

    setFilteredSchools(filtered);
  }, [schools, searchQuery, filterState]);

  async function fetchSchools() {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
        setFilteredSchools(data);
      }
    } catch (err) {
      console.error("Error fetching schools:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectSchool(schoolId: string) {
    setSelectedSchoolId(schoolId);
    setSubmitting(true);
    setError(null);

    try {
      const token = await getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/users/school", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ schoolId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign school");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select school");
      setSelectedSchoolId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateSchool(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = await getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: createName, state: createState }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create school");
      }

      await response.json();
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create school");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="m-4 w-full max-w-md rounded-xl bg-card p-6 text-center">
          <p className="text-muted-foreground">Loading schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-xl bg-card shadow-xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Select Your School</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your school to see listings from your campus community
          </p>
        </div>

        <div className="p-4 border-b border-border bg-muted/30">
          {!showCreateForm ? (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterState("")}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterState === ""
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  All States
                </button>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value as USState | "")}
                  className="rounded-full px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground border-none focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <option value="">More States...</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowCreateForm(false);
                setError(null);
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to schools
            </button>
          )}
        </div>

        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {!showCreateForm ? (
            filteredSchools.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No schools found matching your search</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Create New School
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSchools.map((school) => (
                  <button
                    key={school.id}
                    onClick={() => handleSelectSchool(school.id)}
                    disabled={submitting && selectedSchoolId === school.id}
                    className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50"
                  >
                    <div>
                      <p className="font-medium">{school.name}</p>
                      <p className="text-sm text-muted-foreground">{school.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">{school.memberCount}</p>
                      <p className="text-xs text-muted-foreground">members</p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create a new school
                </button>
              </div>
            )
          ) : (
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="schoolName" className="text-sm font-medium">
                  School Name
                </label>
                <input
                  id="schoolName"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Enter school name"
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="schoolState" className="text-sm font-medium">
                  State
                </label>
                <select
                  id="schoolState"
                  value={createState}
                  onChange={(e) => setCreateState(e.target.value as USState)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create School"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
