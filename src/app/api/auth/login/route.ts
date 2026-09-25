import { NextRequest, NextResponse } from "next/server";
import { authenticate, loginInput } from "@/lib/server/auth-service";
import { isSameOriginRequest, readJson } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const parsed = loginInput.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "credentials" }, { status: 400 });

  try {
    const user = await authenticate(parsed.data);
    if (!user) return NextResponse.json({ error: "credentials" }, { status: 401 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
