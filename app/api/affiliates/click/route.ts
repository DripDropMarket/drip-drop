import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "../../../lib/firebase-admin";
import { Transaction } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const { affiliateId } = await request.json();
    
    if (!affiliateId) {
      return NextResponse.json({ error: "Missing affiliateId" }, { status: 400 });
    }

    const { firestore } = await initFirebaseAdmin();
    const db = firestore();
    const affiliateRef = db.collection("affiliates").doc(affiliateId);

    await db.runTransaction(async (transaction: Transaction) => {
      const affiliateDoc = await transaction.get(affiliateRef);
      if (!affiliateDoc.exists) {
        throw new Error("Affiliate not found");
      }
      
      const data = affiliateDoc.data()!;
      if (!data.isActive) return;

      transaction.update(affiliateRef, {
        clickCount: (data.clickCount || 0) + 1,
        updatedAt: new Date(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error tracking click:", error);
    if (error instanceof Error && error.message === "Affiliate not found") {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 });
  }
}
