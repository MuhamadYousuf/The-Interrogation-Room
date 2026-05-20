# Frontend Walkthrough Trace

## Stack

- Expo managed workflow
- React Native
- TypeScript
- React Navigation
- Expo Linear Gradient
- Lucide React Native icons

## Key Files

```text
frontend/App.tsx
frontend/src/screens/HomeScreen.tsx
frontend/src/screens/GameScreen.tsx
frontend/src/hooks/useGameState.ts
frontend/src/services/api.ts
frontend/src/types/game.d.ts
```

## Home Screen

File:

```text
frontend/src/screens/HomeScreen.tsx
```

Purpose:

- Introduce The Interrogation Room.
- Provide a clear play button.
- Navigate to the game screen.
- Use responsive landscape layout so content does not disappear on smaller phones.

## Game Screen

File:

```text
frontend/src/screens/GameScreen.tsx
```

Main modes:

- Room exploration
- Interrogation mode

Room exploration includes:

- Background room image.
- Compact HUD.
- Location navigation.
- Clickable clue hotspots.
- Suspect dock.
- Evidence bag modal.
- Agent trace console button.
- Detective Riley companion button.

Interrogation mode includes:

- Suspect portrait.
- Back to Room button.
- Case transcript panel.
- Message input.
- Accuse button.

## Case Briefing

The case briefing modal appears at the beginning of each case. It includes:

- case title
- scenario
- objective
- difficulty

The briefing content is scrollable so long generated text does not get clipped.

## Accusation Flow

The player cannot simply tap a suspect and win. They must type an assumption explaining:

- how the suspect committed the murder
- motive
- contradiction or evidence chain

The backend judges both suspect correctness and reasoning quality.

## Resolution Flow

After any accusation:

- The case ends.
- The true story is shown.
- The result is marked as solved or failed.
- The player returns home.
- The next play continues with the prepared adaptive case.

## Trace Console

The Agent Trace Log modal displays backend traces:

- observation
- inference
- decision
- action
- confidence

This is the visible proof of agentic behavior in the app.

