# The Interrogation Room

The Interrogation Room is a landscape mobile murder mystery game built around an agentic AI backend. The player explores a mansion, collects hidden-object evidence, interrogates suspects, and must end each case by accusing a suspect with a written deduction. The game then reveals the true story and generates a new adaptive case based on the player's performance.

The project was built for a hackathon-style judging flow where the key requirement is to demonstrate agentic orchestration, dynamic NPC behavior, procedural case generation, and transparent reasoning traces.

## Core Idea

Most mystery games use fixed scripts. The Interrogation Room uses a hub-and-spoke AI architecture:

- The frontend is a React Native mobile game shell.
- The backend is a FastAPI "orchestrator" that coordinates specialized AI agents.
- Gemini is used for dynamic NPC dialogue, companion advice, accusation evaluation, and procedural case generation.
- The game tracks player metrics such as time spent, interrogation count, retry count, and collected evidence.
- Those metrics influence how hard or clear the next case becomes.

## Gameplay Loop

1. The player starts at the home screen.
2. The backend creates a fresh murder case.
3. The game shows a case briefing: victim, scenario, objective, and difficulty.
4. The player explores rooms in the mansion.
5. Clues appear as clickable hidden objects in room scenes.
6. The player interrogates suspects in a visual-novel style interrogation room.
7. The player may ask Detective Riley, the companion agent, for help analyzing clues and contradictions.
8. When ready, the player accuses a suspect and writes their reasoning.
9. The case ends immediately after the accusation.
10. The backend judges:
    - Was the accused suspect the real killer?
    - Was the player's reasoning close enough?
11. The true story is revealed whether the player wins or loses.
12. A new case is generated using the player's performance data.

## Architecture Overview

```text
React Native / Expo App
        |
        | REST API calls
        v
FastAPI Backend Orchestrator
        |
        | routes requests to specialized agents
        v
Gemini Agents
  - Director Agent
  - NPC Agent
  - PCG Agent
  - Companion Agent
  - Judgement Logic
```

## Project Structure

```text
frontend/
  App.tsx
  src/
    screens/
      HomeScreen.tsx
      GameScreen.tsx
    hooks/
      useGameState.ts
    services/
      api.ts
    components/
      AgentTraceLogModal.tsx
      ClueInventory.tsx
      DialogueBox.tsx
    types/
      game.d.ts

backend/
  main.py
  models/
    schemas.py
  agents/
    orchestrator.py
    director_agent.py
    npc_agent.py
    pcg_agent.py
    companion_agent.py
    prompts.py
```

## Frontend

The frontend is an Expo managed React Native app written in TypeScript.

Main features:

- Landscape mobile layout.
- Home screen with play button.
- Case briefing modal before each investigation.
- Mansion room navigation.
- Clickable clue hotspots.
- Suspect portrait dock.
- Interrogation room layout with suspect portrait and case transcript.
- Written accusation flow.
- Resolution screen with real story reveal.
- Agent trace modal that exposes observation, inference, decision, and action.
- Companion chat with Detective Riley.

Frontend stack:

- React Native
- Expo
- TypeScript
- React Navigation
- Expo Linear Gradient
- Lucide React Native icons

## Backend

The backend is a FastAPI application that exposes game endpoints and coordinates the agentic system.

Backend stack:

- FastAPI
- Uvicorn
- Pydantic
- google-generativeai
- python-dotenv

The backend keeps session state in memory for the demo. Each player receives a `session_id`, and all case state is stored under that session. This separates concurrent players as long as each device has its own session.

For production, this should be moved to Redis or a database with per-session locks.

## Agents Developed

### 1. Orchestrator Hub

File: `backend/agents/orchestrator.py`

The orchestrator is the central coordinator. It:

- Starts sessions.
- Stores current case state.
- Tracks the true killer.
- Routes interrogation requests to the NPC agent.
- Routes metrics to the director logic.
- Handles accusation outcomes.
- Ends cases after accusation.
- Generates and stores the next adaptive level.

### 2. Director Agent

File: `backend/agents/director_agent.py`

The Director Agent evaluates player metrics and produces a gameplay directive. For example:

- If the player is struggling, suspects loosen their defenses.
- If the player is performing well, suspects keep alibis tighter.

This gives the game adaptive difficulty inside live dialogue.

### 3. NPC Agent

File: `backend/agents/npc_agent.py`

The NPC Agent uses Gemini to respond as a suspect. It receives:

- NPC name
- Player question
- Director directive

It must return strict JSON:

```json
{
  "dialogue": "NPC response",
  "trace": {
    "observation": "What was observed",
    "inference": "What the agent inferred",
    "decision": "Why it chose this response",
    "action": "What it did"
  }
}
```

The NPC agent also includes accusation reasoning evaluation. If the player accuses the correct suspect but gives weak reasoning, the case still ends, but the player does not get full success.

### 4. PCG Agent

File: `backend/agents/pcg_agent.py`

The PCG Agent creates new murder mystery cases. It generates:

- Theme
- Victim
- True solution story
- 4-5 suspects
- Exactly one killer
- 5-6 hidden-object clues
- Red herrings
- Critical contradictions

It also receives previous case themes and player performance so it can avoid repeating the same type of case and adjust difficulty.

### 5. Companion Agent: Detective Riley

File: `backend/agents/companion_agent.py`

Detective Riley acts as the player's partner. Riley does not know the hidden killer directly. Instead, Riley analyzes:

- Discovered clues
- Suspect transcript history
- Player questions

Riley helps summarize contradictions, review theories, and guide the player without solving the case outright.

## Multilingual NLP

NPCs and Detective Riley include a language mirroring rule. The agents are instructed to detect the player's latest input language and respond in the same language/script:

- English input -> English response
- Roman Urdu/Hindi input -> Roman Urdu response
- Urdu/Arabic script input -> same native script response

This allows a player to naturally ask questions like:

```text
tum us waqt kahan thay?
```

and receive a Roman Urdu response while keeping the suspect's personality intact.

## API Endpoints

### `GET /health`

Simple backend health check.

### `POST /game/start`

Starts a session or loads the next prepared case.

Returns:

- session id
- level id
- title
- room description
- objective
- difficulty
- NPC list
- clue list
- starting trace

### `POST /game/interrogate`

Used when the player asks a suspect a question.

Request includes:

- session id
- NPC id
- player message
- current metrics

Returns:

- NPC dialogue
- agent trace

### `POST /game/accuse`

Used when the player makes a final accusation.

Request includes:

- session id
- accused NPC id
- written assumption/reasoning
- current player metrics

Returns:

- success or failed status
- outcome message
- real solution story
- next generated level

Important behavior: the case ends after every accusation, whether correct or incorrect.

### `POST /game/companion/chat`

Used by Detective Riley companion chat.

Request includes:

- session id
- player message
- global suspect transcript
- discovered clues

Returns:

- Riley response
- agent trace

### `POST /game/generate_level`

Returns a procedural level configuration based on player metrics.

## Real and Mock APIs

Real APIs used:

- Gemini through `google-generativeai`
- FastAPI REST endpoints consumed by the Expo app

Mock/demo behavior:

- Sessions are stored in an in-memory Python dictionary.
- If Gemini fails or returns invalid JSON, local fallback responses keep the game playable.
- Room background images are currently fixed remote image URLs.
- Clue positions are currently UI-defined placeholders mapped to generated clue objects.

## Agent Trace Transparency

A major feature is the Agent Trace Log. The frontend includes a terminal-style modal showing how agents reason:

- Observation
- Inference
- Decision
- Action
- Confidence

This is used to demonstrate agentic behavior to judges and players.

## Adaptive Difficulty

The game tracks:

- elapsed seconds
- number of interrogations
- retry count
- inspected clue ids
- accusation accuracy

After each accusation, the orchestrator builds a performance profile and passes it to the PCG agent.

Examples:

- Fast correct solve with evidence -> next case becomes more ambiguous.
- Wrong accusation or poor reasoning -> next case has a clearer clue chain.
- Mixed performance -> adaptive middle difficulty.

## Setup

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Add the Gemini key to `backend/.env`:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL_NAME=gemini-3.1-flash-lite
```

### Frontend

```powershell
cd frontend
npm install
npx expo start -c
```

The backend URL is configured in:

```text
frontend/src/services/api.ts
```

Current demo backend:

```text
https://the-interrogation-room-backend.onrender.com
```

## Validation

Frontend:

```powershell
cd frontend
npx tsc --noEmit
```

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m compileall main.py agents models
```

## APK Build

The Expo app can be built into an APK with EAS:

```powershell
cd frontend
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

For APK output, `eas.json` should use:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## Limitations and Future Work

- Replace in-memory sessions with Redis or Postgres.
- Add per-session async locks for stronger concurrency safety.
- Generate or fetch realistic room-specific scene images per procedural case.
- Persist player progress across app restarts.
- Add sound design, transitions, and custom art assets.
- Add better clue object placement driven by backend room metadata.
- Add deploy-time environment configuration for frontend API base URL.

## Summary

The Interrogation Room demonstrates a complete agentic game loop:

- AI-generated murder cases
- Adaptive suspect dialogue
- Companion reasoning assistant
- Written accusation evaluation
- Transparent agent traces
- Performance-based next-level generation

The result is not just a visual novel shell, but a playable mystery system where agents actively shape the content, difficulty, and player experience.
