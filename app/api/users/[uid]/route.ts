import { NextRequest, NextResponse } from "next/server";
import { getDB, extractTimestamp } from "../../helpers";
import { ListingData } from "@/app/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const db = getDB();
    
    const userSnap = await db.collection("users").doc(uid).get();
    
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userData = userSnap.data()!;
    
    let school = null;
    if (userData.schoolId) {
      const schoolSnap = await db.collection("schools").doc(userData.schoolId).get();
      if (schoolSnap.exists) {
        const schoolData = schoolSnap.data()!;
        school = {
          id: schoolSnap.id,
          name: schoolData.name,
          state: schoolData.state,
        };
      }
    }
    
    const listingsSnap = await db.collection("listings")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .get();
    
    const listings: ListingData[] = [];
    listingsSnap.forEach((doc) => {
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
    
    return NextResponse.json({
      uid: userSnap.id,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      profilePicture: userData.profilePicture || "",
      schoolId: userData.schoolId || null,
      school,
      listings,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
