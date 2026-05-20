import json
import os
import re
import traceback
from typing import Any

import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-3.1-flash-lite")
model = genai.GenerativeModel(GEMINI_MODEL_NAME)


def _extract_json(text: str) -> dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _fallback_response(npc_name: str, player_message: str, director_directive: str, reason: str) -> dict[str, Any]:
    return {
        "dialogue": (
            f"{npc_name} studies you for a long second. "
            "The manor has a way of making every answer sound like a confession."
        ),
        "trace": {
            "observation": f"Gemini fallback used after player asked: {player_message}",
            "inference": f"Director directive was: {director_directive}",
            "decision": "Return a valid InterrogationResponse-shaped JSON fallback.",
            "action": f"Handled NPC dialogue locally because Gemini failed: {reason}",
        },
    }


def generate_npc_dialogue(npc_name: str, player_message: str, director_directive: str) -> dict[str, Any]:
    prompt = f"""
You are {npc_name}, a suspect in the 2D noir murder mystery game The Interrogation Room.

Director directive:
{director_directive}

Player message:
{player_message}

Rules:
- Stay in character as a guarded murder mystery suspect.
- Integrate the director directive naturally.
- Do not reveal the culprit outright.
- Keep dialogue concise for a mobile visual novel UI.
- Return raw JSON only. No markdown, no code fences, no commentary.
- The JSON must match this structure exactly:
{{
  "dialogue": "NPC line shown to the player",
  "trace": {{
    "observation": "What player behavior or message was observed",
    "inference": "What the agent inferred",
    "decision": "Why this response strategy was chosen",
    "action": "What the NPC response does"
  }}
}}

LANGUAGE MIRRORING RULE: You must dynamically analyze the language and script of the player's latest input. If the player types in English, you must respond in English. If the player types in Roman Urdu/Hindi (e.g., 'tum us waqt kahan the?'), you MUST respond in natural, conversational Roman Urdu. If the player types in the native Urdu/Arabic script, respond in that native script. Crucially, you must maintain your unique character persona, secrets, and tone completely intact, regardless of the language you are speaking.
"""

    try:
        print(f"[npc_agent] using Gemini model: {GEMINI_MODEL_NAME}")
        response = model.generate_content(prompt)
        raw_text = response.text or ""
        print("[npc_agent] raw Gemini response:", raw_text)
        parsed = _extract_json(raw_text)

        if not isinstance(parsed.get("dialogue"), str) or not isinstance(parsed.get("trace"), dict):
            raise ValueError("Gemini response did not match InterrogationResponse JSON shape.")

        return parsed
    except Exception as exc:
        print("[npc_agent] Gemini generation failed with raw exception:")
        traceback.print_exception(type(exc), exc, exc.__traceback__)
        return _fallback_response(npc_name, player_message, director_directive, str(exc))


def evaluate_accusation_assumption(player_assumption: str, true_solution: str) -> dict[str, Any]:
    prompt = f"""
You are the Judgement Agent for the murder mystery game The Interrogation Room.
Your task is to compare the player's typed accusation assumption against the true solution of the case, and determine if the player's reasoning is correct and close enough.

True Solution:
{true_solution}

Player's Assumption:
{player_assumption}

Rules:
- The player does NOT need to match the true solution word-for-word.
- They must grasp the general motive, method, or core clue contradictions that link the suspect to the crime.
- If the player's assumption is extremely short, vague, or nonsensical (e.g., "they did it", "they are bad", "because of clues", "asdf"), judge it as INCORRECT.
- If the player's explanation names or implies at least one concrete clue, method, motive, timeline contradiction, alibi flaw, or planted red herring, judge it as CORRECT.
- If the player only says the suspect is guilty without explaining why, judge it as INCORRECT even when the accused suspect is the true killer.
- Return raw JSON only. No markdown, no code fences, no commentary.
- The JSON must match this structure exactly:
{{
  "is_close_enough": true, // or false
  "feedback": "A short message explaining why they are correct, or what detail they missed."
}}

LANGUAGE MIRRORING RULE: You must dynamically analyze the language and script of the player's latest input. If the player types in English, you must respond in English. If the player types in Roman Urdu/Hindi (e.g., 'tum us waqt kahan the?'), you MUST respond in natural, conversational Roman Urdu. If the player types in the native Urdu/Arabic script, respond in that native script. Crucially, you must maintain your unique character persona, secrets, and tone completely intact, regardless of the language you are speaking.
"""

    try:
        print(f"[npc_agent] evaluating assumption using Gemini model: {GEMINI_MODEL_NAME}")
        response = model.generate_content(prompt)
        raw_text = response.text or ""
        print("[npc_agent] raw evaluation response:", raw_text)
        parsed = _extract_json(raw_text)
        if "is_close_enough" not in parsed:
            raise ValueError("Invalid is_close_enough in response.")
        return {
            "is_close_enough": bool(parsed.get("is_close_enough")),
            "feedback": str(parsed.get("feedback") or "The details align with the crime scene.")
        }
    except Exception as exc:
        print("[npc_agent] Accusation evaluation failed, using fallback:")
        traceback.print_exception(type(exc), exc, exc.__traceback__)
        normalized = player_assumption.lower()
        words = normalized.split()
        evidence_terms = [
            "clue", "evidence", "motive", "method", "poison", "knife", "gun", "blood",
            "alibi", "timeline", "time", "letter", "key", "glass", "ash", "fingerprint",
            "contradiction", "jhoot", "saboot", "wajah", "zehar", "khun", "waqt",
            "nishan", "chabi", "khat", "alibi",
        ]
        has_reasoning_signal = any(term in normalized for term in evidence_terms)
        if len(words) >= 8 and has_reasoning_signal:
            return {
                "is_close_enough": True,
                "feedback": "Your deduction is accepted. The details match the crime scene evidence."
            }
        else:
            return {
                "is_close_enough": False,
                "feedback": "Your assumption is too brief. Provide a more detailed explanation of their motive or evidence."
            }
