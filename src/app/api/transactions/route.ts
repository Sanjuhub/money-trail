import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { listTransactions, saveTransaction, transactionInput } from "@/lib/server/ledger-service";
import { isSameOriginRequest, readJson } from "@/lib/server/http";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const user = await getCurrentUserWithRefresh();
  if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const query = request.nextUrl.searchParams;
  const transactions = await listTransactions(user.id, { q: query.get("q") ?? "", type: query.get("type") ?? "", category: query.get("category") ?? "", from: query.get("from") ?? "", to: query.get("to") ?? "" });
  return NextResponse.json({ transactions }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh();
  if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const parsed = transactionInput.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "transaction" }, { status: 400 });
  const result = await saveTransaction(user.id, parsed.data);
  return "error" in result ? NextResponse.json({ error: result.error }, { status: 400 }) : NextResponse.json(result, { status: 201 });
}
