export interface MatchContext {
  leagueAverageGoals: {
    home: number;
    away: number;
  };
  homeTeam: {
    name: string;
    standings: {
      position: number;
    };
    injuries: string[];
    restDays: number;
  };
  awayTeam: {
    name:string;
    standings: {
      position: number;
    };
    injuries: string[];
    restDays: number;
  };
  weather?: string;
  bookmakerOdds?: {
    home: number;
    draw: number;
    away: number;
  };
}

export interface MatchListItem {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  date: string;
}
