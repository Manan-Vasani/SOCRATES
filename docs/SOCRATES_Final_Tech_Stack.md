# SOCRATES: FINAL TECH STACK
## AI-Enhanced Online Tutoring Marketplace

> **Stack**: MERN (MongoDB, Express, React, Node.js) + Python FastAPI AI Microservice + n8n Workflow Automation
> **Status**: LOCKED — No changes without team consensus
>
> **🔑 LOCAL-ML-FIRST MANDATE**: Build custom local ML models (`scikit-learn`, `PyTorch`, `sentence-transformers`, Ollama) for tutor matching, similarity scoring, classification, sentiment, and recommendations. **Reserve external LLM APIs (Gemini / OpenAI) ONLY for open-ended multi-step tutoring responses where local models are insufficient.** See [MASTER_SYSTEM_PROMPT §4.3](file:///d:/SOCRATES/docs/MASTER_SYSTEM_PROMPT.md).

---

## 🖥️ FRONTEND

| Category | Tool | Version | Purpose | Cost | Install |
|----------|------|---------|---------|------|---------|
| **Framework** | React | ^19.x | UI component library | FREE | Comes with Vite |
| **Build Tool** | Vite | ^6.x | Dev server + bundler (10-100x faster than Webpack) | FREE | `npm create vite@latest` |
| **CSS** | Tailwind CSS | v4 | Utility-first CSS framework | FREE | `npm install -D tailwindcss @tailwindcss/vite` |
| **Routing** | React Router | ^7.x | Client-side page navigation | FREE | `npm install react-router-dom` |
| **State Management** | Zustand | ^5.x | Global state (auth, theme, notifications) | FREE | `npm install zustand` |
| **Server State** | TanStack Query | ^5.x | API caching, background refetch, loading states | FREE | `npm install @tanstack/react-query` |
| **HTTP Client** | Axios | ^1.7+ | API requests with interceptors | FREE | `npm install axios` |
| **Forms** | React Hook Form | ^7.x | Form handling with minimal re-renders | FREE | `npm install react-hook-form` |
| **Validation** | Zod | ^3.x | Schema validation (shared with backend) | FREE | `npm install zod` |
| **Form + Zod Bridge** | @hookform/resolvers | ^3.x | Connect Zod schemas to React Hook Form | FREE | `npm install @hookform/resolvers` |
| **Animation** | Framer Motion | ^11.x | Page transitions, hover effects, micro-animations | FREE | `npm install framer-motion` |
| **Calendar** | FullCalendar | ^6.x | Session scheduling calendar widget | FREE | `npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction` |
| **Icons** | **lucide-react** | ^0.4.x | **MANDATORY** - Vector icons only. Zero raw emojis. | FREE | `npm install lucide-react` |
| **Dates** | date-fns | ^4.x | Date formatting & manipulation | FREE | `npm install date-fns` |
| **Toasts** | Sonner | ^2.x | Beautiful toast notifications | FREE | `npm install sonner` |
| **Real-Time (Client)** | Socket.IO Client | ^4.8+ | WebSocket connection to backend | FREE | `npm install socket.io-client` |
| **Class Merging** | clsx | ^2.x | Conditional CSS class names | FREE | `npm install clsx` |
| **Linting** | ESLint | ^9.x | Find code issues | FREE | `npm install -D eslint` |
| **Formatting** | Prettier | ^3.x | Auto-format code | FREE | `npm install -D prettier` |

> **⚠️ ZERO TOLERANCE**: Raw emoji icons forbidden. Use `lucide-react` exclusively. Hardcoded hex colors forbidden. Use CSS variable tokens only.

## ⚙️ BACKEND

| Category | Tool | Version | Purpose | Cost | Install |
|----------|------|---------|---------|------|---------|
| **Runtime** | Node.js | 20 LTS | JavaScript server runtime | FREE | [nodejs.org](https://nodejs.org) |
| **Framework** | Express.js | ^4.21+ | Web server, routing, middleware | FREE | `npm install express` |
| **Database** | MongoDB | Latest | NoSQL document database | FREE (512MB Atlas) | [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas) |
| **ODM** | Mongoose | ^8.x | MongoDB schema modeling, validation, hooks | FREE | `npm install mongoose` |
| **Auth - Tokens** | jsonwebtoken | ^9.x | Create & verify JWT tokens | FREE | `npm install jsonwebtoken` |
| **Auth - Hashing** | bcrypt | ^5.x | Password hashing (industry standard) | FREE | `npm install bcrypt` |
| **Security - Headers** | Helmet | ^8.x | Set secure HTTP headers (XSS, clickjacking) | FREE | `npm install helmet` |
| **Security - CORS** | cors | ^2.8+ | Allow frontend to call backend | FREE | `npm install cors` |
| **Security - Rate Limit** | express-rate-limit | ^7.x | Prevent brute-force attacks (100 req/15min on auth) | FREE | `npm install express-rate-limit` |
| **Security - Sanitize** | sanitize-html | ^2.x | Strip dangerous HTML from user input | FREE | `npm install sanitize-html` |
| **Validation** | Joi | ^17.x | Request body validation | FREE | `npm install joi` |
| **Alt Validation** | express-validator | ^7.x | Middleware-based validation | FREE | `npm install express-validator` |
| **Real-Time (Server)** | Socket.IO | ^4.8+ | WebSocket server for chat & notifications | FREE | `npm install socket.io` |
| **Payments** | Razorpay | ^2.x | Indian payment gateway (INR, UPI, cards) | 2% per txn | `npm install razorpay` |
| **File Upload** | Multer | ^1.x | Handle multipart file uploads | FREE | `npm install multer` |
| **Image Processing** | Sharp | ^0.33+ | Resize, compress uploaded images | FREE | `npm install sharp` |
| **Cloud Storage** | Cloudinary | Latest | Image & video hosting (25GB free) | FREE tier | `npm install cloudinary` |
| **Email** | Nodemailer | ^6.x | Send emails (verification, reset, booking confirm) | FREE | `npm install nodemailer` |
| **HTTP Client** | Axios | ^1.7+ | Call external APIs (Razorpay, AI services, n8n webhooks) | FREE | `npm install axios` |
| **Env Variables** | dotenv | ^16.x | Load .env file secrets | FREE | `npm install dotenv` |
| **IDs** | uuid | ^10.x | Generate unique identifiers | FREE | `npm install uuid` |
| **Compression** | compression | ^1.x | Gzip API responses | FREE | `npm install compression` |
| **Logging** | **winston** | ^3.x | **Structured JSON logging** (timestamp, requestId, context) | FREE | `npm install winston` |
| **Async Errors** | express-async-errors | ^3.x | Catch async errors without try-catch | FREE | `npm install express-async-errors` |
| **Dev - Auto Restart** | Nodemon | ^3.x | Auto-restart on file changes | FREE | `npm install -D nodemon` |
| **Linting** | ESLint | ^9.x | Code quality | FREE | `npm install -D eslint` |
| **Formatting** | Prettier | ^3.x | Code formatting | FREE | `npm install -D prettier` |

> **Security Layers (9)**: Cloudflare → Rate Limiter → Helmet → CORS → JWT Auth → Joi/Zod Validation → Sanitize HTML → Controller → MongoDB

## 📹 VIDEO CALLING

| Category | Tool | Cost | Why This One |
|----------|------|------|-------------|
| **Video SDK** | **@jitsi/react-sdk** | **FREE** | Open-source, no usage fees, 5-day implementation, proven reliability |
| Install | `npm install @jitsi/react-sdk` | | |
| Hosted Option | meet.jit.si (free public server) | | No self-hosting needed for demo |
| Backup Plan | Embed Google Meet links manually | FREE | If Jitsi has issues |

> **Why NOT WebRTC?** Raw WebRTC takes 22 days and requires STUN/TURN servers ($$$). Jitsi wraps WebRTC for you.  
> **Why NOT Daily.co?** Daily.co costs $0.04/min. Jitsi is completely free.

---

## 🔄 WORKFLOW AUTOMATION (n8n)

| Category | Tool | Cost | Purpose |
|----------|------|------|---------|
| **Workflow Engine** | n8n | **FREE** (self-hosted) | Offload heavy background tasks, AI processing, notifications, admin approvals from Express |
| **Local Run** | Docker | `docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n` | Access at `http://localhost:5678` |
| **Webhooks** | Express → n8n | HTTP POST | Trigger workflows: tutor verification (OCR + admin approval), async session summaries, weekly leaderboards |
| **Integrations** | Gemini AI, Gmail, Slack, Discord, Google Sheets, MongoDB | | Native nodes in n8n visual editor |

> **3 Core Workflows**: (1) Tutor Verification & Admin Approval (OCR + whitelist + Slack approve/reject), (2) Async Post-Session Summary (Gemini → Email → MongoDB), (3) Weekly Leaderboard & Volunteer Hour Reports (Cron → MongoDB → Sheets → Gemini → Gmail)

## 🤖 AI / ML FEATURES (Local-First Directive)

| Feature | Provider | Model | Cost | Install |
|---------|----------|-------|------|---------|
| **AI Tutoring Assistant (Socratic)** | Google Gemini | gemini-1.5-flash | FREE (60 req/min) | `npm install @google/generative-ai` |
| **Session Summarization** | Google Gemini | gemini-1.5-flash | FREE | Same package |
| **Sentiment Analysis (Reviews)** | **Hugging Face (Local)** | **Xenova/bert-base-uncased-finetuned-sst-2-english** | **FREE** | `npm install @xenova/transformers` |
| **Content Moderation** | OpenAI | Moderation API | FREE (~$0.002/req) | `npm install openai` |
| **Tutor Matching / Similarity** | **Local (scikit-learn / sentence-transformers)** | **all-MiniLM-L6-v2 embeddings + cosine similarity** | **FREE** | Python: `pip install scikit-learn sentence-transformers` |
| **Recommendation Engine** | **Local (PyTorch / TensorFlow.js)** | **Custom neural net / collaborative filtering** | **FREE** | `npm install @tensorflow/tfjs` or Python service |
| **Intent Detection (Chat)** | **Hugging Face (Local)** | **Xenova/bert-base-uncased (zero-shot)** | **FREE** | `npm install @xenova/transformers` |

> **🔑 LOCAL-FIRST RULE**: Build custom ML models (scikit-learn, PyTorch, sentence-transformers, Ollama) for tutor matching, similarity scoring, classification, sentiment, recommendations. **Reserve external LLM APIs (Gemini/OpenAI) ONLY for open-ended multi-step tutoring responses where local models are insufficient.**
> 
> **Why Google Gemini?** 60 free requests/minute. At $0.075 per 1M tokens, it's the cheapest LLM by far.  
> **Total AI cost estimate**: ~₹0-500/month for a college project.

## 💾 DATABASE

| Component | Tool | Details |
|-----------|------|---------|
| **Database** | MongoDB Atlas | Free tier: 512MB storage, shared cluster |
| **ODM** | Mongoose | Schema validation, middleware hooks, virtuals |
| **GUI** | MongoDB Compass | Desktop app for visual DB management |
| **Collections** | 8 total | User, Tutor, Session, Payment, Review, Message, Availability, Notification |

### Critical Indexes (Performance)

```javascript
// Tutor search - compound index for combined filters
tutorSchema.index({ subjects: 1, hourlyRate: 1, rating: -1 });

// Session queries
sessionSchema.index({ studentId: 1, status: 1 });       // "My upcoming sessions"
sessionSchema.index({ tutorId: 1, startTime: -1 });     // "Tutor's session history"

// Chat messages
messageSchema.index({ conversationId: 1, createdAt: 1 }); // Load conversation in order

// Notifications - TTL auto-delete after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Availability
availabilitySchema.index({ tutorId: 1, dayOfWeek: 1 });
```

## 🚀 DEPLOYMENT & DEVOPS

| Component | Tool | Cost | Details |
|-----------|------|------|---------|
| **Frontend Hosting** | Vercel | FREE | Auto-deploy from GitHub, instant HTTPS, CDN |
| **Backend Hosting** | Render | FREE | 750 hrs/month free, auto-deploy from GitHub |
| **Database Hosting** | MongoDB Atlas | FREE | 512MB, shared cluster, auto-backups |
| **Image CDN** | Cloudinary | FREE | 25GB storage, auto-optimization |
| **Version Control** | GitHub | FREE | Private repos, Issues, Pull Requests |
| **CI/CD** | GitHub Actions | FREE | 2000 min/month, auto-test on push |
| **Process Manager** | PM2 | FREE | Keep Node.js running in production |
| **Containerization** | **Docker** | **FREE** | `backend/Dockerfile` + `docker-compose.yml` for local dev |
| **Orchestration** | **Docker Compose** | **FREE** | Local stack: backend + mongo |
| **Structured Logging** | **Winston** | **FREE** | JSON logs with timestamp, requestId, context |
| **Secret Management** | `.env` + Platform Dashboards | FREE | Never commit `.env`; use Render/Vercel env vars |

### Docker Setup

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml (local development)
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    depends_on:
      - mongo
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
volumes:
  mongo-data:
```

### CI/CD Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [dev, main]
  pull_request:
    branches: [dev]
jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd backend && npm ci
      - run: cd backend && npm test
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
  deploy:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Auto-deploy triggered"
        # Vercel and Render auto-deploy from GitHub
```
## 🛠️ DEVELOPMENT TOOLS

| Tool | Purpose | Cost |
|------|---------|------|
| **VS Code** | Code editor | FREE |
| **Postman / Thunder Client** | API testing | FREE |
| **MongoDB Compass** | Database GUI | FREE |
| **Figma** | UI/UX wireframes | FREE (student) |
| **Git** | Version control | FREE |
| **GitHub Desktop** | Visual Git (optional) | FREE |
| **Chrome DevTools** | Browser debugging | FREE |
| **Docker Desktop** | Container management | FREE |

### Recommended VS Code Extensions

| Extension | Purpose |
|-----------|---------|
| ESLint | Inline linting |
| Prettier | Auto-format on save |
| Tailwind CSS IntelliSense | Class autocomplete |
| Thunder Client | API testing inside VS Code |
| MongoDB for VS Code | DB queries inside VS Code |
| GitLens | Git blame & history |
| ES7+ React Snippets | React boilerplate shortcuts |
| Docker | Container management |

---

## 🎨 DESIGN SYSTEM (Apple-Inspired — MANDATORY)

### Design Tokens (Law — Never Deviate)

```
Colors (CSS Variables):
  --primary:           #0066cc      /* Action Blue - ONLY interactive color */
  --primary-hover:     #0071e3      /* Hover state */
  --primary-on-dark:   #2997ff      /* Sky Link Blue - links on dark tiles */
  --background:        #ffffff / #000000  /* Light / Dark canvas */
  --surface-0:         #ffffff / #000000  /* Base layer */
  --surface-50:        #f5f5f7 / #0a0a0a  /* Elevated cards, sidebar (parchment) */
  --surface-100:       #fafafc / #111111  /* Raised panels */
  --surface-200:       #e5e5e7 / #1a1a1a  /* Inputs, hover troughs */
  --foreground:        #1d1d1f / #ffffff  /* Primary body text */
  --text-secondary:    #7a7a7a / #a3a3a3  /* Descriptions, secondary labels */
  --text-muted:        #86868b / #525252  /* Captions, placeholders, disabled */
  --border:            rgba(0,0,0,0.12) / rgba(255,255,255,0.12)
  --border-subtle:     rgba(0,0,0,0.06) / rgba(255,255,255,0.06)
  --destructive:       #ff3b30
  --success:           #34c759
  --warning:           #ff9500

Typography:
  Display Hero   → Outfit / SF Pro Display, 700, -0.03em tracking
  Heading 1-3    → Outfit, 600, -0.02em tracking
  Body / Subtitle → Inter / SF Pro Text, 400/500, normal (17px base — NOT 16px)
  Overline/Label → Inter, 600, 0.08em tracking (uppercase tags)

Spacing Grid: 4px base (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px)
Radius Scale:
  --radius-sm:  8px   (Inputs, chips, badges)
  --radius-md:  12px  (Buttons, dropdowns, tooltips)
  --radius-lg:  16px  (Standard cards, dialog bodies)
  --radius-xl:  20px  (Hero panels, feature containers)
  --radius-full: 9999px (Avatars, pills, circular HUDs)
```

### Component Contracts (Enforced)

| Component | Spec |
|-----------|------|
| **Navbar** | Fixed top, h-16 (64px), z-50, backdrop-blur(16px), border-bottom 1px var(--border) |
| **Primary Button** | h-40px, px-20px, rounded-md, var(--primary) bg, white text, transition 150ms cubic-bezier(0.4,0,0.2,1), hover: var(--primary-hover), active: scale(0.98) |
| **Glass Card** | var(--glass-bg), border var(--border), rounded-lg, backdrop-blur(20px), hover: border var(--border-strong) + shadow 0 8px 32px rgba(0,0,0,0.12) |
| **Shadow Philosophy** | **ONE shadow only**: `rgba(0,0,0,0.22) 3px 5px 30px` on product imagery. NEVER on cards, buttons, text. |

### Zero-Tolerance Violations

| Violation | Reason |
|-----------|--------|
| Raw Emoji Icons | Destroys premium aesthetic. Use `lucide-react`. |
| Unnecessary Cloud API Calls | Wastes rate limits/costs. Build local ML for scoring/indexing. |
| Layout Thrashing Hover | Animating `width`/`height`/`margin` causes jank. Use `transform`/`opacity` only. |
| Hardcoded Color Hexes | Breaks light/dark theme. Use CSS variable tokens. |
| Untyped JavaScript / `any` | Violates production TypeScript standards. |

---

## 📦 FULL INSTALL COMMANDS

### Frontend (one shot)
```bash
# Scaffold
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Core dependencies
npm install react-router-dom axios @tanstack/react-query react-hook-form zod @hookform/resolvers zustand socket.io-client framer-motion date-fns sonner lucide-react clsx @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @xenova/transformers

# Dev dependencies
npm install -D tailwindcss @tailwindcss/vite eslint prettier
```

### Backend (one shot)
```bash
mkdir backend && cd backend
npm init -y

# Core dependencies
npm install express cors helmet mongoose dotenv jsonwebtoken bcrypt nodemailer socket.io razorpay cloudinary axios multer sharp uuid joi express-validator express-async-errors compression express-rate-limit sanitize-html winston

# AI dependencies
npm install @google/generative-ai openai @xenova/transformers

# Dev dependencies
npm install -D nodemon eslint prettier
```

### AI Microservice (Python/FastAPI — Local ML First)
```bash
mkdir ai-service && cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn scikit-learn sentence-transformers torch transformers pydantic python-dotenv httpx
# Optional: ollama for local LLMs
```

### n8n (Workflow Automation)
```bash
# Run via Docker (no install needed)
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
# Access at http://localhost:5678
```

---

## 💰 TOTAL COST BREAKDOWN

| Item | Monthly Cost |
|------|-------------|
| MongoDB Atlas (free tier) | ₹0 |
| Vercel (free tier) | ₹0 |
| Render (free tier) | ₹0 |
| Cloudinary (free tier) | ₹0 |
| Jitsi Meet (public server) | ₹0 |
| Google Gemini API (free tier) | ₹0 |
| GitHub (free tier) | ₹0 |
| Razorpay (test mode) | ₹0 |
| n8n (self-hosted Docker) | ₹0 |
| Domain name (optional) | ~₹500/year |
| **TOTAL** | **₹0** (for development & demo) |

---

## 📊 STACK SUMMARY DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19 + Vite 6)                 │
│  Tailwind v4 │ Zustand │ React Router │ Framer Motion          │
│  Socket.IO Client │ FullCalendar │ React Hook Form             │
│  lucide-react │ TanStack Query │ @xenova/transformers (local)  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Axios + TanStack Query
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js 20 + Express.js)                  │
│  JWT+bcrypt │ Helmet │ CORS │ Rate-Limit │ Multer │ Nodemailer  │
│  Razorpay │ Socket.IO │ Mongoose │ Joi │ Winston │ Compression  │
│  express-async-errors │ Cloudinary │ sanitize-html             │
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

---

**Total Libraries: ~55 packages** (Frontend ~25, Backend ~25, AI Service ~10)  
**Estimated Install Size: ~500MB**  
**Setup Time: ~1.5 hours** (includes Docker, n8n, AI service)  
**All FREE for development & demo ✅**
