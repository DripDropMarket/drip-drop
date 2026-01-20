import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../../../helpers";
import admin from "firebase-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    const { id: schoolId } = await params;

    const body = await request.json();
    const { targetUserId, action } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: targetUserId, action" },
        { status: 400 }
      );
    }

    if (action !== "add" && action !== "remove") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'add' or 'remove'" },
        { status: 400 }
      );
    }

    const db = getDB();
    const schoolRef = db.collection("schools").doc(schoolId);
    let resultAdminIds: string[] = [];

    await db.runTransaction(async (transaction) => {
      const schoolSnap = await transaction.get(schoolRef);

      if (!schoolSnap.exists) {
        throw new Error("School not found");
      }

      const schoolData = schoolSnap.data();
      const currentAdminIds = schoolData?.adminIds || [];

      if (!currentAdminIds.includes(userId)) {
        throw new Error("Only admins can manage school admins");
      }

      if (action === "add") {
        if (currentAdminIds.includes(targetUserId)) {
          throw new Error("User is already an admin");
        }
        resultAdminIds = [...currentAdminIds, targetUserId];
      } else {
        if (!currentAdminIds.includes(targetUserId)) {
          throw new Error("User is not an admin");
        }
        if (currentAdminIds.length <= 1) {
          throw new Error("Cannot remove the last admin");
        }
        resultAdminIds = currentAdminIds.filter((id: string) => id !== targetUserId);
      }

      transaction.update(schoolRef, { adminIds: resultAdminIds });
    });

    return NextResponse.json({ success: true, adminIds: resultAdminIds });
  } catch (error) {
    console.error("Error managing school admin:", error);

    if (error instanceof Error) {
      if (error.message === "School not found") {
        return NextResponse.json({ error: "School not found" }, { status: 404 });
      }
      if (error.message === "Only admins can manage school admins") {
        return NextResponse.json({ error: "Only admins can manage school admins" }, { status: 403 });
      }
      if (error.message === "User is already an admin") {
        return NextResponse.json({ error: "User is already an admin" }, { status: 400 });
      }
      if (error.message === "User is not an admin") {
        return NextResponse.json({ error: "User is not an admin" }, { status: 400 });
      }
      if (error.message === "Cannot remove the last admin") {
        return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 });
      }
    }

    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to manage school admin" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    const { id: schoolId } = await params;

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

    const isAdmin = adminIds.includes(userId);

    const usersRef = db.collection("users");
    const admins: { uid: string; firstName: string; lastName: string; profilePicture: string }[] = [];

    for (let i = 0; i < adminIds.length; i += 30) {
      const chunk = adminIds.slice(i, i + 30);
      if (chunk.length > 0) {
        const usersSnap = await usersRef.where(admin.firestore.FieldPath.documentId(), "in", chunk).get();
        usersSnap.forEach((userSnap) => {
          const userData = userSnap.data();
          admins.push({
            uid: userSnap.id,
            firstName: userData?.firstName || "",
            lastName: userData?.lastName || "",
            profilePicture: userData?.profilePicture || "",
          });
        });
      }
    }

    return NextResponse.json({
      isAdmin,
      adminIds,
      admins,
    });
  } catch (error) {
    console.error("Error fetching school admin status:", error);

    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch admin status" }, { status: 500 });
  }
}
