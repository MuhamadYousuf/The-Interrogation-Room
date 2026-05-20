# Decision Log Trace

## Decision: Use FastAPI Backend

Reason:

- Simple REST integration with Expo.
- Strong Pydantic validation.
- Easy to deploy and demonstrate.

## Decision: Use Expo Managed Workflow

Reason:

- Fast mobile iteration.
- Easy APK generation with EAS.
- TypeScript support.

## Decision: Use StyleSheet Instead of NativeWind

Reason:

- Reduced configuration risk during hackathon.
- Faster to keep app runnable.
- Easier to debug layout issues in landscape mode.

## Decision: Landscape Layout

Reason:

- Better match for visual novel / point-and-click game style.
- More space for suspect portrait and transcript panel.

## Decision: Case Ends After Accusation

Reason:

- Better mystery-game tension.
- Prevents random guessing.
- Lets the backend reveal the real story and prepare the next case.

## Decision: Written Accusation Required

Reason:

- Forces reasoning, not just suspect guessing.
- Gives the Judgement Agent something meaningful to evaluate.

## Decision: In-Memory Session Store for Demo

Reason:

- Fast for hackathon implementation.
- Enough for single-server demo.

Risk:

- Not production safe across server restarts or multiple workers.

Future fix:

- Redis or database-backed session store.

## Decision: Agent Trace Console

Reason:

- Required for Antigravity-style transparency.
- Shows visible observation/inference/decision/action chain.
- Helps judges understand agentic behavior.

