import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../../../helpers";
import { UpdateSchoolInput } from "@/app/lib/types";
import { US_STATES } from "@/app/lib/constants";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    const { id: schoolId } = await params;

    const body: UpdateSchoolInput = await request.json();

    if (!body.name && !body.state) {
      return NextResponse.json(
        { error: "At least one field (name or state) must be provided" },
        { status: 400 }
      );
    }

    if (body.state && !US_STATES.includes(body.state)) {
      return NextResponse.json(
        { error: "Invalid state" },
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
        { error: "Only admins can update school details" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.name) {
      const trimmedName = body.name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: "School name cannot be empty" },
          { status: 400 }
        );
      }

      const existingQuery = await db.collection("schools")
        .where("name", "==", trimmedName)
        .where("state", "==", body.state || schoolData?.state)
        .get();

      if (!existingQuery.empty) {
        const existingDoc = existingQuery.docs.find(d => d.id !== schoolId);
        if (existingDoc) {
          return NextResponse.json(
            { error: "A school with this name already exists in this state" },
            { status: 400 }
          );
        }
      }

      updateData.name = trimmedName;
    }

    if (body.state) {
      updateData.state = body.state;
    }

    await schoolRef.update(updateData);

    const updatedSnap = await schoolRef.get();
    const updatedData = updatedSnap.data();

    return NextResponse.json({
      id: schoolId,
      name: updatedData?.name,
      state: updatedData?.state,
      memberCount: updatedData?.memberCount || 0,
      createdAt: {
        seconds: updatedData?.createdAt?.seconds || 0,
        nanoseconds: updatedData?.createdAt?.nanoseconds || 0,
      },
      adminIds: updatedData?.adminIds || [],
    });
  } catch (error) {
    console.error("Error updating school:", error);

    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    const { id: schoolId } = await params;

    const body = await request.json();
    const { action, targetId } = body;

    if (!action || !targetId) {
      return NextResponse.json(
        { error: "Missing required fields: action, targetId" },
        { status: 400 }
      );
    }

    const validActions = ["remove_listing", "remove_member"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
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
        { error: "Only admins can perform this action" },
        { status: 403 }
      );
    }

    if (action === "remove_listing") {
      const listingRef = db.collection("listings").doc(targetId);
      const listingSnap = await listingRef.get();

      if (!listingSnap.exists) {
        return NextResponse.json(
          { error: "Listing not found" },
          { status: 404 }
        );
      }

      const listingData = listingSnap.data();

      if (listingData?.schoolId !== schoolId) {
        return NextResponse.json(
          { error: "Listing does not belong to this school" },
          { status: 403 }
        );
      }

      await listingRef.delete();

      return NextResponse.json({ success: true, message: "Listing removed" });
    } else if (action === "remove_member") {
      if (targetId === userId) {
        return NextResponse.json(
          { error: "Cannot remove yourself from the school" },
          { status: 400 }
        );
      }

      const userRef = db.collection("users").doc(targetId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      const userData = userSnap.data();

      if (userData?.schoolId !== schoolId) {
        return NextResponse.json(
          { error: "User is not a member of this school" },
          { status: 403 }
        );
      }

      if (adminIds.includes(targetId)) {
        if (adminIds.length <= 1) {
          return NextResponse.json(
            { error: "Cannot remove the last admin" },
            { status: 400 }
          );
        }
      }

      await db.runTransaction(async (transaction) => {
        const currentSchoolSnap = await transaction.get(schoolRef);
        const currentSchoolData = currentSchoolSnap.data();
        const currentMemberCount = currentSchoolData?.memberCount || 0;
        const currentAdminIds = currentSchoolData?.adminIds || [];

        const schoolUpdate: Record<string, unknown> = {};

        if (currentMemberCount > 0) {
          schoolUpdate.memberCount = currentMemberCount - 1;
        }

        if (currentAdminIds.includes(targetId)) {
          schoolUpdate.adminIds = currentAdminIds.filter((id: string) => id !== targetId);
        }

        if (Object.keys(schoolUpdate).length > 0) {
          transaction.update(schoolRef, schoolUpdate);
        }

        transaction.update(userRef, { schoolId: null });
      });

      return NextResponse.json({ success: true, message: "Member removed" });
    }
  } catch (error) {
    console.error("Error performing school action:", error);

    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
