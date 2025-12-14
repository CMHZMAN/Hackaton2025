import { MatchContext } from "@/domain/models/Match";
import { AIProviderFactory } from "@/infrastructure/services/ai";
import { FairOddsResponse } from "@/domain/models/FairOdds";
import { ChatMessage, createChatMessage } from "@/domain/models";

export async function getAIAdjustment(
  matchContext: MatchContext
): Promise<FairOddsResponse["aiAdjustment"]> {
  const provider = AIProviderFactory.getDefaultProvider();

  if (!provider) {
    throw new Error("No AI provider configured");
  }

  const prompt = `
    You are an AI assistant tasked with providing small, bounded adjustments to expected goals for a football match, along with reasons and a confidence level.
    Given the following match context, provide a JSON object with your adjustment:

    Match Context:
    - Home team: ${matchContext.homeTeam.name} (position: ${matchContext.homeTeam.standings.position}, injuries: ${matchContext.homeTeam.injuries.join(", ")}, rest days: ${matchContext.homeTeam.restDays})
    - Away team: ${matchContext.awayTeam.name} (position: ${matchContext.awayTeam.standings.position}, injuries: ${matchContext.awayTeam.injuries.join(", ")}, rest days: ${matchContext.awayTeam.restDays})
    - League average goals: home ${matchContext.leagueAverageGoals.home.toFixed(2)}, away ${matchContext.leagueAverageGoals.away.toFixed(2)}
    - Weather: ${matchContext.weather || "N/A"}

    Your output MUST be a JSON object with the following structure. Ensure it is valid JSON. Do not wrap the JSON in markdown code blocks.
    {
      "homeExpectedGoalsDelta": number, // Delta must be between -1.0 and 1.0
      "awayExpectedGoalsDelta": number, // Delta must be between -1.0 and 1.0
      "reasons": string[], // Array of strings explaining the adjustments
      "confidence": "low" | "medium" | "high" // Confidence level of your adjustment
    }

    Example output:
    {
      "homeExpectedGoalsDelta": 0.1,
      "awayExpectedGoalsDelta": -0.05,
      "reasons": ["Home team has better recent form.", "Away team has a key injury."],
      "confidence": "medium"
    }
  `;

  const messages: ChatMessage[] = [createChatMessage("user", prompt)];

  return new Promise((resolve, reject) => {
    let fullResponse = "";
    provider.sendMessage(messages, {
      onToken: (token) => {
        fullResponse += token;
      },
      onComplete: () => {
        try {
          // Clean the response: remove markdown code blocks if present
          let cleanResponse = fullResponse.trim();
          if (cleanResponse.startsWith("```json")) {
            cleanResponse = cleanResponse.slice(7);
          } else if (cleanResponse.startsWith("```")) {
            cleanResponse = cleanResponse.slice(3);
          }
          if (cleanResponse.endsWith("```")) {
            cleanResponse = cleanResponse.slice(0, -3);
          }
          cleanResponse = cleanResponse.trim();

          const aiAdjustment = JSON.parse(cleanResponse);
          
          // Validate the structure and bounds of the AI response
          if (
            typeof aiAdjustment.homeExpectedGoalsDelta !== "number" ||
            typeof aiAdjustment.awayExpectedGoalsDelta !== "number" ||
            !Array.isArray(aiAdjustment.reasons) ||
            !["low", "medium", "high"].includes(aiAdjustment.confidence) ||
            aiAdjustment.homeExpectedGoalsDelta < -1.0 ||
            aiAdjustment.homeExpectedGoalsDelta > 1.0 ||
            aiAdjustment.awayExpectedGoalsDelta < -1.0 ||
            aiAdjustment.awayExpectedGoalsDelta > 1.0
          ) {
            throw new Error("Invalid AI response format or out-of-bounds delta.");
          }
          resolve(aiAdjustment);
        } catch (error: any) {
          console.error("Error parsing or validating AI adjustment response:", fullResponse, error);
          reject(new Error("Failed to process AI adjustment: " + error.message));
        }
      },
      onError: (error) => {
        console.error("AI provider error for adjustment:", error);
        reject(new Error("AI provider error during adjustment."));
      },
    });
  });
}
