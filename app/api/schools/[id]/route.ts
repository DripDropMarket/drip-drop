import { NextRequest, NextResponse } from "next/server";
import { getDB, extractTimestamp } from "../../helpers";
import { ListingData, MemberData } from "@/app/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: schoolId } = await params;
    const db = getDB();
    
    const schoolSnap = await db.collection("schools").doc(schoolId).get();
    
    if (!schoolSnap.exists) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    
    const schoolData = schoolSnap.data()!;
    
    const membersQuery = db.collection("users").where("schoolId", "==", schoolId);
    const membersSnap = await membersQuery.get();
    
    const adminIds = schoolData.adminIds || [];
    const members: MemberData[] = membersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        profilePicture: data.profilePicture || "",
        isAdmin: adminIds.includes(doc.id),
      };
    });
    
    const listingsSnap = await db.collection("listings")
      .where("schoolId", "==", schoolId)
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
      id: schoolSnap.id,
      name: schoolData.name,
      state: schoolData.state,
      memberCount: schoolData.memberCount || 0,
      createdAt: {
        seconds: schoolData.createdAt?.seconds || 0,
        nanoseconds: schoolData.createdAt?.nanoseconds || 0,
      },
      adminIds: schoolData.adminIds || [],
      members,
      listings,
    });
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
  }
}
