import { and, eq, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alerts, recurring, recurringOccurrences, users } from "@/lib/db/schema";
import { evaluateBudgetAlerts, evaluateSmartAlerts } from "@/lib/server/ledger-service";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const today = new Date().toISOString().slice(0, 10);
  const due = await db.select().from(recurring).where(and(eq(recurring.active, true), lte(recurring.nextDate, today)));
  for (const schedule of due) await db.insert(recurringOccurrences).values({ recurringId: schedule.id, dueDate: schedule.nextDate }).onConflictDoNothing();
  const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const upcoming = await db.select().from(recurring).where(and(eq(recurring.active, true), lte(recurring.nextDate, inSevenDays)));
  for (const schedule of upcoming) await db.insert(alerts).values({ userId: schedule.userId, key: `bill:${schedule.id}:${schedule.nextDate}`, kind: "bill-reminder", message: `${schedule.description} is due on ${schedule.nextDate}.` }).onConflictDoNothing();
  const allUsers = await db.select({ id: users.id }).from(users);
  for (const user of allUsers) { await evaluateBudgetAlerts(user.id); await evaluateSmartAlerts(user.id); }
  return NextResponse.json({ recurringDue: due.length, usersChecked: allUsers.length });
}
