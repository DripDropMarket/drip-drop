"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { getListing, updateListing, deleteListing, getListings, markListingAsSold, markListingAsAvailable } from "@/app/views/listings";
import { toggleSavedListing, getSavedListings } from "@/app/views/saved";
import { createConversation } from "@/app/views/messaging";
import { ListingData, ListingType, ClothingType, Condition, Size, Gender, formatDate } from "@/app/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import ImageUpload from "@/app/components/image-upload";
import ListingGallery from "@/app/components/listing-gallery";
import ProgressiveImage from "@/app/components/progressive-image";

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

const conditionLabels: Record<Condition, string> = {
  new: "New",
  like_new: "Like New",
  used_good: "Used - Good",
  used_fair: "Used - Fair",
};

const sizeLabels: Record<Size, string> = {
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
  xxl: "XXL",
};

const genderLabels: Record<Gender, string> = {
  mens: "Men's",
  womens: "Women's",
  unisex: "Unisex",
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

const conditionOptions: { value: Condition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "used_good", label: "Used - Good" },
  { value: "used_fair", label: "Used - Fair" },
];

const sizeOptions: { value: Size; label: string }[] = [
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
  { value: "xxl", label: "XXL" },
];

const genderOptions: { value: Gender; label: string }[] = [
  { value: "mens", label: "Men's" },
  { value: "womens", label: "Women's" },
  { value: "unisex", label: "Unisex" },
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
  const [editCondition, setEditCondition] = useState<Condition | undefined>(undefined);
  const [editSize, setEditSize] = useState<Size | undefined>(undefined);
  const [editGender, setEditGender] = useState<Gender | undefined>(undefined);
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [editIsPrivate, setEditIsPrivate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [dmMessage, setDmMessage] = useState("");
  const [sendingDM, setSendingDM] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<{ firstName: string; lastName: string; profilePicture: string; schoolId?: string } | null>(null);
  const [sellerSchool, setSellerSchool] = useState<{ name: string; state: string } | null>(null);
  const [relatedListings, setRelatedListings] = useState<ListingData[]>([]);
  const [existingConversationId, setExistingConversationId] = useState<string | null>(null);
  const [markingSold, setMarkingSold] = useState(false);

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
        setEditCondition(data.condition);
        setEditSize(data.size);
        setEditGender(data.gender);
        setEditImageUrls(data.imageUrls || []);
        setEditIsPrivate(data.isPrivate !== false);

        if (db) {
          const userSnap = await getDoc(doc(db, "users", data.userId));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setSellerInfo({
              firstName: userData.firstName,
              lastName: userData.lastName,
              profilePicture: userData.profilePicture,
              schoolId: userData.schoolId,
            });

            if (userData.schoolId) {
              const schoolSnap = await getDoc(doc(db, "schools", userData.schoolId));
              if (schoolSnap.exists()) {
                const schoolData = schoolSnap.data();
                setSellerSchool({
                  name: schoolData.name,
                  state: schoolData.state,
                });
              }
            }
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
        condition: editCondition,
        size: editSize,
        gender: editGender,
        imageUrls: editImageUrls.length > 0 ? editImageUrls : undefined,
        isPrivate: editIsPrivate,
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
      router.replace("/listings");
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
      router.replace(`/messages/${conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingDM(false);
    }
  }

  async function handleMarkAsSold() {
    if (!listing) return;
    if (!confirm(listing.isSold ? "Mark this listing as available again?" : "Mark this listing as sold?")) return;
    
    setMarkingSold(true);
    try {
      if (listing.isSold) {
        const updated = await markListingAsAvailable(listing.id);
        setListing(updated);
      } else {
        const updated = await markListingAsSold(listing.id);
        setListing(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update listing status");
    } finally {
      setMarkingSold(false);
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

            <div className="grid gap-4 sm:grid-cols-3">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Condition</label>
                <select
                  value={editCondition || ""}
                  onChange={(e) => setEditCondition(e.target.value as Condition || undefined)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select</option>
                  {conditionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {editType === "clothes" && (
              <div className="grid gap-4 sm:grid-cols-2">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Size</label>
                  <select
                    value={editSize || ""}
                    onChange={(e) => setEditSize(e.target.value as Size || undefined)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select size</option>
                    {sizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender</label>
                  <select
                    value={editGender || ""}
                    onChange={(e) => setEditGender(e.target.value as Gender || undefined)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
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

            <div className="rounded-lg border border-border bg-card p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsPrivate}
                  onChange={(e) => setEditIsPrivate(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-sm">Private to my school</p>
                  <p className="text-xs text-muted-foreground">
                    Only students from your school will see this listing
                  </p>
                </div>
              </label>
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
                  {listing.condition && (
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      {conditionLabels[listing.condition]}
                    </span>
                  )}
                  {listing.size && (
                    <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                      {sizeLabels[listing.size]}
                    </span>
                  )}
                  {listing.gender && (
                    <span className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-800">
                      {genderLabels[listing.gender]}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 text-2xl font-bold">{listing.title}</h1>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {formatDate(listing.createdAt)}
                  </span>
                  {listing.price > 0 && (
                    <span className="text-lg font-semibold text-green-600">
                      ${listing.price.toFixed(2)}
                    </span>
                  )}
                </div>
                {listing.isSold && (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      SOLD
                    </span>
                  </div>
                )}
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
                    onClick={handleMarkAsSold}
                    disabled={markingSold}
                    className={`inline-flex h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors ${
                      listing.isSold
                        ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                        : "border-yellow-200 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                    } disabled:opacity-50`}
                  >
                    {markingSold ? "..." : listing.isSold ? "Mark Available" : "Mark Sold"}
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
                  <Link
                    href={`/users/${listing.userId}`}
                    className="flex items-center gap-4 hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors flex-1"
                  >
                    {sellerInfo.profilePicture && (
                      <img
                        src={sellerInfo.profilePicture}
                        alt={`${sellerInfo.firstName} ${sellerInfo.lastName}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {sellerInfo.firstName} {sellerInfo.lastName}
                      </p>
                      {sellerSchool && sellerInfo.schoolId ? (
                        <button
                          onClick={() => router.push(`/schools/${sellerInfo.schoolId}`)}
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <span>{sellerSchool.name}</span>
                          <span className="text-muted-foreground/60">({sellerSchool.state})</span>
                        </button>
                      ) : sellerSchool ? (
                        <p className="text-sm text-muted-foreground">
                          {sellerSchool.name} ({sellerSchool.state})
                        </p>
                      ) : null}
                    </div>
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">User ID: {listing.userId}</p>
              )}
            </div>

            {!isOwner && listing.isSold && (
              <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted py-3 font-medium text-muted-foreground">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                This item has been sold
              </div>
            )}

            {!isOwner && !listing.isSold && (
              <div className="flex gap-3">
                {existingConversationId ? (
                  <Link
                    href={`/messages/${existingConversationId}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover"
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
                        router.replace(`/login?redirect=/listings/${id}`);
                      }
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-hover"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message Seller
                  </button>
                )}
                <button
                  onClick={user ? handleToggleSave : () => router.replace(`/login?redirect=/listings/${id}`)}
                  disabled={savingBookmark}
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-input bg-background px-0 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {saved ? (
                    <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {relatedListings.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="mb-4 text-lg font-semibold">More {typeLabels[listing.type]}</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedListings.map((related, index) => (
                    <Link
                      key={related.id}
                      href={`/listings/${related.id}`}
                      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border hover:-translate-y-1"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-muted relative">
                        {related.imageUrls && related.imageUrls.length > 0 ? (
                          <ProgressiveImage
                            src={related.imageUrls[0]}
                            alt={related.title}
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
                          {related.condition && (
                            <span className="inline-block backdrop-blur-md bg-black/40 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                              {conditionLabels[related.condition]}
                            </span>
                          )}
                          {related.size && (
                            <span className="inline-block backdrop-blur-md bg-black/40 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                              {sizeLabels[related.size]}
                            </span>
                          )}
                          {related.gender && (
                            <span className="inline-block backdrop-blur-md bg-black/40 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                              {genderLabels[related.gender]}
                            </span>
                          )}
                        </div>
                        {related.imageUrls && related.imageUrls.length > 1 && (
                          <div className="absolute bottom-2 right-2 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
                            +{related.imageUrls.length - 1}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 p-3 sm:p-4">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1 mb-1">
                          {related.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                          {related.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          {related.price > 0 ? (
                            <span className="font-bold text-base sm:text-lg text-primary">
                              ${related.price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="font-bold text-base sm:text-lg text-green-600">
                              Free
                            </span>
                          )}
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatDate(related.createdAt)}
                          </span>
                        </div>
                      </div>
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
