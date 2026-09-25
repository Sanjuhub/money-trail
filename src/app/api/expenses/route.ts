import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { addExpense, expenseInput } from "@/lib/server/expense-service";
import { isSameOriginRequest, readJson } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  try {
    const user = await getCurrentUserWithRefresh();
    if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
    const parsed = expenseInput.safeParse(await readJson(request));
    if (!parsed.success) return NextResponse.json({ error: "expense" }, { status: 400 });
    const expense = await addExpense(user.id, parsed.data);
    return NextResponse.json({ expense }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
