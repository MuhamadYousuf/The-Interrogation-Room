# The Interrogation Room - Project Overview Trace

## Project

The Interrogation Room is a landscape mobile murder mystery game with an agentic AI backend. The player explores a mansion, collects evidence, interrogates suspects, consults a partner agent, and ends each case with a written accusation.

## Core Objective

Build a playable game loop that demonstrates:

- Agent-driven NPC dialogue
- Procedural murder mystery generation
- Adaptive difficulty based on player behavior
- Transparent trace logs showing observation, inference, decision, and action
- A visual mobile frontend that feels like a point-and-click / visual novel mystery game

## Final Architecture

```text
React Native Expo frontend
  - Home screen
  - Case briefing
  - Room exploration
  - Hidden clue collection
  - Suspect interrogation
  - Accusation reasoning
  - Agent trace console

FastAPI backend
  - Session state
  - Orchestrator hub
  - Director agent
  - NPC agent
  - PCG agent
  - Companion agent
  - Accusation judgement

Gemini API
  - Dynamic dialogue
  - Companion reasoning
  - Procedural level generation
  - Accusation reasoning evaluation
```

## Major Design Decision

The game uses a hub-and-spoke agentic architecture instead of a single monolithic prompt. The backend orchestrator coordinates specialized agents so each agent has one clear responsibility.

## Why This Matters

This makes the project easier to explain to judges:

- The Director Agent adapts gameplay difficulty.
- The NPC Agent drives suspect behavior.
- The PCG Agent generates new cases.
- The Companion Agent helps the player reason.
- The Orchestrator decides how these agents interact.

## Current Demo Backend

The frontend API service points to:

```text
https://the-interrogation-room-backend.onrender.com
```

## Validation Completed

Frontend:

```powershell
npx tsc --noEmit
```

Backend:

```powershell
.\.venv\Scripts\python.exe -m compileall main.py agents models
```

