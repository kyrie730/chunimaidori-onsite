import { NextResponse } from "next/server";
import type { Db, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getFrom, getMailer } from "@/lib/mailer";
import { otpEmail } from "@/lib/email-templates/otp";

export const maxDuration = 300;

const TEST_RECIPIENT = "newbieplay730@gmail.com";

// Number of emails sent per button click.
const BATCH_SIZE = 20;

type Recipient = { _id: ObjectId; otp: string; email: string; fullName: string };

// Pending = has a valid OTP, otpHasSent is not true (missing counts as false), and user has an email.
function pendingPipeline() {
  return [
    {
      $match: {
        otp: { $regex: /^\d{6}$/ },
        otpHasSent: { $ne: true },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        pipeline: [{ $project: { _id: 0, email: 1, fullName: 1 } }],
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: { "user.email": { $type: "string", $ne: "" } } },
  ];
}

async function countPending(db: Db) {
  const [row] = await db
    .collection("checkinstatuses")
    .aggregate<{ n: number }>([...pendingPipeline(), { $count: "n" }])
    .toArray();
  return row?.n ?? 0;
}

export async function POST() {
  const db = await getDb();
  const recipients = await db
    .collection("checkinstatuses")
    .aggregate<Recipient>([
      ...pendingPipeline(),
      { $sort: { _id: 1 } },
      { $limit: BATCH_SIZE },
      {
        $project: {
          _id: 1,
          otp: 1,
          email: "$user.email",
          fullName: "$user.fullName",
        },
      },
    ])
    .toArray();

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "All OTP emails have already been sent" },
      { status: 404 },
    );
  }

  const mailer = getMailer();
  const from = getFrom();

  // TEST MODE: send this batch to the test inbox instead (still marks them as sent).
  // const targets = recipients.map((r) => ({ ...r, email: TEST_RECIPIENT }));
  // REAL MODE:
  const targets = recipients;

  const total = targets.length;
  const encoder = new TextEncoder();

  // Streams NDJSON: one "progress" line per finished email, then a final "done" line.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: SendOtpEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          // Client disconnected; keep sending in the background.
        }
      };

      let sent = 0;
      const failed: { email: string; error: string }[] = [];
      write({ type: "progress", total, sent, failed: 0 });

      await Promise.all(
        targets.map(async (r) => {
          try {
            await mailer.sendMail({
              from,
              to: r.email,
              ...otpEmail({ fullName: r.fullName, otp: r.otp }),
            });
            sent++;
            await db
              .collection("checkinstatuses")
              .updateOne(
                { _id: r._id },
                { $set: { otpHasSent: true, otpSentAt: new Date() } },
              )
              .catch((e) =>
                console.error("[send-otp] failed to mark sent:", r._id, e),
              );
          } catch (e) {
            failed.push({
              email: r.email,
              error: e instanceof Error ? e.message : String(e),
            });
          }
          write({ type: "progress", total, sent, failed: failed.length });
        }),
      );

      if (failed.length) console.error("[send-otp] failed:", failed);
      const remaining = await countPending(db).catch(() => -1);
      write({ type: "done", total, sent, failed, remaining });
      try {
        controller.close();
      } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export type SendOtpEvent =
  | { type: "progress"; total: number; sent: number; failed: number }
  | {
      type: "done";
      total: number;
      sent: number;
      failed: { email: string; error: string }[];
      remaining: number;
    };
