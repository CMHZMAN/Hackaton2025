export interface FairOddsRequest {
  matchId: string;
}

export interface FairOddsResponse {
  bookmakerOdds: {
    home: number;
    draw: number;
    away: number;
  };
  fairOdds: {
    home: number;
    draw: number;
    away: number;
  };
  probabilities: {
    home: number;
    draw: number;
    away: number;
  };
  aiAdjustment: {
    homeExpectedGoalsDelta: number;
    awayExpectedGoalsDelta: number;
    reasons: string[];
    confidence: "low" | "medium" | "high";
  };
  explanation: string;
}
