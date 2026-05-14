import { NextResponse } from "next/server";
import { getTopHostsByHype } from "@/lib/hype/service";

/**
 * GET /api/hype/leaderboard?limit=N
 *
 * Top hosts by hypeScore, descending. Limit is hard-capped server-side at
 * 100 to keep payloads bounded regardless of client input.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 20;
    const entries = await getTopHostsByHype({ limit });
    return NextResponse.json(
      { entries, count: entries.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/hype/leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
