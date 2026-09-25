import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clearTokenCookies, getCurrentUserWithRefresh } from "@/lib/auth";
import { isSameOriginRequest, readJson } from "@/lib/server/http";
import { changeProfilePassword } from "@/lib/server/profile-service";

export const runtime = "nodejs";
const passwordInput = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(10).max(72),
}).refine((value) => value.currentPassword !== value.newPassword, { path: ["newPassword"] });

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh();
  if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const parsed = passwordInput.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "password-details" }, { status: 400 });
  try {
    if (!(await changeProfilePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword))) {
      return NextResponse.json({ error: "current-password" }, { status: 400 });
    }
    await clearTokenCookies();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
