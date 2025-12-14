# FairOdds AI

FairOdds AI is an educational football match analysis application built as a bootcamp assignment.

The application compares bookmaker odds with internally calculated fair odds using a transparent statistical model, enhanced by a controlled AI reasoning layer.

This project focuses on **explainability, reproducibility, and system design**, not betting or prediction hype.

---

## What problem does this solve?

Bookmaker odds are difficult to interpret.

Users often do not know:
- if odds are reasonable
- what assumptions drive them
- how context such as injuries or rest days affect probabilities

FairOdds AI answers:
> Are current market odds fair given observable match context?

---

## What makes this different from just asking ChatGPT?

ChatGPT can provide opinions.
FairOdds AI provides a **deterministic, reproducible analysis pipeline**.

Key differences:
- probabilities are computed in code, not guessed
- same input always produces the same output
- AI cannot invent numbers
- market odds are explicitly compared to fair odds
- results are visualized and explained

---

## High level system overview

The system has two layers.

### Deterministic model
- expected goals calculation
- Poisson probability model
- fair odds computation
- market comparison

### AI layer
- suggests small bounded adjustments to expected goals
- explains the result in plain language
- highlights uncertainty

AI never computes probabilities or odds directly.

---

## Supported market

Only **1 X 2** outcomes:
- Home win
- Draw
- Away win

This is intentional to keep the scope focused and transparent.

---

## Data used

Minimum signals:
- bookmaker odds
- league standings
- home or away context
- rest days
- injury flags

Optional:
- weather summary

No scraping, sentiment analysis, or free text match reports are used.

---

## Features

- match selection
- bookmaker odds table
- fair odds calculation
- value comparison
- probability visualization
- market vs fair visualization
- AI explanation
- demo mode fallback

---

## Tech Stack

This project is built directly on top of the provided bootcamp template.
We intentionally reuse the existing architecture and tooling.

### Frontend
- Next.js (App Router)
- React
- TypeScript
- Component system provided by the template
- Chart library for data visualization

### Backend
- Next.js API routes (server side)
- Clean architecture structure (domain, infrastructure, presentation)
- Deterministic calculation modules for odds and probabilities

### AI Layer
- AI provider abstraction from the template
- AI used only for:
  - controlled model adjustments
  - explanation and reasoning
- AI never computes probabilities or odds

### Data Sources
- Bookmaker odds API (or mock data in demo mode)
- Football match and standings API (or mock data in demo mode)
- Optional weather API

### Demo Mode
- Full offline demo support
- Mocked data to ensure stable presentation regardless of external APIs

---

## Disclaimer

This application is informational only.
It does not support betting and does not provide financial advice.

---

## Assignment focus

This project is evaluated on:
- correctness of reasoning
- system design
- separation of concerns
- clarity and honesty about limitations

Accuracy is less important than transparency and architecture.
