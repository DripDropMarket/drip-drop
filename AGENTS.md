# AGENTS.md

This document provides guidance for AI assistants working with the Thryft codebase.

## Project Overview

Thryft is a student marketplace web application for buying and selling items on campus. It uses Next.js 16 App Router, React 19, TypeScript, and Firebase.

## Code Style & Conventions

- **File Organization**: Use the App Router (`app/` directory). Route segments go in subdirectories (`app/listings/`, `app/messages/`, etc.)
- **Components**: Client components use `"use client"` directive. Default to server components unless interactivity is needed.
- **Imports**: Use `@/` alias for imports from the `app/` directory
- **Styling**: Tailwind CSS 4 with CSS variables for theming. Define colors in `app/globals.css` using CSS custom properties.
- **TypeScript**: Define shared types in `app/lib/types.ts`. Use TypeScript inference where possible.
- **Firebase**: Use lazy initialization via `app/lib/firebase-runtime.ts` to avoid initialization issues

## Common Patterns

### Client/Server Component Separation

```tsx
// Server component (default)
import { getListings } from '@/app/lib/db';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  return <ListingDetail listing={listing} />;
}
```

```tsx
// Client component
"use client";

import { useState } from 'react';

export default function InteractiveComponent() {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(!state)}>Toggle</button>;
}
```

### Firebase Operations

```tsx
// In client components, import dynamically
const { doc, getDoc } = await import("firebase/firestore");
const db = getFirebaseDb();
const docRef = doc(db, "collection", "id");
```

### Auth Context

```tsx
"use client";

import { useAuth } from '@/app/lib/auth-context';

export default function Component() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  // Use the auth state
}
```

### Listing Types

Located in `app/lib/types.ts`:

```typescript
type ListingType = "clothes" | "textbooks" | "tech" | "furniture" | "tickets" | "services" | "other";
type ClothingType = "tops" | "bottoms" | "outerwear" | "footwear" | "accessories" | "dresses" | "other";
type Condition = "new" | "like_new" | "used_good" | "used_fair";
type Size = "xs" | "s" | "m" | "l" | "xl" | "xxl";
```

## Environment Setup

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## Testing & Building

# Type check (via TypeScript compiler)
npx tsc --noEmit

# Build (includes lint)
npm run build:ISOLATED
```

## Common Tasks

### Adding a New Page

1. Create directory in `app/` (e.g., `app/new-page/`)
2. Add `page.tsx` for the route content
3. Add `layout.tsx` if a specific layout is needed (wrap children in `LayoutWrapper` for sidebar)
4. Add navigation link in `sidebar.tsx` if applicable

### Modifying Listings

Listings are stored in Firestore `listings` collection. Key fields:
- `title`, `description`, `price`, `type`
- `userId`, `schoolId`
- `imageUrls[]`, `isSold`, `isPrivate`
- `condition`, `size` (for clothes)

### Adding School Support

Schools are in `schools` collection. Users have `schoolId` field. New users are prompted to select a school via `school-selection-popup.tsx`.

### Database Operations

Firestore collections:
- `users/{uid}`: Profile data
- `listings/{id}`: Items for sale
- `conversations/{id}`: Chat threads between users
- `messages/{id}`: Individual messages
- `schools/{id}`: School records
- `savedListings`: User bookmarked items

## UI Components

Reusable components in `app/components/`:
- `sidebar.tsx`: Desktop left navigation
- `bottom-nav.tsx`: Mobile bottom navigation
- `layout-wrapper.tsx`: Page layout with sidebar
- `listing-gallery.tsx`: Carousel for listing images
- `progressive-image.tsx`: Lazy-loaded images
- `image-upload.tsx`: File upload to Firebase Storage
- `school-selection-popup.tsx`: School picker for new users

## Navigation Structure

```
/                    # Landing page (public)
├── listings/        # Browse all listings
│   ├── [id]/        # Listing detail
│   └── create/      # Create new listing
├── messages/        # Chat inbox
│   └── [id]/        # Specific conversation
├── profile/         # User profile & saved items
├── schools/         # School pages
│   └── [id]/        # School-specific listings
└── login/           # Sign in page
```

## Firebase Setup Notes

- Auth uses Google OAuth provider
- Firestore rules should enforce `schoolId` scoping for listings
- Storage stores listing images and chat images
- Client SDK initialized lazily to prevent SSR issues
- Admin SDK available for server-side API routes

## Key Files to Know

| File | Purpose |
|------|---------|
| `app/lib/auth-context.tsx` | Authentication state and methods |
| `app/lib/firebase-runtime.ts` | Firebase client initialization |
| `app/lib/types.ts` | TypeScript type definitions |
| `app/components/sidebar.tsx` | Main navigation |
| `app/globals.css` | Tailwind theme and CSS variables |
