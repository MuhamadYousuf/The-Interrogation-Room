import traceback
from uuid import uuid4

from agents.director_agent import evaluate_metrics
from agents.npc_agent import generate_npc_dialogue, evaluate_accusation_assumption
from agents.pcg_agent import generate_procedural_level
from agents.companion_agent import generate_companion_response
from models.schemas import (
    AccusationRequest,
    AccusationResponse,
    AgentTrace,
    Clue,
    GameState,
    InterrogationRequest,
    InterrogationResponse,
    LevelConfiguration,
    NPC,
    NPCResponse,
    PlayerAction,
    PlayerMetrics,
    CompanionChatRequest,
    CompanionChatResponse,
)


SESSION_STORE: dict[str, dict] = {}


def _session_id() -> str:
    return f"session-{uuid4().hex[:12]}"


def _trace(
    observation: str,
    inference: str,
    decision: str,
    action: str,
    confidence: float = 0.75,
) -> AgentTrace:
    return AgentTrace(
        observation=observation,
        inference=inference,
        decision=decision,
        action=action,
        confidence=confidence,
    )


def start_game(session_id: str | None = None) -> GameState:
    if session_id and session_id in SESSION_STORE:
        session_data = SESSION_STORE[session_id]
        if "next_level_state" in session_data:
            state = session_data["next_level_state"]
            session_data["state"] = state
            del session_data["next_level_state"]
            return state
        else:
            level_num = session_data.get("level_num", 1)
            pcg_level = generate_procedural_level(
                level_num,
                performance=session_data.get("last_performance"),
                avoid_themes=session_data.get("case_history", []),
            )
            game_state = _pcg_to_game_state(session_id, level_num, pcg_level)
            killer = next((npc for npc in game_state.npcs if npc.is_killer), game_state.npcs[0])
            session_data["killer_npc_id"] = killer.id
            session_data["state"] = game_state
            session_data["solution"] = pcg_level.get("solution", "")
            session_data.setdefault("case_history", []).append(pcg_level["theme"])
            return game_state

    new_session_id = session_id or _session_id()
    pcg_level = generate_procedural_level(1)
    game_state = _pcg_to_game_state(new_session_id, 1, pcg_level)
    killer = next((npc for npc in game_state.npcs if npc.is_killer), game_state.npcs[0])

    SESSION_STORE[new_session_id] = {
        "level_num": 1,
        "killer_npc_id": killer.id,
        "state": game_state,
        "solution": pcg_level.get("solution", ""),
        "case_history": [pcg_level["theme"]],
        "last_performance": None,
    }
    return game_state



def generate_npc_response(action: PlayerAction) -> NPCResponse:
    message = action.player_message.lower()
    metrics = action.current_metrics
    needs_hint = metrics.retry_count >= 2 or metrics.accuracy < 0.45
    asks_about_music = any(term in message for term in ["music", "record", "gramophone", "skip"])
    asks_about_window = any(term in message for term in ["window", "ash", "cigar", "latch"])

    if asks_about_music:
        dialogue = "Then you heard the flaw in it. The waltz stopped once, then returned after the scream."
        decision = "Reward the player for following the alibi contradiction."
        response_action = "Revealed a precise timing contradiction around the gramophone."
        confidence = 0.88
    elif asks_about_window:
        dialogue = "I never touched the window. Though Lord Harrow did favor those amber cigars."
        decision = "Connect the clue inspection path to a suspect preference."
        response_action = "Pointed the player toward cigar ash as relational evidence."
        confidence = 0.82
    elif needs_hint:
        dialogue = "You are circling the right hour, detective. Listen to what changed after nine."
        decision = "Lower difficulty by giving a soft directional hint."
        response_action = "Steered the player toward the timeline without naming the culprit."
        confidence = 0.76
    else:
        dialogue = "In this house, detective, everyone remembers the truth only after it becomes useful."
        decision = "Preserve mystery while keeping the interrogation responsive."
        response_action = "Returned atmospheric dialogue and maintained current difficulty."
        confidence = 0.66

    return NPCResponse(
        session_id=action.session_id,
        npc_id=action.npc_id,
        dialogue=dialogue,
        trace=_trace(
            observation=(
                f"Player asked {action.npc_id}: '{action.player_message}'. "
                f"Metrics: {metrics.elapsed_seconds}s elapsed, {metrics.retry_count} retries, "
                f"{metrics.accuracy:.0%} accuracy."
            ),
            inference=(
                "The player is following a high-value clue thread."
                if asks_about_music or asks_about_window
                else "The player is either exploring broadly or may need calibrated guidance."
            ),
            decision=decision,
            action=response_action,
            confidence=confidence,
        ),
    )


def run_interrogation_pipeline(payload: InterrogationRequest) -> InterrogationResponse:
    session = SESSION_STORE.get(payload.session_id, {})
    state = session.get("state")
    npc_name = payload.npc_id
    if state:
        npc_name = next((npc.name for npc in state.npcs if npc.id == payload.npc_id), payload.npc_id)
    director_directive = evaluate_metrics(payload.metrics)

    agent_payload = generate_npc_dialogue(
        npc_name=npc_name,
        player_message=payload.player_message,
        director_directive=director_directive,
    )

    try:
        trace_payload = agent_payload.get("trace", {})
        return InterrogationResponse(
            dialogue=str(agent_payload["dialogue"]),
            trace=AgentTrace(
                observation=str(trace_payload["observation"]),
                inference=str(trace_payload["inference"]),
                decision=str(trace_payload["decision"]),
                action=str(trace_payload["action"]),
                confidence=0.82,
            ),
        )
    except Exception as exc:
        print("[orchestrator] Failed to parse NPC agent payload:")
        print("[orchestrator] raw payload:", agent_payload)
        traceback.print_exception(type(exc), exc, exc.__traceback__)
        return InterrogationResponse(
            dialogue=(
                f"{npc_name} glances toward the rain-streaked window. "
                "Ask the right question, detective, and the house may answer."
            ),
            trace=_trace(
                observation=f"Invalid NPC agent payload for message: {payload.player_message}",
                inference=f"Director directive was available: {director_directive}",
                decision="Protect the API contract with a valid fallback response.",
                action=f"Returned local fallback after orchestration parse failure: {exc}",
                confidence=0.45,
            ),
        )


def _pcg_to_game_state(session_id: str, level_num: int, pcg_level: dict) -> GameState:
    suspects = pcg_level["suspects"]
    npcs = [
        NPC(
            id=suspect["id"],
            name=suspect["name"],
            role=suspect["role"],
            mood="guarded" if suspect["is_killer"] else "anxious",
            suspicion=62 if suspect["is_killer"] else 28,
            opening_line=f"{suspect['alibi']} Do not mistake nerves for guilt.",
            personality=suspect["personality"],
            alibi=suspect["alibi"],
            is_killer=suspect["is_killer"],
        )
        for suspect in suspects
    ]
    clues = [
        Clue(
            id=clue["id"],
            title=clue["title"],
            description=clue["description"],
            room=clue["room"],
            location=clue["location"],
            discovered=False,
            relevance=clue["relevance"] if clue["relevance"] in {"minor", "supporting", "critical"} else "supporting",
        )
        for clue in pcg_level["clues"]
    ]

    return GameState(
        session_id=session_id,
        level_id=f"level-{level_num:03d}",
        title=pcg_level["theme"],
        room_name="Blackwood Manor",
        room_description=f"{pcg_level['victim']} The case spans the Drawing Room, Grand Hall, Library, and Conservatory.",
        objective="Search each room for hidden evidence, expose alibi contradictions, and accuse the true killer.",
        difficulty="tense",
        clues=clues,
        npcs=npcs,
        collected_clue_ids=[],
        trace=_trace(
            observation="The player correctly solved the previous case.",
            inference="A fresh procedural mystery should immediately continue the game loop.",
            decision="Use the PCG agent to generate a new victim, suspect set, and hidden killer.",
            action=f"Loaded procedural level {level_num}: {pcg_level['theme']}",
            confidence=0.84,
        ),
    )


def handle_accusation(payload: AccusationRequest) -> AccusationResponse:
    session = SESSION_STORE.get(payload.session_id)
    if not session:
        return AccusationResponse(
            status="failed",
            message="The case file is missing. Start a new investigation.",
        )

    true_solution = session.get("solution", "")
    killer_id = session["killer_npc_id"]
    state = session.get("state")
    killer_name = killer_id
    accused_name = payload.npc_id
    if state:
        killer_name = next((npc.name for npc in state.npcs if npc.id == killer_id), killer_id)
        accused_name = next((npc.name for npc in state.npcs if npc.id == payload.npc_id), payload.npc_id)

    accused_correctly = payload.npc_id == killer_id
    eval_result = evaluate_accusation_assumption(payload.assumption, true_solution) if accused_correctly else {
        "is_close_enough": False,
        "feedback": "You accused the wrong suspect, so the deduction cannot close the case correctly.",
    }
    reasoning_correct = bool(eval_result.get("is_close_enough"))

    if accused_correctly and reasoning_correct:
        status = "success"
        message = (
            f"You caught {killer_name}. Your accusation and reasoning were strong enough to close the case."
        )
        accuracy = 1.0
    elif accused_correctly:
        status = "failed"
        message = (
            f"{killer_name} was the murderer, but your reasoning did not prove the case. "
            f"{eval_result.get('feedback', 'The accusation was missing the decisive clue chain.')}"
        )
        accuracy = 0.55
    else:
        status = "failed"
        message = (
            f"You accused {accused_name}, but the real murderer was {killer_name}. "
            "The case is over, detective."
        )
        accuracy = 0.2

    performance = _performance_profile(payload.current_metrics, status == "success", accuracy)

    next_level_num = int(session["level_num"]) + 1
    pcg_level = generate_procedural_level(
        next_level_num,
        performance=performance,
        avoid_themes=session.get("case_history", []),
    )
    next_state = _pcg_to_game_state(payload.session_id, next_level_num, pcg_level)
    killer = next((npc for npc in next_state.npcs if npc.is_killer), next_state.npcs[0])

    SESSION_STORE[payload.session_id] = {
        "level_num": next_level_num,
        "killer_npc_id": killer.id,
        "state": session["state"],
        "next_level_state": next_state,
        "solution": pcg_level.get("solution", ""),
        "case_history": [*session.get("case_history", []), pcg_level["theme"]],
        "last_performance": performance,
    }

    return AccusationResponse(
        status=status,
        message=message,
        solution_story=true_solution,
        next_level=next_state,
    )


def _performance_profile(metrics: PlayerMetrics, solved: bool, accuracy: float) -> dict:
    clue_count = len(metrics.inspected_clue_ids)
    fast = metrics.elapsed_seconds <= 360
    asked_little = metrics.interrogation_count <= 5
    struggled = metrics.elapsed_seconds >= 900 or metrics.interrogation_count >= 12 or accuracy < 0.5

    if solved and fast and asked_little and clue_count >= 3:
        target_difficulty = "tense"
        adaptation = "Player solved efficiently with evidence. Increase ambiguity, suspect count, and red herrings."
    elif struggled:
        target_difficulty = "standard"
        adaptation = "Player struggled or accused incorrectly. Make the next clue chain clearer and reduce ambiguity slightly."
    else:
        target_difficulty = "adaptive"
        adaptation = "Player showed partial progress. Keep mystery challenging but make critical contradictions readable."

    return {
        "solved": solved,
        "accuracy": accuracy,
        "elapsed_seconds": metrics.elapsed_seconds,
        "interrogation_count": metrics.interrogation_count,
        "retry_count": metrics.retry_count,
        "inspected_clue_count": clue_count,
        "target_difficulty": target_difficulty,
        "adaptation": adaptation,
    }



def generate_level(session_id: str, metrics: PlayerMetrics, previous_level_id: str | None = None) -> LevelConfiguration:
    fast_and_accurate = metrics.elapsed_seconds < 240 and metrics.accuracy >= 0.75
    struggling = metrics.retry_count >= 3 or metrics.accuracy < 0.5

    if fast_and_accurate:
        difficulty = "tense"
        clue_count = 5
        npc_count = 4
        time_pressure = 420
        modifiers = ["conflicting_alibis", "locked_room_variant", "withheld_primary_clue"]
        decision = "Increase complexity for a player solving quickly and accurately."
    elif struggling:
        difficulty = "standard"
        clue_count = 3
        npc_count = 2
        time_pressure = 720
        modifiers = ["stronger_hinting", "visible_key_clue", "reduced_suspect_pool"]
        decision = "Reduce cognitive load and expose a clearer evidence path."
    else:
        difficulty = "adaptive"
        clue_count = 4
        npc_count = 3
        time_pressure = 600
        modifiers = ["dynamic_hinting", "branching_interrogation", "optional_red_herring"]
        decision = "Maintain adaptive difficulty with moderate pressure."

    return LevelConfiguration(
        session_id=session_id,
        level_id=f"level-{uuid4().hex[:8]}",
        title="The Conservatory Without Footprints",
        room_name="Glass Conservatory",
        objective="Explain how the killer crossed wet soil without leaving prints.",
        difficulty=difficulty,
        clue_count=clue_count,
        npc_count=npc_count,
        time_pressure_seconds=time_pressure,
        modifiers=modifiers,
        trace=_trace(
            observation=(
                f"Previous level {previous_level_id or 'unknown'} completed with "
                f"{metrics.elapsed_seconds}s elapsed, {metrics.retry_count} retries, "
                f"and {metrics.accuracy:.0%} accuracy."
            ),
            inference="Performance metrics indicate how much ambiguity the next mystery can support.",
            decision=decision,
            action=f"Generated {difficulty} level configuration with {clue_count} clues and {npc_count} NPCs.",
            confidence=0.79,
        ),
    )


def handle_companion_chat(payload: CompanionChatRequest) -> CompanionChatResponse:
    res = generate_companion_response(
        player_message=payload.player_message,
        global_transcript=payload.global_transcript,
        discovered_clues=payload.discovered_clues,
    )

    trace_payload = res.get("trace", {})
    return CompanionChatResponse(
        response=str(res.get("response", "")),
        trace=AgentTrace(
            observation=str(trace_payload.get("observation", "Analyzed companion chat input.")),
            inference=str(trace_payload.get("inference", "Evaluating case data.")),
            decision=str(trace_payload.get("decision", "Responding as Detective Riley.")),
            action=str(trace_payload.get("action", "Returned companion response.")),
            confidence=0.85,
        ),
    )
