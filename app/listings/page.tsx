"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getListings } from "@/app/views/listings";
import { ListingData, ListingType, ClothingType, FilterOptions, formatDate, Condition, Size } from "@/app/lib/types";
import { useAuth } from "@/app/lib/auth-context";
import ProgressiveImage from "@/app/components/progressive-image";

type ScopeType = "school" | "state" | "all";

const categories: { name: string; value: ListingType | null; icon: string }[] = [
  { name: "All", value: null, icon: "📋" },
  { name: "Clothes", value: "clothes", icon: "👕" },
  { name: "Tech", value: "tech", icon: "💻" },
  { name: "Textbooks", value: "textbooks", icon: "📚" },
  { name: "Furniture", value: "furniture", icon: "🪑" },
  { name: "Tickets", value: "tickets", icon: "🎫" },
  { name: "Services", value: "services", icon: "🔧" },
  { name: "Other", value: "other", icon: "📦" },
];

const clothingTypes: { name: string; value: ClothingType | null }[] = [
  { name: "All", value: null },
  { name: "Tops", value: "tops" },
  { name: "Bottoms", value: "bottoms" },
  { name: "Outerwear", value: "outerwear" },
  { name: "Footwear", value: "footwear" },
  { name: "Accessories", value: "accessories" },
  { name: "Dresses", value: "dresses" },
];

const conditions: { name: string; value: Condition | null }[] = [
  { name: "All", value: null },
  { name: "New", value: "new" },
  { name: "Like New", value: "like_new" },
  { name: "Used - Good", value: "used_good" },
  { name: "Used - Fair", value: "used_fair" },
];

const sizes: { name: string; value: Size | null }[] = [
  { name: "All", value: null },
  { name: "XS", value: "xs" },
  { name: "S", value: "s" },
  { name: "M", value: "m" },
  { name: "L", value: "l" },
  { name: "XL", value: "xl" },
  { name: "XXL", value: "xxl" },
];

const scopeOptions: { name: string; value: ScopeType; icon: string }[] = [
  { name: "My School", value: "school", icon: "🎓" },
  { name: "My State", value: "state", icon: "🗺️" },
  { name: "All Listings", value: "all", icon: "🌍" },
];

const typeLabels: Record<ListingType, string> = {
  clothes: "Clothes",
  textbooks: "Textbooks",
  tech: "Tech",
  furniture: "Furniture",
  tickets: "Tickets",
  services: "Services",
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

export default function ListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ListingType | null>(null);
  const [selectedClothingType, setSelectedClothingType] = useState<ClothingType | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [scope, setScope] = useState<ScopeType>("school");

  useEffect(() => {
    async function fetchListings() {
      try {
        const filters: FilterOptions = {
          scope: scope,
        };

        if (selectedCategory) filters.type = selectedCategory;
        if (selectedClothingType) filters.clothingType = selectedClothingType;
        if (selectedCondition) filters.condition = selectedCondition;
        if (selectedSize) filters.size = selectedSize;
        if (minPrice) filters.minPrice = parseFloat(minPrice);
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
        if (searchQuery) filters.search = searchQuery;

        const data = await getListings(filters);
        setListings(data);
      } catch (err) {
        console.error("Failed to load listings:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchListings();
    }
  }, [selectedCategory, selectedClothingType, minPrice, maxPrice, searchQuery, scope, authLoading]);

  function clearFilters() {
    setSelectedCategory(null);
    setSelectedClothingType(null);
    setSelectedCondition(null);
    setSelectedSize(null);
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
  }

  const hasActiveFilters = selectedCategory || selectedClothingType || selectedCondition || selectedSize || minPrice || maxPrice || searchQuery;

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pb-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground font-medium">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <main className="container mx-auto max-w-7xl px-4 pt-4 lg:pt-8">
        <div className="sticky top-0 z-30 -mx-4 bg-background/95 px-4 pb-4 pt-2 backdrop-blur-xl lg:static lg:mx-0 lg:bg-transparent lg:p-0">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border-none bg-muted/50 py-3.5 pl-11 pr-4 text-base font-medium shadow-sm ring-1 ring-inset ring-border/50 transition-all placeholder:text-muted-foreground hover:bg-muted/70 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <svg
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex flex-col gap-3">
              {user && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                  {scopeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setScope(option.value)}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                        scope === option.value
                          ? "bg-primary text-white shadow-md shadow-primary/25"
                          : "bg-card text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => {
                      setSelectedCategory(category.value);
                      if (category.value !== "clothes") {
                        setSelectedClothingType(null);
                      }
                    }}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      selectedCategory === category.value
                        ? "bg-foreground text-background shadow-lg"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? "Hide Filters" : "Filter Results"}
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {Number(Boolean(selectedCategory)) + Number(Boolean(selectedClothingType)) + Number(Boolean(selectedCondition)) + Number(Boolean(selectedSize)) + Number(Boolean(minPrice)) + Number(Boolean(maxPrice)) + Number(Boolean(searchQuery))}
                  </span>
                )}
            </button>

            {showFilters && (
              <div className="animate-in slide-in-from-top-2 duration-200 space-y-4 rounded-2xl bg-muted/30 p-4 ring-1 ring-inset ring-border/50">
                {selectedCategory === "clothes" && (
                  <div>
                    <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clothing Type</label>
                    <div className="flex flex-wrap gap-2">
                      {clothingTypes.map((type) => (
                        <button
                          key={type.name}
                          onClick={() => setSelectedClothingType(type.value)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            selectedClothingType === type.value
                              ? "bg-primary text-white"
                              : "bg-background text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted"
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</label>
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((cond) => (
                      <button
                        key={cond.name}
                        onClick={() => setSelectedCondition(cond.value)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedCondition === cond.value
                            ? "bg-primary text-white"
                            : "bg-background text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted"
                        }`}
                      >
                        {cond.name}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCategory === "clothes" && (
                  <div>
                    <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size</label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size.name}
                          onClick={() => setSelectedSize(size.value)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            selectedSize === size.value
                              ? "bg-primary text-white"
                              : "bg-background text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted"
                          }`}
                        >
                          {size.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price Range</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full rounded-xl border-none bg-background py-2.5 pl-7 pr-3 text-sm shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <span className="text-muted-foreground font-medium">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full rounded-xl border-none bg-background py-2.5 pl-7 pr-3 text-sm shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={clearFilters}
                      className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">No listings found</h3>
            <p className="text-muted-foreground max-w-sm mt-2">Try adjusting your filters or search query to find what you're looking for.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover hover:scale-105"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing, index) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border hover:-translate-y-1"
              >
                <div className="aspect-square w-full overflow-hidden bg-muted relative">
                  {listing.imageUrls && listing.imageUrls.length > 0 ? (
                    <ProgressiveImage
                      src={listing.imageUrls[0]}
                      alt={listing.title}
                      className="transition-transform duration-500 group-hover:scale-110"
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
                        {conditionLabels[listing.condition]}
                      </span>
                    )}
                    {listing.size && (
                      <span className="inline-block backdrop-blur-md bg-black/40 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                        {sizeLabels[listing.size]}
                      </span>
                    )}
                    <span className="inline-block backdrop-blur-md bg-black/40 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {typeLabels[listing.type]}
                    </span>
                  </div>
                  {listing.imageUrls && listing.imageUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
                      +{listing.imageUrls.length - 1}
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1 p-3 sm:p-4">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1 mb-1">
                    {listing.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                    {listing.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    {listing.price > 0 ? (
                      <span className="font-bold text-base sm:text-lg text-primary">
                        ${listing.price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="font-bold text-base sm:text-lg text-green-600">
                        Free
                      </span>
                    )}
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
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
