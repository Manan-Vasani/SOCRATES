# SOCRATES — Complete Project Blueprint

Distilled from ALL 8 docs. One source of truth. No guessing.

---

## 1. YOUR TECH STACK (What You Are Actually Using)

### Frontend (`frontend/`)
| Layer | Tool | Version |
|---|---|---|
| Framework | React 19 + TypeScript | latest |
| Bundler | Vite + `@tailwindcss/vite` | latest |
| Styling | Tailwind CSS v4 | v4 |
| Routing | `react-router-dom` | v7 |
| State (client) | `zustand` | latest |
| State (server) | `@tanstack/react-query` | latest |
| Forms | `react-hook-form` + `zod` | latest |
| Icons | `lucide-react`, `react-icons` | latest |
| Animations | `framer-motion` | latest |

### Backend (`backend/`)
| Layer | Tool |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js (CommonJS) |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |
| File Upload | Multer + Cloudinary + Sharp |
| Security | Helmet, CORS, express-rate-limit |
| Email | Nodemailer |
| Validation | Joi / express-validator |

### AI Service (`ai-service/` — not yet created)
| Layer | Tool |
|---|---|
| Framework | Python 3.14 + FastAPI + Uvicorn |
| Local ML | scikit-learn, sentence-transformers |
| LLM API | Gemini (only for open-ended tutoring chat) |

---

## 2. EVERY PAGE — Features Inside Each Page + Build Status

### ✅ BUILT PAGES — What Features Each Page Has

---

#### Page 1: Landing / Home (`/`)
**File:** [Home.tsx](file:///d:/SOCRATES/frontend/src/pages/Home.tsx) — **Status: ✅ Built**

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Hero section with CTA buttons | ✅ | — | Done |
| Platform stats counter (tutors, students, sessions) | ✅ | ✅ `PlatformStat` model | Done |
| Subject category cards | ✅ | ✅ `Category` model | Done |
| "How It Works" steps section | ✅ | — | Done |
| Tutor preview cards | ✅ | ✅ `Tutor` model | Done |
| Testimonials carousel | ✅ | ✅ `Testimonial` model | Done |
| FAQ accordion | ✅ | ✅ `FAQ` model | Done |
| CTA / Lead capture form | ✅ | ✅ `Lead` model | Done |
| Footer with site links | ✅ | — | Done |

---

#### Pages 2-6: Auth Flow (`/login`, `/signup`, `/forgot-password`, `/verify-otp`, `/reset-password`)
**Files:** [Login.tsx](file:///d:/SOCRATES/frontend/src/pages/Login.tsx), [Signup.tsx](file:///d:/SOCRATES/frontend/src/pages/Signup.tsx), [ForgotPassword.tsx](file:///d:/SOCRATES/frontend/src/pages/ForgotPassword.tsx), [VerifyOTP.tsx](file:///d:/SOCRATES/frontend/src/pages/VerifyOTP.tsx), [ResetPassword.tsx](file:///d:/SOCRATES/frontend/src/pages/ResetPassword.tsx) — **Status: ✅ Built**

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Email + password registration | ✅ | ✅ `authController` | Done |
| JWT token login | ✅ | ✅ `generateToken` | Done |
| Google OAuth button | ✅ | ✅ `passport.js` | Done |
| OTP email verification | ✅ | ✅ `sendEmail` util | Done |
| Password reset flow | ✅ | ✅ `authController` | Done |
| Form validation (Zod) | ✅ | ✅ | Done |
| Role selection (Student/Tutor) | ✅ | ✅ `User` model `role` field | Done |

---

#### Page 7: User Profile (`/profile`)
**File:** [Profile.tsx](file:///d:/SOCRATES/frontend/src/pages/Profile.tsx) (99KB) — **Status: ✅ Built**

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Profile photo upload | ✅ | ⚠️ Cloudinary not confirmed | Partial |
| Edit name, bio, contact info | ✅ | ✅ `User` model | Done |
| Subject selection (for tutors) | ✅ | ✅ `Tutor` model | Done |
| Hourly rate setting (tutors) | ✅ | ✅ `Tutor` model | Done |
| Qualifications and experience | ✅ | ✅ `Tutor` model | Done |
| Language preferences | ✅ | ✅ `Tutor` model | Done |
| Profile preview mode | ✅ | — | Done |

---

#### Page 8: Tutor Search & Discovery (`/tutors`)
**File:** [Tutors.tsx](file:///d:/SOCRATES/frontend/src/pages/Tutors.tsx) — **Status: ✅ Built**

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Search bar (name, subject, keyword) | ✅ | ✅ `tutorController` | Done |
| Filter by subject | ✅ | ✅ | Done |
| Filter by price range | ✅ | ✅ | Done |
| Filter by rating | ✅ | ✅ | Done |
| Tutor profile cards grid | ✅ | ✅ | Done |
| Pagination | ✅ | ✅ | Done |
| Smart tutor recommendations (AI) | ❌ | ❌ | Not started — needs `ai-service/` |

---

#### Page 9: Tutor Schedule & Booking (`/tutors/:id/schedule`)
**File:** [TutorSchedule.tsx](file:///d:/SOCRATES/frontend/src/pages/TutorSchedule.tsx) (80KB) — **Status: ✅ Built**

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Tutor profile hero header | ✅ | ✅ `Tutor` model | Done |
| Calendar date picker | ✅ | ⚠️ Availability routes partial | Partial |
| Time slot grid | ✅ | ⚠️ | Partial |
| Session type selection (15/30/60 min) | ✅ | ✅ `Booking` model | Done |
| Book session button | ✅ | ✅ `Booking` model | Done |
| Payment checkout before booking | ❌ | ❌ No Stripe | Not started |
| Booking confirmation | ✅ | ⚠️ | Partial |
| Tutor reviews section | ✅ | ❌ No `Review` model | Not started |

---

#### Page 10: Study Room / Video Session (`/study-room/:roomId`)
**File:** [StudyRoom.tsx](file:///d:/SOCRATES/frontend/src/pages/StudyRoom.tsx) — **Status: ✅ Built**

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Video call UI (Jitsi embed) | ✅ | ✅ `StudyRoom` model | Done |
| Audio/video toggle controls | ✅ | — | Done |
| Screen sharing | ✅ | — | Done (via Jitsi) |
| Leave session button | ✅ | — | Done |
| Session recording trigger | ❌ | ❌ | Not started |
| Whiteboard / shared canvas | ❌ | ❌ | Not started |
| Session timer | ✅ | — | Done |

---

#### Page 11: Practice / Code Playground (`/practice`)
**File:** [PracticePage.tsx](file:///d:/SOCRATES/frontend/src/pages/PracticePage.tsx) — **Status: ✅ Built**

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Code editor (Monaco / CodeMirror) | ✅ | — | Done |
| Multi-language support | ✅ | ✅ `compileController` | Done |
| Run / Execute code | ✅ | ✅ `compileRoutes` | Done |
| Output console | ✅ | ✅ | Done |
| AI code hints | ❌ | ❌ | Not started |

---

#### Page 12: Community Doubt Board (`/community`)
**File:** [CommunityPage.tsx](file:///d:/SOCRATES/frontend/src/pages/CommunityPage.tsx) (63KB) — **Status: ⚠️ Frontend only, mock data**

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Post doubt thread (title, description, code, media) | ✅ | ❌ No `DoubtThread` model | Mock only |
| Subject filter pills | ✅ | ❌ | Mock only |
| Solved/unsolved filter | ✅ | ❌ | Mock only |
| Search doubts | ✅ | ❌ | Mock only |
| Threaded nested comments (unlimited depth) | ✅ | ❌ No `Comment` model | Mock only |
| Upvote/downvote (karma) | ✅ | ❌ No karma field on User | Mock only |
| Image/video attachments + lightbox | ✅ | ❌ No Cloudinary | Mock only |
| Code snippet display | ✅ | ❌ | Mock only |
| Comment edit/delete | ✅ | ❌ | Mock only |
| Collapse/expand thread branches | ✅ | — | Done (frontend logic) |
| Socratic AI first-responder bot | ⚠️ Hardcoded | ❌ No Gemini API | Hardcoded text |
| Karma leaderboard sidebar | ⚠️ Data defined, not rendered | ❌ | Dead code |
| Bookmark/save to notebook | ⚠️ Icon imported, never used | ❌ | Dead code |
| Peer-to-peer study room launch from thread | ❌ | ❌ | Not started |
| Tutor doubt terminal (tutor-role filtered view) | ❌ | ❌ | Not started |

---

#### Page 13: Session Recordings (`/recordings`)
**File:** [RecordingsPage.tsx](file:///d:/SOCRATES/frontend/src/pages/RecordingsPage.tsx) — **Status: ✅ Built**

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Recording list with thumbnails | ✅ | ⚠️ Mock data | Frontend only |
| Video playback | ✅ | ❌ No cloud storage | Mock only |
| Download recording | ✅ | ❌ No S3/Firebase | Mock only |
| Filter by subject/date | ✅ | ❌ | Mock only |

---

#### Page 14: Dashboard (`/dashboard`)
**File:** [Dashboard.tsx](file:///d:/SOCRATES/frontend/src/pages/Dashboard.tsx) (56 bytes) — **Status: ❌ Empty stub**

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Everything | ❌ | ❌ | Not started |

---

### ❌ PAGES NOT YET CREATED — With All Features They Need

---

#### Page 15: Student Dashboard (NEW — needs `/student-dashboard` or replace `/dashboard`)
**Doc:** [4-Person Breakdown §10](file:///d:/SOCRATES/docs/SOCRATES_4Person_SGP_Breakdown.md) — **Priority: 🔴 Must Have**

| Feature | What to Build | Backend Needed |
|---|---|---|
| Upcoming sessions list | Card grid showing next 5 booked sessions | `Booking` model query (exists) |
| Session history | Past completed/cancelled sessions | `Booking` model query |
| Payment history | Transaction log with amounts, dates | `Payment` model (NEW) |
| Favorite/saved tutors | List of bookmarked tutor profiles | `favorites[]` field on User (NEW) |
| Saved doubt threads (notebook) | Bookmarked community threads | `bookmarks[]` field on User (NEW) |
| Quick stats cards | Total sessions, hours, spend | Aggregation route (NEW) |
| Quick book button | Shortcut to rebook past tutors | Link to `/tutors/:id/schedule` |
| Recent recordings | Last 3 session recordings | `Recording` model (NEW) |

---

#### Page 16: Tutor Dashboard (NEW — needs `/tutor-dashboard`)
**Doc:** [4-Person Breakdown §11](file:///d:/SOCRATES/docs/SOCRATES_4Person_SGP_Breakdown.md), [Community Model §2](file:///d:/SOCRATES/docs/SOCRATES_Community_Model.md) — **Priority: 🔴 Must Have**

| Feature | What to Build | Backend Needed |
|---|---|---|
| Earnings overview | Total earned, this month, pending | `Payment` aggregation (NEW) |
| Upcoming bookings | Next scheduled sessions | `Booking` model query |
| Student list | Students who booked with this tutor | `Booking` distinct students |
| Availability calendar | Set/edit weekly time slots | Availability CRUD routes (NEW) |
| Karma score + rank | Socrates Karma from community | `karma` field on User (NEW) |
| Solved doubts count | Threads where tutor's answer accepted | `DoubtThread` aggregation (NEW) |
| Performance metrics | Avg rating, response time, completion rate | Aggregation routes (NEW) |
| Reviews received | List of student reviews | `Review` model (NEW) |
| Resume/portfolio export (PDF) | Export profile + karma + stats | `pdfkit` on backend (NEW) |
| Volunteer hours certificate | Convert karma to certified hours | Admin verification + PDF gen (NEW) |

---

#### Page 17: Chat / Messenger (NEW — needs `/chat`)
**Doc:** [DESIGN-apple §5](file:///d:/SOCRATES/docs/DESIGN-apple.md#L577-L581) — **Priority: 🟡 Important**

| Feature | What to Build | Backend Needed |
|---|---|---|
| Conversation list sidebar (320px) | Thread list, active highlight | `Conversation` model (NEW) |
| iMessage-style chat bubbles | Blue outbound, gray inbound per design doc | — (frontend only) |
| Real-time message delivery | Socket.io room per conversation | Socket.io handlers (NEW) |
| Message persistence | Save messages to DB | `Message` model (NEW) |
| Typing indicator | "User is typing..." | Socket.io event (NEW) |
| Online/offline status | Green dot on avatar | Socket.io presence (NEW) |
| Message timestamps | Relative time display | — |
| File/image sharing in chat | Send images/docs in messages | Multer + Cloudinary (exists) |
| Message search | Search across conversation history | Text index on `Message` (NEW) |

---

#### Page 18: AI Tutor Chat (NEW — needs `/ai-tutor`)
**Doc:** [AI/ML Features §1](file:///d:/SOCRATES/docs/SOCRATES_AI_ML_Features.md) — **Priority: 🟡 Important**
*Component [AITutor.tsx](file:///d:/SOCRATES/frontend/src/components/AITutor.tsx) exists (5.6KB) but no dedicated page*

| Feature | What to Build | Backend Needed |
|---|---|---|
| Chat interface with AI | Conversational UI, send question, get response | `aiController` route (exists) |
| Socratic mode (guiding questions, no direct answers) | Prompt engineering | Gemini API prompt config |
| Subject context selector | Pick subject to scope AI responses | Frontend dropdown |
| Image/PDF upload for homework scanning | Multimodal input | Gemini Vision API |
| Chat history persistence | Save past AI conversations | `AIConversation` model (NEW) |
| Code block rendering in responses | Syntax-highlighted code | Frontend markdown renderer |
| Follow-up question suggestions | AI suggests related questions | Gemini prompt chain |

---

#### Page 19: Admin Panel (NEW — needs `/admin`)
**Doc:** [4-Person Breakdown §12](file:///d:/SOCRATES/docs/SOCRATES_4Person_SGP_Breakdown.md) — **Priority: 🟡 Important**

| Feature | What to Build | Backend Needed |
|---|---|---|
| User management table | View, search, block, delete users | Admin-only routes on `User` (NEW) |
| Tutor verification workflow | Review uploaded credentials, approve/reject | `Tutor.isVerified` + admin route (NEW) |
| Payment monitoring | View all transactions, flagged payments | `Payment` admin query (NEW) |
| Dispute resolution | Student/tutor complaints, refund decisions | Dispute model or status field (NEW) |
| Revenue reports | Charts — daily/weekly/monthly revenue | Aggregation pipeline (NEW) |
| User analytics | Signups over time, active users, retention | Aggregation pipeline (NEW) |
| Content moderation | Review flagged doubt threads/comments | Flag system on `DoubtThread` (NEW) |
| System health | API response times, error rates | Logging + metrics (NEW) |

---

#### Page 20: Payment Checkout (NEW — needs `/checkout` or modal)
**Doc:** [4-Person Breakdown §6](file:///d:/SOCRATES/docs/SOCRATES_4Person_SGP_Breakdown.md) — **Priority: 🟡 Important**

| Feature | What to Build | Backend Needed |
|---|---|---|
| Session price display | Show tutor rate, session duration, total | Calculated from `Tutor.hourlyRate` |
| Stripe checkout form | Embedded Stripe Elements or hosted checkout | Stripe API integration (NEW) |
| Payment confirmation | Success/failure screen | Stripe webhook handler (NEW) |
| Invoice/receipt | Downloadable PDF receipt | `Payment` model + PDF gen (NEW) |
| Promo code / discount | Optional coupon field | Stripe coupon API (NEW) |

---

#### Page 21: Notifications Center (NEW — needs `/notifications` or dropdown)
**Doc:** [4-Person Breakdown](file:///d:/SOCRATES/docs/SOCRATES_4Person_SGP_Breakdown.md) — **Priority: 🟢 Nice to Have**

| Feature | What to Build | Backend Needed |
|---|---|---|
| Notification list | All notifications with read/unread status | `Notification` model (NEW) |
| Real-time push notifications | Toast popup on new events | Socket.io broadcast (NEW) |
| Notification types | Booking confirmed, new message, karma earned, session reminder | Enum on model |
| Email notifications | Email on important events | `sendEmail` util (exists) |
| Mark as read / mark all read | Toggle read status | PATCH route (NEW) |

---

### Summary: Page Count

| Status | Count | Pages |
|---|---|---|
| ✅ Fully Built (frontend + backend) | 7 | Home, Auth (5 pages), Practice |
| ⚠️ Frontend built, backend partial/mock | 6 | Profile, Tutors, TutorSchedule, StudyRoom, Community, Recordings |
| ❌ Empty stub | 1 | Dashboard |
| ❌ Not created yet | 7 | Student Dashboard, Tutor Dashboard, Chat, AI Tutor, Admin, Checkout, Notifications |
| **Total** | **21** | |

---

## 3. BACKEND STATUS — What Exists vs What Needs Building

### Existing Backend Files

```
backend/src/
├── server.js                    ← Express entry point
├── config/
│   ├── db.js                    ← MongoDB connection
│   └── passport.js              ← Passport auth config
├── controllers/
│   ├── authController.js        ← Login/Register/OTP
│   ├── auth.controller.js       ← (duplicate? check)
│   ├── tutorController.js       ← Tutor CRUD
│   ├── aiController.js          ← AI endpoint
│   ├── compileController.js     ← Code compiler
│   └── homepageController.js    ← Landing page data
├── middleware/
│   ├── authMiddleware.js        ← JWT verify
│   └── verifyJWT.js             ← (duplicate? check)
├── models/
│   ├── User.js                  ← User schema
│   ├── Tutor.js                 ← Tutor profile schema
│   ├── Booking.js               ← Session booking schema
│   ├── Category.js              ← Subject categories
│   ├── FAQ.js                   ← FAQ content
│   ├── Lead.js                  ← Lead capture
│   ├── PlatformStat.js          ← Stats/metrics
│   ├── StudyRoom.js             ← Study room sessions
│   └── Testimonial.js           ← User testimonials
├── routes/
│   ├── authRoutes.js            ← Auth endpoints
│   ├── auth.routes.js           ← (duplicate? check)
│   ├── tutorRoutes.js           ← Tutor endpoints
│   ├── aiRoutes.js              ← AI endpoints
│   ├── compileRoutes.js         ← Compiler endpoints
│   └── homepageRoutes.js        ← Homepage data
├── socket/                      ← Socket.io setup
└── utils/
    ├── generateToken.js         ← JWT token gen
    ├── seed.js                  ← DB seeder
    └── sendEmail.js             ← Email utility
```

### Missing Backend (needs building)

| # | What | Model | Routes | Priority |
|---|---|---|---|---|
| 1 | **Doubt/Thread system** | DoubtThread.js, Comment.js | `/api/doubts` | 🔴 Community page has no backend |
| 2 | **Karma/Reputation** | Karma.js (or field on User) | `/api/karma` | 🔴 Core to community model |
| 3 | **Chat/Messages** | Message.js, Conversation.js | `/api/messages` | 🟡 Socket.io handlers exist but no persistence |
| 4 | **Reviews** | Review.js | `/api/reviews` | 🟡 No review model exists |
| 5 | **Payments** | Payment.js | `/api/payments` | 🟡 Stripe not integrated |
| 6 | **Notifications** | Notification.js | `/api/notifications` | 🟢 |
| 7 | **Session Recording** | Recording.js | `/api/recordings` | 🟢 |
| 8 | **Bookmarks/Notebook** | Bookmark.js (or field on User) | `/api/bookmarks` | 🟢 |

---

## 4. WHAT TO DO NEXT — Ordered Action Plan

> [!IMPORTANT]
> This is dependency-ordered. Do them in this sequence.

### Step 1: Fix existing backend duplicates
- [ ] Check `authController.js` vs `auth.controller.js` — merge or delete duplicate
- [ ] Check `authRoutes.js` vs `auth.routes.js` — merge or delete duplicate
- [ ] Check `authMiddleware.js` vs `verifyJWT.js` — merge or delete duplicate

### Step 2: Build Community Backend (unlocks Community page)
- [ ] Create `DoubtThread` Mongoose model
- [ ] Create `Comment` Mongoose model (nested/ref)
- [ ] Add `karma` field to User model
- [ ] Create `/api/doubts` CRUD routes
- [ ] Create `/api/doubts/:id/comments` routes
- [ ] Wire CommunityPage to real API (replace mock data)
- [ ] Integrate Gemini for Socratic AI first response
- [ ] Render leaderboard from `TOP_CONTRIBUTORS`

### Step 3: Build Student + Tutor Dashboards
- [ ] Design Student Dashboard page (sessions, stats, bookmarks)
- [ ] Design Tutor Dashboard page (earnings, karma, bookings)
- [ ] Backend aggregation routes for dashboard data

### Step 4: Chat System
- [ ] Create `Message` + `Conversation` Mongoose models
- [ ] Socket.io event handlers for real-time messaging
- [ ] Build Chat page UI (iMessage bubble design from DESIGN-apple.md)
- [ ] Message persistence and history

### Step 5: Payment Integration
- [ ] Create `Payment` Mongoose model
- [ ] Stripe checkout session route
- [ ] Webhook handler for payment confirmation
- [ ] Payment history display in dashboard

### Step 6: AI/ML Service
- [ ] Set up `ai-service/` with FastAPI
- [ ] Build tutor recommendation engine (sentence-transformers + cosine similarity)
- [ ] Gemini-powered AI Tutor chat endpoint
- [ ] Connect frontend AI Tutor component

### Step 7: Admin Panel
- [ ] User management (view, block, delete)
- [ ] Tutor verification workflow
- [ ] Payment monitoring
- [ ] System analytics

### Step 8: Polish + Deploy
- [ ] Fix all design system violations (typography, colors, shadows)
- [ ] Clean dead imports across all files
- [ ] Responsive testing
- [ ] Deploy frontend (Vercel), backend (Render), DB (MongoDB Atlas)

---

## 5. YOUR DOCS — Quick Reference Map

| Doc File | What It Contains | When to Use |
|---|---|---|
| [DESIGN-apple.md](file:///d:/SOCRATES/docs/DESIGN-apple.md) | Colors, typography, components, spacing tokens | Every time you build UI |
| [MASTER_SYSTEM_PROMPT.md](file:///d:/SOCRATES/docs/MASTER_SYSTEM_PROMPT.md) | CSS variables, component contracts, review protocol | Architecture decisions |
| [SOCRATES_Community_Model.md](file:///d:/SOCRATES/docs/SOCRATES_Community_Model.md) | Doubt board features, karma system, tutor terminal | Building community page |
| [SOCRATES_4Person_SGP_Breakdown.md](file:///d:/SOCRATES/docs/SOCRATES_4Person_SGP_Breakdown.md) | Team roles, phases, DB schemas, timeline | Sprint planning |
| [SOCRATES_AI_ML_Features.md](file:///d:/SOCRATES/docs/SOCRATES_AI_ML_Features.md) | 10 AI features with code examples | Building AI service |
| [SOCRATES_Complete_Tech_Stack.md](file:///d:/SOCRATES/docs/SOCRATES_Complete_Tech_Stack.md) | Every npm package, install commands, versions | Installing dependencies |
| [SOCRATES_User_Tutor_Perspectives.md](file:///d:/SOCRATES/docs/SOCRATES_User_Tutor_Perspectives.md) | Student/tutor journeys, feature descriptions | UX decisions |
| [SOCRATES_Development_Workflow.md](file:///d:/SOCRATES/docs/SOCRATES_Development_Workflow.md) | Git workflow, PR process, CI/CD | Team collaboration |

---

> [!TIP]
> **Start with Step 2 (Community Backend)**. Community page already has polished frontend — just needs real API. Biggest bang for effort. Then dashboards (Step 3), then chat (Step 4).
