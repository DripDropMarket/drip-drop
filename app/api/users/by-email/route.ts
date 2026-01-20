import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../../helpers";

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { email, schoolId } = body;

    if (!email || !schoolId) {
      return NextResponse.json(
        { error: "Missing required fields: email, schoolId" },
        { status: 400 }
      );
    }

    const db = getDB();
    const schoolRef = db.collection("schools").doc(schoolId);
    const schoolSnap = await schoolRef.get();

    if (!schoolSnap.exists) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    const schoolData = schoolSnap.data();
    const adminIds = schoolData?.adminIds || [];

    if (!adminIds.includes(userId)) {
      return NextResponse.json(
        { error: "Only admins can lookup users" },
        { status: 403 }
      );
    }

    const usersRef = db.collection("users");
    const userQuery = usersRef.where("email", "==", email.toLowerCase());
    const userSnap = await userQuery.get();

    if (userSnap.empty) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 }
      );
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();

    if (userData.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "User is not a member of this school" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      uid: userDoc.id,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      profilePicture: userData.profilePicture || "",
      isAdmin: adminIds.includes(userDoc.id),
    });
  } catch (error) {
    console.error("Error looking up user by email:", error);

    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to lookup user" }, { status: 500 });
  }
}
