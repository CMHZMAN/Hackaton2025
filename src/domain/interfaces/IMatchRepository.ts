import { MatchContext, MatchListItem } from "../models/Match";

export interface IMatchRepository {
  getMatchContext(matchId: string): Promise<MatchContext>;
  getMatchList(): Promise<MatchListItem[]>;
}
