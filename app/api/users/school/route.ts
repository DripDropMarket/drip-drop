import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../../helpers";

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    
    const body = await request.json();
    const { schoolId } = body;
    
    if (!schoolId) {
      return NextResponse.json(
        { error: "Missing required field: schoolId" },
        { status: 400 }
      );
    }

    const db = getDB();
    const userRef = db.collection("users").doc(userId);
    const schoolRef = db.collection("schools").doc(schoolId);
    
    const [userDoc, schoolDoc] = await Promise.all([
      userRef.get(),
      schoolRef.get()
    ]);

    if (!schoolDoc.exists) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const previousSchoolId = userData?.schoolId;

    await db.runTransaction(async (transaction) => {
      if (previousSchoolId) {
        const prevSchoolRef = db.collection("schools").doc(previousSchoolId);
        const prevSchoolDoc = await transaction.get(prevSchoolRef);
        if (prevSchoolDoc.exists) {
          const prevSchoolData = prevSchoolDoc.data();
          const prevCount = prevSchoolData?.memberCount || 0;
          if (prevCount > 0) {
            transaction.update(prevSchoolRef, { memberCount: prevCount - 1 });
          }
        }
      }

      transaction.update(userRef, { schoolId });
      transaction.update(schoolRef, { memberCount: (schoolDoc.data()?.memberCount || 0) + 1 });
    });

    return NextResponse.json({ success: true, schoolId });
    
  } catch (error) {
    console.error("Error assigning school:", error);
    
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Failed to assign school" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    
    const db = getDB();
    const userRef = db.collection("users").doc(decodedToken.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ schoolId: null });
    }

    const userData = userDoc.data();
    return NextResponse.json({ schoolId: userData?.schoolId || null });
    
  } catch (error) {
    console.error("Error fetching user school:", error);
    
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Failed to fetch user school" }, { status: 500 });
  }
}
