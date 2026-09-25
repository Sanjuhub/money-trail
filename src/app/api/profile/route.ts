import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clearTokenCookies, getCurrentUserWithRefresh } from "@/lib/auth";
import { isSameOriginRequest, readJson } from "@/lib/server/http";
import { deleteProfileAccount, updateProfileName } from "@/lib/server/profile-service";

export const runtime = "nodejs";
const nameInput = z.object({ name: z.string().trim().min(2).max(120) });
const deleteInput = z.object({ confirmation: z.literal("DELETE") });

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh();
  if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const parsed = nameInput.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "name" }, { status: 400 });
  try {
    const updated = await updateProfileName(user.id, parsed.data.name);
    return updated ? NextResponse.json({ user: updated }) : NextResponse.json({ error: "not-found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const user = await getCurrentUserWithRefresh();
  if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const parsed = deleteInput.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "confirmation" }, { status: 400 });
  try {
    if (!(await deleteProfileAccount(user.id))) return NextResponse.json({ error: "not-found" }, { status: 404 });
    await clearTokenCookies();
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "deletion" }, { status: 500 });
  }
}
