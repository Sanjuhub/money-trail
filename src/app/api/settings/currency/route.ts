import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { setUserCurrency } from "@/lib/server/expense-service";
import { isSameOriginRequest, readJson } from "@/lib/server/http";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  try {
    const user = await getCurrentUserWithRefresh();
    if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
    const parsed = z.object({ currency: z.string().length(3) }).safeParse(await readJson(request));
    if (!parsed.success || !(await setUserCurrency(user.id, parsed.data.currency))) {
      return NextResponse.json({ error: "currency" }, { status: 400 });
    }
    return NextResponse.json({ currency: parsed.data.currency });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
