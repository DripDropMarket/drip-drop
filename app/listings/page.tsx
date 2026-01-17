"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getListings } from "@/app/views/listings";
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

export default function ListingsPage() {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        const data = await getListings();
        setListings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load listings");
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-red-500">{error}</p>
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
          <div className="flex items-center gap-4">
            <Link
              href="/listings/create"
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Create Listing
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">All Listings</h1>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No listings yet.</p>
            <Link
              href="/listings/create"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Be the first to create a listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group block rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="mb-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      typeColors[listing.type]
                    }`}
                  >
                    {typeLabels[listing.type]}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-semibold group-hover:text-primary">
                  {listing.title}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {listing.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Posted</span>
                  <span>
                    {new Date(listing.createdAt.seconds * 1000).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
