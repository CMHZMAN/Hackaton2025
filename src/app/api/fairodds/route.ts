import {
  withSecurity,
  SecureRequest,
} from "@/infrastructure/security";
import { FairOddsRequest, FairOddsResponse } from "@/domain/models/FairOdds";
import { MatchContext } from "@/domain/models/Match";
import { calculateFairOdds } from "@/application/usecases/calculateFairOdds";
import { getAIAdjustment } from "@/application/usecases/getAIAdjustment";
import { getAIExplanation } from "@/application/usecases/getAIExplanation";
import { MatchService } from "@/infrastructure/services/match/MatchService";

export interface ValidatedFairOddsRequest extends FairOddsRequest {}

/**
 * POST /api/fairodds
 *
 * Secure FairOdds AI endpoint with:
 * - Rate limiting
 * - Input validation
 *
 * Request body:
 * - matchId: The ID of the match to analyze (required)
 *
 * Response:
 * - FairOddsResponse object
 */
export const POST = withSecurity<{ matchId: string }>(
  {
    modality: "fairodds",
    validateInput: true,
    requireAuth: false, // Anonymous access for workshop convenience
  },
  async (request: SecureRequest, body: ValidatedFairOddsRequest) => {
    const { matchId } = body;
    const { requestId } = request;

    const matchService = new MatchService();
    const matchContext = await matchService.getMatchContext(matchId);

    const {
      homeFairOdds,
      drawFairOdds,
      awayFairOdds,
      homeWinProbability,
      drawProbability,
      awayWinProbability,
    } = calculateFairOdds(matchContext);

    const aiAdjustment = await getAIAdjustment(matchContext);

    const adjustedMatchContext = {
      ...matchContext,
      leagueAverageGoals: {
        home:
          matchContext.leagueAverageGoals.home +
          aiAdjustment.homeExpectedGoalsDelta,
        away:
          matchContext.leagueAverageGoals.away +
          aiAdjustment.awayExpectedGoalsDelta,
      },
    };

    const {
      homeFairOdds: adjustedHomeFairOdds,
      drawFairOdds: adjustedDrawFairOdds,
      awayFairOdds: adjustedAwayFairOdds,
      homeWinProbability: adjustedHomeWinProbability,
      drawProbability: adjustedDrawProbability,
      awayWinProbability: adjustedAwayWinProbability,
    } = calculateFairOdds(adjustedMatchContext);

    const explanation = await getAIExplanation(
      matchContext,
      {
        home: adjustedHomeFairOdds,
        draw: adjustedDrawFairOdds,
        away: adjustedAwayFairOdds,
      },
      aiAdjustment
    );

    const response: FairOddsResponse = {
      bookmakerOdds: {
        home: 0,
        draw: 0,
        away: 0,
      },
      fairOdds: {
        home: adjustedHomeFairOdds,
        draw: adjustedDrawFairOdds,
        away: adjustedAwayFairOdds,
      },
      probabilities: {
        home: adjustedHomeWinProbability,
        draw: adjustedDrawProbability,
        away: adjustedAwayWinProbability,
      },
      aiAdjustment,
      explanation,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
    });
  }
);
