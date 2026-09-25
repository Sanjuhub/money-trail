import "server-only";
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { alerts, budgets, categories, receipts, tags, transactionSplits, transactionTags, transactions } from "@/lib/db/schema";
import { getBudgetProgress, listAccounts } from "@/lib/server/ledger-service";
import type { SessionUser } from "@/lib/types";

function monthStart(offset: number) {
  const today = new Date();
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1)).toISOString().slice(0, 10);
}
export async function getDashboardData(user: SessionUser) {
  const start = monthStart(0), next = monthStart(1), previous = monthStart(-1), trendStart = monthStart(-5);
  const [recent, current, previousRows, trend, accountRows, budgetRows, alertRows, biggest, categoryOptions, receiptRows] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.transactionDate), desc(transactions.createdAt)).limit(30),
    db.select().from(transactions).where(and(eq(transactions.userId, user.id), gte(transactions.transactionDate, start), lt(transactions.transactionDate, next))),
    db.select().from(transactions).where(and(eq(transactions.userId, user.id), gte(transactions.transactionDate, previous), lt(transactions.transactionDate, start))),
    db.select({ id: transactions.id, day: transactions.transactionDate, type: transactions.type, amount: transactions.amount }).from(transactions).where(and(eq(transactions.userId, user.id), gte(transactions.transactionDate, trendStart), lt(transactions.transactionDate, next), sql`${transactions.type} in ('expense','income')`)).orderBy(transactions.transactionDate),
    listAccounts(user.id),
    db.select().from(budgets).where(and(eq(budgets.userId, user.id), eq(budgets.active, true))),
    db.select().from(alerts).where(eq(alerts.userId, user.id)).orderBy(desc(alerts.createdAt)).limit(8),
    db.select().from(transactions).where(and(eq(transactions.userId, user.id), eq(transactions.type, "expense"))).orderBy(desc(transactions.amount)).limit(5),
    db.select().from(categories).where(eq(categories.userId, user.id)).orderBy(categories.name),
    db.select({ id: receipts.id, transactionId: receipts.transactionId }).from(receipts).where(eq(receipts.userId, user.id)),
  ]);
  const txIds = [...recent, ...current, ...previousRows, ...trend, ...biggest].map((row) => row.id);
  const splitRows = txIds.length ? await db.select().from(transactionSplits).where(inArray(transactionSplits.transactionId, [...new Set(txIds)])) : [];
  const recentIds = recent.map((row) => row.id);
  const tagRows = recentIds.length ? await db.select({ transactionId: transactionTags.transactionId, name: tags.name }).from(transactionTags).innerJoin(tags, eq(tags.id, transactionTags.tagId)).where(inArray(transactionTags.transactionId, recentIds)) : [];
  const shares = new Map<string, number[]>(), hasSplits = new Set<string>();
  for (const split of splitRows) { const list = shares.get(split.transactionId) ?? []; if (split.isMine) list.push(Number(split.amount)); shares.set(split.transactionId, list); hasSplits.add(split.transactionId); }
  const amountOf = (row: { id: string; amount: string }) => hasSplits.has(row.id) ? (shares.get(row.id) ?? []).reduce((sum, amount) => sum + amount, 0) : Number(row.amount);
  const total = (rows: typeof current, type: string) => rows.filter((row) => row.type === type).reduce((sum, row) => sum + amountOf(row), 0);
  const expenseTotal = total(current, "expense"), incomeTotal = total(current, "income");
  const previousExpense = total(previousRows, "expense"), previousIncome = total(previousRows, "income");
  const trendMap = new Map<string, { expense: number; income: number }>();
  for (const row of trend) {
    const month = row.day.slice(0, 7), value = trendMap.get(month) ?? { expense: 0, income: 0 };
    value[row.type as "expense" | "income"] += amountOf(row); trendMap.set(month, value);
  }
  const chartData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 5 + index, 1)), key = date.toISOString().slice(0, 7);
    return { day: date.toLocaleDateString("en", { month: "short", timeZone: "UTC" }), amount: trendMap.get(key)?.expense ?? 0, income: trendMap.get(key)?.income ?? 0 };
  });
  const budgetData = await Promise.all(budgetRows.map((budget) => getBudgetProgress(user.id, budget)));
  const netWorth = accountRows.reduce((sum, account) => sum + (account.kind === "liability" ? -account.balance : account.balance), 0);
  const daysLeft = Math.max(1, new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 0)).getUTCDate() - new Date().getUTCDate() + 1);
  return {
    user, expenses: recent.map((item) => ({ ...item, receiptIds: receiptRows.filter((receipt) => receipt.transactionId === item.id).map((receipt) => receipt.id), tags: tagRows.filter((tag) => tag.transactionId === item.id).map((tag) => tag.name), splits: splitRows.filter((part) => part.transactionId === item.id) })), monthlyTotal: expenseTotal, incomeTotal, savings: incomeTotal - expenseTotal, netWorth,
    previousTotal: previousExpense, previousIncome, savingsRate: incomeTotal ? Math.round((incomeTotal - expenseTotal) / incomeTotal * 100) : 0,
    dailyAverage: Math.round(expenseTotal / Math.max(1, new Date().getUTCDate())), budgetDailyAvailable: Math.max(0, incomeTotal - expenseTotal) / daysLeft,
    categoryTotals: [...current.filter((row) => row.type === "expense").reduce((map, row) => map.set(row.category, (map.get(row.category) ?? 0) + amountOf(row)), new Map<string, number>())].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount), chartData,
    accounts: accountRows, budgets: budgetData, alerts: alertRows, biggestExpenses: biggest.map((row) => ({ ...row, amount: amountOf(row) })), categories: categoryOptions,
  };
}
