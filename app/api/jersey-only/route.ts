import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { escapeRegex, getDb, PAGE_SIZE, parsePage } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  const page = parsePage(request.nextUrl.searchParams.get("page"));
  const filter = q
    ? { fullName: { $regex: escapeRegex(q), $options: "i" } }
    : {};

  const db = await getDb();
  const col = db.collection("jersey_form");
  const [items, total] = await Promise.all([
    col
      .find(filter, {
        projection: {
          fullName: 1,
          email: 1,
          phoneNumber: 1,
          discord: 1,
          jerseyName: 1,
          region: 1,
          address: 1,
          status: 1,
          jersey: 1,
          isPaymentComplete: 1,
          isRepeatBuyer: 1,
          hasTakenJersey: 1,
        },
      })
      .sort({ fullName: 1, _id: 1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    col.countDocuments(filter),
  ]);

  return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!ObjectId.isValid(id) || typeof body?.taken !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const taken: boolean = body.taken;

  const db = await getDb();
  const result = await db
    .collection("jersey_form")
    .updateOne(
      { _id: new ObjectId(id), hasTakenJersey: taken ? { $ne: true } : true },
      { $set: { hasTakenJersey: taken, updatedAt: new Date() } },
    );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      {
        error: taken ? "Not found or already taken" : "Not found or not taken",
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
