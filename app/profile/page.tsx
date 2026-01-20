"use client";

import { useAuth } from "@/app/lib/auth-context";
import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { UserData, ListingData } from "@/app/lib/types";
import { getUserListings, deleteListing } from "@/app/views/listings";
import { getSavedListings, toggleSavedListing } from "@/app/views/saved";
import { getListings } from "@/app/views/listings";
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

type TabType = "listings" | "saved";

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [savedListings, setSavedListings] = useState<ListingData[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("listings");

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

  useEffect(() => {
    async function fetchSavedListings() {
      if (user) {
        try {
          const savedData = await getSavedListings();
          if (savedData.length > 0) {
            const allListings = await getListings();
            const savedIds = new Set(savedData.map((s) => s.listingId));
            setSavedListings(allListings.filter((l) => savedIds.has(l.id)));
          }
        } catch (error) {
          console.error("Error fetching saved listings:", error);
        } finally {
          setSavedLoading(false);
        }
      } else {
        setSavedLoading(false);
      }
    }
    fetchSavedListings();
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

  async function handleUnsaveListing(id: string) {
    setUnsavingId(id);
    try {
      await toggleSavedListing(id);
      setSavedListings(savedListings.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Error unsaving listing:", error);
    } finally {
      setUnsavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-muted pb-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <main className="container mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold">Profile</h1>
          <div className="rounded-2xl border-2 border-primary bg-primary/5 p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="mb-6 text-xl font-medium text-foreground">
              Sign in to view your profile
            </p>
            <Link
              href="/login?redirect=/profile"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-white shadow-lg transition-all hover:bg-primary-hover hover:shadow-xl"
            >
              Sign In
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
            {(userData?.profilePicture || user.photoURL) && (
              <div className="relative mb-4 h-20 w-20 flex-none overflow-hidden rounded-full sm:mb-0">
                <Image
                  src={userData?.profilePicture || user.photoURL || ""}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="text-center sm:text-left">
              <p className="mb-1 text-xl font-bold text-card-foreground">
                {userData?.firstName} {userData?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{userData?.email || user.email}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("listings")}
            className={`pb-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "listings"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            My Listings
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`pb-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "saved"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            Saved
          </button>
        </div>

        {activeTab === "listings" && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Listings</h2>
              <Link
                href="/create"
                className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Create New
              </Link>
            </div>

            {listingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading your listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="mb-4 text-lg text-muted-foreground">
                  You haven&apos;t created any listings yet.
                </p>
                <Link
                  href="/create"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="group relative flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            typeColors[listing.type] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {listing.type}
                        </span>
                        {listing.price > 0 && (
                          <span className="font-semibold text-green-600">
                            ${listing.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <h3 className="mb-1 font-semibold group-hover:text-primary truncate">
                        {listing.title}
                      </h3>
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/listings/${listing.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                        >
                          View
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
                    <span className="text-xs text-muted-foreground">
                      {new Date(listing.createdAt.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "saved" && (
          <>
            <h2 className="mb-6 text-lg font-semibold">Saved Listings</h2>

            {savedLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading saved listings...</p>
              </div>
            ) : savedListings.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="mb-4 text-lg text-muted-foreground">
                  You haven&apos;t saved any listings yet.
                </p>
                <Link
                  href="/listings"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Browse Listings
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            typeColors[listing.type] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {listing.type}
                        </span>
                        {listing.price > 0 && (
                          <span className="font-semibold text-green-600">
                            ${listing.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <h3 className="mb-1 font-semibold group-hover:text-primary truncate">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {listing.description}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleUnsaveListing(listing.id);
                      }}
                      disabled={unsavingId === listing.id}
                      className="self-center rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50"
                    >
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        <button
          onClick={signOut}
          className="mt-12 w-full rounded-lg border border-input bg-background py-3 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          Sign Out
        </button>
      </main>
    </div>
  );
}
