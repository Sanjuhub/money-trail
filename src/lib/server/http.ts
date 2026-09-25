import { NextRequest } from "next/server";

export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (origin) {
    try {
      if (new URL(origin).origin !== request.nextUrl.origin) return false;
    } catch {
      return false;
    }
  }
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "none";
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
