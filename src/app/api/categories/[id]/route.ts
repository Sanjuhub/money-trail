import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { db } from "@/lib/db";
import { budgets, categories } from "@/lib/db/schema";
import { isSameOriginRequest, readJson } from "@/lib/server/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id), input = z.object({ name: z.string().trim().min(1).max(60) }).safeParse(await readJson(request));
  if (!id.success || !input.success) return NextResponse.json({ error: "category" }, { status: 400 });
  const [category] = await db.update(categories).set({ name: input.data.name }).where(and(eq(categories.id, id.data), eq(categories.userId, user.id), eq(categories.isDefault, false))).returning();
  return category ? NextResponse.json({ category }) : NextResponse.json({ error: "not-found" }, { status: 404 });
}
export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id); if (!id.success) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const category = await db.transaction(async (tx) => {
    await tx.update(budgets).set({ active: false }).where(and(eq(budgets.categoryId, id.data), eq(budgets.userId, user.id)));
    await tx.update(categories).set({ parentId: null }).where(and(eq(categories.parentId, id.data), eq(categories.userId, user.id)));
    const [deleted] = await tx.delete(categories).where(and(eq(categories.id, id.data), eq(categories.userId, user.id), eq(categories.isDefault, false))).returning({ id: categories.id });
    return deleted;
  });
  return category ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "not-found" }, { status: 404 });
}
