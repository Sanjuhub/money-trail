import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserWithRefresh } from "@/lib/auth";
import { getCsvTransactionExport, getUserDataExport } from "@/lib/server/profile-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserWithRefresh();
  if (!user) return NextResponse.json({ error: "session" }, { status: 401 });
  const parsed = z.enum(["json", "csv"]).safeParse(request.nextUrl.searchParams.get("format"));
  if (!parsed.success) return NextResponse.json({ error: "format" }, { status: 400 });
  const date = new Date().toISOString().slice(0, 10);
  try {
    if (parsed.data === "csv") {
      return new NextResponse(`\uFEFF${await getCsvTransactionExport(user.id)}`, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="money-trail-transactions-${date}.csv"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    return new NextResponse(JSON.stringify(await getUserDataExport(user.id), null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="money-trail-backup-${date}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "export" }, { status: 500 });
  }
}
