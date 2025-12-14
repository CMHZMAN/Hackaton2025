import { IMatchRepository } from "@/domain/interfaces/IMatchRepository";
import { MatchContext, MatchListItem } from "@/domain/models/Match";
import axios from "axios";

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const ODDS_API_KEY = process.env.THE_ODDS_API_KEY;
const BASE_URL = "https://api.football-data.org/v4/";
const ODDS_BASE_URL = "https://api.the-odds-api.com/v4/sports";

export class MatchService implements IMatchRepository {
  private async fetchFromApi(endpoint: string) {
    if (!API_KEY) {
      throw new Error("Football-Data.org API key not configured.");
    }
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: {
          "X-Auth-Token": API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching from Football-Data.org: ${endpoint}`, error);
      throw new Error("Failed to fetch data from Football-Data.org.");
    }
  }

  private async fetchOdds(homeTeam: string, awayTeam: string) {
    if (!ODDS_API_KEY) {
      console.warn("The Odds API key not configured.");
      return null;
    }
    try {
      console.log(`Fetching odds for ${homeTeam} vs ${awayTeam}...`);
      
      // Expanded list of leagues including Portugal, Turkey, etc.
      const sportKeys = [
          'soccer_epl', 
          'soccer_spain_la_liga', 
          'soccer_germany_bundesliga', 
          'soccer_italy_serie_a', 
          'soccer_france_ligue_one', 
          'soccer_netherlands_eredivisie',
          'soccer_portugal_primeira_liga',
          'soccer_turkey_super_league',
          'soccer_uefa_champs_league',
          'soccer_uefa_europa_league'
      ];
      
      for (const sportKey of sportKeys) {
          console.log(`Checking sport key: ${sportKey}`);
          const response = await axios.get(`${ODDS_BASE_URL}/${sportKey}/odds`, {
            params: {
                apiKey: ODDS_API_KEY,
                regions: 'eu',
                markets: 'h2h',
                dateFormat: 'iso',
                oddsFormat: 'decimal'
            }
          });
          
          // Enhanced fuzzy matching logic
          const match = response.data.find((m: any) => {
              const homeApi = m.home_team.toLowerCase();
              const awayApi = m.away_team.toLowerCase();
              const homeLocal = homeTeam.toLowerCase();
              const awayLocal = awayTeam.toLowerCase();

              // Check for exact inclusion
              const homeMatch = homeApi.includes(homeLocal) || homeLocal.includes(homeApi);
              const awayMatch = awayApi.includes(awayLocal) || awayLocal.includes(awayApi);
              
              if (homeMatch && awayMatch) return true;

              // Check for common variations/short names if exact inclusion fails
              // This is a simple example, a robust solution might use Levenshtein distance
              const homeParts = homeLocal.split(' ');
              const awayParts = awayLocal.split(' ');
              
              const homePartialMatch = homeParts.some(part => part.length > 3 && homeApi.includes(part));
              const awayPartialMatch = awayParts.some(part => part.length > 3 && awayApi.includes(part));

              return homePartialMatch && awayPartialMatch;
          });

          if (match) {
              console.log(`Match found in ${sportKey}:`, match.home_team, "vs", match.away_team);
              if (match.bookmakers && match.bookmakers.length > 0) {
                  // Get average or best odds from first bookmaker
                  const market = match.bookmakers[0].markets.find((m: any) => m.key === 'h2h');
                  if (market && market.outcomes) {
                      const home = market.outcomes.find((o: any) => o.name === match.home_team)?.price || 0;
                      const away = market.outcomes.find((o: any) => o.name === match.away_team)?.price || 0;
                      // Draw outcome name is typically 'Draw' but can vary slightly
                      const draw = market.outcomes.find((o: any) => o.name.toLowerCase() === 'draw')?.price || 0;
                      console.log(`Odds found: Home ${home}, Draw ${draw}, Away ${away}`);
                      return { home, draw, away };
                  }
              } else {
                  console.warn("Match found but no bookmakers available.");
              }
          }
      }
      console.warn(`No matching odds found in tested leagues for ${homeTeam} vs ${awayTeam}.`);
      return null;

    } catch (error) {
      console.warn("Error fetching from The Odds API", error);
      return null;
    }
  }

  async getMatchContext(matchId: string): Promise<MatchContext> {
    const matchData = await this.fetchFromApi(`matches/${matchId}`);

    const homeTeamId = matchData.homeTeam.id;
    const awayTeamId = matchData.awayTeam.id;
    const homeTeamName = matchData.homeTeam.name;
    const awayTeamName = matchData.awayTeam.name;
    const competitionId = matchData.competition.id; 

    let homeTeamStandings = { position: 10 }; 
    let awayTeamStandings = { position: 10 }; 

    try {
        const standingsData = await this.fetchFromApi(`competitions/${competitionId}/standings`);
        if (standingsData.standings && standingsData.standings.length > 0) {
             const table = standingsData.standings[0].table;
             const homeEntry = table.find((team: any) => team.team.id === homeTeamId);
             const awayEntry = table.find((team: any) => team.team.id === awayTeamId);
             if (homeEntry) homeTeamStandings = homeEntry;
             if (awayEntry) awayTeamStandings = awayEntry;
        }
    } catch (error) {
        console.warn("Could not fetch standings, using defaults.", error);
    }

    let bookmakerOdds = {
        home: 0,
        draw: 0,
        away: 0
    };

    // Try to fetch real odds from The Odds API
    const realOdds = await this.fetchOdds(homeTeamName, awayTeamName);
    if (realOdds) {
        bookmakerOdds = realOdds;
    } else if (matchData.odds) {
        // Fallback to Football-Data.org odds if available
        bookmakerOdds = {
            home: matchData.odds.homeWin || 0,
            draw: matchData.odds.draw || 0,
            away: matchData.odds.awayWin || 0
        };
    }

    return {
      leagueAverageGoals: {
        home: 1.5,
        away: 1.2,
      },
      homeTeam: {
        name: homeTeamName,
        standings: {
          position: homeTeamStandings.position,
        },
        injuries: [],
        restDays: 7,
      },
      awayTeam: {
        name: awayTeamName,
        standings: {
          position: awayTeamStandings.position,
        },
        injuries: [],
        restDays: 7,
      },
      weather: "Sunny",
      bookmakerOdds,
    };
  }

  async getMatchList(): Promise<MatchListItem[]> {
    const response = await this.fetchFromApi("matches");
    const matches: MatchListItem[] = response.matches.map((match: any) => ({
      id: String(match.id),
      homeTeamName: match.homeTeam.name,
      awayTeamName: match.awayTeam.name,
      date: new Date(match.utcDate).toISOString().split("T")[0],
    }));
    return matches;
  }
}
