import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { db } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { deleteReceipt, getReceipt } from "@/lib/server/receipt-storage";
import { isSameOriginRequest } from "@/lib/server/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id); if (!id.success) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const [receipt] = await db.select().from(receipts).where(and(eq(receipts.id, id.data), eq(receipts.userId, user.id)));
  if (!receipt) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const bytes = await getReceipt(receipt.objectKey); if (!bytes) return NextResponse.json({ error: "not-found" }, { status: 404 });
  return new NextResponse(bytes, { headers: { "Content-Type": receipt.contentType, "Content-Disposition": `inline; filename="${receipt.originalName.replace(/[\r\n"]+/g, "")}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id); if (!id.success) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const [receipt] = await db.delete(receipts).where(and(eq(receipts.id, id.data), eq(receipts.userId, user.id))).returning();
  if (!receipt) return NextResponse.json({ error: "not-found" }, { status: 404 });
  await deleteReceipt(receipt.objectKey);
  return new NextResponse(null, { status: 204 });
}
