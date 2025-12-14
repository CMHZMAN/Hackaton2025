# AI Agent Build Instructions – FairOdds AI

You are implementing FairOdds AI inside this repository.
Follow these instructions strictly.

Do not add features beyond this document.

---

## Goal

Build a football match analysis system that:
- computes fair odds deterministically
- optionally applies bounded AI based adjustments
- explains results clearly
- works fully in demo mode

---

## Core rules

- AI must never output probabilities or odds
- All probability calculations must be done in code
- All AI outputs must be validated and bounded
- Same input must produce the same numerical output
- If external APIs fail, demo mode must still work

---

## Supported market

Only 1 X 2:
- home
- draw
- away

No other markets.

---

## Calculation pipeline

1. Fetch or load match context
2. Compute baseline expected goals
3. Apply optional AI adjustments to expected goals
4. Compute Poisson probabilities
5. Convert probabilities to fair odds
6. Compare with bookmaker odds
7. Generate AI explanation
8. Return structured response to UI

---

## Expected goals baseline

Use a simple deterministic approach:
- league average goals
- home advantage
- standings position difference

Keep logic readable and explainable.

---

## Poisson model

Compute probabilities for goals 0–5 for both teams.
Aggregate probabilities for:
- home win
- draw
- away win

Normalize probabilities.

---

## Fair odds

fair_odds = 1 / probability

Clamp odds to reasonable max values.

---

## AI adjustment step

AI input:
- baseline expected goals
- injuries summary
- standings
- rest days
- home away context
- optional weather

AI output must be:

```json
{
  "homeExpectedGoalsDelta": number,
  "awayExpectedGoalsDelta": number,
  "reasons": string[],
  "confidence": "low | medium | high"
}
