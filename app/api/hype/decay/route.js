import { NextResponse } from "next/server";
import { applyHypeDecay } from "@/lib/hype/service";

/**
 * POST /api/hype/decay
 *
 * Destructive: applies multiplicative decay to all users' hypeScore. Meant
 * to be called by a scheduled job (e.g. Vercel Cron, GitHub Actions cron,
 * or a manual admin trigger) on a daily-ish cadence.
 *
 * Auth: shared-secret header. We deliberately do NOT use the regular user
 * session here -- this endpoint must be callable by a headless cron with
 * no cookie jar. Set HYPE_DECAY_SECRET in env; if unset, the endpoint is
 * disabled (returns 503) so it can never accidentally run unprotected.
 *
 * Body (optional JSON): { factor: number }   -- multiplier in (0, 1]
 */
export async function POST(request) {
  const secret = process.env.HYPE_DECAY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Decay endpoint disabled (HYPE_DECAY_SECRET not configured)" },
      { status: 503 },
    );
  }

  const provided = request.headers.get("x-hype-decay-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let factor;
  try {
    const text = await request.text();
    if (text) {
      const body = JSON.parse(text);
      factor = body?.factor;
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const result = await applyHypeDecay(
      factor === undefined ? undefined : { factor },
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("applyHypeDecay:")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/hype/decay error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
