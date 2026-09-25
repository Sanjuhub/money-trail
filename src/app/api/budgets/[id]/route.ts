import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { db } from "@/lib/db";
import { budgets, categories } from "@/lib/db/schema";
import { isSameOriginRequest, readJson } from "@/lib/server/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const patchSchema = z.object({ name: z.string().trim().min(1).max(100).optional(), categoryId: z.uuid().nullable().optional(), amount: z.coerce.number().positive().optional(), period: z.enum(["weekly", "monthly", "custom"]).optional(), startDate: z.iso.date().optional(), endDate: z.iso.date().nullable().optional(), rollover: z.boolean().optional(), alertAt: z.coerce.number().int().min(1).max(100).optional(), active: z.boolean().optional() }).refine((item) => Object.keys(item).length > 0 && !(item.startDate && item.endDate && item.endDate < item.startDate));
export async function PATCH(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id), input = patchSchema.safeParse(await readJson(request));
  if (!id.success || !input.success) return NextResponse.json({ error: "budget" }, { status: 400 });
  if (input.data.categoryId) { const [category] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, input.data.categoryId), eq(categories.userId, user.id))); if (!category) return NextResponse.json({ error: "category" }, { status: 400 }); }
  const { amount, ...rest } = input.data;
  const values = { ...rest, amount: amount?.toFixed(2) };
  const [budget] = await db.update(budgets).set(values).where(and(eq(budgets.id, id.data), eq(budgets.userId, user.id))).returning();
  return budget ? NextResponse.json({ budget }) : NextResponse.json({ error: "not-found" }, { status: 404 });
}
export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id); if (!id.success) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const [budget] = await db.update(budgets).set({ active: false }).where(and(eq(budgets.id, id.data), eq(budgets.userId, user.id))).returning({ id: budgets.id });
  return budget ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "not-found" }, { status: 404 });
}
