from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


Difficulty = Literal["intro", "standard", "tense", "adaptive"]
NpcMood = Literal["calm", "guarded", "anxious", "hostile", "grieving"]
ClueRelevance = Literal["minor", "supporting", "critical"]


class PlayerMetrics(BaseModel):
    elapsed_seconds: int = Field(default=0, ge=0)
    interrogation_count: int = Field(default=0, ge=0)
    retry_count: int = Field(default=0, ge=0)
    accuracy: float = Field(default=1.0, ge=0, le=1)
    inspected_clue_ids: list[str] = Field(default_factory=list)


class PlayerAction(BaseModel):
    session_id: str
    npc_id: str
    player_message: str = Field(min_length=1, max_length=1200)
    current_metrics: PlayerMetrics = Field(default_factory=PlayerMetrics)


class AgentTrace(BaseModel):
    observation: str
    inference: str
    decision: str
    action: str
    confidence: float = Field(default=0.75, ge=0, le=1)
    timestamp: datetime = Field(default_factory=utc_now)


class InterrogationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    session_id: str = Field(validation_alias=AliasChoices("sessionId", "session_id"))
    npc_id: str = Field(validation_alias=AliasChoices("npcId", "npc_id"))
    player_message: str = Field(
        min_length=1,
        max_length=1200,
        validation_alias=AliasChoices("playerMessage", "player_message"),
    )
    metrics: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("metrics", "currentMetrics", "current_metrics"),
    )


class InterrogationResponse(BaseModel):
    dialogue: str
    trace: AgentTrace


class NPC(BaseModel):
    id: str
    name: str
    role: str
    mood: NpcMood
    suspicion: int = Field(ge=0, le=100)
    opening_line: str
    personality: str | None = None
    alibi: str | None = None
    is_killer: bool = False


class Clue(BaseModel):
    id: str
    title: str
    description: str
    room: str
    location: str
    discovered: bool = False
    relevance: ClueRelevance


class GameState(BaseModel):
    session_id: str
    level_id: str
    title: str
    room_name: str
    room_description: str
    objective: str
    difficulty: Difficulty
    clues: list[Clue]
    npcs: list[NPC]
    collected_clue_ids: list[str] = Field(default_factory=list)
    trace: AgentTrace


class AccusationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    session_id: str = Field(validation_alias=AliasChoices("sessionId", "session_id"))
    npc_id: str = Field(validation_alias=AliasChoices("npcId", "npc_id", "accusedNpcId", "accused_npc_id"))
    assumption: str = Field(default="", validation_alias=AliasChoices("assumption", "player_assumption"))


class StartGameRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    session_id: str | None = Field(default=None, validation_alias=AliasChoices("sessionId", "session_id"))


class GeneratedSuspect(BaseModel):
    id: str
    name: str
    role: str
    personality: str
    alibi: str
    is_killer: bool


class GeneratedLevelData(BaseModel):
    theme: str
    victim: str
    suspects: list[GeneratedSuspect] = Field(min_length=4, max_length=5)


class AccusationResponse(BaseModel):
    status: Literal["success", "failed"]
    message: str
    solution_story: str | None = None
    next_level: GameState | None = None



class NPCResponse(BaseModel):
    session_id: str
    npc_id: str
    dialogue: str
    trace: AgentTrace


class LevelGenerationRequest(BaseModel):
    session_id: str
    current_metrics: PlayerMetrics = Field(default_factory=PlayerMetrics)
    previous_level_id: str | None = None


class LevelConfiguration(BaseModel):
    session_id: str
    level_id: str
    title: str
    room_name: str
    objective: str
    difficulty: Difficulty
    clue_count: int = Field(ge=1)
    npc_count: int = Field(ge=1)
    time_pressure_seconds: int = Field(ge=60)
    modifiers: list[str]
    trace: AgentTrace


class CompanionChatRequest(BaseModel):
    session_id: str
    player_message: str
    global_transcript: list[dict[str, Any]] = Field(default_factory=list)
    discovered_clues: list[dict[str, Any]] = Field(default_factory=list)


class CompanionChatResponse(BaseModel):
    response: str
    trace: AgentTrace
