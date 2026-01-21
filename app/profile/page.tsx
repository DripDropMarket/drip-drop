"use client";

import { useAuth } from "@/app/lib/auth-context";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ListingData, formatDate } from "@/app/lib/types";
import { getUserListings, deleteListing } from "@/app/views/listings";
import { getSavedListings, toggleSavedListing } from "@/app/views/saved";
import { getListings } from "@/app/views/listings";
import { getCurrentUser, UserData } from "@/app/views/user";
import Link from "next/link";
import ProgressiveImage from "@/app/components/progressive-image";

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
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [soldListings, setSoldListings] = useState<ListingData[]>([]);
  const [savedListings, setSavedListings] = useState<ListingData[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("listings");

  useEffect(() => {
    async function fetchUserData() {
      if (user) {
        try {
          const data = await getCurrentUser();
          setUserData(data);
          setListings(data.listings.filter((l) => !l.isSold));
          setSoldListings(data.listings.filter((l) => l.isSold));
        } catch (error) {
          console.error("Error fetching user data:", error);
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
          const active = data.filter((l) => !l.isSold);
          const sold = data.filter((l) => l.isSold);
          setListings(active);
          setSoldListings(sold);
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
      setSoldListings(soldListings.filter((l) => l.id !== id));
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
      <div className="flex items-center justify-center min-h-screen bg-background pb-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <main className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
          <h1 className="mb-8 text-3xl font-bold tracking-tight">Profile</h1>
          <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="mb-6 text-lg font-medium text-card-foreground">
              Sign in to view your profile
            </p>
            <Link
              href="/login?redirect=/profile"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
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
      <main className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
        <div className="mb-8 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
            {(userData?.profilePicture || user.photoURL) && (
              <div className="relative mb-4 h-20 w-20 flex-none overflow-hidden rounded-full sm:mb-0 ring-2 ring-ring/10">
                <Image
                  src={userData?.profilePicture || user.photoURL || ""}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="text-center sm:text-left">
              <p className="mb-1 text-xl font-bold tracking-tight text-card-foreground">
                {userData?.firstName} {userData?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {userData?.school && userData.schoolId && (
                <Link
                  href={`/schools/${userData.schoolId}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
                >
                  <span>{userData.school.name}</span>
                  <span className="text-muted-foreground/60">({userData.school.state})</span>
                </Link>
              )}
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
                className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Create New
              </Link>
            </div>

            {listingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">Loading your listings...</p>
                </div>
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="mb-4 text-muted-foreground font-medium">
                  You haven&apos;t created any listings yet.
                </p>
                <Link
                  href="/create"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => (
                  <ProfileListingItem
                    key={listing.id}
                    listing={listing}
                    deletingId={deletingId}
                    onDelete={handleDeleteListing}
                  />
                ))}
              </div>
            )}

            {soldListings.length > 0 && (
              <>
                <div className="mt-8 pt-6 border-t border-border">
                  <h2 className="text-lg font-semibold text-muted-foreground">Sold Listings</h2>
                </div>
                <div className="space-y-3">
                  {soldListings.map((listing) => (
                    <ProfileListingItem
                      key={listing.id}
                      listing={listing}
                      isSold
                      deletingId={deletingId}
                      onDelete={handleDeleteListing}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "saved" && (
          <>
            <h2 className="mb-6 text-lg font-semibold">Saved Listings</h2>

            {savedLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">Loading saved listings...</p>
                </div>
              </div>
            ) : savedListings.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="mb-4 text-muted-foreground font-medium">
                  You haven&apos;t saved any listings yet.
                </p>
                <Link
                  href="/listings"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  Browse Listings
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedListings.map((listing, index) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50"
                  >
                    <div className="h-20 w-20 flex-none rounded-lg bg-muted overflow-hidden">
                      {listing.imageUrls && listing.imageUrls.length > 0 ? (
                        <ProgressiveImage
                          src={listing.imageUrls[0]}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                          index={index}
                          priority={index < 6}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
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
                      className="self-center rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50 transition-colors"
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

interface ProfileListingItemProps {
  listing: ListingData;
  isSold?: boolean;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

function ProfileListingItem({ listing, isSold, deletingId, onDelete }: ProfileListingItemProps) {
  const router = useRouter();

  return (
    <Link
      key={listing.id}
      href={`/listings/${listing.id}`}
      className={`group relative flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 ${isSold ? "opacity-75" : ""}`}
    >
      <div className={`h-20 w-20 flex-none rounded-lg bg-muted overflow-hidden ${isSold ? "grayscale" : ""}`}>
        {listing.imageUrls && listing.imageUrls.length > 0 ? (
          <ProgressiveImage
            src={listing.imageUrls[0]}
            alt={listing.title}
            className="h-full w-full object-cover"
            index={0}
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {isSold && (
          <div className="absolute top-1 left-1">
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              SOLD
            </span>
          </div>
        )}
      </div>
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
        <h3 className={`mb-1 font-semibold truncate ${isSold ? "text-muted-foreground" : "group-hover:text-primary"}`}>
          {listing.title}
        </h3>
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {listing.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDate(listing.createdAt)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                router.push(`/listings/${listing.id}`);
              }}
              className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
            >
              {isSold ? "View" : "Edit"}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(listing.id);
              }}
              disabled={deletingId === listing.id}
              className="inline-flex h-8 items-center justify-center rounded-md border border-destructive/20 bg-destructive/10 px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
            >
              {deletingId === listing.id ? "..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
