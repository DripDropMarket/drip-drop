"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getListings } from "@/app/views/listings";
import { ListingData, ListingType, ClothingType, FilterOptions } from "@/app/lib/types";
import { useAuth } from "@/app/lib/auth-context";

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

const typeColors: Record<ListingType, string> = {
  clothes: "bg-blue-100 text-blue-800",
  textbooks: "bg-green-100 text-green-800",
  tech: "bg-purple-100 text-purple-800",
  furniture: "bg-orange-100 text-orange-800",
  tickets: "bg-red-100 text-red-800",
  services: "bg-teal-100 text-teal-800",
  other: "bg-gray-100 text-gray-800",
};

export default function ListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ListingType | null>(null);
  const [selectedClothingType, setSelectedClothingType] = useState<ClothingType | null>(null);
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
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
  }

  const hasActiveFilters = selectedCategory || selectedClothingType || minPrice || maxPrice || searchQuery;

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center bg-background pb-20">
        <p className="text-muted-foreground">Loading listings...</p>
      </div>
    );
  }

  return (
    <div className="bg-background pb-20">
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {user && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">View:</span>
              {scopeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setScope(option.value)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    scope === option.value
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => {
                  setSelectedCategory(category.value);
                  if (category.value !== "clothes") {
                    setSelectedClothingType(null);
                  }
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-primary"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? "Hide Filters" : "Show Filters"}
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                {Number(Boolean(selectedCategory)) + Number(Boolean(selectedClothingType)) + Number(Boolean(minPrice)) + Number(Boolean(maxPrice)) + Number(Boolean(searchQuery))}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
              {selectedCategory === "clothes" && (
                <div>
                  <label className="mb-2 block text-sm font-medium">Clothing Type</label>
                  <div className="flex flex-wrap gap-2">
                    {clothingTypes.map((type) => (
                      <button
                        key={type.name}
                        onClick={() => setSelectedClothingType(type.value)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          selectedClothingType === type.value
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">Price Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No listings found.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  {listing.imageUrls && listing.imageUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                      +{listing.imageUrls.length - 1}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        typeColors[listing.type]
                      }`}
                    >
                      {typeLabels[listing.type]}
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
                      {new Date(listing.createdAt.seconds * 1000).toLocaleDateString()}
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
