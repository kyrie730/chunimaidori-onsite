import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { CHECKIN_PROJECTION, USER_PROJECTION } from "@/lib/projections";

export async function GET(request: NextRequest) {
  const otp = request.nextUrl.searchParams.get("otp") ?? "";
  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json(
      { error: "OTP must be 6 digits" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [item] = await db
    .collection("checkinstatuses")
    .aggregate([
      { $match: { otp } },
      { $limit: 1 },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [{ $project: USER_PROJECTION }],
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $project: CHECKIN_PROJECTION },
    ])
    .toArray();

  if (!item) {
    return NextResponse.json({ error: "OTP not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let takenBy: string | null = null;
  if (body?.takenBy !== undefined) {
    takenBy = typeof body.takenBy === "string" ? body.takenBy.trim() : "";
    if (!takenBy || takenBy.length > 100) {
      return NextResponse.json(
        { error: "Diambil Oleh is required (max 100 chars)" },
        { status: 400 },
      );
    }
  }

  const db = await getDb();
  const set: Record<string, unknown> = {
    checkInStatus: true,
    updatedAt: new Date(),
  };
  if (takenBy) set.takenBy = takenBy;

  const result = await db
    .collection("checkinstatuses")
    .updateOne(
      { _id: new ObjectId(id), checkInStatus: { $ne: true } },
      { $set: set },
    );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Not found or already checked in" },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
