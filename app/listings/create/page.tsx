"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { createListing } from "@/app/views/listings";
import { ListingType } from "@/app/lib/types";

const typeOptions: { value: ListingType; label: string }[] = [
  { value: "clothes", label: "Clothes" },
  { value: "textbooks", label: "Textbooks" },
  { value: "tech", label: "Tech" },
  { value: "furniture", label: "Furniture" },
  { value: "tickets", label: "Tickets" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

export default function CreateListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ListingType>("other");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const listing = await createListing({ title, description, type });
      router.push(`/listings/${listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">💧</span>
            <span className="text-xl font-bold">Drip Drop</span>
          </Link>
          <Link
            href="/listings"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            Back to Listings
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Create a Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you selling?"
              required
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Category
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ListingType)}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item..."
              required
              rows={5}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-4">
            <Link
              href="/listings"
              className="flex h-11 items-center justify-center rounded-lg border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
