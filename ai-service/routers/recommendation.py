from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional

router = APIRouter(prefix="/api/v1/ai/recommend", tags=["Smart ML Recommendation"])

class TutorCandidate(BaseModel):
    id: str
    name: str
    subject: str
    bio: str
    subjects: List[str] = []
    hourly_rate: float
    rating: float
    reviews: str | int = "50 reviews"
    is_online: bool = True
    is_verified: bool = True
    institution: Optional[str] = "Academic Institution"
    experience: Optional[str] = "5+ yrs exp"

class StudentRequirement(BaseModel):
    student_id: Optional[str] = "guest_student"
    query: Optional[str] = ""
    subject: Optional[str] = "All"
    preferred_language: Optional[str] = "English"
    max_budget: Optional[float] = 100.0
    min_rating: Optional[float] = 0.0
    learning_style: Optional[str] = "Interactive & Problem Solving"
    candidates: Optional[List[TutorCandidate]] = None

class ScoredTutorMatch(BaseModel):
    tutor_id: str
    name: str
    match_score: int
    subject: str
    hourly_rate: float
    rating: float
    is_verified: bool
    is_online: bool
    matching_reasons: List[str]

try:
    from hybrid_recommender import HybridTutorRecommender
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from hybrid_recommender import HybridTutorRecommender

class RecommendationResponse(BaseModel):
    success: bool
    total_matches: int
    recommendations: List[ScoredTutorMatch]
    algorithm: str = "SOCRATES Hybrid Recommendation Engine (CBF Cosine + SVD Matrix Factorization)"

def extract_review_count(reviews: str | int) -> int:
    if isinstance(reviews, int):
        return reviews
    import re
    numbers = re.findall(r'\d+', str(reviews))
    return int(numbers[0]) if numbers else 40

def compute_ml_tutor_scores(
    candidates: List[TutorCandidate],
    req: StudentRequirement
) -> List[ScoredTutorMatch]:
    if not candidates:
        return []

    # 1. Format candidates into tutor dictionary array for Hybrid Engine
    tutors_data = []
    for c in candidates:
        exp_years = 5.0
        if c.experience:
            import re
            nums = re.findall(r'\d+', c.experience)
            if nums:
                exp_years = float(nums[0])
        tutors_data.append({
            "id": c.id,
            "name": c.name,
            "subject": c.subject,
            "subjects": c.subjects,
            "bio": c.bio,
            "hourly_rate": c.hourly_rate,
            "rating": c.rating,
            "experience_years": exp_years
        })

    # 2. Initialize and fit Hybrid Tutor Recommender
    recommender = HybridTutorRecommender(alpha=0.6)
    recommender.fit(tutors_data, ratings_data=[])

    # 3. Format student requirements
    pref = {
        "subject": req.subject if req.subject != "All" else "",
        "keywords": f"{req.query or ''} {req.learning_style or ''}",
        "max_budget": req.max_budget or 100.0,
        "min_rating": req.min_rating or 0.0,
        "min_experience": 0.0
    }

    # 4. Generate hybrid ML recommendations
    recs = recommender.recommend(req.student_id or "guest_student", pref, top_k=len(candidates))

    # Map output candidates back to ScoredTutorMatch
    candidate_map = {c.id: c for c in candidates}
    results: List[ScoredTutorMatch] = []

    for r in recs:
        tid = r.get('tutor_id') or r.get('id')
        c = candidate_map.get(tid)
        is_ver = c.is_verified if c else True
        is_on = c.is_online if c else True

        results.append(
            ScoredTutorMatch(
                tutor_id=tid,
                name=r['name'],
                match_score=int(r['match_score']),
                subject=r['subject'],
                hourly_rate=float(r['hourly_rate']),
                rating=float(r['rating']),
                is_verified=is_ver,
                is_online=is_on,
                matching_reasons=r['reasons'][:3]
            )
        )

    return results

@router.post("/tutors", response_model=RecommendationResponse)
async def recommend_tutors(payload: StudentRequirement):
    """
    ML-driven Tutor Recommendation Engine.
    Uses TF-IDF Vector Cosine Similarity & Multi-Attribute Utility Models (MAUT)
    to match student requirements with candidate tutors.
    """
    try:
        candidates = payload.candidates or [
            TutorCandidate(
                id="tut_101",
                name="Dr. Evelyn Reed",
                subject="Algorithms & Data Structures",
                bio="Specialized in Graph Theory, Dynamic Programming, and High-Performance Algorithm Design.",
                subjects=["Algorithms", "Data Structures", "Python", "C++"],
                hourly_rate=65.0,
                rating=4.98,
                reviews="142 reviews",
                is_online=True,
                is_verified=True,
                institution="Stanford University"
            ),
            TutorCandidate(
                id="tut_102",
                name="Marcus Chen",
                subject="Linear Algebra & AI Foundations",
                bio="Passionate about demystifying Matrix Decompositions, Neural Networks, and PyTorch.",
                subjects=["Linear Algebra", "PyTorch", "Machine Learning", "Python"],
                hourly_rate=55.0,
                rating=4.95,
                reviews="98 reviews",
                is_online=True,
                is_verified=True,
                institution="MIT"
            ),
            TutorCandidate(
                id="tut_103",
                name="Sophia Williams",
                subject="Quantum Mechanics & Physics",
                bio="Theoretical Physicist helping university students master Quantum Computing and Electromagnetism.",
                subjects=["Quantum Physics", "Calculus", "Thermodynamics"],
                hourly_rate=70.0,
                rating=5.0,
                reviews="210 reviews",
                is_online=False,
                is_verified=True,
                institution="Cambridge University"
            ),
        ]

        scored_matches = compute_ml_tutor_scores(candidates, payload)

        return RecommendationResponse(
            success=True,
            total_matches=len(scored_matches),
            recommendations=scored_matches
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation Engine error: {str(e)}"
        )
