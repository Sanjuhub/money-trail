import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { db } from "@/lib/db";
import { recurring, transactionSplits, transactions } from "@/lib/db/schema";
import { getDashboardData } from "@/lib/server/dashboard-service";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const user = await getCurrentUserWithRefresh();
  if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const period = request.nextUrl.searchParams.get("period") ?? "monthly";
  const today = new Date(), currentYear = today.getUTCFullYear();
  let start: Date;
  if (period === "daily") start = new Date(Date.UTC(currentYear, today.getUTCMonth(), today.getUTCDate() - 29));
  else if (period === "weekly") start = new Date(Date.UTC(currentYear, today.getUTCMonth(), today.getUTCDate() - 7 * 11));
  else if (period === "yearly") start = new Date(Date.UTC(currentYear - 4, 0, 1));
  else start = new Date(Date.UTC(currentYear, today.getUTCMonth() - 11, 1));
  const from = start.toISOString().slice(0, 10), to = new Date(Date.UTC(currentYear, today.getUTCMonth(), today.getUTCDate() + 1)).toISOString().slice(0, 10);
  const [rows, recurringRows, dashboard] = await Promise.all([
    db.select().from(transactions).where(and(eq(transactions.userId, user.id), gte(transactions.transactionDate, from), lt(transactions.transactionDate, to), sql`${transactions.type} in ('expense','income')`)).orderBy(transactions.transactionDate),
    db.select().from(recurring).where(and(eq(recurring.userId, user.id), eq(recurring.active, true), eq(recurring.type, "expense"))),
    getDashboardData(user),
  ]);
  const splits = rows.length ? await db.select().from(transactionSplits).where(inArray(transactionSplits.transactionId, rows.map((row) => row.id))) : [];
  const mine = new Map<string, number[]>(), splitIds = new Set<string>();
  for (const split of splits) { splitIds.add(split.transactionId); if (split.isMine) mine.set(split.transactionId, [...(mine.get(split.transactionId) ?? []), Number(split.amount)]); }
  const amount = (row: (typeof rows)[number]) => splitIds.has(row.id) ? (mine.get(row.id) ?? []).reduce((a, b) => a + b, 0) : Number(row.amount);
  const series = new Map<string, { expenses: number; income: number }>();
  for (const row of rows) {
    const date = new Date(`${row.transactionDate}T00:00:00Z`);
    let key: string;
    if (period === "daily") key = row.transactionDate;
    else if (period === "weekly") key = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - ((date.getUTCDay() + 6) % 7))).toISOString().slice(0, 10);
    else if (period === "yearly") key = String(date.getUTCFullYear());
    else key = row.transactionDate.slice(0, 7);
    const item = series.get(key) ?? { expenses: 0, income: 0 };
    item[row.type === "income" ? "income" : "expenses"] += amount(row); series.set(key, item);
  }
  const categoryTotals = new Map<string, number>(), merchantTotals = new Map<string, { total: number; count: number }>();
  for (const row of rows) if (row.type === "expense") {
    const month = row.transactionDate.slice(0, 7), key = `${row.category}\u0000${month}`;
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + amount(row));
    if (row.merchant) { const item = merchantTotals.get(row.merchant) ?? { total: 0, count: 0 }; item.total += amount(row); item.count += 1; merchantTotals.set(row.merchant, item); }
  }
  const categoryTrends = [...categoryTotals.entries()].map(([key, total]) => { const [category, month] = key.split("\u0000"); return { category, month, amount: total }; });
  const merchantRows = [...merchantTotals.entries()].map(([merchant, values]) => ({ merchant, total: values.total, count: values.count })).sort((a, b) => b.total - a.total).slice(0, 20);
  const yearRows = rows.filter((row) => row.transactionDate.startsWith(String(currentYear)));
  const yearlyExpenses = yearRows.filter((row) => row.type === "expense").reduce((sum, row) => sum + amount(row), 0);
  const recurringMonthlyEstimate = recurringRows.reduce((sum, item) => sum + Number(item.amount) * (item.cadence === "weekly" ? 52 / 12 : item.cadence === "yearly" ? 1 / 12 : 1), 0);
  return NextResponse.json({ period, series: [...series.entries()].map(([date, totals]) => ({ date, ...totals })), categoryTrends, merchants: merchantRows, yearlyExpenses, averageDailyExpense: Math.round(yearlyExpenses / Math.max(1, Math.ceil((Date.now() - Date.UTC(currentYear, 0, 1)) / 86400000))), recurringMonthlyEstimate, savingsRate: dashboard.savingsRate, largestTransactions: dashboard.biggestExpenses, monthlyComparison: { income: dashboard.incomeTotal, expenses: dashboard.monthlyTotal, previousIncome: dashboard.previousIncome, previousExpenses: dashboard.previousTotal } }, { headers: { "Cache-Control": "no-store" } });
}
