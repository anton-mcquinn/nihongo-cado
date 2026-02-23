import json
import re

import anthropic
import pdfplumber


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    import io

    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_vocab_with_llm(
    text: str,
    api_key: str,
    known_words: list[str],
) -> list[dict]:
    """Call Claude to extract Japanese vocabulary from text."""
    # Cap text sent to LLM
    text = text[:8000]

    # Cap known words list
    known_words = known_words[:500]

    known_section = ""
    if known_words:
        known_section = (
            "\n\nThe user already knows these words (mark any of these as "
            '"already_known": true if they appear in your output):\n'
            + ", ".join(known_words)
        )

    prompt = f"""Extract Japanese vocabulary words from the following text.
For each word, provide:
- front: the Japanese word (kanji if applicable)
- back: English meaning
- romaji: romaji reading
- part_of_speech: noun, verb, adjective, adverb, particle, expression, etc.
- notes: brief usage note or example context from the text (optional)
- already_known: true if the word is in the user's known words list, false otherwise

Return ONLY a JSON array of objects. No markdown fences, no explanation.
{known_section}

Text:
{text}"""

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text

    # Strip markdown fences if present
    raw = re.sub(r"^```(?:json)?\s*\n?", "", raw.strip())
    raw = re.sub(r"\n?```\s*$", "", raw.strip())

    # If output was truncated mid-JSON, try to salvage complete entries
    try:
        words = json.loads(raw)
    except json.JSONDecodeError:
        # Find the last complete object by locating last "},"
        last_complete = raw.rfind("},")
        if last_complete == -1:
            last_complete = raw.rfind("}")
        if last_complete != -1:
            raw = raw[:last_complete + 1] + "]"
            words = json.loads(raw)
        else:
            raise

    # Normalize
    result = []
    for w in words:
        result.append({
            "front": str(w.get("front", "")),
            "back": str(w.get("back", "")),
            "romaji": str(w.get("romaji", "")),
            "part_of_speech": str(w.get("part_of_speech", "")),
            "notes": str(w.get("notes", "")),
            "already_known": bool(w.get("already_known", False)),
        })

    return result
