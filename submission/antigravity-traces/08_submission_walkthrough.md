# Submission Walkthrough

## What to Show Judges

1. Open the app.
2. Show home screen: The Interrogation Room.
3. Press play.
4. Show generated case briefing.
5. Enter investigation.
6. Tap clue hotspots to collect evidence.
7. Open Evidence Bag.
8. Tap a suspect and enter interrogation mode.
9. Ask a suspect a question.
10. Open Agent Trace Console.
11. Show observation, inference, decision, and action.
12. Ask Detective Riley for help.
13. Accuse a suspect and type reasoning.
14. Show result screen and real story reveal.
15. Return home and start next adaptive case.

## Important Talking Points

- The game is not using fixed case scripts only.
- The PCG agent generates new cases.
- The NPC agent responds dynamically.
- The Director agent adapts difficulty.
- Riley is a companion reasoning agent.
- The accusation system checks suspect identity and reasoning quality.
- Trace logs are visible in-game.
- These files summarize the implementation process and architecture.

## Demo Risk Notes

- Backend must be online.
- Gemini key must be configured on deployed backend.
- If Gemini output fails JSON parsing, fallback logic keeps the game playable.
- Session state is in-memory for demo, so server restarts reset sessions.

