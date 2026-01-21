"use client";

import Link from "next/link";
import ProgressiveImage from "@/app/components/progressive-image";
import { ListingData } from "@/app/lib/types";
import { formatDate } from "@/app/lib/types";

const conditionLabels: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  used_good: "Good",
  used_fair: "Fair",
};

const sizeLabels: Record<string, string> = {
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
  xxl: "XXL",
};

const genderLabels: Record<string, string> = {
  mens: "Men's",
  womens: "Women's",
  unisex: "Unisex",
};

const typeLabels: Record<string, string> = {
  clothes: "CLOTHES",
  textbooks: "BOOKS",
  tech: "TECH",
  furniture: "FURNITURE",
  tickets: "TICKETS",
  services: "SERVICES",
  other: "OTHER",
};

interface ListingCardProps {
  listing: ListingData;
  index?: number;
  isSold?: boolean;
  actionButtons?: React.ReactNode;
}

export default function ListingCard({ listing, index = 0, isSold = false, actionButtons }: ListingCardProps) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-border hover:-translate-y-1 ${isSold ? "opacity-75 grayscale" : ""}`}
    >
      <div className="aspect-square w-full overflow-hidden bg-muted relative">
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
              {conditionLabels[listing.condition]}
            </span>
          )}
          {listing.size && (
            <span className="inline-block backdrop-blur-md bg-black/40 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
              {sizeLabels[listing.size]}
            </span>
          )}
          {listing.gender && (
            <span className="inline-block backdrop-blur-md bg-black/40 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
              {genderLabels[listing.gender]}
            </span>
          )}
          <span className="inline-block backdrop-blur-md bg-black/40 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {typeLabels[listing.type]}
          </span>
        </div>
        {listing.imageUrls && listing.imageUrls.length > 1 && !isSold && (
          <div className="absolute bottom-2 right-2 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
            +{listing.imageUrls.length - 1}
          </div>
        )}
        {isSold && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              SOLD
            </span>
          </div>
        )}
        {actionButtons && (
          <div className="absolute top-2 left-2 z-10">
            {actionButtons}
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        <h3 className={`font-semibold text-sm sm:text-base line-clamp-1 mb-1 ${isSold ? "text-muted-foreground" : "text-foreground"}`}>
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
  );
}
