import { MatchContext } from "@/domain/models/Match";

const MAX_GOALS = 5;

function poisson(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n === 0) {
    return 1;
  }
  return n * factorial(n - 1);
}

export function calculateFairOdds(matchContext: MatchContext) {
  // 1. Compute baseline expected goals
  const { leagueAverageGoals, homeTeam, awayTeam } = matchContext;

  const homeAdvantage = 0.2;
  const standingsDifference = (awayTeam.standings.position - homeTeam.standings.position) / 20;

  const homeExpectedGoals =
    leagueAverageGoals.home + homeAdvantage + standingsDifference;
  const awayExpectedGoals =
    leagueAverageGoals.away - homeAdvantage - standingsDifference;

  // 2. Compute Poisson probabilities
  const homeProbabilities = Array.from({ length: MAX_GOALS + 1 }, (_, i) =>
    poisson(homeExpectedGoals, i)
  );
  const awayProbabilities = Array.from({ length: MAX_GOALS + 1 }, (_, i) =>
    poisson(awayExpectedGoals, i)
  );

  let homeWinProbability = 0;
  let drawProbability = 0;
  let awayWinProbability = 0;

  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      if (i > j) {
        homeWinProbability += homeProbabilities[i] * awayProbabilities[j];
      } else if (i === j) {
        drawProbability += homeProbabilities[i] * awayProbabilities[j];
      } else {
        awayWinProbability += homeProbabilities[i] * awayProbabilities[j];
      }
    }
  }

  // 3. Normalize probabilities
  const totalProbability =
    homeWinProbability + drawProbability + awayWinProbability;
  homeWinProbability /= totalProbability;
  drawProbability /= totalProbability;
  awayWinProbability /= totalProbability;

  // 4. Convert probabilities to fair odds
  const homeFairOdds = 1 / homeWinProbability;
  const drawFairOdds = 1 / drawProbability;
  const awayFairOdds = 1 / awayWinProbability;

  return {
    homeFairOdds,
    drawFairOdds,
    awayFairOdds,
    homeWinProbability,
    drawProbability,
    awayWinProbability,
  };
}
