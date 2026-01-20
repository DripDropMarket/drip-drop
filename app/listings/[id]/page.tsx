"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { getListing, updateListing, deleteListing, getListings } from "@/app/views/listings";
import { toggleSavedListing, getSavedListings } from "@/app/views/saved";
import { createConversation } from "@/app/views/messaging";
import { ListingData, ListingType, ClothingType } from "@/app/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import ImageUpload from "@/app/components/image-upload";
import ListingGallery from "@/app/components/listing-gallery";

const typeLabels: Record<ListingType, string> = {
  clothes: "Clothes",
  textbooks: "Textbooks",
  tech: "Tech",
  furniture: "Furniture",
  tickets: "Tickets",
  services: "Services",
  other: "Other",
};

const clothingTypeLabels: Record<ClothingType, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  outerwear: "Outerwear",
  footwear: "Footwear",
  accessories: "Accessories",
  dresses: "Dresses",
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

const clothingTypeOptions: { value: ClothingType; label: string }[] = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "outerwear", label: "Outerwear" },
  { value: "footwear", label: "Footwear" },
  { value: "accessories", label: "Accessories" },
  { value: "dresses", label: "Dresses" },
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
  const [editPrice, setEditPrice] = useState("");
  const [editType, setEditType] = useState<ListingType>("other");
  const [editClothingType, setEditClothingType] = useState<ClothingType | undefined>(undefined);
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [dmMessage, setDmMessage] = useState("");
  const [sendingDM, setSendingDM] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<{ firstName: string; lastName: string; profilePicture: string } | null>(null);
  const [relatedListings, setRelatedListings] = useState<ListingData[]>([]);
  const [existingConversationId, setExistingConversationId] = useState<string | null>(null);

  const isOwner = user && listing && user.uid === listing.userId;

  useEffect(() => {
    async function fetchListing() {
      try {
        const data = await getListing(id);
        setListing(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditPrice(data.price.toString());
        setEditType(data.type);
        setEditClothingType(data.clothingType);
        setEditImageUrls(data.imageUrls || []);

        if (db) {
          const userSnap = await getDoc(doc(db, "users", data.userId));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setSellerInfo({
              firstName: userData.firstName,
              lastName: userData.lastName,
              profilePicture: userData.profilePicture,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load listing");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id]);

  useEffect(() => {
    async function fetchRelatedListings() {
      if (listing && listing.id) {
        try {
          const allListings = await getListings({ type: listing.type });
          const filtered = allListings.filter((l) => l.id !== listing.id).slice(0, 3);
          setRelatedListings(filtered);
        } catch (err) {
          console.error("Failed to fetch related listings:", err);
        }
      }
    }
    fetchRelatedListings();
  }, [listing]);

  useEffect(() => {
    async function checkExistingConversation() {
      if (user && listing && listing.userId !== user.uid) {
        try {
          const conversations = await import("@/app/views/messaging").then((m) => m.getConversations());
          const existing = conversations.find((c) => c.listingId === listing.id);
          if (existing) {
            setExistingConversationId(existing.id);
          }
        } catch {
          setExistingConversationId(null);
        }
      }
    }
    checkExistingConversation();
  }, [user, listing]);

  useEffect(() => {
    async function checkSaved() {
      if (user && listing) {
        try {
          const savedListings = await getSavedListings();
          setSaved(savedListings.some((s) => s.listingId === listing.id));
        } catch {
          setSaved(false);
        }
      }
    }
    checkSaved();
  }, [user, listing]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateListing(id, {
        title: editTitle,
        description: editDescription,
        price: parseFloat(editPrice) || 0,
        type: editType,
        clothingType: editType === "clothes" ? editClothingType : undefined,
        imageUrls: editImageUrls.length > 0 ? editImageUrls : undefined,
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

  async function handleToggleSave() {
    if (!listing) return;
    setSavingBookmark(true);
    try {
      const result = await toggleSavedListing(listing.id);
      setSaved(result.saved);
    } catch (err) {
      console.error("Failed to toggle save:", err);
    } finally {
      setSavingBookmark(false);
    }
  }

  async function handleSendDM() {
    if (!listing || !user) return;
    setSendingDM(true);
    try {
      const { conversationId } = await createConversation(
        listing.id,
        listing.userId,
        dmMessage
      );
      setShowDMModal(false);
      setDmMessage("");
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingDM(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-background pb-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex items-center justify-center bg-background pb-20">
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
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/listings" className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <button
            onClick={user && !isOwner ? handleToggleSave : () => router.push(`/login?redirect=/listings/${id}`)}
            disabled={savingBookmark}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            {(!user || isOwner) ? (
              <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            ) : saved ? (
              <svg className="h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {editing ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Edit Listing</h1>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={editType}
                  onChange={(e) => {
                    setEditType(e.target.value as ListingType);
                    if (e.target.value !== "clothes") {
                      setEditClothingType(undefined);
                    }
                  }}
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
                <label className="text-sm font-medium">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {editType === "clothes" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Clothing Type</label>
                <select
                  value={editClothingType || ""}
                  onChange={(e) => setEditClothingType(e.target.value as ClothingType)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select type</option>
                  {clothingTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <ImageUpload
              images={editImageUrls}
              onImagesChange={setEditImageUrls}
              maxImages={10}
              listingId={id}
            />

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
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      typeColors[listing.type]
                    }`}
                  >
                    {typeLabels[listing.type]}
                  </span>
                  {listing.clothingType && (
                    <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                      {clothingTypeLabels[listing.clothingType]}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 text-2xl font-bold">{listing.title}</h1>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {new Date(listing.createdAt.seconds * 1000).toLocaleDateString()}
                  </span>
                  {listing.price > 0 && (
                    <span className="text-lg font-semibold text-green-600">
                      ${listing.price.toFixed(2)}
                    </span>
                  )}
                </div>
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

            {listing.imageUrls && listing.imageUrls.length > 0 && (
              <ListingGallery images={listing.imageUrls} title={listing.title} />
            )}

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Description</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {listing.description}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-6">
              <h2 className="mb-4 text-lg font-semibold">About the Seller</h2>
              {sellerInfo ? (
                <div className="flex items-center gap-4">
                  {sellerInfo.profilePicture && (
                    <img
                      src={sellerInfo.profilePicture}
                      alt={`${sellerInfo.firstName} ${sellerInfo.lastName}`}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">
                      {sellerInfo.firstName} {sellerInfo.lastName}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">User ID: {listing.userId}</p>
              )}
            </div>

            {!isOwner && (
              existingConversationId ? (
                <Link
                  href={`/messages/${existingConversationId}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  View Conversation
                </Link>
              ) : (
                <button
                  onClick={() => {
                    if (user) {
                      setShowDMModal(true);
                    } else {
                      router.push(`/login?redirect=/listings/${id}`);
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message Seller
                </button>
              )
            )}

            {relatedListings.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="mb-4 text-lg font-semibold">More {typeLabels[listing.type]}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedListings.map((related) => (
                    <Link
                      key={related.id}
                      href={`/listings/${related.id}`}
                      className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        {related.price > 0 && (
                          <span className="font-semibold text-green-600">
                            ${related.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold group-hover:text-primary line-clamp-1 text-sm">
                        {related.title}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {related.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showDMModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Message Seller</h2>
            <textarea
              value={dmMessage}
              onChange={(e) => setDmMessage(e.target.value)}
              placeholder="Hi, I'm interested in your listing..."
              rows={4}
              className="mb-4 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDMModal(false);
                  setDmMessage("");
                }}
                className="flex-1 rounded-lg border border-input bg-background py-2 font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSendDM}
                disabled={!dmMessage.trim() || sendingDM}
                className="flex-1 rounded-lg bg-primary py-2 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {sendingDM ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
