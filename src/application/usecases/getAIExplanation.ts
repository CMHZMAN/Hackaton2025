import { MatchContext } from "@/domain/models/Match";
import { AIProviderFactory } from "@/infrastructure/services/ai";
import { FairOddsResponse } from "@/domain/models/FairOdds";
import { ChatMessage, createChatMessage } from "@/domain/models";

export async function getAIExplanation(
  matchContext: MatchContext,
  fairOdds: FairOddsResponse["fairOdds"],
  aiAdjustment: FairOddsResponse["aiAdjustment"]
): Promise<string> {
  const provider = AIProviderFactory.getDefaultProvider();

  if (!provider) {
    throw new Error("No AI provider configured");
  }

  const prompt = `
    You are an AI assistant specialized in explaining football match predictions.
    Given the following match context, calculated fair odds, and AI adjustments, provide a clear, concise, and easy-to-understand explanation in plain language.
    Highlight any significant factors or adjustments made.

    Match Context:
    - Home team: ${matchContext.homeTeam.name} (position: ${matchContext.homeTeam.standings.position}, injuries: ${matchContext.homeTeam.injuries.join(", ")}, rest days: ${matchContext.homeTeam.restDays})
    - Away team: ${matchContext.awayTeam.name} (position: ${matchContext.awayTeam.standings.position}, injuries: ${matchContext.awayTeam.injuries.join(", ")}, rest days: ${matchContext.awayTeam.restDays})
    - League average goals: home ${matchContext.leagueAverageGoals.home.toFixed(2)}, away ${matchContext.leagueAverageGoals.away.toFixed(2)}
    - Weather: ${matchContext.weather || "N/A"}

    Calculated Fair Odds:
    - Home: ${fairOdds.home.toFixed(2)}
    - Draw: ${fairOdds.draw.toFixed(2)}
    - Away: ${fairOdds.away.toFixed(2)}

    AI Adjustment:
    - Home expected goals delta: ${aiAdjustment.homeExpectedGoalsDelta.toFixed(2)}
    - Away expected goals delta: ${aiAdjustment.awayExpectedGoalsDelta.toFixed(2)}
    - Reasons: ${aiAdjustment.reasons.join(", ")}
    - Confidence: ${aiAdjustment.confidence}

    Your explanation should be a single block of text. Focus on explaining *why* the odds are what they are, and *what* the AI adjustments mean in simple terms.
  `;

  const messages: ChatMessage[] = [createChatMessage("user", prompt)];

  return new Promise((resolve, reject) => {
    let fullResponse = "";
    provider.sendMessage(messages, {
      onToken: (token) => {
        fullResponse += token;
      },
      onComplete: () => {
        // Explanation is expected to be plain text, no JSON parsing needed
        if (fullResponse.trim().length === 0) {
          reject(new Error("AI explanation received empty response."));
        } else {
          resolve(fullResponse.trim());
        }
      },
      onError: (error) => {
        console.error("AI provider error for explanation:", error);
        reject(new Error("AI provider error during explanation."));
      },
    });
  });
}
