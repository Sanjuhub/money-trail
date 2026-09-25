import { NextRequest, NextResponse } from "next/server";
import { createAccount, signupInput } from "@/lib/server/auth-service";
import { isSameOriginRequest, readJson } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const parsed = signupInput.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "details" }, { status: 400 });

  try {
    const result = await createAccount(parsed.data);
    if (!result.ok) {
      const status = result.reason === "exists" ? 409 : 500;
      return NextResponse.json({ error: result.reason }, { status });
    }
    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
