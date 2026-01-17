"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { getListing, updateListing, deleteListing } from "@/app/views/listings";
import { ListingData, ListingType } from "@/app/lib/types";

const typeLabels: Record<ListingType, string> = {
  clothes: "Clothes",
  textbooks: "Textbooks",
  tech: "Tech",
  furniture: "Furniture",
  tickets: "Tickets",
  services: "Services",
  other: "Other",
};

const typeColors: Record<ListingType, string> = {
  clothes: "bg-blue-100 text-blue-800",
  textbooks: "bg-green-100 text-green-800",
  tech: "bg-purple-100 text-purple-800",
  furniture: "bg-orange-100 text-orange-800",
  tickets: "bg-red-100 text-red-800",
  services: "bg-teal-100 text-teal-800",
  other: "bg-gray-100 text-gray-800",
};

const typeOptions: { value: ListingType; label: string }[] = [
  { value: "clothes", label: "Clothes" },
  { value: "textbooks", label: "Textbooks" },
  { value: "tech", label: "Tech" },
  { value: "furniture", label: "Furniture" },
  { value: "tickets", label: "Tickets" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

export default function ListingDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<ListingType>("other");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user && listing && user.uid === listing.userId;

  useEffect(() => {
    async function fetchListing() {
      try {
        const data = await getListing(id);
        setListing(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditType(data.type);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load listing");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateListing(id, {
        title: editTitle,
        description: editDescription,
        type: editType,
      });
      setListing(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    
    setDeleting(true);
    try {
      await deleteListing(id);
      router.push("/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete listing");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Listing not found"}</p>
          <Link
            href="/listings"
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-white"
          >
            Back to Listings
          </Link>
        </div>
      </div>
    );
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

      <main className="container mx-auto max-w-3xl px-4 py-12">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {editing ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Edit Listing</h1>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as ListingType)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setEditing(false)}
                className="flex h-11 items-center justify-center rounded-lg border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    typeColors[listing.type]
                  }`}
                >
                  {typeLabels[listing.type]}
                </span>
                <h1 className="mt-4 text-3xl font-bold">{listing.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Posted on{" "}
                  {new Date(listing.createdAt.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Description</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {listing.description}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-6">
              <h2 className="mb-2 text-sm font-medium">About the Seller</h2>
              <p className="text-sm text-muted-foreground">
                User ID: {listing.userId}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
