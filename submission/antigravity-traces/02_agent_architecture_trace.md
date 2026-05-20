# Agent Architecture Trace

## Orchestrator Hub

File:

```text
backend/agents/orchestrator.py
```

Responsibilities:

- Own session state.
- Start new games.
- Store current level state.
- Track true killer per session.
- Route player interrogation to NPC agent.
- Route performance metrics to Director logic.
- Evaluate accusation outcomes.
- Generate and store the next level.

Trace pattern:

```text
Observation: player action and current metrics
Inference: what the action means for difficulty or story state
Decision: which agent should handle the next step
Action: call NPC, PCG, companion, or judgement logic
```

## Director Agent

File:

```text
backend/agents/director_agent.py
```

Responsibilities:

- Evaluate metrics such as time spent, ask count, retry count, and accuracy.
- Produce a directive that changes NPC behavior.

Example directive:

```text
The player is struggling. Loosen your defenses and accidentally slip up with a clue.
```

## NPC Agent

File:

```text
backend/agents/npc_agent.py
```

Responsibilities:

- Generate suspect dialogue.
- Stay in character.
- Follow the Director Agent directive.
- Return strict JSON.
- Provide trace object with observation, inference, decision, and action.
- Evaluate accusation reasoning.

Important behavior:

- The NPC must not reveal the killer outright during interrogation.
- The NPC adapts to the language/script used by the player.

## PCG Agent

File:

```text
backend/agents/pcg_agent.py
```

Responsibilities:

- Generate fresh murder mystery cases.
- Create 4-5 suspects.
- Ensure exactly one killer.
- Create 5-6 clickable clues.
- Include critical contradictions and red herrings.
- Avoid repeating previous case themes.
- Adjust difficulty using player performance.

Performance inputs:

- solved or failed
- accuracy
- elapsed seconds
- interrogation count
- retry count
- inspected clue count

## Companion Agent

File:

```text
backend/agents/companion_agent.py
```

Persona:

Detective Riley, the player's partner.

Responsibilities:

- Analyze discovered clues.
- Read global suspect transcript.
- Help player reason through contradictions.
- Avoid directly revealing hidden killer identity.
- Mirror the player's language and script.

## Agent Trace Contract

Every major agent response includes:

```json
{
  "observation": "What the agent noticed",
  "inference": "What the agent concluded",
  "decision": "Why it chose this strategy",
  "action": "What it returned or changed"
}
```

The frontend displays these in the Agent Reasoning Console.

