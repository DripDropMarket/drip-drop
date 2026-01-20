import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../helpers";
import { CreateSchoolInput, SchoolData } from "@/app/lib/types";
import { US_STATES } from "@/app/lib/constants";
import admin from "firebase-admin";

export async function GET() {
  try {
    const db = getDB();
    const schoolsRef = db.collection("schools");
    const querySnapshot = await schoolsRef.orderBy("name", "asc").get();
    
    const schools: SchoolData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      schools.push({
        id: doc.id,
        name: data.name,
        state: data.state,
        memberCount: data.memberCount || 0,
        createdAt: {
          seconds: data.createdAt?.seconds || 0,
          nanoseconds: data.createdAt?.nanoseconds || 0,
        },
      });
    });

    return NextResponse.json(schools);
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    
    const body: CreateSchoolInput = await request.json();
    
    if (!body.name || !body.state) {
      return NextResponse.json(
        { error: "Missing required fields: name, state" },
        { status: 400 }
      );
    }

    if (!US_STATES.includes(body.state)) {
      return NextResponse.json(
        { error: "Invalid state" },
        { status: 400 }
      );
    }

    const db = getDB();
    const schoolsRef = db.collection("schools");
    
    const existingQuery = await schoolsRef
      .where("name", "==", body.name.trim())
      .where("state", "==", body.state)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json(
        { error: "A school with this name already exists in this state" },
        { status: 400 }
      );
    }

    const schoolData = {
      name: body.name.trim(),
      state: body.state,
      memberCount: 1,
      createdAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await schoolsRef.add(schoolData);

    const userRef = db.collection("users").doc(decodedToken.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.update({ schoolId: docRef.id });
    }

    return NextResponse.json({
      id: docRef.id,
      name: schoolData.name,
      state: schoolData.state,
      memberCount: schoolData.memberCount,
      createdAt: {
        seconds: Date.now() / 1000,
        nanoseconds: 0,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating school:", error);
    
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }
}
