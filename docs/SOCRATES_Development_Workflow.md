# SOCRATES: Project Development Workflow
## Step-by-Step — How to Build This Project From Zero to Deployed

---

## 🔄 THE BIG PICTURE (5 Phases)

```
Phase 0          Phase 1           Phase 2            Phase 3           Phase 4           Phase 5
SETUP &      →   AUTH &        →   SEARCH, BOOK   →  REAL-TIME      →  AI &          →  POLISH &
DESIGN            PROFILES          & PAY              FEATURES          ADMIN             DEPLOY
(2 weeks)        (3 weeks)         (3 weeks)          (3 weeks)         (3 weeks)         (2 weeks)
```

> **Golden Rule**: Each phase builds on the previous one. Never jump ahead.
> **Backend First → Test → Frontend → Connect** — for EVERY feature.

---

## PHASE 0 — SETUP & DESIGN (Week 1-2)

> **Goal**: Nobody writes feature code yet. Only setup, planning, design, and infrastructure.

### Step 1: Environment Setup (Day 1)
```
Everyone installs:
  → Node.js 20 LTS
  → Python 3.11
  → VS Code + Extensions (ESLint, Prettier, Tailwind IntelliSense, Docker)
  → Git
  → Postman (or Thunder Client)
  → MongoDB Compass
  → Docker Desktop
```

### Step 2: Project Scaffold (Day 1-2)
```
Member 4 does:
  → Create GitHub repo (private)
  → Set up branch rules (main → dev → feature branches)
  → Scaffold frontend (Vite + React + TypeScript)
  → Scaffold backend (Express + Mongoose)
  → Scaffold AI service (FastAPI + Uvicorn)
  → Install ALL dependencies (from Final Tech Stack doc)
  → Create .env.example files (frontend, backend, ai-service)
  → Create .gitignore
  → Push initial commit
   
Everyone else:
  → Clone the repo
  → Run npm install in frontend/ and backend/
  → Run pip install in ai-service/
  → Verify all three servers start (frontend :5173, backend :5000, ai-service :8001)
```

### Step 3: Infrastructure Setup (Day 2-3)
```
Member 4 does:
  → Write backend/Dockerfile + docker-compose.yml (backend + mongo)
  → Write ai-service/Dockerfile + add to docker-compose.yml
  → Set up GitHub Actions CI/CD (test-backend, test-frontend, test-ai, deploy)
  → Configure n8n via Docker (docker run -p 5678:5678 n8nio/n8n)
  → Set up MongoDB Atlas free cluster
  → Connect backend to Atlas
  → Verify connection works
  → Set up Cloudinary account
  → Set up Razorpay test account
  → Set up Google Gemini API key
```

### Step 4: Database Design (Day 3-4)
```
Member 3 + Member 4 do:
  → Design all 8 MongoDB collections (schemas, relationships, indexes)
  → Add critical compound indexes (tutor search, sessions, chat, notifications TTL)
  → Create docs/database-schema.md
  → Verify indexes with explain()
```

### Step 5: API Contract (Day 4-5)
```
Member 3 does:
  → List EVERY endpoint the project needs (REST + Socket.IO events)
  → Define request body + response shape for each (Zod schemas)
  → Create docs/api-contract.md
  → Share with Members 1 & 2 so they know what data they'll receive
```

### Step 6: UI Wireframes (Day 1-7)
```
Member 1 + Member 2 do (in Figma):
  → Home / Landing page (product-tile-light + alternating dark/parchment tiles)
  → Login & Register (form-input-field, button-primary)
  → Tutor Search (search-input, configurator-option-chip sidebar, store-utility-card grid)
  → Tutor Profile page (sub-nav-frosted, calendar-scheduler-genius, appstore-review-card)
  → Session Booking (calendar, Razorpay checkout)
  → Student Dashboard (store-utility-card metrics, sidebar nav)
  → Tutor Dashboard (earnings chart, availability calendar)
  → Chat page (imessage-bubble-inbound/outbound, search-input message bar)
  → Video Call page (facetime-video-grid, facetime-control-dock)
  → Admin Panel (users table, tutor approval queue)

  These are rough wireframes, NOT pixel-perfect designs.
  Just boxes and labels showing what goes where.
  Reference DESIGN-apple.md component contracts exactly.
```

### Step 7: Design System (Day 5-7)
```
Member 1 does:
  → Set up Tailwind config with project colors, fonts, spacing (from DESIGN-apple.md tokens)
  → Build reusable components: Button (btn-primary), Input (form-input-field), Card (glass-card), Modal, Loader
  → Build layout: Navbar (global-nav + sub-nav-frosted), Footer, page wrapper
  → Set up React Router with placeholder pages
  → Configure @xenova/transformers for browser sentiment/intent
  → Verify design token compliance (no hardcoded hex, no raw emojis, lucide-react only)
```

### ✅ Phase 0 Checkpoint
```
Before moving on, verify:
  ☐ All three servers run without errors (frontend :5173, backend :5000, ai-service :8001)
  ☐ Backend connects to MongoDB Atlas
  ☐ Docker compose starts backend + mongo + ai-service
  ☐ GitHub Actions CI/CD passes (lint, build, test)
  ☐ n8n accessible at localhost:5678
  ☐ All wireframes exist (even if rough)
  ☐ API contract doc is written
  ☐ Shared components (Button, Input, Card, Modal, Loader) exist
  ☐ Design tokens from DESIGN-apple.md enforced (CSS variables only)
  ☐ React Router shows all placeholder pages
  ☐ Everyone can pull, branch, and push to GitHub
```

---

## PHASE 1 — AUTHENTICATION & PROFILES (Week 3-5)

> **Goal**: A user can register, login, see their profile, and edit it.

### The Workflow (This Pattern Repeats for Every Feature)

```
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────┐
  │  1. BACKEND  │ →   │  2. TEST    │ →   │ 3. FRONTEND │ →   │ 4. CONNECT   │
  │  Build API   │     │  with       │     │  Build UI   │     │  Frontend to │
  │  endpoint    │     │  Postman    │     │  page       │     │  Backend API │
  └─────────────┘     └─────────────┘     └─────────────┘     └──────────────┘
      Member 3              Member 3           Member 1/2          Both meet
```

> **THIS IS THE MOST IMPORTANT PATTERN.** Backend first → test it → then frontend → then connect. Never build frontend and backend separately and hope they'll connect later.

### Step-by-Step for Auth

```
Week 3:
  Member 3: Build POST /api/auth/register
     → Hash password with bcrypt
     → Save user to MongoDB
     → Return JWT token
     → Test with Postman ✓
   
  Member 3: Build POST /api/auth/login
     → Find user by email
     → Compare password with bcrypt
     → Return JWT token
     → Test with Postman ✓

  Member 3: Build GET /api/auth/me (protected route)
     → Verify JWT token from header
     → Return user data
     → Test with Postman ✓

  Member 4: Set up Winston logger (structured JSON, requestId, context)
     → Add to all controllers
     → Test: logger.info('User registered', { userId, role })

  Member 1: Build Register page UI
     → Form with name, email, password, role selector (form-input-field, button-primary)
     → Validation with React Hook Form + Zod
     → Connect to POST /api/auth/register
     → On success → redirect to dashboard

  Member 1: Build Login page UI
     → Form with email, password
     → Connect to POST /api/auth/login
     → Save token to localStorage (Zustand store)
     → On success → redirect to dashboard

  Member 2: Build auth state management
     → Zustand store (login, logout, isAuthenticated, user)
     → Protected route component (redirect to /login if not logged in)
     → Navbar (global-nav + sub-nav-frosted) shows Login/Register OR user name + Logout

Week 4:
  Member 3: Build password reset APIs
     → POST /api/auth/forgot-password (send email via Nodemailer)
     → POST /api/auth/reset-password/:token
   
  Member 4: Set up Nodemailer
     → Configure Gmail App Password
     → Build sendEmail utility function
     → Test: send a verification email ✓

  Member 3: Build Tutor Profile APIs
     → POST /api/tutors (create profile)
     → GET /api/tutors/:id (get profile)
     → PUT /api/tutors/:id (update profile)
     → GET /api/tutors (search with filters - for later)

  Member 4: Set up Cloudinary
     → Configure upload middleware (Multer + Cloudinary + Sharp)
     → POST /api/upload (upload profile photo)
     → Returns Cloudinary URL ✓

Week 5:
  Member 1: Build Tutor Profile page
     → Display: photo, name, subjects, bio, rate, rating (product-tile-light, appstore-review-card)
     → Edit mode (if viewing own profile)
     → Photo upload button (Cloudinary)
     → Connect to all tutor APIs

  EVERYONE: Test the full flow together
     → Register as student ✓
     → Register as tutor ✓
     → Login ✓
     → View profile ✓
     → Edit profile + upload photo ✓
     → Logout ✓
```

### ✅ Phase 1 Checkpoint
```
  ☐ Can register as student and tutor
  ☐ Can login and see "Welcome, [name]" in navbar
  ☐ Can view and edit tutor profile
  ☐ Can upload profile photo (Cloudinary)
  ☐ Password reset email sends
  ☐ Protected routes redirect to login
  ☐ Winston logs show structured JSON with requestId
```

---

## PHASE 2 — SEARCH, BOOKING & PAYMENTS (Week 6-8)

> **Goal**: A student can find a tutor, book a session, and pay for it.

```
Week 6: SEARCH
  Member 3 → Build GET /api/tutors/search?subject=&price=&rating=&page=
     → Compound index: { subjects: 1, hourlyRate: 1, rating: -1 }
     → Pagination (never fetch all)
  Member 3 → Test with Postman (verify filters work, pagination works, explain() shows index usage)
  Member 1 → Build Search page (search-input, configurator-option-chip sidebar, store-utility-card grid)
  Member 1 → Connect search UI to API (TanStack Query)
  Member 1 → Build Home/Landing page (product-tile-light hero, alternating dark/parchment tiles)

Week 7: AVAILABILITY & BOOKING (Backend)
  Member 3 → Build availability CRUD APIs (tutor sets available time slots)
  Member 3 → Build session booking API (student books a slot)
      → Check: is the slot available?
      → Check: no double-booking (unique index on tutorId + startTime + status)
      → Create session with status "booked"
  Member 3 → Build cancel/reschedule APIs
  Member 4 → Set up Razorpay (test mode)
      → Create order API (amount in paise, currency INR)
      → Verify payment API (signature verification)
      → Webhook handler (payment.captured, payment.failed)

Week 8: BOOKING & PAYMENT (Frontend)
  Member 1 → Build Booking page
      → Calendar-scheduler-genius showing tutor's available slots
      → Select date + time → confirm booking
      → Razorpay checkout button (redirect to Razorpay)
      → Confirmation page after payment (poll payment status)
  Member 2 → Build Student Dashboard (basic)
      → Upcoming sessions list
      → Payment history
  Member 2 → Build Tutor Dashboard (basic)
      → Booking requests
      → Earnings summary
      → Availability manager (add/remove time slots)
```

### ✅ Phase 2 Checkpoint
```
  ☐ Search with filters returns correct results (uses compound index)
  ☐ Tutor can set available time slots
  ☐ Student can book a session
  ☐ Razorpay payment works (test mode)
  ☐ Booked session shows in student dashboard
  ☐ Booked session shows in tutor dashboard
  ☐ Can cancel a session
```

---

## PHASE 3 — REAL-TIME FEATURES (Week 9-11)

> **Goal**: Chat, video calls, notifications — the "live" features.

```
Week 9: SOCKET.IO SETUP + CHAT BACKEND
  Member 4 → Set up Socket.IO server
      → User connects → joins their room (userId)
      → send-message event → save to DB → emit to recipient
      → typing indicator event
      → online/offline status tracking (heartbeat)
      → Reconnection logic with exponential backoff
  Member 3 → Build chat REST APIs
      → GET /api/chat/conversations (list all chats, pagination)
      → GET /api/chat/messages/:conversationId (message history)

Week 10: CHAT FRONTEND + JITSI
  Member 2 → Build Chat page
      → Conversation list (left sidebar, canvas-parchment, hairline borders)
      → Message bubbles (imessage-bubble-inbound/outbound, avatar)
      → Message input (search-input wrapper, full width)
      → Typing indicator ("User is typing...")
      → Online/offline dot on avatar
      → Auto-scroll to latest message
      → Connect to Socket.IO events
  Member 4 → Set up Jitsi room management
      → Generate unique room IDs per session (sessionId based)
      → API to get room details (roomName, config)
  Member 2 → Build Video Call page
      → Embed Jitsi Meet using @jitsi/react-sdk
      → Controls: mute audio, mute video, share screen, leave call (facetime-control-dock)
      → "Join Session" button on dashboard → opens video room

Week 11: NOTIFICATIONS + REVIEWS + N8N
  Member 2 → Build notification UI
      → Bell icon in navbar with unread count
      → Dropdown showing recent notifications
      → Toast popups (push-notification-toast) for real-time notifications
  Member 3 → Build review APIs (create, read, update, delete)
      → POST /api/reviews (after session completed)
      → GET /api/tutors/:id/reviews
      → OpenAI Moderation API integration
  Member 1 → Build review UI (star rating + comment form, appstore-review-card on tutor profile)
  Member 4 → Deploy n8n workflows (import JSON, configure webhooks)
      → Workflow 1: Tutor Verification (OCR + Slack approve/reject)
      → Workflow 2: Async Session Summary (Gemini → Email → MongoDB)
      → Workflow 3: Weekly Leaderboard (Cron → Sheets → Gemini → Gmail)
  Member 3 → Add n8n webhook triggers to backend
      → Tutor registration → axios.post(N8N_WEBHOOK_VERIFY_TUTOR)
      → Session end → axios.post(N8N_WEBHOOK_SUMMARY)
```

### ✅ Phase 3 Checkpoint
```
  ☐ Can send and receive chat messages in real-time
  ☐ Typing indicator works
  ☐ Online/offline status shows
  ☐ Can join a Jitsi video call from dashboard
  ☐ Video, audio, screen share, and leave all work
  ☐ Notifications appear in real-time (bell + toast)
  ☐ Can leave a review after a session
  ☐ n8n workflows trigger correctly (check n8n UI executions)
```

---

## PHASE 4 — AI FEATURES & ADMIN PANEL (Week 12-14)

> **Goal**: Add the "smart" features that make your project stand out + admin controls.

```
Week 12: AI SERVICE DEPLOYMENT + LOCAL ML MODELS
  Member 4 → Deploy AI Service (FastAPI on Render/Docker)
      → sentence-transformers (all-MiniLM-L6-v2) for embeddings
      → scikit-learn (RandomForest, NearestNeighbors) for matching/recommendations
      → @xenova/transformers (BERT) for sentiment/intent (or Python transformers)
      → XGBoost for performance prediction
      → OR-Tools for schedule optimization
      → Health endpoint + structured logging (Winston-compatible)
  Member 3 → Build backend AI proxy endpoints
      → POST /api/ai/match-tutors → forwards to AI service
      → POST /api/ai/recommend-tutors
      → POST /api/ai/analyze-sentiment
      → POST /api/ai/detect-intent
      → POST /api/ai/predict-performance
      → POST /api/ai/optimize-schedule
  Member 2 → Build AI Chat panel (floating "Ask AI" button on dashboard)
      → Chat-like interface (student types, AI responds)
      → Loading animation while AI thinks (Framer Motion)
      → @xenova/transformers for client-side sentiment/intent (instant feedback)
  Member 2 → Build session summary display
      → After session ends → n8n triggers Gemini summary → show in session details

Week 13: GEMINI INTEGRATION + ADMIN PANEL
  Member 3 → Build Gemini endpoints (external LLM only)
      → POST /api/ai/socratic (Socratic tutoring assistant)
      → POST /api/ai/summarize (session transcript → markdown)
      → POST /api/ai/lesson-prep (student history → tutor lesson plan)
      → POST /api/ai/moderate (review text → APPROVED/REJECTED)
  Member 2 → Enhance AI Chat panel with Socratic mode
      → Toggle: Local intent detection → Gemini Socratic responses
  Member 1 → Build Admin Panel UI
      → Users table with search + block/unblock buttons
      → Tutor approval queue (shows n8n verification status)
      → Dashboard with stats cards (total users, sessions, revenue)
      → Payment records table
      → System health (AI service, n8n, DB status)

Week 14: DASHBOARD ENHANCEMENTS + AI INSIGHTS
  Member 2 → Enhance Student Dashboard
      → Favorite tutors list
      → Session history with AI summaries
      → Quick re-book button
      → Smart tutor recommendations (from AI service)
  Member 2 → Enhance Tutor Dashboard
      → Earnings chart (Recharts)
      → Student list
      → Availability calendar (FullCalendar)
      → Performance metrics (avg rating, response time)
      → AI Lesson Prep (view Gemini-generated plan before session)
```

### ✅ Phase 4 Checkpoint
```
  ☐ AI Service deployed and healthy (FastAPI /health returns 200)
  ☐ Local ML: Tutor matching (embeddings) returns relevant results
  ☐ Local ML: Recommendations (hybrid CF + content) work
  ☐ Local ML: Sentiment analysis (browser + server) accurate
  ☐ Local ML: Intent detection (zero-shot) classifies correctly
  ☐ Local ML: Performance prediction returns confidence score
  ☐ Local ML: Schedule optimization finds valid slots
  ☐ Socratic AI Assistant (Gemini) answers with guiding questions
  ☐ Session summaries generate automatically (n8n + Gemini)
  ☐ Lesson prep generates for tutors 30min before session
  ☐ Inappropriate reviews get flagged (OpenAI Moderation)
  ☐ Admin can view all users, block/unblock, approve tutors
  ☐ Admin sees platform stats + system health
  ☐ Dashboards look polished with charts + AI insights
```

---

## PHASE 5 — POLISH, TEST & DEPLOY (Week 15-16)

> **Goal**: Make everything production-ready, test thoroughly, deploy, prepare presentation.

```
Week 15: RESPONSIVE DESIGN + PERFORMANCE + SECURITY
  Member 1 → Test every page on mobile, tablet, desktop
      → Fix any broken layouts (Tailwind responsive utilities)
      → Add loading skeletons / spinners (Framer Motion)
  Member 2 → Add page transitions (Framer Motion AnimatePresence)
      → Add micro-animations (button hover: scale(0.98), card hover: shadow)
  Member 1 + 2 → Lazy load images, code-split routes (React.lazy + Suspense)
      → Run Lighthouse audit → target 85+ score
  Member 3 → Write backend tests (Jest + Supertest)
      → Test all auth endpoints
      → Test booking flow (search → book → pay → confirm)
      → Test payment verification (Razorpay webhook)
      → Test AI proxy endpoints
  Member 3 → Security hardening
      → Helmet headers (verify with securityheaders.com)
      → Rate limiting on auth routes (100 req/15min)
      → Input sanitization on all user input (sanitize-html)
      → JWT token rotation (refresh token pattern)
  Member 4 → MongoDB index optimization
      → Verify all critical indexes exist (explain() on slow queries)
      → Test query performance under load
  Member 4 → Docker + CI/CD verification
      → docker-compose up → all services healthy
      → GitHub Actions: test-backend, test-frontend, test-ai all pass
      → Deploy to Vercel (FE) + Render (BE) from main branch

Week 16: DEPLOYMENT + DEMO PREP
  Member 4 → Deploy frontend to Vercel
      → Connect GitHub repo
      → Set environment variables (production URLs)
      → Verify live URL works
  Member 4 → Deploy backend to Render
      → Connect GitHub repo
      → Set environment variables
      → Verify API responds (/health)
  Member 4 → Deploy AI Service to Render (or same as backend)
      → Set environment variables (Gemini key, MongoDB URI)
      → Verify /health endpoint
  Member 4 → Verify MongoDB Atlas whitelist includes Render IPs
  Member 4 → Seed database with realistic demo data
      → 10-15 tutor profiles with photos (Cloudinary)
      → 5-10 student accounts
      → Sample bookings (completed + upcoming), reviews, chat messages
      → Tutor embeddings pre-computed for AI matching demo
  EVERYONE → Test the deployed version end-to-end
      → Register → Search → Book → Pay → Chat → Video Call → AI Assistant → Admin Panel
  EVERYONE → Record 5-minute demo video
      → Show: register → search → book → pay → chat → video call → AI assistant → admin panel
  EVERYONE → Create presentation slides (15-20 slides)
      → Problem statement
      → Solution overview
      → Tech stack (MERN + FastAPI + n8n + Local ML)
      → Architecture diagram (with n8n, AI service, Jitsi)
      → Feature demo screenshots
      → AI features highlight (Local-First + Gemini)
      → Challenges faced (Jitsi, Local ML, n8n)
      → Future scope (Redis cache, BullMQ, AWS migration, Terraform)
  EVERYONE → Write/update README.md
      → Setup guide (Docker, n8n, AI service)
      → API contract link
      → Design system reference (DESIGN-apple.md)
```

### ✅ Phase 5 Checkpoint (FINAL)
```
  ☐ Live URL works (frontend + backend + AI service)
  ☐ Demo data is seeded (tutors, students, bookings, reviews, chats)
  ☐ All core features work on deployed version
  ☐ Mobile responsive (no horizontal scroll, touch targets 44px)
  ☐ Lighthouse score 85+ (Performance, Accessibility, Best Practices, SEO)
  ☐ Demo video recorded (5 min, all features)
  ☐ Presentation slides ready (15-20 slides)
  ☐ README is complete (setup, architecture, API, design)
  ☐ GitHub Actions CI/CD passes on main
  ☐ DONE 🎉
```

---

## 🔁 DAILY WORKFLOW FOR ANY FEATURE

Every single feature follows this same loop:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   1. Backend dev creates the API endpoint                │
│              ↓                                           │
│   2. Backend dev tests it with Postman                   │
│              ↓                                           │
│   3. Backend dev tells frontend dev:                     │
│      "POST /api/sessions — send { tutorId, date, time }  │
│       returns { session, paymentUrl }"                   │
│              ↓                                           │
│   4. Frontend dev builds the UI page                     │
│              ↓                                           │
│   5. Frontend dev connects UI to the API using Axios     │
│              ↓                                           │
│   6. Both test together — does the full flow work?       │
│              ↓                                           │
│   7. Create Pull Request → Code Review → Merge to dev   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 📅 WEEKLY TEAM SYNC (Every Sunday, 30 minutes)

```
Each person answers 3 questions:

  1. What did I finish this week?
  2. What am I doing next week?
  3. Am I stuck on anything?

Then:
  → Demo what you built (screen share)
  → Merge all feature branches into dev
  → Test dev branch together
  → Plan next week's tasks
```

---

## ⚡ QUICK REFERENCE: Who Does What When

```
          Week:  1-2      3-5        6-8         9-11       12-14      15-16
               SETUP     AUTH      BOOKING     REALTIME     AI        DEPLOY

Member 1:    Figma     Login     Search      Reviews     Admin      Responsive
             Design    Signup    Home        Review UI   Panel      Testing
             System    Profile   Booking UI             UI         

Member 2:    Figma     Auth      Dashboard   Chat UI     AI Chat    Animations
             Wireframe Store     (basic)     Video UI    Summary    Performance
                         Routes             Notif UI    Dash+      

Member 3:    DB        Auth      Search      Chat API    AI API     Tests
             Schema    APIs      Booking     Notif API   Admin      Security
             API Doc   Profile   Session     Review      APIs       
                         APIs      APIs        APIs                 

Member 4:    GitHub    Email     Razorpay    Socket.IO   AI Svc     Deploy
             Atlas     Cloud-    Payment     Jitsi       n8n        Seed Data
             Docker    inary     APIs        n8n         Local ML   CI/CD
             CI/CD     n8n       Docker                           Winston
```

---

**Follow this workflow and you'll ship on time. No shortcuts, no skipping phases.** 🚀