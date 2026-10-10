from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import re
import json

router = APIRouter(prefix="/api/v1/ai/summarize", tags=["Session Summarizer"])

class SummarizeRequest(BaseModel):
    session_id: str
    transcript: Optional[str] = Field(None, description="Full text transcript or dialogue of the live tutoring session")
    dialogue: Optional[str] = Field(None, description="Alternative field for transcript dialogue")
    subject: Optional[str] = "General Tutoring"
    topic: Optional[str] = "Study Session"
    total_words: Optional[int] = 0
    duration_minutes: Optional[int] = 60

class Flashcard(BaseModel):
    question: str
    answer: str

class SummarizeResponse(BaseModel):
    success: bool
    session_id: str
    executive_summary: str
    key_takeaways: List[str]
    action_items: List[str]
    key_equations: List[str]
    generated_flashcards: List[Flashcard]

def local_nlp_summarize(transcript: str, subject: str, topic: str) -> SummarizeResponse:
    """
    Local robust NLP transcript summarizer fallback.
    Extracts key takeaways, questions for flashcards, homework items, and equations without requiring external API keys.
    """
    lines = [l.strip() for l in transcript.split("\n") if l.strip()]
    if not lines:
        lines = [s.strip() for s in re.split(r'[.!?]+', transcript) if len(s.strip()) > 5]

    # 1. Identify Questions for Flashcards
    flashcards: List[Flashcard] = []
    question_patterns = [r'\?', r'^(what|how|why|can we|where|explain|calculate|solve|is it|derive)\b']
    
    for i, line in enumerate(lines):
        is_q = any(re.search(pat, line, re.IGNORECASE) for pat in question_patterns)
        if is_q and len(flashcards) < 4:
            clean_q = re.sub(r'^(Tutor|Student|You|Dr\.\s*[\w\s]+):\s*', '', line, flags=re.IGNORECASE).strip()
            # If next line exists, use it as answer, else generate conceptual answer
            clean_ans = "Core theoretical rule and problem-solving method reviewed during class."
            if i + 1 < len(lines):
                next_line = re.sub(r'^(Tutor|Student|You|Dr\.\s*[\w\s]+):\s*', '', lines[i + 1], flags=re.IGNORECASE).strip()
                if not any(re.search(pat, next_line, re.IGNORECASE) for pat in question_patterns):
                    clean_ans = next_line
            flashcards.append(Flashcard(question=clean_q, answer=clean_ans))

    if not flashcards:
        flashcards = [
            Flashcard(
                question=f"What was the main theorem discussed in {topic}?",
                answer=f"The foundational principles and problem-solving strategies of {subject} were mastered."
            ),
            Flashcard(
                question="What is the core step-by-step verification method?",
                answer="1. Identify given values, 2. Apply the formula, 3. Validate units and edge limits."
            )
        ]

    # 2. Extract Action Items & Homework
    action_items: List[str] = []
    action_keywords = ['homework', 'exercise', 'practice', 'problem', 'chapter', 'review', 'complete', 'submit', 'assignment']
    for line in lines:
        if any(kw in line.lower() for kw in action_keywords) and len(action_items) < 4:
            clean_act = re.sub(r'^(Tutor|Student|You|Dr\.\s*[\w\s]+):\s*', '', line, flags=re.IGNORECASE).strip()
            if len(clean_act) > 10:
                action_items.append(clean_act)

    if not action_items:
        action_items = [
            f"Review practice problem set for {topic}",
            "Complete assigned exercises before the next session",
            "Review key flashcards for active recall"
        ]

    # 3. Extract Equations / Math symbols
    key_equations: List[str] = []
    eq_patterns = [r'=', r'\\int', r'\\frac', r'd/dx', r'O\(', r'\^', r'\\sqrt', r'\+']
    for line in lines:
        if any(re.search(pat, line) for pat in eq_patterns) and len(key_equations) < 3:
            clean_eq = re.sub(r'^(Tutor|Student|You|Dr\.\s*[\w\s]+):\s*', '', line, flags=re.IGNORECASE).strip()
            if len(clean_eq) > 4 and len(clean_eq) < 100:
                key_equations.append(clean_eq)

    if not key_equations:
        key_equations = [
            f"Core {subject} Formula: f(x) relationship verification",
        ]

    # 4. Synthesize Key Takeaways
    meaningful_lines = [l for l in lines if len(l) > 20 and not any(re.search(pat, l, re.IGNORECASE) for pat in question_patterns)]
    key_takeaways: List[str] = []
    for l in meaningful_lines[:3]:
        clean_t = re.sub(r'^(Tutor|Student|You|Dr\.\s*[\w\s]+):\s*', '', l, flags=re.IGNORECASE).strip()
        key_takeaways.append(clean_t)

    if len(key_takeaways) < 2:
        key_takeaways = [
            f"Mastered core principles of {topic}",
            f"Identified and resolved student roadblocks in {subject}",
            "Verified step-by-step problem solving approach with live examples"
        ]

    # 5. Executive Summary
    executive_summary = (
        f"This study session focused on {topic} in {subject}. "
        f"The tutor and learner worked through foundational concepts, tackled specific practice problems, "
        f"and established step-by-step problem-solving strategies."
    )

    return SummarizeResponse(
        success=True,
        session_id="local-session",
        executive_summary=executive_summary,
        key_takeaways=key_takeaways,
        action_items=action_items,
        key_equations=key_equations,
        generated_flashcards=flashcards
    )

@router.post("/session", response_model=SummarizeResponse)
async def summarize_session(payload: SummarizeRequest):
    """
    Automated Session Summarizer & Flashcard Generator.
    Extracts key concepts, action items, equations, and flashcards from lecture transcripts.
    """
    transcript = (payload.transcript or "").strip()
    subject = payload.subject or "General Tutoring"
    topic = payload.topic or "Study Session"

    if not transcript:
        return local_nlp_summarize("General session overview and discussion.", subject, topic)

    # Attempt Gemini API if key is configured
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            system_prompt = f"""You are Socrates AI, an expert educational summarizer.
Analyze this tutoring session transcript for Subject: '{subject}', Topic: '{topic}'.
Return a valid JSON object ONLY with the following exact keys:
{{
  "executive_summary": "2-3 sentences summarizing the session achievements",
  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "action_items": ["Homework 1", "Practice task 2"],
  "key_equations": ["Equation or formula 1", "Equation 2"],
  "generated_flashcards": [
    {{"question": "Flashcard Question 1", "answer": "Concise explanation 1"}},
    {{"question": "Flashcard Question 2", "answer": "Concise explanation 2"}}
  ]
}}

Transcript:
\"\"\"{transcript[:8000]}\"\"\"
"""
            response = model.generate_content(
                system_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            raw_text = response.text.strip()
            data = json.loads(raw_text)

            flashcards = [
                Flashcard(question=f.get("question", ""), answer=f.get("answer", ""))
                for f in data.get("generated_flashcards", [])
                if f.get("question") and f.get("answer")
            ]

            return SummarizeResponse(
                success=True,
                session_id=payload.session_id,
                executive_summary=data.get("executive_summary", ""),
                key_takeaways=data.get("key_takeaways", []),
                action_items=data.get("action_items", []),
                key_equations=data.get("key_equations", []),
                generated_flashcards=flashcards or [
                    Flashcard(question=f"What was the core concept of {topic}?", answer=f"Mastered core principles of {subject}.")
                ]
            )
        except Exception as e:
            print(f"[Summarizer AI Warning] Gemini API call failed, using local NLP: {e}")

    # Fallback to smart local NLP
    res = local_nlp_summarize(transcript, subject, topic)
    res.session_id = payload.session_id
    return res
