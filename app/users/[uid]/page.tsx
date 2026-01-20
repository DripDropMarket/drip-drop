"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { getUserListings } from "@/app/views/listings";
import { ListingData, formatDate } from "@/app/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
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

export default function UserListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  const [sellerInfo, setSellerInfo] = useState<{ firstName: string; lastName: string; profilePicture: string } | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!uid) {
        router.replace("/listings");
        return;
      }

      if (user && user.uid === uid) {
        router.replace("/profile");
        return;
      }

      fetchSellerInfo();
      fetchUserListings();
    }
  }, [uid, user, authLoading, router]);

  async function fetchSellerInfo() {
    if (!db || !uid) return;

    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setSellerInfo({
          firstName: userData.firstName,
          lastName: userData.lastName,
          profilePicture: userData.profilePicture,
        });
      }
    } catch (err) {
      console.error("Error fetching seller info:", err);
    }
  }

  async function fetchUserListings() {
    if (!uid) return;

    try {
      const data = await getUserListings(uid);
      setListings(data);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center bg-background pb-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/listings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Listings
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
            {sellerInfo?.profilePicture ? (
              <img
                src={sellerInfo.profilePicture}
                alt={`${sellerInfo.firstName} ${sellerInfo.lastName}`}
                className="h-20 w-20 rounded-full object-cover mb-4 sm:mb-0"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-0">
                <svg className="h-10 w-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className="text-center sm:text-left">
              <p className="text-2xl font-bold text-card-foreground">
                {sellerInfo?.firstName} {sellerInfo?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">Seller</p>
            </div>
          </div>
        </div>

        <h2 className="mb-6 text-xl font-semibold">
          {sellerInfo?.firstName}'s Listings ({listings.length})
        </h2>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-lg text-muted-foreground">
              {sellerInfo?.firstName} hasn't posted any listings yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, index) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group block rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-muted">
                  {listing.imageUrls && listing.imageUrls.length > 0 ? (
                    <ProgressiveImage
                      src={listing.imageUrls[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      index={index}
                      priority={index < 6}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
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
                  <h3 className="mb-1 font-semibold group-hover:text-primary line-clamp-1">
                    {listing.title}
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatDate(listing.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
