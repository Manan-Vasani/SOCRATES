# SOCRATES: Online Tutoring Marketplace - 4 Person SGP Breakdown

## ✅ PROJECT SUITABILITY FOR 4-PERSON TEAM

| Criteria | Score | Status |
|----------|-------|--------|
| Innovation | 9/10 | ✅ Excellent |
| Complexity | 10/10 | ✅ Perfect for 4-5 members |
| Industry Relevance | 10/10 | ✅ Real-world use case |
| Learning Opportunity | 10/10 | ✅ Full-stack + DevOps + ML |
| Presentation Impact | 10/10 | ✅ Impressive demo |
| SGP Suitability (4 members) | 10/10 | ✅ Ideal fit |

---

## 👥 RECOMMENDED TEAM STRUCTURE (4 PEOPLE)

### **Member 1: Frontend Developer (UI/UX & Landing)**
**Time Allocation:** 4-5 months

**Responsibilities:**
- Home Page & Landing Page (Apple-style product tiles)
- Tutor Search & Filter UI (split-screen, sidebar filters)
- Tutor Profile Pages (sticky sub-nav, scheduler, reviews)
- Session Booking UI (calendar, Razorpay checkout)
- Responsive Design (Mobile/Tablet/Desktop)

**Features to Build:**
- Homepage with hero tile + alternating dark/parchment tiles
- Advanced filter options (subject, price, rating, availability chips)
- Tutor profile cards with ratings/reviews (store-utility-card)
- Booking calendar interface (calendar-scheduler-genius)
- Payment checkout UI (Razorpay)

**Libraries/Tools:**
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- React Router v7
- Axios + TanStack Query
- **lucide-react** (MANDATORY - zero raw emojis)
- Framer Motion
- FullCalendar
- @xenova/transformers (browser sentiment/intent)

**Time Breakdown:**
- Setup & Design System (per DESIGN-apple.md): 3 days
- Home & Search Page: 8 days
- Tutor Profiles: 6 days
- Booking UI: 7 days
- Responsive Design & Testing: 6 days
- **Total: ~30 days**

---

### **Member 2: Frontend Developer (Dashboards & Real-time)**
**Time Allocation:** 4-5 months

**Responsibilities:**
- Student Dashboard (upcoming sessions, payment history, favorites, AI summaries)
- Tutor Dashboard (earnings, bookings, student management, availability calendar)
- Real-time Chat UI (iMessage-style bubbles, typing indicators)
- Video Call Page (Jitsi embed, controls)
- Notifications UI (toast, bell dropdown)
- AI Chat Panel (floating Socratic assistant)

**Features to Build:**
- Student dashboard with session history + AI summaries
- Tutor dashboard with earnings chart + availability manager
- FullCalendar integration for session scheduling
- Chat interface with Socket.IO (imessage-bubble components)
- Session history pages
- Notification system (push-notification-toast)

**Libraries/Tools:**
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Socket.IO Client
- FullCalendar
- Axios + TanStack Query
- Framer Motion
- @jitsi/react-sdk
- @xenova/transformers
- Recharts (earnings charts)

**Time Breakdown:**
- Student Dashboard: 8 days
- Tutor Dashboard: 8 days
- Calendar Integration: 6 days
- Chat UI: 5 days
- Video Call UI: 4 days
- Notifications: 3 days
- AI Chat Panel: 3 days
- **Total: ~37 days**

---

### **Member 3: Backend Developer (Core APIs & Auth)**
**Time Allocation:** 4-5 months

**Responsibilities:**
- Authentication & Authorization (JWT, bcrypt, roles)
- User Management APIs (register, profile, password reset)
- Tutor Profile APIs (CRUD, verification status)
- Booking/Session Management APIs (CRUD, conflict prevention)
- Search & Filter APIs (compound indexes, pagination)
- Review & Rating APIs
- Admin Panel Backend (user management, tutor approval, stats)
- Notification System (DB + Socket.IO push)

**Features to Build:**
- User registration & login (Student/Tutor/Admin roles)
- Password reset + email verification (Nodemailer)
- Role-based access control
- Tutor profile management (Cloudinary uploads)
- Session booking/cancellation/rescheduling
- Search API with filters (subject, price, rating)
- Review system (create, read, moderate)
- Admin endpoints (block users, approve tutors, platform stats)

**Tech Stack:**
- Node.js 20 + Express.js (CommonJS)
- MongoDB + Mongoose
- JWT + bcrypt
- Nodemailer (Gmail App Password)
- Cloudinary (Multer + Sharp)
- Joi / express-validator
- express-async-errors
- Winston (structured JSON logging)
- Helmet, CORS, express-rate-limit, sanitize-html

**Time Breakdown:**
- Authentication & JWT: 5 days
- User Management APIs: 4 days
- Tutor Profile APIs: 3 days
- Booking APIs (CRUD): 6 days
- Search & Filter APIs: 4 days
- Review APIs: 3 days
- Admin APIs: 4 days
- Notifications: 3 days
- Testing & Debugging: 4 days
- **Total: ~36 days**

---

### **Member 4: Backend + DevOps + AI/ML (Database, Real-time, Infrastructure, Local ML)**
**Time Allocation:** 4-5 months

**Responsibilities:**
- Database Design & Management (MongoDB schemas, indexes, optimization)
- Payment Integration (Razorpay: orders, verify, webhooks, payouts)
- Real-time Communication (Socket.IO server, rooms, presence)
- Video Calling Backend (Jitsi room management)
- AI Microservice (Python FastAPI + Local ML models)
- n8n Workflow Automation (3 core workflows)
- Deployment & DevOps (Docker, CI/CD, Vercel, Render)
- Monitoring & Logging (Winston, health checks)

**Features to Build:**
- MongoDB collections (8) + critical compound indexes
- Razorpay integration (test → production)
- Socket.IO: chat, typing, presence, notifications
- Jitsi room generation + session mapping
- **AI Service (Python FastAPI):**
  - Tutor matching (sentence-transformers embeddings)
  - Recommendations (hybrid CF + content-based)
  - Sentiment analysis (Xenova BERT)
  - Intent detection (zero-shot)
  - Performance prediction (RandomForest)
  - Schedule optimization (OR-Tools)
- **n8n Workflows:**
  - Tutor verification (OCR + admin approval)
  - Async session summaries (Gemini → Email → MongoDB)
  - Weekly leaderboard (Cron → Sheets → Gemini → Gmail)
- Docker + docker-compose (local stack)
- GitHub Actions CI/CD (test + deploy)
- Vercel (FE) + Render (BE) deployment
- MongoDB Atlas + Cloudinary configuration
- Seed script for demo data

**Tech Stack:**
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- Socket.IO
- Razorpay API
- @jitsi/react-sdk (backend room management)
- **Python 3.11 + FastAPI + Uvicorn**
- **sentence-transformers, scikit-learn, XGBoost, OR-Tools, transformers**
- **n8n (Docker)**
- Docker + Docker Compose
- GitHub Actions
- Winston (JSON logging)
- PM2 (production process manager)
- Vercel + Render

**Time Breakdown:**
- Database Design & Indexes: 4 days
- Razorpay Integration: 5 days
- Socket.IO Setup: 4 days
- Jitsi Room Management: 3 days
- **AI Service Development: 10 days**
- **n8n Workflows: 4 days**
- Docker + CI/CD: 4 days
- Deployment (Vercel/Render): 3 days
- Admin Dashboard Backend: 3 days
- Monitoring/Logging/Seed: 3 days
- Testing & Optimization: 4 days
- **Total: ~47 days**

---

## 📋 COMPLETE FEATURE BREAKDOWN WITH TIME ESTIMATES

### **Phase 1: Foundation (Weeks 1-3)**

#### Feature 1: Authentication System
- **Time:** 4-5 days
- **Includes:** Registration (Student/Tutor/Admin), JWT login, password reset email, email verification, session management
- **Team:** Member 3 (Backend)
- **Status:** Critical Path

#### Feature 2: Tutor Profiles
- **Time:** 4 days (FE) + 2 days (BE) = 6 days
- **Includes:** Info (name, photo, bio), subjects, experience, hourly rate, rating, edit profile, photo upload (Cloudinary)
- **Team:** Member 1 (FE) + Member 3 (BE)
- **Status:** Critical Path

#### Feature 3: Search & Filters
- **Time:** 3 days (FE) + 4 days (BE) = 7 days
- **Includes:** Search by subject/keyword, filter by price/rating/experience, pagination, autocomplete, compound index optimization
- **Team:** Member 1 (FE) + Member 3 (BE)
- **Status:** Critical Path

---

### **Phase 2: Core Booking System (Weeks 4-6)**

#### Feature 4: Session Booking System
- **Time:** 5 days (FE) + 6 days (BE) = 11 days
- **Includes:** Available slots, book/cancel/reschedule, booking confirmation, payment before booking, conflict prevention
- **Team:** Member 1 & 2 (FE) + Member 3 & 4 (BE)
- **Status:** Critical Path

#### Feature 5: Calendar Scheduling
- **Time:** 4 days (FE) + 3 days (BE) = 7 days
- **Includes:** Student calendar, tutor availability manager, slot creation, FullCalendar integration, conflict prevention
- **Team:** Member 2 (FE) + Member 4 (BE)
- **Status:** Critical Path

#### Feature 6: Payment System (Razorpay)
- **Time:** 4 days
- **Includes:** Razorpay order creation, payment verification, webhook handling, payment history, refund logic, invoices
- **Team:** Member 4 (BE)
- **Status:** Critical Path

---

### **Phase 3: Real-time Features (Weeks 7-10)**

#### Feature 7: Real-Time Chat
- **Time:** 5 days (FE) + 3 days (BE) = 8 days
- **Includes:** Student↔Tutor messaging, history, typing indicators, online/offline, notifications, timestamps
- **Team:** Member 2 (FE) + Member 4 (BE)
- **Status:** Important

#### Feature 8: Live Video Session (Jitsi — NOT WebRTC)
- **Time:** 5 days (FE) + 3 days (BE) = 8 days (vs 22 for raw WebRTC)
- **Includes:** Jitsi room generation, join meeting, video/audio, screen share, leave, session mapping
- **Team:** Member 2 (FE) + Member 4 (BE)
- **Status:** Critical (but LOW risk with Jitsi)
- **Tech:** @jitsi/react-sdk + meet.jit.si (free)

#### Feature 9: Notifications
- **Time:** 3 days (FE) + 2 days (BE) = 5 days
- **Includes:** Bell icon + dropdown, toast popups (push-notification-toast), real-time via Socket.IO, DB persistence
- **Team:** Member 2 (FE) + Member 3 (BE)

---

### **Phase 4: AI Features & Admin (Weeks 11-14)**

#### Feature 10: AI Integration (Local-First + Gemini)
- **Time:** 10 days (Member 4 AI Service) + 3 days (FE) = 13 days
- **Includes:**
  - Socratic AI Assistant (Gemini)
  - Session Summarization (Gemini → n8n async)
  - Tutor Matching (sentence-transformers embeddings)
  - Smart Recommendations (hybrid CF + content)
  - Sentiment Analysis (@xenova/transformers)
  - Intent Detection (zero-shot)
  - Performance Prediction (RandomForest)
  - Lesson Prep for Tutors (Gemini)
  - Schedule Optimization (OR-Tools)
- **Team:** Member 4 (AI Service) + Member 2 (FE AI Chat) + Member 3 (BE AI endpoints)

#### Feature 11: Admin Panel
- **Time:** 5 days (FE) + 3 days (BE) = 8 days
- **Includes:** User management (search, block/unblock), tutor approval queue (n8n workflow), payment monitoring, revenue stats, system health
- **Team:** Member 1 (FE) + Member 3 (BE)

#### Feature 12: Dashboard Enhancements
- **Time:** 4 days (FE) + 2 days (BE) = 6 days
- **Includes:** Student: favorites, AI summaries, quick re-book. Tutor: earnings chart, student list, availability calendar, performance metrics
- **Team:** Member 2 (FE) + Member 3/4 (BE)

#### Feature 13: Review System
- **Time:** 2 days (FE) + 2 days (BE) = 4 days
- **Includes:** 1-5 star ratings, comments, edit/delete, average calculation, admin moderation (OpenAI Moderation API)
- **Team:** Member 1 (FE) + Member 3 (BE)

---

### **Phase 5: Polish & Deploy (Weeks 15-16)**

#### Feature 14: Responsive + Performance
- **Time:** 4 days
- **Includes:** Mobile/tablet/desktop testing, loading skeletons, lazy images, code-split routes, Lighthouse 85+
- **Team:** Member 1 & 2

#### Feature 15: Testing + Security
- **Time:** 3 days
- **Includes:** Jest + Supertest (auth, booking, payments), Helmet headers, rate limiting, input sanitization, MongoDB index verification
- **Team:** Member 3 & 4

#### Feature 16: Deployment & Demo Prep
- **Time:** 4 days
- **Includes:** Vercel (FE), Render (BE), MongoDB Atlas, Cloudinary, seed demo data (15 tutors, 10 students, bookings, reviews, chats), demo video, slides
- **Team:** Member 4 (deploy) + All (test + demo)

---

## 🗄️ DATABASE SCHEMA (MongoDB Collections)

### **Users Collection**
```javascript
{
  "_id": ObjectId,
  "name": String,
  "email": String (unique),
  "password": String (bcrypt hashed),
  "role": String (enum: "student", "tutor", "admin"),
  "profilePhoto": String (Cloudinary URL),
  "phone": String,
  "createdAt": Date,
  "updatedAt": Date,
  "isVerified": Boolean,
  "isBlocked": Boolean
}
```

### **Tutors Collection (Extended Profile)**
```javascript
{
  "_id": ObjectId,
  "userId": ObjectId (ref: Users),
  "subjects": [String],
  "experience": String (years),
  "qualifications": String,
  "bio": String,
  "hourlyRate": Number,
  "rating": Number (average),
  "totalReviews": Number,
  "isVerified": Boolean (admin approval),
  "verificationDate": Date,
  "totalEarnings": Number,
  "totalSessions": Number,
  "responseTime": Number (minutes),
  "languages": [String],
  "embedding": [Float32] (384-dim for AI matching)
}
```

### **Sessions Collection**
```javascript
{
  "_id": ObjectId,
  "studentId": ObjectId (ref: Users),
  "tutorId": ObjectId (ref: Users),
  "subject": String,
  "startTime": Date,
  "endTime": Date,
  "duration": Number (minutes),
  "status": String (enum: "booked", "completed", "cancelled", "no-show"),
  "paymentId": ObjectId (ref: Payments),
  "jitsiRoom": String,
  "recordingUrl": String (optional, Cloudinary),
  "summary": String (markdown, from AI),
  "notes": String,
  "cancelledBy": String,
  "cancellationReason": String
}
```

### **Payments Collection**
```javascript
{
  "_id": ObjectId,
  "sessionId": ObjectId (ref: Sessions),
  "studentId": ObjectId (ref: Users),
  "tutorId": ObjectId (ref: Users),
  "amount": Number,
  "currency": String (default: "INR"),
  "status": String (enum: "pending", "completed", "failed", "refunded"),
  "razorpayOrderId": String,
  "razorpayPaymentId": String,
  "paymentDate": Date,
  "refundAmount": Number,
  "refundDate": Date
}
```

### **Reviews Collection**
```javascript
{
  "_id": ObjectId,
  "sessionId": ObjectId (ref: Sessions),
  "studentId": ObjectId (ref: Users),
  "tutorId": ObjectId (ref: Users),
  "rating": Number (1-5),
  "comment": String,
  "createdAt": Date,
  "updatedAt": Date,
  "helpful": Number,
  "sentiment": String (POSITIVE/NEGATIVE from AI),
  "moderated": Boolean
}
```

### **Messages Collection (Chat)**
```javascript
{
  "_id": ObjectId,
  "senderId": ObjectId (ref: Users),
  "recipientId": ObjectId (ref: Users),
  "message": String,
  "timestamp": Date,
  "isRead": Boolean,
  "conversationId": String
}
```

### **Availability Collection (Tutor Slots)**
```javascript
{
  "_id": ObjectId,
  "tutorId": ObjectId (ref: Users),
  "dayOfWeek": String,
  "startTime": String (HH:MM),
  "endTime": String (HH:MM),
  "isRecurring": Boolean,
  "createdAt": Date
}
```

### **Notifications Collection**
```javascript
{
  "_id": ObjectId,
  "userId": ObjectId (ref: Users),
  "type": String (booking, message, payment, review, system),
  "title": String,
  "body": String,
  "data": Object (ref IDs),
  "read": Boolean,
  "createdAt": Date
}
// TTL Index: createdAt, expireAfterSeconds: 2592000 (30 days)
```

---

## 🛠️ COMPLETE TECH STACK (Aligned with SOCRATES_Final_Tech_Stack.md)

### **Frontend Stack**
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React | ^19.x | UI library |
| Build Tool | Vite | ^6.x | Dev server + bundler |
| CSS | Tailwind CSS | v4 | Utility-first (Apple tokens) |
| Routing | React Router | ^7.x | Client-side navigation |
| State (Client) | Zustand | ^5.x | Auth, theme, notifications |
| State (Server) | TanStack Query | ^5.x | API caching, refetch |
| HTTP Client | Axios | ^1.7+ | Interceptors, API calls |
| Forms | React Hook Form | ^7.x | Minimal re-renders |
| Validation | Zod | ^3.x | Schema validation |
| Bridge | @hookform/resolvers | ^3.x | Zod ↔ RHF |
| Animation | Framer Motion | ^11.x | Transitions, micro-animations |
| Calendar | FullCalendar | ^6.x | Scheduling widget |
| **Icons** | **lucide-react** | ^0.4.x | **MANDATORY - Vector only** |
| Dates | date-fns | ^4.x | Formatting |
| Toasts | Sonner | ^2.x | Notifications |
| Real-time | Socket.IO Client | ^4.8+ | WebSocket |
| Class Merge | clsx | ^2.x | Conditional classes |
| **Local ML** | **@xenova/transformers** | ^2.x | **Sentiment/Intent in browser** |
| Video | @jitsi/react-sdk | latest | Jitsi Meet embed |
| Linting | ESLint | ^9.x | Code quality |
| Formatting | Prettier | ^3.x | Auto-format |

### **Backend Stack**
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Node.js | 20 LTS | JS runtime |
| Framework | Express.js | ^4.21+ | Web server |
| Database | MongoDB | Latest | NoSQL |
| ODM | Mongoose | ^8.x | Schema, validation |
| Auth | jsonwebtoken | ^9.x | JWT tokens |
| Hashing | bcrypt | ^5.x | Password hashing |
| Security | Helmet | ^8.x | HTTP headers |
| CORS | cors | ^2.8+ | Cross-origin |
| Rate Limit | express-rate-limit | ^7.x | 100 req/15min auth |
| Sanitize | sanitize-html | ^2.x | XSS prevention |
| Validation | Joi | ^17.x | Body validation |
| Alt Validation | express-validator | ^7.x | Middleware validation |
| Real-time | Socket.IO | ^4.8+ | WebSocket server |
| Payments | Razorpay | ^2.x | INR/UPI/Cards |
| File Upload | Multer | ^1.x | Multipart handling |
| Image Proc | Sharp | ^0.33+ | Resize/compress |
| Cloud Storage | Cloudinary | Latest | Images/videos (25GB free) |
| Email | Nodemailer | ^6.x | Verification, booking emails |
| HTTP Client | Axios | ^1.7+ | External APIs (Razorpay, Gemini, n8n) |
| Env | dotenv | ^16.x | .env loading |
| IDs | uuid | ^10.x | Unique identifiers |
| Compression | compression | ^1.x | Gzip responses |
| **Logging** | **winston** | ^3.x | **Structured JSON logs** |
| Async Errors | express-async-errors | ^3.x | No try-catch needed |
| Dev Restart | Nodemon | ^3.x | Auto-reload |
| Linting | ESLint | ^9.x | Code quality |
| Formatting | Prettier | ^3.x | Formatting |

### **AI Microservice Stack (Python)**
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | FastAPI | Async API framework |
| Server | Uvicorn | ASGI server |
| Embeddings | sentence-transformers | all-MiniLM-L6-v2 (384-dim) |
| ML | scikit-learn | RandomForest, CF, similarity |
| Boosting | XGBoost | Performance prediction |
| Optimization | OR-Tools | Schedule optimization |
| NLP | transformers (HF) | BERT, zero-shot (server alt) |
| Validation | Pydantic | Request/response schemas |
| HTTP | httpx | Async HTTP client |
| Cache | redis-py | Embedding cache (optional) |

### **Workflow Automation**
| Tool | Purpose |
|------|---------|
| n8n (Docker) | Async workflows: verification, summaries, leaderboards |

### **Deployment Stack**
| Component | Technology |
|-----------|-----------|
| Frontend | Vercel (auto-deploy, HTTPS, CDN) |
| Backend | Render (750 hrs free, auto-deploy) |
| Database | MongoDB Atlas (512MB free) |
| Images | Cloudinary (25GB free) |
| Version Control | GitHub (private, Issues, PRs) |
| CI/CD | GitHub Actions (2000 min free) |
| Process Manager | PM2 (production) |
| Containerization | Docker + Docker Compose (local) |

---

## 📅 RECOMMENDED DEVELOPMENT TIMELINE (16 Weeks = ~4 Months)

| Week | Phase | Key Deliverables | Team Focus |
|------|-------|-----------------|-----------|
| 1 | Setup & Design | Repo, branch rules, Vite+React+TS, Express, MongoDB Atlas, .env.example, DESIGN-apple.md tokens, wireframes | All |
| 2 | Design System | Tailwind config, Button/Input/Card/Modal/Loader, Navbar (global-nav + sub-nav-frosted), React Router placeholders | M1, M2 |
| 3 | Auth APIs | POST /register, /login, /me, password reset, Nodemailer, JWT, bcrypt | M3 |
| 4 | Auth UI + Profiles | Register/Login pages, Tutor Profile CRUD, Cloudinary upload, protected routes | M1, M3 |
| 5 | Search & Filters | GET /tutors/search (compound index), Search page (sidebar chips), Home page hero | M1, M3 |
| 6 | Booking APIs | Availability CRUD, Session booking (conflict check), cancel/reschedule | M3, M4 |
| 7 | Booking UI + Razorpay | Calendar scheduler, Razorpay order/verify/webhook, confirmation page | M1, M2, M4 |
| 8 | Dashboards (Basic) | Student: upcoming, payments. Tutor: bookings, earnings, availability mgr | M2, M3 |
| 9 | Real-time Chat | Socket.IO server, rooms, typing, presence, Chat page (imessage-bubble) | M2, M4 |
| 10 | Video (Jitsi) | Room generation, Video Call page (@jitsi/react-sdk), controls, notifications | M2, M4 |
| 11 | AI Service Deploy | FastAPI service, sentence-transformers, matching, sentiment, intent, prediction | M4 |
| 12 | AI Features + n8n | Socratic (Gemini), summaries (n8n), recommendations, lesson prep, tutor verification workflow | M2, M3, M4 |
| 13 | Admin Panel | User management, tutor approval (n8n), stats, payment records | M1, M3 |
| 14 | Dashboard Polish | AI summaries, earnings charts, favorites, quick re-book, performance metrics | M2, M3 |
| 15 | Responsive + Test | Mobile/desktop fix, Lighthouse, Jest/Supertest, security hardening, index verify | All |
| 16 | Deploy + Demo | Vercel + Render, seed data, E2E test, demo video (5min), slides (15-20) | All |

---

## ⚠️ RISK ANALYSIS & MITIGATION

| Risk | Level | Mitigation |
|------|-------|------------|
| **Video Calling** | LOW | Use **Jitsi (@jitsi/react-sdk)** — 5 days, free, no STUN/TURN. Skip raw WebRTC. |
| **Real-time Sync** | MEDIUM | Socket.IO reconnection + exponential backoff, offline message queue, server persistence |
| **AI Local Models** | MEDIUM | Pre-download models in Docker build, cache embeddings in Redis, fallback to Gemini |
| **Razorpay Webhooks** | LOW | Use ngrok for local testing, idempotent handlers, proper signature verification |
| **DB Performance** | LOW | Compound indexes from Day 1, pagination always, explain() queries |
| **Timezone Bugs** | LOW | Store UTC, convert on frontend (date-fns-tz), display timezone in UI |
| **Mobile Video** | LOW | Jitsi handles mobile; test on real devices |
| **n8n Reliability** | LOW | Retry on webhook failure, manual re-trigger endpoint, logs in n8n UI |

---

## 🎯 SIMPLIFIED VERSION (12 Weeks — Guaranteed Success)

**Core Features Only:**
✅ Authentication (4 days)
✅ Tutor Profiles (6 days)
✅ Search & Filters (7 days)
✅ Session Booking (11 days)
✅ Calendar Integration (7 days)
✅ Razorpay Payments (4 days)
✅ Real-time Chat (8 days)
✅ Jitsi Video (8 days)
✅ Student Dashboard (4 days)
✅ Tutor Dashboard (5 days)
✅ Reviews (4 days)
✅ **Basic AI: Socratic Assistant only (Gemini, 3 days)**

**Skip/Defer:**
❌ Local ML matching/recommendations (add post-SGP)
❌ Sentiment/Intent/Prediction (add post-SGP)
❌ n8n workflows (manual approval, cron jobs later)
❌ Admin Panel (basic user list only)
❌ Session Recording
❌ Schedule Optimization

**Timeline: 12 weeks** — Still impressive, shippable, extensible.

---

## 📊 EFFORT DISTRIBUTION (4 PEOPLE)

| Member | Frontend | Backend | Database | Real-time | AI/ML | DevOps |
|--------|----------|---------|----------|-----------|-------|--------|
| Member 1 | 80% | - | - | - | - | - |
| Member 2 | 50% | - | - | 30% | 10% (AI UI) | - |
| Member 3 | - | 70% | 20% | - | - | - |
| Member 4 | - | 30% | 80% | 70% | 90% | 100% |

**Total: ~150 work days** | **Per Person: ~37-40 days** | **Weekly: 15-20 hrs × 16 weeks**

---

## ✨ FINAL VERDICT

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Feasibility** | 9/10 | ✅ Jitsi + Local ML + n8n reduces risk |
| **Impressiveness** | 10/10 | ✅ Full-stack + AI + DevOps + System Design |
| **Learning Value** | 10/10 | ✅ React 19, TS, Tailwind v4, FastAPI, ML, Docker, CI/CD |
| **Complexity** | 7/10 | ⚠️ Manageable with Jitsi (not WebRTC) |
| **Time Estimate** | 16 weeks | ✅ Realistic with parallel tracks |
| **Risk Level** | LOW-MED | ✅ Mitigated by tech choices |
| **Recommendation** | **HIGHLY RECOMMENDED** | 🎯 Perfect SGP — portfolio-grade |

---

### **To Maximize Success:**
1. **Use Jitsi (@jitsi/react-sdk)** — not WebRTC (saves 14 days, zero infrastructure)
2. **Local ML in Python FastAPI** — sentence-transformers + scikit-learn, not cloud APIs
3. **n8n for async** — verification, summaries, leaderboards off main thread
4. **Docker from Week 1** — consistent env, easy CI/CD
5. **Winston logging from Day 1** — structured JSON, request IDs
6. **Weekly code reviews** — catch drift early
7. **Seed demo data early** — test with realistic volume

---

**Let's build something exceptional! 🚀**