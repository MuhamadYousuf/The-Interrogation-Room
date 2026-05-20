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


def generate_companion_response(
    player_message: str,
    global_transcript: list[dict[str, Any]],
    discovered_clues: list[dict[str, Any]],
) -> dict[str, Any]:
    prompt = f"""
You are Detective Riley, a seasoned veteran investigator and the player's loyal partner in Echoes of the Manor.
You do NOT know the identity of the killer, nor the complete solution story of the crime scene yet.
Your job is to act as the player's brainstorming partner: review facts, check alibis, summarize contradictions, and help them analyze what has been uncovered so far.

The player is talking to you directly. Bounce ideas off them, ask clarifying questions, and help them connect clues to witness statements, but do NOT formulate opinions on subjects that are completely unevidenced. Keep your tone atmospheric, noir, professional, and supportive.

DISCOVERED CLUES SO FAR:
{json.dumps(discovered_clues, indent=2) if discovered_clues else "No clues have been collected from the rooms yet."}

GLOBAL TRANSCRIPT OF ALL SUSPECT INTERROGATIONS SO FAR:
{json.dumps(global_transcript, indent=2) if global_transcript else "No witness interrogations have taken place yet."}

PLAYER MESSAGE:
"{player_message}"

Respond with a JSON object containing two fields:
1. "response": Your reply to the player (in character as Detective Riley).
2. "trace": A diagnostic trace log outlining your reasoning process containing:
   - "observation": What you observe about the player's message and current case context.
   - "inference": Your reasoning about alibis, clues, contradictions, or details.
   - "decision": Your strategy/focus for the response.
   - "action": What type of response you are returning.

Example Output format:
{{
  "response": "Alright, detective. Let's look at the clock. Lord Harrow claims he was in the conservatory at nine, but...",
  "trace": {{
    "observation": "Player is asking about timeline contradictions.",
    "inference": "Harrow's statement conflicts with the skip in the gramophone waltz recorded in drawing room clues.",
    "decision": "Guide player to verify the music timing.",
    "action": "Returned a helpful observation on the alibi timeline."
  }}
}}
Do NOT include any markdown code blocks (e.g. ```json) in your raw output. Output raw JSON only.

LANGUAGE MIRRORING RULE: You must dynamically analyze the language and script of the player's latest input. If the player types in English, you must respond in English. If the player types in Roman Urdu/Hindi (e.g., 'tum us waqt kahan the?'), you MUST respond in natural, conversational Roman Urdu. If the player types in the native Urdu/Arabic script, respond in that native script. Crucially, you must maintain your unique character persona, secrets, and tone completely intact, regardless of the language you are speaking.
"""
    try:
        print(f"[companion_agent] generating response for message: {player_message}")
        raw_res = model.generate_content(prompt)
        text = raw_res.text.strip()

        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\n", "", text)
            text = re.sub(r"\n```$", "", text)
            text = text.strip()

        try:
            parsed = json.loads(text)
            return parsed
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            raise
    except Exception as e:
        print("[companion_agent] failed to generate response:")
        traceback.print_exc()
        return {
            "response": (
                "Sorry partner, my mind is in a haze. "
                "Let's look back at the case files together and see what we've missed."
            ),
            "trace": {
                "observation": f"Failed to call Gemini companion agent: {str(e)}",
                "inference": "Gemini API or decoding error.",
                "decision": "Return a safe, atmospheric fallback dialog.",
                "action": "Triggered local fallback.",
            },
        }
