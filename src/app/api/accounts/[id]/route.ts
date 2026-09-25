import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { isSameOriginRequest, readJson } from "@/lib/server/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const patchSchema = z.object({ name: z.string().trim().min(1).max(100).optional(), openingBalance: z.coerce.number().finite().min(0).max(999999999999).optional(), archived: z.boolean().optional() }).refine((input) => Object.keys(input).length > 0);
export async function PATCH(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id), input = patchSchema.safeParse(await readJson(request));
  if (!id.success || !input.success) return NextResponse.json({ error: "account" }, { status: 400 });
  const { openingBalance, ...rest } = input.data;
  const values = { ...rest, openingBalance: openingBalance?.toFixed(2) };
  const [account] = await db.update(accounts).set(values).where(and(eq(accounts.id, id.data), eq(accounts.userId, user.id))).returning();
  return account ? NextResponse.json({ account }) : NextResponse.json({ error: "not-found" }, { status: 404 });
}
export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id); if (!id.success) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const [account] = await db.update(accounts).set({ archived: true }).where(and(eq(accounts.id, id.data), eq(accounts.userId, user.id))).returning({ id: accounts.id });
  return account ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "not-found" }, { status: 404 });
}
