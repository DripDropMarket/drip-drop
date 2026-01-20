"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { getListings } from "@/app/views/listings";
import { ListingData, SchoolData, USState } from "@/app/lib/types";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { US_STATES } from "@/app/lib/constants";

const typeColors: Record<string, string> = {
  clothes: "bg-blue-100 text-blue-800",
  textbooks: "bg-green-100 text-green-800",
  tech: "bg-purple-100 text-purple-800",
  furniture: "bg-orange-100 text-orange-800",
  tickets: "bg-red-100 text-red-800",
  services: "bg-teal-100 text-teal-800",
  other: "bg-gray-100 text-gray-800",
};

interface MemberData {
  uid: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  isAdmin?: boolean;
}

interface AdminUser {
  uid: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
}

export default function SchoolPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<SchoolData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageAdminsModal, setShowManageAdminsModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState({ name: "", state: "" as USState });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");

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
          adminIds: schoolData.adminIds || [],
        });
        setEditingSchool({ name: schoolData.name, state: schoolData.state });

        const membersQuery = query(
          collection(db, "users"),
          where("schoolId", "==", schoolId)
        );
        const membersSnap = await getDocs(membersQuery);
        const adminIds = schoolData.adminIds || [];
        const membersData = membersSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            profilePicture: data.profilePicture || "",
            isAdmin: adminIds.includes(doc.id),
          };
        });
        setMembers(membersData);

        if (user) {
          const token = await user.getIdToken();
          const adminResponse = await fetch(`/api/schools/${schoolId}/admin`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            setIsAdmin(adminData.isAdmin);
            setAdmins(adminData.admins);
          }
        }

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
  }, [schoolId, user]);

  const handleUpdateSchool = async () => {
    if (!editingSchool.name.trim()) {
      setErrorMessage("School name cannot be empty");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/schools/${schoolId}/manage`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingSchool.name,
          state: editingSchool.state,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update school");
      }

      setSchool(data);
      setShowEditModal(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update school");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to remove this listing?")) return;

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/schools/${schoolId}/manage`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "remove_listing",
          targetId: listingId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove listing");
      }

      setListings(listings.filter((l) => l.id !== listingId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove listing");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the school?")) return;

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/schools/${schoolId}/manage`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "remove_member",
          targetId: userId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove member");
      }

      setMembers(members.filter((m) => m.uid !== userId));
      if (school) {
        setSchool({ ...school, memberCount: school.memberCount - 1 });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setErrorMessage("Please enter an email address");
      return;
    }

    try {
      const token = await user?.getIdToken();
      const lookupResponse = await fetch(`/api/users/by-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newAdminEmail,
          schoolId,
        }),
      });

      if (!lookupResponse.ok) {
        const data = await lookupResponse.json();
        throw new Error(data.error || "User not found");
      }

      const targetUser = await lookupResponse.json();

      if (targetUser.isAdmin) {
        setErrorMessage("This member is already an admin");
        return;
      }

      const adminResponse = await fetch(`/api/schools/${schoolId}/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: targetUser.uid,
          action: "add",
        }),
      });

      const data = await adminResponse.json();

      if (!adminResponse.ok) {
        throw new Error(data.error || "Failed to add admin");
      }

      setMembers(members.map((m) =>
        m.uid === targetUser.uid ? { ...m, isAdmin: true } : m
      ));
      setAdmins([...admins, {
        uid: targetUser.uid,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        profilePicture: targetUser.profilePicture,
      }]);
      if (school) {
        setSchool({ ...school, adminIds: data.adminIds });
      }
      setNewAdminEmail("");
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to add admin");
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/schools/${schoolId}/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: userId,
          action: "remove",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove admin");
      }

      setMembers(members.map((m) =>
        m.uid === userId ? { ...m, isAdmin: false } : m
      ));
      setAdmins(admins.filter((a) => a.uid !== userId));
      if (school) {
        setSchool({ ...school, adminIds: data.adminIds });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove admin");
    }
  };

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
            <div className="flex items-center gap-4">
              <div className="text-center sm:text-right">
                <p className="text-3xl font-bold text-primary">{school.memberCount}</p>
                <p className="text-sm text-muted-foreground">members</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>

        {showAdminPanel && (
          <div className="mb-8 rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
            <h2 className="text-lg font-semibold mb-4">Admin Controls</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-white"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit School
              </button>
              <button
                onClick={() => setShowManageAdminsModal(true)}
                className="inline-flex h-9 items-center justify-center rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Manage Admins
              </button>
            </div>
          </div>
        )}

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
                  <div
                    key={listing.id}
                    className="group block rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <Link href={`/listings/${listing.id}`}>
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
                    {isAdmin && (
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => handleRemoveListing(listing.id)}
                          className="w-full inline-flex h-8 items-center justify-center rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200"
                        >
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove Listing
                        </button>
                      </div>
                    )}
                  </div>
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
                  <div
                    key={member.uid}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50"
                  >
                    <Link href={`/users/${member.uid}`} className="flex items-center gap-3 flex-1 min-w-0">
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
                        <p className="font-medium truncate flex items-center gap-2">
                          {member.firstName} {member.lastName}
                          {member.isAdmin && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Admin
                            </span>
                          )}
                        </p>
                      </div>
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    {isAdmin && member.uid !== user?.uid && (
                      <div className="flex items-center gap-1">
                        {member.isAdmin ? (
                          <button
                            onClick={() => handleRemoveAdmin(member.uid)}
                            className="p-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            title="Remove admin"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRemoveMember(member.uid)}
                            className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                            title="Remove from school"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit School</h2>
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
                {errorMessage}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">School Name</label>
                <input
                  type="text"
                  value={editingSchool.name}
                  onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <select
                  value={editingSchool.state}
                  onChange={(e) => setEditingSchool({ ...editingSchool, state: e.target.value as USState })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSchool}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManageAdminsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Manage Admins</h2>
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
                {errorMessage}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Admins</label>
                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div key={admin.uid} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
                        {admin.profilePicture ? (
                          <img
                            src={admin.profilePicture}
                            alt={`${admin.firstName} ${admin.lastName}`}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/20" />
                        )}
                        <span className="text-sm">{admin.firstName} {admin.lastName}</span>
                      </div>
                      {admins.length > 1 && (
                        <button
                          onClick={() => handleRemoveAdmin(admin.uid)}
                          className="p-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Add Admin</label>
                <p className="text-xs text-muted-foreground mb-2">Enter the member&apos;s email address</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleAddAdmin}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowManageAdminsModal(false);
                  setErrorMessage(null);
                }}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
