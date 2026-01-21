import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken, getAdminAuth } from "../helpers";
import { ListingType, CreateListingInput, ListingData, ClothingType, TimestampData, Condition, Size, Gender } from "@/app/lib/types";

function extractTimestamp(createdAt: any): TimestampData {
  if (!createdAt) {
    return { seconds: 0, nanoseconds: 0 };
  }
  
  if (typeof createdAt === 'object') {
    if ('seconds' in createdAt && 'nanoseconds' in createdAt) {
      return {
        seconds: createdAt.seconds,
        nanoseconds: createdAt.nanoseconds,
      };
    }
    if ('_seconds' in createdAt && '_nanoseconds' in createdAt) {
      return {
        seconds: createdAt._seconds,
        nanoseconds: createdAt._nanoseconds,
      };
    }
    if (createdAt instanceof Date || typeof createdAt.getTime === 'function') {
      const time = createdAt.getTime();
      return {
        seconds: Math.floor(time / 1000),
        nanoseconds: 0,
      };
    }
  }
  
  if (typeof createdAt === 'number') {
    return {
      seconds: createdAt,
      nanoseconds: 0,
    };
  }
  
  return { seconds: 0, nanoseconds: 0 };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as ListingType | null;
    const clothingType = searchParams.get("clothingType") as ClothingType | null;
    const condition = searchParams.get("condition") as Condition | null;
    const size = searchParams.get("size") as Size | null;
    const gender = searchParams.get("gender") as Gender | null;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const scope = searchParams.get("scope") as "school" | "state" | "all" | null;

    const db = getDB();
    const listingsRef = db.collection("listings");

    let queryRef = listingsRef as any;
    let hasScopeFilter = false;

    if (scope && scope !== "all") {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const firebaseAuth = getAdminAuth();
          const token = authHeader.split(" ")[1];
          const decodedToken = await firebaseAuth.verifyIdToken(token);
          const userId = decodedToken.uid;

          const userDoc = await db.collection("users").doc(userId).get();
          const userData = userDoc.data();
          const userSchoolId = userData?.schoolId;

          if (userSchoolId) {
            if (scope === "school") {
              queryRef = listingsRef.where("schoolId", "==", userSchoolId);
              hasScopeFilter = true;
            } else if (scope === "state") {
              const schoolDoc = await db.collection("schools").doc(userSchoolId).get();
              const schoolData = schoolDoc.data();
              if (schoolData) {
                const stateSchoolsSnapshot = await db.collection("schools")
                  .where("state", "==", schoolData.state)
                  .get();
                
                const stateSchoolIds = stateSchoolsSnapshot.docs.map((s) => s.id);
                if (stateSchoolIds.length > 0) {
                  const maxInClause = 10;
                  if (stateSchoolIds.length <= maxInClause) {
                    queryRef = listingsRef.where("schoolId", "in", stateSchoolIds);
                    hasScopeFilter = true;
                  } else {
                    return NextResponse.json(
                      { error: "Too many schools in this state to filter. Please try again later." },
                      { status: 400 }
                    );
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Error filtering by scope:", err);
          return NextResponse.json({ error: "Failed to apply scope filter" }, { status: 400 });
        }
      }
    }

    const querySnapshot = await queryRef.orderBy("createdAt", "desc").get();
    
    let listings: ListingData[] = [];
    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      listings.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        price: data.price || 0,
        type: data.type,
        clothingType: data.clothingType,
        condition: data.condition,
        size: data.size,
        gender: data.gender,
        userId: data.userId,
        schoolId: data.schoolId,
        isPrivate: data.isPrivate || false,
        isSold: data.isSold || false,
        createdAt: extractTimestamp(data.createdAt),
        imageUrls: data.imageUrls,
      });
    });

    const authHeader = request.headers.get("Authorization");
    let currentUserId: string | null = null;
    let currentUserSchoolId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const firebaseAuth = getAdminAuth();
        const token = authHeader.split(" ")[1];
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        currentUserId = decodedToken.uid;

        const userDoc = await db.collection("users").doc(currentUserId).get();
        const userData = userDoc.data();
        currentUserSchoolId = userData?.schoolId;
      } catch (err) {
        console.error("Error verifying token:", err);
      }
    }

    listings = listings.filter((listing) => {
      if (listing.isSold) return false;
      if (!listing.isPrivate) return true;
      if (currentUserSchoolId && listing.schoolId === currentUserSchoolId) return true;
      return false;
    });

    if (type) {
      listings = listings.filter((l) => l.type === type);
    }

    if (clothingType) {
      listings = listings.filter((l) => l.clothingType === clothingType);
    }

    if (condition) {
      listings = listings.filter((l) => l.condition === condition);
    }

    if (size) {
      listings = listings.filter((l) => l.size === size);
    }

    if (gender) {
      listings = listings.filter((l) => l.gender === gender);
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      listings = listings.filter((l) => l.price >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      listings = listings.filter((l) => l.price <= max);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(searchLower) ||
          l.description.toLowerCase().includes(searchLower)
      );
    }
    
    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    
    const body: CreateListingInput = await request.json();
    
    if (!body.title || !body.description || !body.type || body.price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, type, price" },
        { status: 400 }
      );
    }
    
    const validTypes: ListingType[] = ["clothes", "textbooks", "tech", "furniture", "tickets", "services", "other"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: "Invalid listing type" },
        { status: 400 }
      );
    }
    
    const db = getDB();
    const listingsRef = db.collection("listings");
    
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const schoolId = userData?.schoolId;
    
    const listingData: Record<string, unknown> = {
      title: body.title,
      description: body.description,
      price: body.price,
      type: body.type,
      userId: userId,
      schoolId: schoolId || null,
      isPrivate: body.isPrivate !== false,
      isSold: false,
      createdAt: new Date(),
      imageUrls: body.imageUrls || [],
    };
    
    if (body.clothingType !== undefined) {
      listingData.clothingType = body.clothingType;
    }
    
    if (body.condition !== undefined) {
      listingData.condition = body.condition;
    }
    
    if (body.size !== undefined) {
      listingData.size = body.size;
    }
    
    if (body.gender !== undefined) {
      listingData.gender = body.gender;
    }
    
    const docRef = await listingsRef.add(listingData);
    
    const responseData: Record<string, unknown> = {
      id: docRef.id,
      title: body.title,
      description: body.description,
      price: body.price,
      type: body.type,
      userId: userId,
      schoolId: schoolId || null,
      isPrivate: body.isPrivate !== false,
      isSold: false,
      createdAt: {
        seconds: Date.now() / 1000,
        nanoseconds: 0,
      },
      imageUrls: body.imageUrls || [],
    };
    
    if (body.clothingType !== undefined) {
      responseData.clothingType = body.clothingType;
    }
    
    if (body.condition !== undefined) {
      responseData.condition = body.condition;
    }
    
    if (body.size !== undefined) {
      responseData.size = body.size;
    }
    
    if (body.gender !== undefined) {
      responseData.gender = body.gender;
    }
    
    return NextResponse.json(responseData, { status: 201 });
    
  } catch (error) {
    console.error("Error creating listing:", error);
    
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
