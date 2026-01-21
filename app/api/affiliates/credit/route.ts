import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "../../../lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { affiliateId, referredUserId, referredEmail } = await request.json();
    
    if (!affiliateId || !referredUserId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { firestore } = await initFirebaseAdmin();
    const db = firestore();

    const affiliateRef = db.collection("affiliates").doc(affiliateId);
    const conversionRef = db.collection("affiliateConversions").doc();
    const referredUserRef = db.collection("users").doc(referredUserId);

    await db.runTransaction(async (transaction: any) => {
      const affiliateDoc = await transaction.get(affiliateRef);
      
      if (!affiliateDoc.exists) {
        throw new Error("Affiliate not found");
      }

      const affiliateData = affiliateDoc.data()!;
      
      if (!affiliateData.isActive) {
        throw new Error("Affiliate is not active");
      }

      const referredUserDoc = await transaction.get(referredUserRef);
      if (!referredUserDoc.exists) {
        throw new Error("Referred user not found");
      }
      const referredUserData = referredUserDoc.data()!;
      
      if (referredUserData.referredBy) {
        throw new Error("User already referred");
      }

      transaction.set(conversionRef, {
        affiliateId,
        referredUserId,
        referredEmail,
        commission: affiliateData.commissionRate || 0,
        status: "pending",
        createdAt: new Date(),
      });

      transaction.update(affiliateRef, {
        signUpCount: (affiliateData.signUpCount || 0) + 1,
        updatedAt: new Date(),
      });

      transaction.update(referredUserRef, {
        referredBy: affiliateId,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error crediting affiliate:", error);
    
    if (error instanceof Error && error.message === "User already referred") {
      return NextResponse.json(
        { error: "User already referred" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to credit affiliate" },
      { status: 500 }
    );
  }
}
