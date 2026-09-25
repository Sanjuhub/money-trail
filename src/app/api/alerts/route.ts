import { and, desc, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { db } from "@/lib/db";
import { alerts } from "@/lib/db/schema";
import { isSameOriginRequest } from "@/lib/server/http";
export const runtime = "nodejs";
export async function GET() { const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 }); const items = await db.select().from(alerts).where(eq(alerts.userId, user.id)).orderBy(desc(alerts.createdAt)).limit(100); return NextResponse.json({ alerts: items }); }
export async function PATCH(request: NextRequest) { if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 }); const user = await getCurrentUserWithRefresh(); if (!user) return NextResponse.json({ error: "session" }, { status: 401 }); const [item] = await db.update(alerts).set({ readAt: new Date() }).where(and(eq(alerts.userId, user.id), eq(alerts.id, request.nextUrl.searchParams.get("id") ?? ""), isNull(alerts.readAt))).returning(); return item ? NextResponse.json({ alert: item }) : NextResponse.json({ error: "not-found" }, { status: 404 }); }
