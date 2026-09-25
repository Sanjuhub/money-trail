import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { getDashboardData } from "@/lib/server/dashboard-service";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUserWithRefresh();
    if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
    return NextResponse.json(await getDashboardData(user), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
