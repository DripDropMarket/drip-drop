"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { createListing } from "@/app/views/listings";
import { ListingType, ClothingType, Condition, Size, Gender } from "@/app/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
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

export default function CreateListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<ListingType>("other");
  const [clothingType, setClothingType] = useState<ClothingType | undefined>(undefined);
  const [condition, setCondition] = useState<Condition | undefined>(undefined);
  const [size, setSize] = useState<Size | undefined>(undefined);
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [schoolName, setSchoolName] = useState("your school");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchoolName() {
      if (user && db) {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.schoolId) {
            const schoolSnap = await getDoc(doc(db, "schools", userData.schoolId));
            if (schoolSnap.exists()) {
              setSchoolName(schoolSnap.data().name);
            }
          }
        }
      }
    }
    fetchSchoolName();
  }, [user]);

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
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center p-4">
        <main className="w-full max-w-md text-center space-y-6">
          <div className="space-y-2">
             <h1 className="text-3xl font-bold tracking-tight">Join to Sell</h1>
             <p className="text-muted-foreground">Sign in to start selling your items.</p>
          </div>
          <Link
            href="/login?redirect=/create"
            className="inline-flex w-full h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5"
          >
            Sign In to Continue
          </Link>
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
        condition,
        size,
        gender,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        isPrivate,
      });
      router.replace(`/listings/${listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="container mx-auto max-w-xl px-4 py-8 md:py-12">
        <div className="mb-8 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Create Listing</h1>
          <p className="text-muted-foreground">Fill in the details to post your item.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 ring-1 ring-red-100 dark:bg-red-900/10 dark:text-red-400 dark:ring-red-900/20">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you selling?"
                required
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold leading-none">
                Photos
              </label>
              <ImageUpload
                images={imageUrls}
                onImagesChange={setImageUrls}
                maxImages={10}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold leading-none">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe condition, size, brand, etc..."
                required
                rows={5}
                className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none transition-all"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-semibold leading-none">
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    className="flex h-12 w-full rounded-xl border border-input bg-background py-3 pl-8 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-semibold leading-none">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as ListingType);
                      if (e.target.value !== "clothes") {
                        setClothingType(undefined);
                      }
                    }}
                    className="flex h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="condition" className="text-sm font-semibold leading-none">
                  Condition
                </label>
                <div className="relative">
                  <select
                    id="condition"
                    value={condition || ""}
                    onChange={(e) => setCondition(e.target.value as Condition || undefined)}
                    className="flex h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  >
                    <option value="">Select</option>
                    {conditionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {type === "clothes" && (
              <div className="grid gap-6 sm:grid-cols-3 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <label htmlFor="clothingType" className="text-sm font-semibold leading-none">
                    Clothing Type
                  </label>
                  <div className="relative">
                    <select
                      id="clothingType"
                      value={clothingType || ""}
                      onChange={(e) => setClothingType(e.target.value as ClothingType)}
                      className="flex h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                    >
                      <option value="">Select type</option>
                      {clothingTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                     <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                       <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                       </svg>
                     </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="size" className="text-sm font-semibold leading-none">
                    Size
                  </label>
                  <div className="relative">
                    <select
                      id="size"
                      value={size || ""}
                      onChange={(e) => setSize(e.target.value as Size || undefined)}
                      className="flex h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                    >
                      <option value="">Select size</option>
                      {sizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                     <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                       <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                       </svg>
                     </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="gender" className="text-sm font-semibold leading-none">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      value={gender || ""}
                      onChange={(e) => setGender(e.target.value as Gender || undefined)}
                      className="flex h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                    >
                      <option value="">Select</option>
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                     <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                       <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                       </svg>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-sm">Private to my school</p>
                <p className="text-xs text-muted-foreground">
                  Only students from {schoolName} will see this listing
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              href="/listings"
              className="flex h-12 items-center justify-center rounded-xl border border-input bg-background px-8 text-sm font-medium transition-all hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Create Listing"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
