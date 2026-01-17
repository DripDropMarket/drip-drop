"use client";

import { useAuth } from "@/app/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { UserData, ListingData } from "@/app/lib/types";
import { getUserListings, deleteListing } from "@/app/views/listings";
import Link from "next/link";

const typeColors: Record<string, string> = {
  clothes: "bg-blue-100 text-blue-800",
  textbooks: "bg-green-100 text-green-800",
  tech: "bg-purple-100 text-purple-800",
  furniture: "bg-orange-100 text-orange-800",
  tickets: "bg-red-100 text-red-800",
  services: "bg-teal-100 text-teal-800",
  other: "bg-gray-100 text-gray-800",
};

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchUserData() {
      if (user && db) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        }
      }
    }
    fetchUserData();
  }, [user]);

  useEffect(() => {
    async function fetchListings() {
      if (user) {
        try {
          const data = await getUserListings(user.uid);
          setListings(data);
        } catch (error) {
          console.error("Error fetching listings:", error);
        } finally {
          setListingsLoading(false);
        }
      }
    }
    fetchListings();
  }, [user]);

  async function handleDeleteListing(id: string) {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    
    setDeletingId(id);
    try {
      await deleteListing(id);
      setListings(listings.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
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
            Browse Listings
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="flex flex-col items-center">
            {(userData?.profilePicture || user.photoURL) && (
              <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full">
                <Image
                  src={userData?.profilePicture || user.photoURL || ""}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <p className="mb-2 text-2xl font-bold text-card-foreground">
              {userData?.firstName} {userData?.lastName}
            </p>
            <p className="mb-6 text-muted-foreground">{userData?.email || user.email}</p>
            <button
              onClick={signOut}
              className="rounded-lg bg-primary px-6 py-2 font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Listings</h2>
          <Link
            href="/listings/create"
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Create New Listing
          </Link>
        </div>

        {listingsLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading your listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="mb-4 text-lg text-muted-foreground">
              You haven&apos;t created any listings yet.
            </p>
            <Link
              href="/listings/create"
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50"
              >
                <div className="mb-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      typeColors[listing.type] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {listing.type}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold group-hover:text-primary">
                  {listing.title}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {listing.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(listing.createdAt.seconds * 1000).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      disabled={deletingId === listing.id}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === listing.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
