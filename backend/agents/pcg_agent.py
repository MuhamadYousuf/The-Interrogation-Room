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


def _fallback_level(level_num: int, reason: str) -> dict[str, Any]:
    fallback_cases = [
        {
            "theme": "The Bell-Rope Murder at Blackwood Manor",
            "victim": "Father Alden, a retired chaplain found beneath the bell rope with ink on his fingertips.",
            "solution": "Jonas Reed cut the chapel bell rope halfway through to stage Father Alden's death as a tragic accident. Jonas had been stealing historical valuables from the chapel, and Father Alden recorded the missing pieces in the archive ledger using green ink. Jonas killed him to keep him silent and escaped through the Grand Hall, leaving dry mud flakes on polished tile.",
        },
        {
            "theme": "The Clockmaker's Last Toast",
            "victim": "Mira Vale, an antique clock restorer found beside a stopped grandfather clock.",
            "solution": "Clara Vane disabled the clock mechanism to hide the true time of death, then struck Mira with a brass winding key after Mira uncovered forged inheritance papers. The broken clock hand, missing ledger page, and fresh brass filings point back to Clara's staged timeline.",
        },
        {
            "theme": "The Conservatory Without Footprints",
            "victim": "Dr. Noel Pierce, a botanist found among shattered orchids after the storm.",
            "solution": "Ilya Cross used the overhead irrigation walkway to cross the conservatory without touching the wet soil, then poisoned Noel with extract from a rare orchid. The clean ladder rung, cut irrigation cord, and hidden plant label expose the route and method.",
        },
    ]
    case = fallback_cases[(level_num - 1) % len(fallback_cases)]
    return {
        "theme": f"{case['theme']}, case {level_num}",
        "victim": case["victim"],
        "solution": case["solution"],
        "suspects": [
            {
                "id": f"level-{level_num}-npc-mara",
                "name": "Mara Voss",
                "role": "Choir Director",
                "personality": "Precise, wounded, and quietly furious.",
                "alibi": "Claims she was rehearsing alone in the vestry.",
                "is_killer": False,
            },
            {
                "id": f"level-{level_num}-npc-jonas",
                "name": "Jonas Reed",
                "role": "Groundskeeper",
                "personality": "Soft-spoken, observant, and evasive about the chapel keys.",
                "alibi": "Says he was clearing storm drains behind the manor.",
                "is_killer": True,
            },
            {
                "id": f"level-{level_num}-npc-celia",
                "name": "Celia Harrow",
                "role": "Benefactor",
                "personality": "Elegant, controlling, and allergic to public scandal.",
                "alibi": "Insists she never left the dining hall after the toast.",
                "is_killer": False,
            },
            {
                "id": f"level-{level_num}-npc-ilya",
                "name": "Ilya Cross",
                "role": "Archivist",
                "personality": "Brilliant, sleep-deprived, and protective of old secrets.",
                "alibi": "Claims he was cataloging letters in the library.",
                "is_killer": False,
            },
        ],
        "clues": [
            {
                "id": f"level-{level_num}-clue-bell-rope",
                "title": "Frayed Bell Rope",
                "description": "The rope was cut halfway through before the body was discovered.",
                "room": "Drawing Room",
                "location": "Bell pull near the fireplace",
                "relevance": "critical",
            },
            {
                "id": f"level-{level_num}-clue-ink",
                "title": "Green Ink Smudge",
                "description": "The victim's fingertips match the ink used in the archive ledger.",
                "room": "Library",
                "location": "Ledger on the reading desk",
                "relevance": "supporting",
            },
            {
                "id": f"level-{level_num}-clue-mud",
                "title": "Dry Mud Flake",
                "description": "Dry chapel mud sits on a polished hall tile despite the rain outside.",
                "room": "Grand Hall",
                "location": "Tile below the staircase",
                "relevance": "critical",
            },
            {
                "id": f"level-{level_num}-clue-glass",
                "title": "Cracked Conservatory Pane",
                "description": "The crack opens from the inside, not from the storm.",
                "room": "Conservatory",
                "location": "Lower glass panel",
                "relevance": "supporting",
            },
        ],
        "generation_note": f"Fallback PCG used because Gemini failed: {reason}",
    }


def _normalize_level(raw_level: dict[str, Any], level_num: int) -> dict[str, Any]:
    suspects = raw_level.get("suspects")
    if not isinstance(suspects, list) or len(suspects) < 4:
        raise ValueError("PCG response must include at least four suspects for hard mode.")

    normalized_suspects = []
    killer_seen = False
    for index, suspect in enumerate(suspects[:5], start=1):
        if not isinstance(suspect, dict):
            raise ValueError("Each suspect must be an object.")

        is_killer = bool(suspect.get("is_killer"))
        if is_killer and killer_seen:
            is_killer = False
        killer_seen = killer_seen or is_killer

        normalized_suspects.append(
            {
                "id": str(suspect.get("id") or f"level-{level_num}-npc-{index}"),
                "name": str(suspect.get("name") or f"Suspect {index}"),
                "role": str(suspect.get("role") or "Person of Interest"),
                "personality": str(suspect.get("personality") or "Guarded and watchful."),
                "alibi": str(suspect.get("alibi") or "Claims to have been elsewhere."),
                "is_killer": is_killer,
            }
        )

    if not killer_seen:
        normalized_suspects[0]["is_killer"] = True

    normalized_clues = []
    for index, clue in enumerate(raw_level.get("clues") or [], start=1):
        if not isinstance(clue, dict):
            continue
        normalized_clues.append(
            {
                "id": str(clue.get("id") or f"level-{level_num}-clue-{index}"),
                "title": str(clue.get("title") or f"Hidden Evidence {index}"),
                "description": str(clue.get("description") or "A small detail the killer hoped nobody would notice."),
                "room": str(clue.get("room") or "Drawing Room"),
                "location": str(clue.get("location") or "A suspicious object in the scene"),
                "relevance": str(clue.get("relevance") or "supporting"),
            }
        )

    if len(normalized_clues) < 4:
        normalized_clues = _fallback_level(level_num, "PCG returned too few hidden-object clues.")["clues"]

    return {
        "theme": str(raw_level.get("theme") or f"Generated murder mystery case {level_num}"),
        "victim": str(raw_level.get("victim") or "An unnamed victim with a dangerous secret."),
        "solution": str(raw_level.get("solution") or "The killer committed the crime and covered their tracks, leaving subtle contradictions behind."),
        "suspects": normalized_suspects,
        "clues": normalized_clues[:6],
    }


def generate_procedural_level(
    level_num: int,
    performance: dict[str, Any] | None = None,
    avoid_themes: list[str] | None = None,
) -> dict[str, Any]:
    performance = performance or {}
    avoid_themes = avoid_themes or []
    target_difficulty = performance.get("target_difficulty", "tense")
    player_summary = json.dumps(performance, indent=2)
    avoid_summary = ", ".join(avoid_themes[-5:]) if avoid_themes else "No previous cases yet."
    prompt = f"""
You are the PCG Agent for The Interrogation Room, a mobile noir murder mystery game.

Design a {target_difficulty.upper()} murder mystery case for level {level_num}.

Player performance from the previous case:
{player_summary}

Previous case themes to avoid repeating:
{avoid_summary}

Return strict raw JSON only. No markdown, no code fences, no commentary.
The JSON must have this exact structure:
{{
  "theme": "A distinctive murder mystery premise",
  "victim": "Name and brief detail",
  "solution": "A detailed narrative of how the murder actually happened, who did it, why, and how the clues tie together. Make it a complete and cohesive short story explaining the truth.",
  "suspects": [
    {{
      "id": "level-{level_num}-npc-unique",
      "name": "NPC name",
      "role": "NPC role",
      "personality": "Short personality description",
      "alibi": "What they claim they were doing",
      "is_killer": false
    }}
  ],
  "clues": [
    {{
      "id": "level-{level_num}-clue-hidden-object",
      "title": "Short evidence title",
      "description": "What this clue proves",
      "room": "Drawing Room",
      "location": "The exact clickable object in the photo",
      "relevance": "critical"
    }}
  ]
}}

Rules:
- Include 4 or 5 suspects.
- Exactly ONE suspect must have "is_killer": true.
- Include 5 or 6 clickable hidden-object clues.
- Each clue's room MUST be one of: Drawing Room, Grand Hall, Library, Conservatory.
- The clue location must be a physical object a player can plausibly click in a realistic room photo.
- Make at least two clues misleading red herrings and at least two clues critical contradictions.
- The mystery should be psychologically interesting: inheritance, blackmail, staged alibis, secret relationships, or professional betrayal.
- Keep all text concise enough for a mobile visual novel UI.
- Make the mystery completely different from all previous themes listed above.
- Do NOT create another poisoning-at-a-gala case unless none of the previous cases used poison or a gala.
- Vary the murder method, location framing, motive, victim type, and clue logic each level.
- If the player solved quickly and accurately, increase ambiguity with stronger red herrings.
- If the player struggled, make the next clue chain clearer while still interesting.
"""

    try:
        print(f"[pcg_agent] using Gemini model: {GEMINI_MODEL_NAME}")
        response = model.generate_content(prompt)
        raw_text = response.text or ""
        print("[pcg_agent] raw Gemini response:", raw_text)
        return _normalize_level(_extract_json(raw_text), level_num)
    except Exception as exc:
        print("[pcg_agent] PCG generation failed with raw exception:")
        traceback.print_exception(type(exc), exc, exc.__traceback__)
        return _fallback_level(level_num, str(exc))
