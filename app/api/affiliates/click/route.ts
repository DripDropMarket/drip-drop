import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "../../../lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { affiliateId } = await request.json();
    
    if (!affiliateId) {
      return NextResponse.json({ error: "Missing affiliateId" }, { status: 400 });
    }

    const { firestore } = await initFirebaseAdmin();
    const db = firestore();
    const affiliateRef = db.collection("affiliates").doc(affiliateId);

    await db.runTransaction(async (transaction: any) => {
      const affiliateDoc = await transaction.get(affiliateRef);
      if (!affiliateDoc.exists) return;
      
      const data = affiliateDoc.data();
      if (!data.isActive) return;

      transaction.update(affiliateRef, {
        clickCount: (data.clickCount || 0) + 1,
        updatedAt: new Date(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking click:", error);
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 });
  }
}
