"""
Hybrid Recommendation System for Tutor-Student Matching
Combines Content-Based Filtering (Cosine Similarity) and Collaborative Filtering (Matrix Factorization via SVD).
Uses NumPy for linear algebra, SVD decomposition, TF-IDF vectorization, and cosine similarity.
"""

import numpy as np
from typing import List, Dict, Any

# ============================================================================
# 1. CONTENT-BASED FILTERING (CBF) - TF-IDF & Cosine Similarity
# ============================================================================

class ContentBasedRecommender:
    """
    Content-Based Filtering using TF-IDF text vectorization and feature normalization.
    Computes match score using Cosine Similarity.
    """
    def __init__(self):
        self.vocabulary = []
        self.idf_vector = None
        self.tutors_data = []
        self.tutor_feature_vectors = None
        self.price_min = 0.0
        self.price_max = 1.0
        self.exp_min = 0.0
        self.exp_max = 1.0

    def _tokenize(self, text: str) -> List[str]:
        """Simple whitespace & lowercase tokenizer."""
        import re
        return re.findall(r'\b\w+\b', text.lower())

    def fit(self, tutors_data: List[Dict[str, Any]]):
        """
        Build feature vectors (TF-IDF + Normalized Rating/Price/Experience) for all tutors.
        """
        self.tutors_data = tutors_data
        n_tutors = len(tutors_data)
        if n_tutors == 0:
            return

        # 1. Build Text Corpus
        corpus_tokens = []
        for t in tutors_data:
            subject = t.get('subject', '')
            subjects = " ".join(t.get('subjects', []))
            bio = t.get('bio', '')
            text = f"{subject} {subjects} {bio}"
            tokens = self._tokenize(text)
            corpus_tokens.append(tokens)

        # 2. Extract Vocabulary & Compute IDF
        vocab_set = set(t for tokens in corpus_tokens for t in tokens)
        self.vocabulary = sorted(list(vocab_set))
        vocab_idx = {w: i for i, w in enumerate(self.vocabulary)}

        doc_freq = np.zeros(len(self.vocabulary))
        for tokens in corpus_tokens:
            unique_in_doc = set(tokens)
            for w in unique_in_doc:
                doc_freq[vocab_idx[w]] += 1

        # Smooth IDF formulation: log((1 + N) / (1 + df)) + 1
        self.idf_vector = np.log((1.0 + n_tutors) / (1.0 + doc_freq)) + 1.0

        # 3. Compute TF-IDF matrix for tutors
        tfidf_matrix = np.zeros((n_tutors, len(self.vocabulary)))
        for i, tokens in enumerate(corpus_tokens):
            if not tokens:
                continue
            token_counts = {}
            for w in tokens:
                token_counts[w] = token_counts.get(w, 0) + 1
            for w, count in token_counts.items():
                tf = count / len(tokens)
                tfidf_matrix[i, vocab_idx[w]] = tf * self.idf_vector[vocab_idx[w]]

        # 4. Normalize Numerical Features (Rating, Price, Experience)
        rates = [t.get('hourly_rate', 50.0) for t in tutors_data]
        exps = [t.get('experience_years', 3.0) for t in tutors_data]
        ratings = [t.get('rating', 4.0) for t in tutors_data]

        self.price_min = float(min(rates))
        self.price_max = float(max(rates)) if float(max(rates)) > float(min(rates)) else float(min(rates)) + 1.0
        self.exp_min = float(min(exps))
        self.exp_max = float(max(exps)) if float(max(exps)) > float(min(exps)) else float(min(exps)) + 1.0

        num_matrix = np.zeros((n_tutors, 3))
        for i in range(n_tutors):
            norm_rating = ratings[i] / 5.0
            norm_price_score = 1.0 - ((rates[i] - self.price_min) / (self.price_max - self.price_min + 1e-5))
            norm_exp = (exps[i] - self.exp_min) / (self.exp_max - self.exp_min + 1e-5)
            num_matrix[i] = [norm_rating, norm_price_score, norm_exp]

        # Combine TF-IDF (weight: 0.70) and Numerical features (weight: 0.30)
        self.tutor_feature_vectors = np.hstack((tfidf_matrix * 0.70, num_matrix * 0.30))

    def predict_similarity(self, student_preference: Dict[str, Any]) -> np.ndarray:
        """
        Compute cosine similarity between student preference vector and tutor vectors.
        """
        n_tutors = len(self.tutors_data)
        if n_tutors == 0 or self.tutor_feature_vectors is None:
            return np.array([])

        query_text = f"{student_preference.get('subject', '')} {student_preference.get('keywords', '')}"
        query_tokens = self._tokenize(query_text)

        query_tfidf = np.zeros(len(self.vocabulary))
        if query_tokens:
            token_counts = {}
            for w in query_tokens:
                token_counts[w] = token_counts.get(w, 0) + 1
            vocab_idx = {w: i for i, w in enumerate(self.vocabulary)}
            for w, count in token_counts.items():
                if w in vocab_idx:
                    tf = count / len(query_tokens)
                    query_tfidf[vocab_idx[w]] = tf * self.idf_vector[vocab_idx[w]]

        max_budget = student_preference.get('max_budget', 100.0)
        min_rating = student_preference.get('min_rating', 4.0)
        min_exp = student_preference.get('min_experience', 2.0)

        norm_rating = min_rating / 5.0
        norm_price_score = 1.0 - min(1.0, max(0.0, (max_budget - self.price_min) / (self.price_max - self.price_min + 1e-5)))
        norm_exp = min(1.0, max(0.0, (min_exp - self.exp_min) / (self.exp_max - self.exp_min + 1e-5)))

        query_num = np.array([norm_rating, norm_price_score, norm_exp])
        student_vec = np.hstack((query_tfidf * 0.70, query_num * 0.30))

        # Cosine Similarity: (A · B) / (||A|| * ||B||)
        dot_products = np.dot(self.tutor_feature_vectors, student_vec)
        student_norm = np.linalg.norm(student_vec)
        tutor_norms = np.linalg.norm(self.tutor_feature_vectors, axis=1)

        denominator = (tutor_norms * student_norm) + 1e-9
        similarities = dot_products / denominator

        return np.clip(similarities, 0.0, 1.0)


# ============================================================================
# 2. COLLABORATIVE FILTERING (CF) - Matrix Factorization via NumPy SVD
# ============================================================================

class CollaborativeFilteringSVD:
    """
    Collaborative Filtering using Singular Value Decomposition (SVD).
    Decomposes Student-Tutor Rating Matrix R into U * Sigma * V^T.
    """
    def __init__(self, k_factors: int = 2):
        self.k_factors = k_factors
        self.student_ids = []
        self.tutor_ids = []
        self.predicted_matrix = None
        self.global_mean = 4.0

    def fit(self, ratings_data: List[Dict[str, Any]]):
        """
        Fit SVD model on past rating interaction data [{'student_id', 'tutor_id', 'rating'}].
        """
        if not ratings_data:
            return

        all_students = sorted(list(set(r['student_id'] for r in ratings_data)))
        all_tutors = sorted(list(set(r['tutor_id'] for r in ratings_data)))

        self.student_ids = all_students
        self.tutor_ids = all_tutors

        student_idx_map = {sid: i for i, sid in enumerate(all_students)}
        tutor_idx_map = {tid: i for i, tid in enumerate(all_tutors)}

        n_students = len(all_students)
        n_tutors = len(all_tutors)

        # 1. Build Rating Matrix R
        R = np.full((n_students, n_tutors), np.nan)
        ratings_val_list = []
        for r in ratings_data:
            i = student_idx_map[r['student_id']]
            j = tutor_idx_map[r['tutor_id']]
            R[i, j] = r['rating']
            ratings_val_list.append(r['rating'])

        self.global_mean = float(np.mean(ratings_val_list)) if ratings_val_list else 4.0

        # 2. Demean Matrix R (user mean centering)
        user_means = np.nanmean(R, axis=1)
        user_means = np.nan_to_num(user_means, nan=self.global_mean)

        R_demeaned = np.zeros((n_students, n_tutors))
        for i in range(n_students):
            for j in range(n_tutors):
                if not np.isnan(R[i, j]):
                    R_demeaned[i, j] = R[i, j] - user_means[i]
                else:
                    R_demeaned[i, j] = 0.0

        # 3. Perform Truncated SVD via NumPy
        U, S, Vt = np.linalg.svd(R_demeaned, full_matrices=False)

        k = min(self.k_factors, len(S))
        U_k = U[:, :k]
        S_k = np.diag(S[:k])
        Vt_k = Vt[:k, :]

        # Reconstruct Rating Matrix: R_hat = U_k * S_k * Vt_k + user_means
        R_hat = np.dot(np.dot(U_k, S_k), Vt_k) + user_means.reshape(-1, 1)
        self.predicted_matrix = R_hat

    def predict_rating(self, student_id: str, tutor_id: str) -> float:
        """
        Predict rating for student_id and tutor_id.
        """
        if self.predicted_matrix is None or student_id not in self.student_ids or tutor_id not in self.tutor_ids:
            return self.global_mean

        i = self.student_ids.index(student_id)
        j = self.tutor_ids.index(tutor_id)
        return float(self.predicted_matrix[i, j])

    def get_student_predicted_ratings(self, student_id: str, tutor_list: List[str]) -> np.ndarray:
        """
        Get predicted rating array normalized to [0, 1] for a student across tutors.
        """
        preds = [self.predict_rating(student_id, tid) for tid in tutor_list]
        preds_arr = np.array(preds)
        # Scale 1-5 rating range to [0, 1]
        norm_preds = (preds_arr - 1.0) / 4.0
        return np.clip(norm_preds, 0.0, 1.0)


# ============================================================================
# 3. HYBRID RECOMMENDER ENGINE
# ============================================================================

class HybridTutorRecommender:
    """
    Combines Content-Based Cosine Similarity and SVD Collaborative Filtering
    with dynamic cold-start weighting.
    """
    def __init__(self, alpha: float = 0.5):
        self.cbf = ContentBasedRecommender()
        self.cf = CollaborativeFilteringSVD(k_factors=2)
        self.default_alpha = alpha
        self.tutors_data = []
        self.known_students = set()

    def fit(self, tutors_data: List[Dict[str, Any]], ratings_data: List[Dict[str, Any]]):
        """
        Train CBF and SVD CF models.
        """
        self.tutors_data = tutors_data
        self.cbf.fit(tutors_data)
        self.cf.fit(ratings_data)
        self.known_students = set(r['student_id'] for r in ratings_data)

    def recommend(
        self,
        student_id: str,
        student_preference: Dict[str, Any],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generate hybrid recommendations for a student.
        Adjusts alpha dynamically:
        - Cold-start student -> alpha = 1.0 (100% Content-Based)
        - Existing student   -> alpha = self.default_alpha (Hybrid blend)
        """
        all_tutor_ids = [t['id'] for t in self.tutors_data]

        # 1. Content-Based Scores [0, 1]
        cbf_scores = self.cbf.predict_similarity(student_preference)

        # 2. Collaborative Filtering Scores [0, 1]
        is_cold_start = student_id not in self.known_students
        if is_cold_start:
            alpha = 1.0  # Cold-start fallback
            cf_scores = np.zeros(len(all_tutor_ids))
        else:
            alpha = self.default_alpha
            cf_scores = self.cf.get_student_predicted_ratings(student_id, all_tutor_ids)

        # 3. Hybrid Blended Score
        hybrid_scores = (alpha * cbf_scores) + ((1.0 - alpha) * cf_scores)

        # Format and Rank Results
        results = []
        for idx, t in enumerate(self.tutors_data):
            cbf_s = float(cbf_scores[idx]) if idx < len(cbf_scores) else 0.0
            cf_s = float(cf_scores[idx]) if idx < len(cf_scores) else 0.0
            h_score = float(hybrid_scores[idx]) if idx < len(hybrid_scores) else 0.0

            match_pct = int(min(99, max(50, round(h_score * 100))))

            reasons = []
            if cbf_s > 0.35:
                reasons.append(f"Strong Domain Match ({t.get('subject')})")
            if not is_cold_start and cf_s > 0.6:
                reasons.append("High SVD Collaborative Prediction")
            if t.get('rating', 0.0) >= 4.8:
                reasons.append(f"Top Rated Tutor ({t.get('rating')} stars)")
            if t.get('hourly_rate', 100.0) <= student_preference.get('max_budget', 100.0):
                reasons.append(f"Fits Budget (${int(t.get('hourly_rate'))}/hr)")

            results.append({
                "tutor_id": t['id'],
                "name": t['name'],
                "subject": t['subject'],
                "hourly_rate": t['hourly_rate'],
                "rating": t['rating'],
                "match_score": match_pct,
                "cbf_score": round(cbf_s, 4),
                "cf_score": round(cf_s, 4),
                "hybrid_score": round(h_score, 4),
                "reasons": reasons[:3]
            })

        # Sort descending by hybrid_score
        results.sort(key=lambda x: x['hybrid_score'], reverse=True)
        return results[:top_k]


# ============================================================================
# DEMONSTRATION & VERIFICATION SCRIPT
# ============================================================================

if __name__ == "__main__":
    print("=" * 75)
    print("SOCRATES — HYBRID RECOMMENDATION ENGINE (CBF + SVD CF)")
    print("=" * 75)

    # 1. Sample Tutor Metadata (Udemy/Tutor Dataset Format)
    tutors_data = [
        {
            "id": "tut_101",
            "name": "Dr. Evelyn Reed",
            "subject": "Algorithms & Data Structures",
            "subjects": ["Algorithms", "Data Structures", "Python", "C++"],
            "bio": "Expert in Graph Theory, Dynamic Programming, and High-Performance Algorithm Design.",
            "hourly_rate": 65.0,
            "rating": 4.98,
            "experience_years": 8.0
        },
        {
            "id": "tut_102",
            "name": "Marcus Chen",
            "subject": "Machine Learning & AI",
            "subjects": ["Machine Learning", "Linear Algebra", "PyTorch", "Python"],
            "bio": "Demystifying Deep Learning, Neural Networks, PyTorch, and Data Science fundamentals.",
            "hourly_rate": 55.0,
            "rating": 4.90,
            "experience_years": 5.0
        },
        {
            "id": "tut_103",
            "name": "Sophia Williams",
            "subject": "Quantum Physics & Math",
            "subjects": ["Physics", "Calculus", "Quantum Mechanics"],
            "bio": "Theoretical Physicist teaching Quantum Computing, Electromagnetism, and Linear Algebra.",
            "hourly_rate": 70.0,
            "rating": 4.85,
            "experience_years": 7.0
        },
        {
            "id": "tut_104",
            "name": "Alex Rivera",
            "subject": "Web Development & React",
            "subjects": ["Fullstack", "React", "TypeScript", "Node.js"],
            "bio": "Senior Software Architect teaching Modern Web Apps, React 19, TypeScript, and API Architecture.",
            "hourly_rate": 45.0,
            "rating": 4.75,
            "experience_years": 4.0
        },
        {
            "id": "tut_105",
            "name": "Prof. David Miller",
            "subject": "Data Structures & C++",
            "subjects": ["C++", "Data Structures", "Computer Architecture"],
            "bio": "University Professor with 12 years of experience teaching Memory Management and Operating Systems.",
            "hourly_rate": 80.0,
            "rating": 4.95,
            "experience_years": 12.0
        }
    ]

    # 2. Historical Ratings Matrix (Student x Tutor session ratings)
    ratings_data = [
        {"student_id": "std_01", "tutor_id": "tut_101", "rating": 5.0},
        {"student_id": "std_01", "tutor_id": "tut_102", "rating": 5.0},
        {"student_id": "std_01", "tutor_id": "tut_104", "rating": 3.0},

        {"student_id": "std_02", "tutor_id": "tut_103", "rating": 5.0},
        {"student_id": "std_02", "tutor_id": "tut_105", "rating": 4.0},
        {"student_id": "std_02", "tutor_id": "tut_101", "rating": 2.0},

        {"student_id": "std_03", "tutor_id": "tut_104", "rating": 5.0},
        {"student_id": "std_03", "tutor_id": "tut_101", "rating": 4.5},
        {"student_id": "std_03", "tutor_id": "tut_102", "rating": 4.0},
    ]

    # 3. Train Hybrid Engine
    recommender = HybridTutorRecommender(alpha=0.5)
    recommender.fit(tutors_data, ratings_data)
    print("\n[+] Hybrid Engine successfully trained (CBF Cosine Similarity + SVD Matrix Factorization).")

    # 4. Test Case 1: Existing Student (std_01) requesting Machine Learning
    print("\n" + "=" * 75)
    print("TEST CASE 1: Existing Student (std_01) -> Subject: Machine Learning & AI")
    print("=" * 75)
    pref_existing = {
        "subject": "Machine Learning & AI",
        "keywords": "PyTorch Neural Networks Python",
        "max_budget": 60.0,
        "min_rating": 4.5,
        "min_experience": 4.0
    }
    recs_existing = recommender.recommend("std_01", pref_existing, top_k=3)
    for idx, r in enumerate(recs_existing, 1):
        print(f"\n{idx}. {r['name']} ({r['subject']})")
        print(f"   Match Score: {r['match_score']}% | Hybrid Score: {r['hybrid_score']}")
        print(f"   Breakdown  : CBF Score={r['cbf_score']} | CF Score={r['cf_score']}")
        print(f"   Price      : ${r['hourly_rate']}/hr | Rating: {r['rating']} stars")
        print(f"   Reasons    : {', '.join(r['reasons'])}")

    # 5. Test Case 2: Cold-Start Student (std_new) requesting C++ & Data Structures
    print("\n" + "=" * 75)
    print("TEST CASE 2: Cold-Start Student (std_new) -> Subject: Algorithms & C++")
    print("=" * 75)
    pref_new = {
        "subject": "Algorithms & C++",
        "keywords": "Data Structures Memory Management C++",
        "max_budget": 85.0,
        "min_rating": 4.8,
        "min_experience": 5.0
    }
    recs_new = recommender.recommend("std_new", pref_new, top_k=3)
    for idx, r in enumerate(recs_new, 1):
        print(f"\n{idx}. {r['name']} ({r['subject']})")
        print(f"   Match Score: {r['match_score']}% | Hybrid Score: {r['hybrid_score']}")
        print(f"   Breakdown  : CBF Score={r['cbf_score']} (Pure CBF due to Cold-Start)")
        print(f"   Price      : ${r['hourly_rate']}/hr | Rating: {r['rating']} stars")
        print(f"   Reasons    : {', '.join(r['reasons'])}")

    print("\n" + "=" * 75)
    print("HYBRID RECOMMENDER VERIFICATION SUCCESSFUL")
    print("=" * 75)