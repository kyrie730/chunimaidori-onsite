import { NextResponse, type NextRequest } from "next/server";
import { ObjectId, type Document } from "mongodb";
import { escapeRegex, getDb, PAGE_SIZE, parsePage } from "@/lib/mongodb";
import { CHECKIN_PROJECTION, USER_PROJECTION } from "@/lib/projections";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  const page = parsePage(request.nextUrl.searchParams.get("page"));

  const pipeline: Document[] = [
    { $match: { checkInStatus: true, hasTakenJersey: { $ne: true } } },
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
  ];
  if (q) {
    pipeline.push({
      $match: { "user.fullName": { $regex: escapeRegex(q), $options: "i" } },
    });
  }
  pipeline.push(
    { $sort: { "user.fullName": 1, _id: 1 } },
    {
      $facet: {
        total: [{ $count: "n" }],
        items: [
          { $skip: (page - 1) * PAGE_SIZE },
          { $limit: PAGE_SIZE },
          {
            $lookup: {
              from: "jerseys",
              localField: "userId",
              foreignField: "userId",
              pipeline: [
                { $project: { _id: 1, type: 1, inGameName: 1, size: 1 } },
              ],
              as: "jerseys",
            },
          },
          { $project: { ...CHECKIN_PROJECTION, jerseys: 1 } },
        ],
      },
    },
  );

  const db = await getDb();
  const [result] = await db
    .collection("checkinstatuses")
    .aggregate(pipeline)
    .toArray();

  return NextResponse.json({
    items: result?.items ?? [],
    total: result?.total?.[0]?.n ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db
    .collection("checkinstatuses")
    .updateOne(
      {
        _id: new ObjectId(id),
        checkInStatus: true,
        hasTakenJersey: { $ne: true },
      },
      { $set: { hasTakenJersey: true, updatedAt: new Date() } },
    );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Not found or already taken" },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
