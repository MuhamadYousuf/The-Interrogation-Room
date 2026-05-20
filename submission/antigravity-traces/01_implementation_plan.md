# Implementation Plan Trace

## Phase 1 - Frontend Scaffold

Goal: create the first Expo mobile shell.

Tasks:

- Create Expo TypeScript frontend.
- Add React Navigation.
- Add reusable components for dialogue, clue inventory, and trace log modal.
- Build initial `GameScreen`.
- Add TypeScript types for NPCs, clues, level state, and agent traces.

Outcome:

- Frontend structure created under `frontend/src`.
- Initial core game loop represented in React state.

## Phase 2 - Backend Scaffold

Goal: create the FastAPI orchestrator backend.

Tasks:

- Create `backend/main.py`.
- Create Pydantic schemas in `backend/models/schemas.py`.
- Create `agents/orchestrator.py`.
- Create agent prompt files and placeholder agent logic.
- Enable CORS for Expo communication.

Outcome:

- Backend endpoints created:
  - `POST /game/start`
  - `POST /game/interrogate`
  - `POST /game/generate_level`

## Phase 3 - Gemini Agent Integration

Goal: replace mock logic with agentic Gemini calls.

Tasks:

- Add `google-generativeai`.
- Load Gemini API key from `.env`.
- Add NPC agent using Gemini.
- Add PCG agent using Gemini.
- Add fallback handling if Gemini fails or returns invalid JSON.

Outcome:

- Dynamic suspect dialogue added.
- Procedural murder mystery generation added.

## Phase 4 - Professional Game Flow

Goal: make the app feel like a game, not a utility app.

Tasks:

- Add landscape orientation.
- Add home screen.
- Add case briefing modal.
- Rework screen layout into room exploration and interrogation mode.
- Add clickable clue hotspots.
- Add suspect dock and room navigation.
- Add accusation modal.
- Add resolution modal.

Outcome:

- Game loop became:
  Home -> Briefing -> Explore -> Interrogate -> Accuse -> Reveal -> Next Case

## Phase 5 - Adaptive Accusation and Next Case

Goal: make accusation a final case-ending action.

Tasks:

- Require written accusation reasoning.
- Judge whether accused suspect is correct.
- Judge whether reasoning is close enough.
- Reveal the real story in every outcome.
- Generate next case based on performance.
- Avoid repeating previous themes.

Outcome:

- Correct suspect + correct reasoning = case solved.
- Correct suspect + weak reasoning = case closed but failed.
- Wrong suspect = case closed and real killer revealed.
- Next case difficulty adapts from player behavior.

## Phase 6 - Submission Polish

Goal: prepare for hackathon submission.

Tasks:

- Rename project to The Interrogation Room.
- Add README documentation.
- Add Antigravity trace/log submission files.
- Ensure `.env`, `.venv`, `node_modules`, `.expo`, and caches are ignored.
- Validate frontend and backend.

