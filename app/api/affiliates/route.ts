import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "../../lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { userId, name, commissionRate = 0 } = await request.json();
    
    if (!userId || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { firestore } = await initFirebaseAdmin();
    const db = firestore();

    const affiliateRef = db.collection("affiliates").doc();
    const code = affiliateRef.id.substring(0, 8);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const linkUrl = `${baseUrl}/?utm_source=affiliate&utm_campaign=${code}&utm_affiliate=${affiliateRef.id}`;

    await affiliateRef.set({
      userId,
      name,
      code,
      linkUrl,
      clickCount: 0,
      signUpCount: 0,
      commissionRate,
      isActive: true,
      createdAt: new Date(),
    });

    return NextResponse.json({
      id: affiliateRef.id,
      code,
      linkUrl,
    });
  } catch (error: any) {
    console.error("Error creating affiliate:", error);
    return NextResponse.json(
      { error: "Failed to create affiliate" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const { firestore } = await initFirebaseAdmin();
    const db = firestore();

    const snapshot = await db.collection("affiliates")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .get();

    const affiliates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ affiliates });
  } catch (error: any) {
    console.error("Error fetching affiliates:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliates" },
      { status: 500 }
    );
  }
}
