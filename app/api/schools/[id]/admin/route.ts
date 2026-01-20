import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../../../helpers";

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
        { error: "Only admins can manage school admins" },
        { status: 403 }
      );
    }

    if (action === "add") {
      if (adminIds.includes(targetUserId)) {
        return NextResponse.json(
          { error: "User is already an admin" },
          { status: 400 }
        );
      }

      await schoolRef.update({
        adminIds: [...adminIds, targetUserId],
      });

      return NextResponse.json({ success: true, adminIds: [...adminIds, targetUserId] });
    } else {
      if (!adminIds.includes(targetUserId)) {
        return NextResponse.json(
          { error: "User is not an admin" },
          { status: 400 }
        );
      }

      if (adminIds.length <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin" },
          { status: 400 }
        );
      }

      const newAdminIds = adminIds.filter((id: string) => id !== targetUserId);

      await schoolRef.update({
        adminIds: newAdminIds,
      });

      return NextResponse.json({ success: true, adminIds: newAdminIds });
    }
  } catch (error) {
    console.error("Error managing school admin:", error);

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
    const admins = [];

    for (const adminId of adminIds) {
      const userSnap = await usersRef.doc(adminId).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        admins.push({
          uid: adminId,
          firstName: userData?.firstName || "",
          lastName: userData?.lastName || "",
          profilePicture: userData?.profilePicture || "",
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
