from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.orchestrator import generate_level, handle_accusation, run_interrogation_pipeline, start_game, handle_companion_chat
from models.schemas import (
    AccusationRequest,
    AccusationResponse,
    GameState,
    InterrogationRequest,
    InterrogationResponse,
    LevelConfiguration,
    LevelGenerationRequest,
    StartGameRequest,
    CompanionChatRequest,
    CompanionChatResponse,
)

app = FastAPI(
    title="The Interrogation Room Agentic Orchestrator",
    description="Mock FastAPI backend for adaptive murder mystery gameplay.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/game/start", response_model=GameState)
async def start_game_session(request: StartGameRequest | None = None) -> GameState:
    session_id = request.session_id if request else None
    return start_game(session_id)



@app.post("/game/interrogate", response_model=InterrogationResponse)
async def interrogate(action: InterrogationRequest) -> InterrogationResponse:
    return run_interrogation_pipeline(action)


@app.post("/game/accuse", response_model=AccusationResponse)
async def accuse(action: AccusationRequest) -> AccusationResponse:
    return handle_accusation(action)


@app.post("/game/generate_level", response_model=LevelConfiguration)
async def create_generated_level(request: LevelGenerationRequest) -> LevelConfiguration:
    return generate_level(
        session_id=request.session_id,
        metrics=request.current_metrics,
        previous_level_id=request.previous_level_id,
    )


@app.post("/game/companion/chat", response_model=CompanionChatResponse)
async def companion_chat(action: CompanionChatRequest) -> CompanionChatResponse:
    return handle_companion_chat(action)
