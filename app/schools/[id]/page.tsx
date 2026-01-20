"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { getListings } from "@/app/views/listings";
import { ListingData, SchoolData } from "@/app/lib/types";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

const typeColors: Record<string, string> = {
  clothes: "bg-blue-100 text-blue-800",
  textbooks: "bg-green-100 text-green-800",
  tech: "bg-purple-100 text-purple-800",
  furniture: "bg-orange-100 text-orange-800",
  tickets: "bg-red-100 text-red-800",
  services: "bg-teal-100 text-teal-800",
  other: "bg-gray-100 text-gray-800",
};

export default function SchoolPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<SchoolData | null>(null);
  const [members, setMembers] = useState<{ firstName: string; lastName: string; profilePicture: string; uid: string }[]>([]);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchoolData() {
      if (!schoolId || !db) return;

      try {
        const schoolSnap = await getDoc(doc(db, "schools", schoolId));
        if (!schoolSnap.exists()) {
          setError("School not found");
          setLoading(false);
          return;
        }

        const schoolData = schoolSnap.data();
        setSchool({
          id: schoolSnap.id,
          name: schoolData.name,
          state: schoolData.state,
          memberCount: schoolData.memberCount || 0,
          createdAt: {
            seconds: schoolData.createdAt?.seconds || 0,
            nanoseconds: schoolData.createdAt?.nanoseconds || 0,
          },
        });

        const membersQuery = query(
          collection(db, "users"),
          where("schoolId", "==", schoolId)
        );
        const membersSnap = await getDocs(membersQuery);
        const membersData = membersSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            profilePicture: data.profilePicture || "",
          };
        });
        setMembers(membersData);

        const listingsData = await getListings({ scope: "school" });
        const schoolListings = listingsData.filter((l) => l.schoolId === schoolId);
        setListings(schoolListings);
      } catch (err) {
        console.error("Error fetching school:", err);
        setError("Failed to load school");
      } finally {
        setLoading(false);
      }
    }

    fetchSchoolData();
  }, [schoolId]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center bg-background pb-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="flex items-center justify-center bg-background pb-20">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "School not found"}</p>
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

        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">{school.name}</h1>
              <p className="text-muted-foreground">{school.state}</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-3xl font-bold text-primary">{school.memberCount}</p>
              <p className="text-sm text-muted-foreground">members</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Listings from {school.name}</h2>
            
            {listings.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-lg text-muted-foreground">
                  No listings from this school yet.
                </p>
                {user && (
                  <Link
                    href="/create"
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                  >
                    Create a Listing
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="group block rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-muted">
                      {listing.imageUrls && listing.imageUrls.length > 0 ? (
                        <img
                          src={listing.imageUrls[0]}
                          alt={listing.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Members</h2>
            
            {members.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">No members yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <Link
                    key={member.uid}
                    href={`/users/${member.uid}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50"
                  >
                    {member.profilePicture ? (
                      <img
                        src={member.profilePicture}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.firstName} {member.lastName}
                      </p>
                    </div>
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
