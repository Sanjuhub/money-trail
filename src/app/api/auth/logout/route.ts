import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/server/auth-service";
import { isSameOriginRequest } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  try {
    await logout();
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
