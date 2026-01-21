"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { getUser, UserData } from "@/app/views/user";
import { formatDate } from "@/app/lib/types";
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

  const [userData, setUserData] = useState<UserData | null>(null);
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

      fetchUserData();
    }
  }, [uid, user, authLoading, router]);

  async function fetchUserData() {
    if (!uid) return;

    try {
      const data = await getUser(uid);
      setUserData(data);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background pb-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background pb-20">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "User not found"}</p>
          <Link
            href="/listings"
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="mb-8 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {userData.profilePicture ? (
                <img
                  src={userData.profilePicture}
                  alt={`${userData.firstName} ${userData.lastName}`}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-ring/10"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center ring-2 ring-ring/10">
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
                  {userData.firstName} {userData.lastName}
                </h1>
                {userData.school ? (
                  <Link
                    href={`/schools/${userData.school.id}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mt-1"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>{userData.school.name}</span>
                    <span className="text-muted-foreground/60">({userData.school.state})</span>
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">No school</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-8 sm:gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold tracking-tight text-primary">{userData.listings.length}</p>
                <p className="text-sm text-muted-foreground font-medium">listings</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="sr-only">Listings</h2>

        {userData.listings.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-lg text-muted-foreground font-medium">
              {userData.firstName} hasn't posted any listings yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userData.listings.map((listing, index) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border hover:-translate-y-1"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
                  {listing.imageUrls && listing.imageUrls.length > 0 ? (
                    <ProgressiveImage
                      src={listing.imageUrls[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      index={index}
                      priority={index < 6}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted/50">
                      <svg className="h-12 w-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    {listing.condition && (
                      <span className="inline-block backdrop-blur-md bg-black/40 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                        {listing.condition.replace(/_/g, " ")}
                      </span>
                    )}
                    {listing.size && (
                      <span className="inline-block backdrop-blur-md bg-black/40 text-white text-[10px] font-semibold px-2 py-1 rounded-full uppercase">
                        {listing.size}
                      </span>
                    )}
                  </div>
                  {listing.imageUrls && listing.imageUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
                      +{listing.imageUrls.length - 1}
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        typeColors[listing.type] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {listing.type}
                    </span>
                    {listing.price > 0 ? (
                      <span className="font-bold text-lg text-primary whitespace-nowrap">
                        ${listing.price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="font-bold text-lg text-green-600 whitespace-nowrap">
                        Free
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-card-foreground text-sm sm:text-base line-clamp-1 mb-1">
                    {listing.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                    {listing.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(listing.createdAt)}
                    </span>
                    {listing.isSold && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        SOLD
                      </span>
                    )}
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
