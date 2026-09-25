import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { db } from "@/lib/db";
import { budgets, categories } from "@/lib/db/schema";
import { isSameOriginRequest, readJson } from "@/lib/server/http";
import { getBudgetProgress } from "@/lib/server/ledger-service";
export const runtime = "nodejs";
const inputSchema = z.object({ name: z.string().trim().min(1).max(100), categoryId: z.uuid().nullable().optional(), amount: z.coerce.number().positive().max(999999999999), period: z.enum(["weekly", "monthly", "custom"]), startDate: z.iso.date(), endDate: z.iso.date().nullable().optional(), rollover: z.boolean().default(false), alertAt: z.coerce.number().int().min(1).max(100).default(80) }).refine((value) => !value.endDate || value.endDate >= value.startDate);
export async function GET() {
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const rows = await db.select().from(budgets).where(and(eq(budgets.userId, user.id), eq(budgets.active, true)));
  const result = await Promise.all(rows.map((budget) => getBudgetProgress(user.id, budget)));
  return NextResponse.json({ budgets: result });
}
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const input = inputSchema.safeParse(await readJson(request)); if (!input.success) return NextResponse.json({ error: "budget" }, { status: 400 });
  if (input.data.categoryId) { const [category] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, input.data.categoryId), eq(categories.userId, user.id))); if (!category) return NextResponse.json({ error: "category" }, { status: 400 }); }
  const [budget] = await db.insert(budgets).values({ ...input.data, userId: user.id, amount: input.data.amount.toFixed(2), endDate: input.data.endDate ?? null }).returning();
  return NextResponse.json({ budget }, { status: 201 });
}
