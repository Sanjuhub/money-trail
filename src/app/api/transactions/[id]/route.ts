import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { deleteTransaction, saveTransaction, transactionInput } from "@/lib/server/ledger-service";
import { isSameOriginRequest, readJson } from "@/lib/server/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh();
  if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id), input = transactionInput.safeParse(await readJson(request));
  if (!id.success || !input.success) return NextResponse.json({ error: "transaction" }, { status: 400 });
  const result = await saveTransaction(user.id, input.data, id.data);
  return "error" in result ? NextResponse.json({ error: result.error }, { status: result.error === "not-found" ? 404 : 400 }) : NextResponse.json(result);
}
export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh();
  if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id);
  if (!id.success || !(await deleteTransaction(user.id, id.data))) return NextResponse.json({ error: "not-found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
