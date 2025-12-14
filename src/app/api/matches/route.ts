import { NextResponse } from "next/server";
import { MatchService } from "@/infrastructure/services/match/MatchService";

/**
 * GET /api/matches
 *
 * Returns a list of available matches.
 */
export async function GET() {
  try {
    const matchService = new MatchService();
    const matches = await matchService.getMatchList();
    return NextResponse.json(matches);
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: { message: error.message || "Failed to fetch matches." } }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
