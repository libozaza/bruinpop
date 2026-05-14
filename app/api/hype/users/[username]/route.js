import { NextResponse } from "next/server";
import { getHostHypePublic } from "@/lib/hype/service";

/**
 * GET /api/hype/users/:username
 *
 * Returns the host's public trust payload, or 404 if the user does not
 * exist. Read-only and intentionally public -- nothing here is sensitive;
 * the same payload is rendered on the HostCredibility badge.
 */
export async function GET(_request, { params }) {
  try {
    const { username } = await params;
    const payload = await getHostHypePublic(username);
    if (!payload) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(payload, {
      headers: {
        // Short cache: hype updates land in seconds via engagement handlers;
        // a 30s edge cache absorbs hot-host traffic without making the badge
        // feel stale.
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("GET /api/hype/users/[username] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
