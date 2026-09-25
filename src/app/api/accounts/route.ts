import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { createAccount, listAccounts } from "@/lib/server/ledger-service";
import { isSameOriginRequest, readJson } from "@/lib/server/http";
export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(1).max(100), type: z.enum(["cash", "bank", "wallet", "investment", "credit_card"]), kind: z.enum(["asset", "liability"]), openingBalance: z.coerce.number().finite().min(0).max(999999999999) });
export async function GET() { const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 }); return NextResponse.json({ accounts: await listAccounts(user.id) }); }
export async function POST(request: NextRequest) { if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 }); const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 }); const input = schema.safeParse(await readJson(request)); if (!input.success) return NextResponse.json({ error: "account" }, { status: 400 }); const value = { ...input.data, kind: input.data.type === "credit_card" ? "liability" : input.data.kind }; return NextResponse.json({ account: await createAccount(user.id, value) }, { status: 201 }); }
