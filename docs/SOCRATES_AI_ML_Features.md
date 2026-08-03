# SOCRATES: AI & ML FEATURES INTEGRATION GUIDE 🤖
## Local-First Architecture — Aligned with MASTER_SYSTEM_PROMPT & Final Tech Stack

> **🔑 LOCAL-FIRST RULE**: Build custom ML models (scikit-learn, PyTorch, sentence-transformers, Ollama) for tutor matching, similarity scoring, classification, sentiment, recommendations. **Reserve external LLM APIs (Gemini/OpenAI) ONLY for open-ended multi-step tutoring responses where local models are insufficient.**

---

## 1. AI/ML FEATURES OVERVIEW (Stack-Aligned)

| # | Feature | Provider | Model / Approach | Cost | Install |
|---|---------|----------|------------------|------|---------|
| 1 | **AI Tutoring Assistant (Socratic)** | Google Gemini | gemini-1.5-flash (Socratic prompt) | FREE (60 req/min) | `npm i @google/generative-ai` |
| 2 | **Session Summarization** | Google Gemini | gemini-1.5-flash (structured prompt) | FREE | Same package |
| 3 | **Sentiment Analysis (Reviews)** | **Local (Hugging Face)** | **Xenova/bert-base-uncased-finetuned-sst-2-english** | **FREE** | `npm i @xenova/transformers` |
| 4 | **Content Moderation** | OpenAI | Moderation API | FREE (~$0.002/req) | `npm i openai` |
| 5 | **Tutor Matching / Similarity** | **Local (Python)** | **sentence-transformers (all-MiniLM-L6-v2) + cosine similarity** | **FREE** | `pip install sentence-transformers scikit-learn` |
| 6 | **Smart Tutor Recommendations** | **Local (Python/JS)** | **Collaborative filtering + embedding similarity** | **FREE** | `npm i @xenova/transformers` or Python service |
| 7 | **Student Performance Prediction** | **Local (Python)** | **scikit-learn RandomForest / XGBoost** | **FREE** | `pip install scikit-learn xgboost` |
| 8 | **Intent Detection (Chat)** | **Local (Hugging Face)** | **Xenova/bert-base-uncased (zero-shot)** | **FREE** | `npm i @xenova/transformers` |
| 9 | **Intelligent Scheduling** | **Local (Python)** | **Constraint optimization (OR-Tools)** | **FREE** | `pip install ortools` |
| 10 | **AI Lesson Prep for Tutors** | Google Gemini | gemini-1.5-flash (student history → lesson plan) | FREE | Same package |

> **Total AI Cost: ~₹0/month** (all free tiers, local models run on CPU)

---

## 2. ARCHITECTURE: AI MICROSERVICE (Python FastAPI)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19 + Vite)                   │
│  @xenova/transformers (sentiment, intent in browser)           │
└────────────────────────────┬────────────────────────────────────┘
                             │ Axios + TanStack Query
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js 20 + Express.js)                  │
│  Orchestrates: Auth, Booking, Payments, Chat, n8n webhooks     │
└────────┬────────────┬────────────┬────────────┬─────────────────┘
         │            │            │            │
         ▼            ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐
  │ MongoDB  │ │Cloudinary│ │  Jitsi   │ │     n8n        │
  │  Atlas   │ │ (Images) │ │  (Video) │ │ (Workflows)    │
  └──────────┘ └──────────┘ └──────────┘ └───────┬────────┘
                                                  │
         ┌────────────────────────────────────────┼────────────────┐
         │                                        │                │
         ▼                                        ▼                ▼
  ┌──────────────┐                        ┌──────────────┐ ┌──────────────┐
  │  AI Service  │                        │  Gemini API  │ │ Gmail/Slack  │
  │  (Python/    │                        │  (External   │ │ Sheets/      │
  │   FastAPI)   │                        │   LLM Only)  │ │ Discord      │
  │  Local ML    │                        └──────────────┘ └──────────────┘
  │  First!      │
  │  (sklearn,   │
  │   PyTorch,   │
  │   transformers)
  └──────────────┘
```

**AI Service Endpoints** (FastAPI, port 8001):
- `POST /match/tutors` — Embedding similarity search
- `POST /recommend/tutors` — Collaborative filtering + content-based
- `POST /analyze/sentiment` — Review sentiment (Xenova BERT)
- `POST /analyze/intent` — Chat intent detection (zero-shot)
- `POST /predict/performance` — Student dropout risk (RandomForest)
- `POST /optimize/schedule` — Slot optimization (OR-Tools)
- `GET /health` — Service health

---

## 3. LOCAL ML IMPLEMENTATIONS

### 3.1 Tutor Matching — Embedding Similarity (Python)

```python
# ai-service/app/services/matching.py
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')  # 384-dim, fast CPU

def compute_tutor_embedding(tutor: dict) -> np.ndarray:
    """Build text representation: subjects + bio + experience"""
    text = f"{' '.join(tutor['subjects'])} {tutor['bio']} {tutor['experience']} years"
    return model.encode([text])[0]

def match_tutors(student_profile: dict, tutors: list, top_k: int = 10) -> list:
    """Return top_k tutors ranked by semantic similarity + hard filters"""
    student_text = f"{' '.join(student_profile['subjects'])} {student_profile.get('learning_goals', '')}"
    student_emb = model.encode([student_text])[0]
    
    tutor_embs = np.array([compute_tutor_embedding(t) for t in tutors])
    similarities = cosine_similarity([student_emb], tutor_embs)[0]
    
    # Apply hard filters (price, rating, availability)
    filtered = []
    for i, tutor in enumerate(tutors):
        if tutor['hourlyRate'] <= student_profile.get('max_budget', 9999):
            if tutor['rating'] >= student_profile.get('min_rating', 0):
                filtered.append((tutor, similarities[i]))
    
    filtered.sort(key=lambda x: x[1], reverse=True)
    return [t for t, _ in filtered[:top_k]]
```

### 3.2 Smart Recommendations — Hybrid (Python)

```python
# ai-service/app/services/recommendations.py
from sklearn.neighbors import NearestNeighbors
import numpy as np

def collaborative_filtering(student_id: str, interactions: list, tutor_embs: np.ndarray, k: int = 5):
    """User-based CF: find similar students, recommend their liked tutors"""
    # Build user-item matrix (sparse)
    # For MVP: use embedding similarity as proxy
    student_emb = tutor_embs[student_id]  # precomputed
    distances, indices = NearestNeighbors(n_neighbors=k+1, metric='cosine').fit(tutor_embs).kneighbors([student_emb])
    return indices[0][1:]  # exclude self

def content_based_recommendations(student_profile: dict, tutor_embs: np.ndarray, k: int = 10):
    """Embedding similarity + metadata filters"""
    # Reuse match_tutors logic
    pass

def hybrid_recommend(student_id: str, student_profile: dict, tutors: list, k: int = 10):
    """Blend CF + content-based (weighted)"""
    cf_scores = collaborative_filtering(student_id, ..., k*2)
    cb_scores = content_based_recommendations(student_profile, ..., k*2)
    # Merge with 0.6 CF + 0.4 CB weights
    return merged[:k]
```

### 3.3 Sentiment Analysis (Browser + Server)

```javascript
// frontend/src/lib/sentiment.js (runs in browser via @xenova/transformers)
import { pipeline } from '@xenova/transformers';

let classifier = null;
export async function analyzeSentiment(text: string) {
  if (!classifier) {
    classifier = await pipeline('sentiment-analysis', 'Xenova/bert-base-uncased-finetuned-sst-2-english');
  }
  const [result] = await classifier(text);
  return { label: result.label, confidence: result.score }; // POSITIVE/NEGATIVE
}

// backend: same model via @xenova/transformers (Node) or Python transformers
```

```python
# ai-service/app/services/sentiment.py (Python alternative)
from transformers import pipeline
classifier = pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')
def analyze(text): return classifier(text)[0]
```

### 3.4 Intent Detection (Zero-Shot, Browser + Server)

```javascript
// frontend/src/lib/intent.js
import { pipeline } from '@xenova/transformers';

let classifier = null;
const INTENTS = ['booking_session', 'ask_for_help', 'complaint', 'payment_issue', 'technical_support', 'greeting'];

export async function detectIntent(message: string) {
  if (!classifier) {
    classifier = await pipeline('zero-shot-classification', 'Xenova/bert-base-mnli');
  }
  const result = await classifier(message, INTENTS);
  return { intent: result.labels[0], confidence: result.scores[0] };
}
```

### 3.5 Student Performance Prediction (Python)

```python
# ai-service/app/services/prediction.py
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import numpy as np

MODEL_PATH = 'models/performance_rf.pkl'
SCALER_PATH = 'models/scaler.pkl'

def train_model(training_data: list):
    """training_data: [{sessions, avg_score, response_time, hours_studied, will_improve}, ...]"""
    X = np.array([[d['sessions'], d['avg_score'], d['response_time'], d['hours_studied']] for d in training_data])
    y = np.array([d['will_improve'] for d in training_data])
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_scaled, y)
    
    pickle.dump(model, open(MODEL_PATH, 'wb'))
    pickle.dump(scaler, open(SCALER_PATH, 'wb'))

def predict_performance(student_stats: dict) -> dict:
    model = pickle.load(open(MODEL_PATH, 'rb'))
    scaler = pickle.load(open(SCALER_PATH, 'rb'))
    
    features = np.array([[student_stats['sessions'], student_stats['avg_score'], 
                          student_stats['response_time'], student_stats['hours_studied']]])
    features_scaled = scaler.transform(features)
    
    prob = model.predict_proba(features_scaled)[0][1]  # P(will_improve)
    return {'will_improve': prob > 0.5, 'confidence': float(prob)}
```

### 3.6 Intelligent Scheduling (Python OR-Tools)

```python
# ai-service/app/services/scheduling.py
from ortools.sat.python import cp_model

def optimize_tutor_schedule(tutor_availability: list, student_requests: list, constraints: dict):
    """CP-SAT: maximize matched sessions respecting tutor hours, student prefs, timezone"""
    model = cp_model.CpModel()
    # Variables: x[tutor, student, slot] ∈ {0,1}
    # Constraints: tutor max hours/day, student preferred times, no overlaps
    # Objective: maximize sum(x) + weight * student_priority
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10
    status = solver.Solve(model)
    # Return matched pairs
    return matches
```

---

## 4. GEMINI INTEGRATION (External LLM — Reserved Uses Only)

```python
# ai-service/app/services/gemini.py
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

SOCRATIC_SYSTEM_PROMPT = """You are a Socratic tutor. NEVER give direct answers.
Ask ONE guiding question at a time. Help the student discover the solution.
If they're stuck, offer a hint. Celebrate progress."""

async def socratic_tutor(question: str, context: dict = None) -> str:
    prompt = f"{SOCRATIC_SYSTEM_PROMPT}\n\nStudent: {question}"
    if context:
        prompt += f"\nContext: {context}"
    response = await model.generate_content_async(prompt)
    return response.text

async def summarize_session(transcript: str) -> str:
    prompt = f"""Summarize this tutoring session into structured markdown:
    
{transcript}

Include:
- Key concepts covered
- Learning objectives achieved  
- Homework / next steps
- Resources recommended"""
    response = await model.generate_content_async(prompt)
    return response.text

async def generate_lesson_prep(student_history: dict, upcoming_topic: str) -> str:
    prompt = f"""Generate a 1-page lesson plan for a tutor.
Student profile: {student_history}
Upcoming topic: {upcoming_topic}

Include:
- Prerequisites check
- 3 key learning objectives
- Socratic questions to guide
- Common misconceptions
- Practice problems"""
    response = await model.generate_content_async(prompt)
    return response.text
```

---

## 5. N8N WORKFLOWS (Async AI Processing)

| Workflow | Trigger | n8n Nodes | Output |
|----------|---------|-----------|--------|
| **Tutor Verification** | Tutor applies | Webhook → Gemini OCR (cert PDF) → Google Sheets (whitelist) → Slack (Approve/Reject) → HTTP PUT `/api/admin/tutor/:id/status` | Tutor verified/rejected |
| **Session Summary** | Session ends | Webhook → Gemini (transcript → markdown) → Gmail (student) → MongoDB (lesson log) | Email + DB summary |
| **Weekly Leaderboard** | Cron (Sun 23:59) | MongoDB (top 5 karma) → Google Sheets → Gemini (certificate text) → Gmail (tutors) | Certificates emailed |
| **AI Lesson Prep** | 30min before session | Webhook → Gemini (student history → lesson plan) → MongoDB (tutor prep) | Tutor sees prep in dashboard |

---

## 6. DEPLOYMENT: AI SERVICE

```dockerfile
# ai-service/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

```yaml
# docker-compose.yml (add to root)
services:
  ai-service:
    build: ./ai-service
    ports:
      - "8001:8001"
    env_file:
      - ./ai-service/.env
    depends_on:
      - redis  # for caching embeddings
```

```txt
# ai-service/requirements.txt
fastapi==0.109
uvicorn==0.27
sentence-transformers==3.0
scikit-learn==1.5
transformers==4.40
torch==2.3 --index-url https://download.pytorch.org/whl/cpu
xgboost==2.1
ortools==9.10
pydantic==2.7
python-dotenv==1.0
httpx==0.27
redis==5.0
```

---

## 7. FRONTEND INTEGRATION

```javascript
// frontend/src/services/aiClient.js
import axios from 'axios';

const aiService = axios.create({ baseURL: '/api/ai' }); // proxied via Vite to localhost:8001
const backend = axios.create({ baseURL: '/api' });

export const ai = {
  // Local ML (via Python AI service)
  matchTutors: (profile) => aiService.post('/match/tutors', profile),
  recommendTutors: (studentId) => aiService.post('/recommend/tutors', { studentId }),
  analyzeSentiment: (text) => aiService.post('/analyze/sentiment', { text }),
  detectIntent: (message) => aiService.post('/analyze/intent', { message }),
  predictPerformance: (stats) => aiService.post('/predict/performance', stats),
  optimizeSchedule: (data) => aiService.post('/optimize/schedule', data),

  // Gemini (via backend proxy)
  socraticHelp: (question, context) => backend.post('/ai/socratic', { question, context }),
  summarizeSession: (transcript) => backend.post('/ai/summarize', { transcript }),
  generateLessonPrep: (sessionId) => backend.post('/ai/lesson-prep', { sessionId }),
};
```

```javascript
// frontend/src/hooks/useSocraticAI.js
import { useState } from 'react';
import { ai } from '@/services/aiClient';

export function useSocraticAI() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    setLoading(true);
    setMessages(m => [...m, { role: 'user', content: question }]);
    try {
      const { data } = await ai.socraticHelp(question);
      setMessages(m => [...m, { role: 'assistant', content: data.answer }]);
    } finally {
      setLoading(false);
    }
  }
  return { messages, ask, loading };
}
```

---

## 8. IMPLEMENTATION TIMELINE (Aligned with Development Workflow)

| Week | Phase | Backend (Member 3/4) | AI Service (Member 4) | Frontend (Member 1/2) |
|------|-------|---------------------|----------------------|----------------------|
| 14 | AI Integration | `POST /api/ai/socratic`, `/api/ai/summarize`, `/api/ai/moderate` | **Deploy FastAPI service**, implement matching, sentiment, intent endpoints | AI Chat panel (floating button), session summary display |
| 15 | Admin + n8n | Admin APIs, n8n webhook triggers | Tutor matching CF, recommendation hybrid, performance prediction | Admin panel UI, tutor terminal with match scores |
| 16 | Dashboards | Lesson prep endpoint, schedule optimizer | Deploy all local models, cache embeddings in Redis | Student/Tutor dashboards with AI insights, smart booking suggestions |

**Total AI Implementation: ~10 days** (parallel with Phase 4)

---

## 9. TOOLS & SERVICES (Stack-Aligned Only)

| Category | Tool | Purpose | Cost |
|----------|------|---------|------|
| **Local Embeddings** | sentence-transformers (all-MiniLM-L6-v2) | Tutor matching, semantic search | FREE |
| **Local Classification** | @xenova/transformers (BERT, MNLI) | Sentiment, intent (browser + server) | FREE |
| **Local ML** | scikit-learn, XGBoost | Prediction, recommendation | FREE |
| **Optimization** | OR-Tools | Scheduling, constraint solving | FREE |
| **External LLM** | Google Gemini 1.5 Flash | Socratic tutoring, summarization, lesson prep | FREE (60/min) |
| **Moderation** | OpenAI Moderation API | Content safety | FREE (~$0.002/req) |
| **Workflow** | n8n (self-hosted) | Async AI, approvals, notifications | FREE |
| **Cache** | Redis (optional) | Embedding cache, rate limiting | FREE (local) |

---

## 10. COMPLETE DEPENDENCY LISTS

### Frontend (package.json)
```bash
npm install \
  react-router-dom axios @tanstack/react-query \
  react-hook-form zod @hookform/resolvers zustand \
  socket.io-client framer-motion date-fns sonner \
  lucide-react clsx \
  @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction \
  @xenova/transformers \
  @jitsi/react-sdk
```

### Backend (package.json)
```bash
npm install \
  express cors helmet mongoose dotenv jsonwebtoken bcrypt \
  nodemailer socket.io razorpay cloudinary axios multer sharp \
  uuid joi express-validator express-async-errors compression \
  express-rate-limit sanitize-html winston \
  @google/generative-ai openai @xenova/transformers
```

### AI Service (requirements.txt)
```bash
pip install fastapi uvicorn sentence-transformers scikit-learn xgboost ortools transformers torch pydantic python-dotenv httpx redis
```

---

## 11. COST ESTIMATION (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| Google Gemini API | 100k requests (tutoring + summaries) | ₹0 (free tier) |
| OpenAI Moderation | 5k reviews | ~₹80 |
| n8n (self-hosted Docker) | 3 workflows | ₹0 |
| AI Service (Render/EC2) | 24/7 CPU inference | ₹0 (free tier) |
| Redis (optional) | Embedding cache | ₹0 (local) |
| **TOTAL** | | **~₹0-100/month** |

---

## 12. ZERO-TOLERANCE COMPLIANCE CHECKLIST

- ✅ **No raw emojis** — lucide-react only
- ✅ **Local ML first** — Embeddings, sentiment, intent, matching, prediction all local
- ✅ **Gemini reserved** — Only Socratic tutoring, summarization, lesson prep
- ✅ **No cloud Speech-to-Text** — Not in stack (use Jitsi native recording)
- ✅ **No cloud Vision** — Not in stack
- ✅ **No hardcoded hexes** — CSS variables only
- ✅ **Typed everywhere** — TypeScript frontend, Pydantic AI service
- ✅ **Anti-jank** — GPU transforms only, no layout thrashing

---

**This guide is the single source of truth for AI/ML implementation. All code must follow Local-First Directive.** 🤖✨