import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { db } from "@/lib/db";
import { receipts, transactions } from "@/lib/db/schema";
import { isSameOriginRequest } from "@/lib/server/http";
import { putReceipt } from "@/lib/server/receipt-storage";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const form = await request.formData(); const file = form.get("file"), transactionId = form.get("transactionId");
  if (!(file instanceof File) || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) return NextResponse.json({ error: "file" }, { status: 400 });
  let ownedTransaction: string | null = null;
  if (typeof transactionId === "string") {
    const id = z.uuid().safeParse(transactionId); if (!id.success) return NextResponse.json({ error: "transaction" }, { status: 400 });
    const [row] = await db.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.id, id.data), eq(transactions.userId, user.id)));
    if (!row) return NextResponse.json({ error: "not-found" }, { status: 404 }); ownedTransaction = row.id;
  }
  const key = `${user.id}/${randomUUID()}`;
  try {
    await putReceipt(key, new Uint8Array(await file.arrayBuffer()), file.type);
    const [receipt] = await db.insert(receipts).values({ userId: user.id, transactionId: ownedTransaction, objectKey: key, contentType: file.type, originalName: file.name.slice(0, 255) }).returning({ id: receipts.id, transactionId: receipts.transactionId });
    return NextResponse.json({ receipt }, { status: 201 });
  } catch { return NextResponse.json({ error: "storage" }, { status: 500 }); }
}
