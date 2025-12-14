"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FairOddsResponse } from "@/domain/models/FairOdds";
import { MatchListItem } from "@/domain/models/Match";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

export default function FairOddsPage() {
  const [matchId, setMatchId] = useState("");
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FairOddsResponse | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch("/api/matches");
        if (!response.ok) {
          throw new Error("Failed to fetch matches.");
        }
        const data: MatchListItem[] = await response.json();
        setMatches(data);
        if (data.length > 0) {
          setMatchId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId) {
      setError("Please select a match.");
      return;
    }

    setLoadingAnalysis(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/fairodds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || "An unknown error occurred.");
      }

      const data: FairOddsResponse = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const probabilityData = results
    ? [
        { name: "Home Win", value: results.probabilities.home },
        { name: "Draw", value: results.probabilities.draw },
        { name: "Away Win", value: results.probabilities.away },
      ]
    : [];

  const oddsComparisonData = results
    ? [
        {
          name: "Home",
          Bookmaker: results.bookmakerOdds.home,
          Fair: results.fairOdds.home,
        },
        {
          name: "Draw",
          Bookmaker: results.bookmakerOdds.draw,
          Fair: results.fairOdds.draw,
        },
        {
          name: "Away",
          Bookmaker: results.bookmakerOdds.away,
          Fair: results.fairOdds.away,
        },
      ]
    : [];

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">FairOdds AI Analysis</h1>
        <p className="text-muted-foreground">
          Advanced match analysis powered by deterministic models and AI reasoning.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match Selection</CardTitle>
          <CardDescription>
            Select a match to generate fair odds and AI insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="grid gap-2 flex-1">
              {loadingMatches ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground h-10">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading matches...
                </div>
              ) : (
                <Select onValueChange={setMatchId} value={matchId}>
                  <SelectTrigger id="match">
                    <SelectValue placeholder="Select a match" />
                  </SelectTrigger>
                  <SelectContent>
                    {matches.map((match) => (
                      <SelectItem key={match.id} value={match.id}>
                        {match.homeTeamName} vs {match.awayTeamName} ({match.date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button type="submit" disabled={loadingAnalysis || loadingMatches || !matchId}>
              {loadingAnalysis ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Get Fair Odds
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Stats Cards */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Odds Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={oddsComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Bookmaker" fill="#8884d8" name="Bookmaker Odds" />
                    <Bar dataKey="Fair" fill="#82ca9d" name="Fair Odds (Model)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Probabilities Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Win Probabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={probabilityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {probabilityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${(value * 100).toFixed(2)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* AI Adjustment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5" />
                AI Model Adjustments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Home xG Delta</div>
                  <div className={`text-xl font-bold ${results.aiAdjustment.homeExpectedGoalsDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.aiAdjustment.homeExpectedGoalsDelta > 0 ? '+' : ''}
                    {results.aiAdjustment.homeExpectedGoalsDelta.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Away xG Delta</div>
                  <div className={`text-xl font-bold ${results.aiAdjustment.awayExpectedGoalsDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.aiAdjustment.awayExpectedGoalsDelta > 0 ? '+' : ''}
                    {results.aiAdjustment.awayExpectedGoalsDelta.toFixed(2)}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Confidence Level</div>
                <div className="w-full bg-secondary rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      results.aiAdjustment.confidence === 'high' ? 'bg-green-500 w-full' :
                      results.aiAdjustment.confidence === 'medium' ? 'bg-yellow-500 w-2/3' :
                      'bg-red-500 w-1/3'
                    }`} 
                  />
                </div>
                <div className="text-xs text-right mt-1 capitalize text-muted-foreground">
                  {results.aiAdjustment.confidence}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Reasoning */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                AI Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                {results.aiAdjustment.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Full Explanation */}
          <Card className="md:col-span-2 lg:col-span-3 bg-muted/50">
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground">
                {results.explanation}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
