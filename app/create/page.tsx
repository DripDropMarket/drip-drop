"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { createListing } from "@/app/views/listings";
import { ListingType, ClothingType } from "@/app/lib/types";
import ImageUpload from "@/app/components/image-upload";

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

export default function CreateListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<ListingType>("other");
  const [clothingType, setClothingType] = useState<ClothingType | undefined>(undefined);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-background pb-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <main className="container mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold">Create a Listing</h1>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="mb-4 text-lg text-muted-foreground">
              Sign in to create a listing
            </p>
            <Link
              href="/login?redirect=/create"
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Sign In
            </Link>
          </div>
        </main>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        setError("Please enter a valid price");
        setSubmitting(false);
        return;
      }

      const listing = await createListing({
        title,
        description,
        price: priceNum,
        type,
        clothingType: type === "clothes" ? clothingType : undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
      router.push(`/listings/${listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Create a Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you selling?"
              required
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Category
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as ListingType);
                  if (e.target.value !== "clothes") {
                    setClothingType(undefined);
                  }
                }}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price ($)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {type === "clothes" && (
            <div className="space-y-2">
              <label htmlFor="clothingType" className="text-sm font-medium">
                Clothing Type
              </label>
              <select
                id="clothingType"
                value={clothingType || ""}
                onChange={(e) => setClothingType(e.target.value as ClothingType)}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
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
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item..."
              required
              rows={5}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <ImageUpload
            images={imageUrls}
            onImagesChange={setImageUrls}
            maxImages={10}
          />

          <div className="flex gap-4">
            <Link
              href="/listings"
              className="flex h-11 items-center justify-center rounded-lg border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
