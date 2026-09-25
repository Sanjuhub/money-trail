import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { editExpense, expenseInput, removeExpense } from "@/lib/server/expense-service";
import { isSameOriginRequest, readJson } from "@/lib/server/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  try {
    const user = await getCurrentUserWithRefresh();
    if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
    const { id } = await params;
    const idResult = z.uuid().safeParse(id);
    const parsed = expenseInput.safeParse(await readJson(request));
    if (!idResult.success || !parsed.success) return NextResponse.json({ error: "expense" }, { status: 400 });
    const expense = await editExpense(user.id, idResult.data, parsed.data);
    if (!expense) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ expense });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  try {
    const user = await getCurrentUserWithRefresh();
    if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
    const idResult = z.uuid().safeParse((await params).id);
    if (!idResult.success) return NextResponse.json({ error: "not-found" }, { status: 404 });
    const removed = await removeExpense(user.id, idResult.data);
    if (!removed) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
