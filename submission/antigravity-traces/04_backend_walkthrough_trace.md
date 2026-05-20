# Backend Walkthrough Trace

## Stack

- FastAPI
- Uvicorn
- Pydantic
- google-generativeai
- python-dotenv

## Entry Point

File:

```text
backend/main.py
```

The backend exposes REST APIs consumed by the Expo app.

## Endpoints

### GET /health

Purpose:

- Verify backend is online.

### POST /game/start

Purpose:

- Start a new game session.
- Load a prepared next level if one exists.
- Otherwise generate a new case.

### POST /game/interrogate

Purpose:

- Send player question to the NPC agent.
- Return suspect dialogue and trace.

### POST /game/accuse

Purpose:

- End the current case.
- Check if accused NPC is killer.
- Check if player reasoning is close enough.
- Reveal real story.
- Generate next adaptive case.

### POST /game/companion/chat

Purpose:

- Ask Detective Riley to analyze the current case.
- Send transcript and discovered clues.
- Return companion advice and trace.

### POST /game/generate_level

Purpose:

- Generate a procedural level configuration using metrics.

## Session Handling

Current demo implementation:

```text
SESSION_STORE: dict[str, dict]
```

Each player has a `session_id`. Case state, killer ID, solution, and next prepared level are stored under that session.

Production note:

- Replace in-memory store with Redis or Postgres.
- Add per-session locks for concurrent request safety.

## Error Handling

Gemini responses must be strict JSON. If parsing fails:

- raw exception is logged
- fallback response is returned
- API contract stays valid

This keeps the demo playable even when model output is imperfect.

