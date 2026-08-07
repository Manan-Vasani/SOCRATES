# SOCRATES Backend Analysis

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js 20-alpine |
| Framework | Express.js 4.22 |
| Database | MongoDB (Atlas / local fallback) |
| ORM/ODM | Mongoose 9.7 |
| Auth | JWT + Passport.js (Google OAuth2 + ID token verification) |
| Real-time | Socket.IO 4.8 (2 namespaces) |
| File Upload | Multer (memory) → Cloudinary |
| Email | Brevo API v3 → Gmail SMTP → console log |
| AI Gateway | Axios proxy → FastAPI (`http://localhost:8000`) |
| Code Execution | child_process exec (Python, JS, C++, Java, SQL) |
| Rate Limiting | express-rate-limit (4 tiers) |
| Security | helmet, cors, compression, morgan, express-validator |
| Containerization | Docker |
| Dev Tools | nodemon, eslint, prettier |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection with graceful fallback
│   │   ├── passport.js        # Google OAuth strategy + token verification
│   │   └── cloudinaryConfig.js # Cloudinary upload/delete helpers
│   ├── controllers/
│   │   ├── authController.js      # Signup, login, OTP, profile update
│   │   ├── auth.controller.js     # Google popup login, callback, getMe, logout
│   │   ├── communityController.js # Threads, comments, voting, karma, AI bot
│   │   ├── studyRoomController.js # Room CRUD, join/leave, messages
│   │   ├── tutorController.js     # Tutor catalog, booking
│   │   ├── compileController.js   # Multi-language code execution
│   │   └── homepageController.js  # Overview, stats, tutors, FAQs, leads
│   ├── middleware/
│   │   ├── rateLimiter.js         # 4 rate limiters (global, auth, booking, AI)
│   │   ├── authMiddleware.js      # protect + authorize
│   │   └── verifyJWT.js           # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   ├── DoubtThread.js
│   │   ├── Comment.js
│   │   ├── StudyRoom.js
│   │   ├── StudyRoomMessage.js
│   │   ├── Karma.js
│   │   ├── Booking.js
│   │   ├── Tutor.js
│   │   ├── Category.js
│   │   ├── FAQ.js
│   │   ├── Lead.js
│   │   ├── PlatformStat.js
│   │   └── Testimonial.js
│   ├── routes/
│   │   ├── auth.routes.js         # All auth endpoints
│   │   ├── authRoutes.js          # Re-export wrapper
│   │   ├── aiRoutes.js             # Proxy to FastAPI
│   │   ├── communityRoutes.js     # Threads + comments
│   │   ├── studyRoomRoutes.js     # Room endpoints
│   │   ├── tutorRoutes.js         # Tutor catalog + booking
│   │   ├── compileRoutes.js       # Code execution
│   │   ├── uploadRoutes.js        # Media upload
│   │   └── homepageRoutes.js      # Homepage data
│   ├── socket/
│   │   └── socketServer.js        # Socket.IO with 2 namespaces
│   ├── utils/
│   │   ├── generateToken.js       # JWT generation
│   │   ├── seed.js                # Database seeding
│   │   └── sendEmail.js           # Email delivery (3 providers)
│   └── server.js                  # Entry point
├── package.json
├── Dockerfile
├── .dockerignore
├── .env                           # Live credentials (DO NOT COMMIT)
├── .env.example                   # Template for env vars
└── ANALYSIS.md                    # This file
```

---

## API Route Map

### Auth (`/auth`, `/api/auth`, `/api/v1/auth`)
| Method | Path | Middleware | Description |
|---|---|---|---|
| GET | `/google` | - | Initiate Google OAuth redirect |
| GET | `/google/callback` | - | OAuth callback handler |
| POST | `/google` | - | Google ID token auth (popup) |
| POST | `/signup` | authLimiter | Register new user |
| POST | `/register` | authLimiter | Alias for /signup |
| POST | `/login` | authLimiter | Local auth login |
| PUT | `/profile` | authLimiter + verifyJWT | Update profile |
| POST | `/forgot-password` | authLimiter | Send OTP email |
| POST | `/verify-otp` | authLimiter | Verify reset OTP |
| POST | `/reset-password` | authLimiter | Reset password |
| POST | `/logout` | - | Logout |
| GET | `/me` | verifyJWT | Get current user |

### Homepage (`/api/v1/homepage`)
| Method | Path | Description |
|---|---|---|
| GET | `/overview` | Stats, tutors, FAQs, study rooms |
| GET | `/stats` | Platform statistics |
| GET | `/tutors/featured` | Featured tutors |
| GET | `/faqs` | FAQs |
| POST | `/leads/subscribe` | Email lead capture |

### AI (`/api/v1/ai`)
| Method | Path | Middleware | Description |
|---|---|---|---|
| GET | `/health` | - | AI service health check |
| POST | `/tutor/query` | aiLimiter | Socratic AI tutor query |
| POST | `/recommend/tutors` | aiLimiter | Tutor recommendations |
| POST | `/summarize/session` | aiLimiter | Session summary |

### Community (`/api/v1/community`)
| Method | Path | Middleware | Description |
|---|---|---|---|
| GET | `/threads` | - | List threads (paginated, filtered) |
| GET | `/threads/:id` | - | Get thread with comments |
| POST | `/threads` | protect | Create thread |
| PUT | `/threads/:id` | protect | Edit thread |
| DELETE | `/threads/:id` | protect | Soft-delete thread |
| POST | `/threads/:id/vote` | protect | Upvote/downvote |
| POST | `/threads/:id/bookmark` | protect | Toggle bookmark |
| POST | `/threads/:id/solve` | protect | Mark solved |
| GET | `/threads/:id/comments` | - | List comments (tree) |
| POST | `/threads/:id/comments` | protect | Add comment |
| PUT | `/comments/:id` | protect | Edit comment |
| DELETE | `/comments/:id` | protect | Soft-delete comment |
| POST | `/comments/:id/vote` | protect | Vote comment |
| GET | `/leaderboard` | - | Top contributors |
| GET | `/bookmarks` | protect | User bookmarks |

### Study Rooms (`/api/v1/study-rooms`)
| Method | Path | Middleware | Description |
|---|---|---|---|
| GET | `/` | - | List active rooms |
| POST | `/` | protect | Create room |
| GET | `/:id` | - | Room details |
| POST | `/:id/join` | protect | Join room |
| POST | `/:id/leave` | protect | Leave room |
| POST | `/:id/end` | protect | End room (host only) |
| GET | `/:id/messages` | protect | Chat history |
| POST | `/from-thread/:threadId` | protect | Create room from thread |

### Tutors (`/api/v1/tutors`)
| Method | Path | Middleware | Description |
|---|---|---|---|
| GET | `/` | - | All tutors (DB + seeded) |
| GET | `/:id` | - | Tutor detail |
| GET | `/:id/bookings` | - | Tutor bookings |
| POST | `/:id/book` | bookingLimiter | Book session |

### Compile (`/api/v1/compile`)
| Method | Path | Middleware | Description |
|---|---|---|---|
| POST | `/` | globalLimiter | Execute code (Python, JS, C++, Java) |

### Upload (`/api/v1/upload`)
| Method | Path | Middleware | Description |
|---|---|---|---|
| POST | `/media` | protect | Upload files to Cloudinary |

---

## Data Models (Schema Summary)

### User
```js
{
  fullName: String (required),
  email: String (unique, required, lowercase),
  phone: String,
  googleId: String (sparse),
  profileImage: String (default: placeholder),
  provider: 'local' | 'google',
  password: String (conditional on provider, select: false),
  role: 'student' | 'tutor' | 'both' | 'admin',
  bio: String,
  subjects: [String],
  hourlyRate: Number (default: 45),
  rate20Min: Number (default: 15),
  rate30Min: Number (default: 25),
  availability: [{ dayOfWeek, timeStart, timeEnd }],
  karma: Number,
  solvedCount: Number,
  bookmarks: [ObjectId -> DoubtThread],
  tutorBadge: String,
  isTutorVerified: Boolean,
  isVerified: Boolean,
  lastLogin: Date,
  resetPasswordOtp: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}
// Virtuals: name (-> fullName), avatar (-> profileImage)
```

### DoubtThread
```js
{
  title: String (required, max 300),
  content: String (required, max 10000),
  subject: String (required),
  tags: [String],
  codeSnippet: String,
  media: [{ url, type: 'image'|'video', publicId }],
  author: ObjectId -> User (required),
  upvotes: Number (default: 0),
  downvotes: Number (default: 0),
  voters: [{ user: ObjectId, vote: 'up'|'down' }],
  isSolved: Boolean (default: false),
  solvedBy: ObjectId -> User,
  hasAiAnswer: Boolean (default: false),
  commentsCount: Number (default: 0),
  bookmarkedBy: [ObjectId -> User],
  viewCount: Number (default: 0),
}
// Indexes: { subject, isSolved, createdAt }, { author, createdAt }, { tags }, { 'voters.user' }
```

### Comment
```js
{
  thread: ObjectId -> DoubtThread (required),
  parentComment: ObjectId -> Comment (nullable),
  author: ObjectId -> User (required),
  role: 'student' | 'tutor' | 'ai' (default: 'student'),
  isVerified: Boolean (default: false),
  text: String (max 5000),
  media: [{ url, type, publicId }],
  upvotes: Number (default: 0),
  downvotes: Number (default: 0),
  voters: [{ user: ObjectId, vote: 'up'|'down' }],
  isEdited: Boolean (default: false),
  isDeleted: Boolean (default: false),
}
// Indexes: { thread, createdAt }, { parentComment }, { author, createdAt }
```

### StudyRoom
```js
{
  title: String (required),
  subject: String (required),
  description: String (max 500),
  host: ObjectId -> User (required),
  participants: [{
    user: ObjectId -> User,
    joinedAt: Date,
    role: 'host' | 'member'
  }],
  maxCapacity: Number (2-20, default: 8),
  tag: 'Public' | 'Private' | 'Focus' | 'Whiteboard' | 'Code',
  isPrivate: Boolean (default: false),
  accessCode: String,
  linkedThread: ObjectId -> DoubtThread,
  jitsiRoomName: String (unique),
  status: 'active' | 'ended' (default: 'active'),
  endedAt: Date,
}
// Indexes: { status, subject, createdAt }, { host, status }, { linkedThread }
```

### StudyRoomMessage
```js
{
  room: ObjectId -> StudyRoom (required),
  sender: ObjectId -> User (required),
  text: String (required, max 2000),
  type: 'text' | 'system' | 'ai' (default: 'text'),
}
// Index: { room, createdAt }
```

### Karma
```js
{
  user: ObjectId -> User (required),
  action: 'post_thread' | 'comment' | 'reply' | 'upvote_received' | 'downvote_received' | 'solution_accepted' | 'ai_assist',
  points: Number (required),
  reference: ObjectId,
  refModel: 'DoubtThread' | 'Comment',
}
// Indexes: { user, createdAt }, { user, action }
```

### Booking
```js
{
  tutorId: String (required, index),
  studentName: String (required),
  date: String,
  time: String,
  subject: String (required),
  duration: Number (default: 60),
  topic: String,
  fee: Number (required),
  status: 'confirmed' | 'pending' | 'cancelled' (default: 'confirmed'),
}
```

### Tutor (Seeded Catalog)
```js
{
  name: String (required),
  subject: String (required),
  experience: String (required),
  rating: Number (default: 5.0),
  reviews: String (required),
  image: String (required),
  hourlyRate: Number (default: 45),
  isFeatured: Boolean (default: true),
}
```

### Category
```js
{
  title: String (required),
  courseCount: Number (required),
  iconName: String (default: 'BookOpen'),
  slug: String (required, unique),
}
```

### FAQ
```js
{
  q: String (required),
  a: String (required),
  category: String (default: 'General'),
  order: Number (default: 0),
}
```

### Lead
```js
{
  email: String (required),
  role: 'student' | 'tutor' | 'general' (default: 'general'),
  source: String (default: 'homepage'),
}
```

### PlatformStat
```js
{
  numericValue: Number (required),
  suffix: String (required),
  label: String (required),
  order: Number (default: 0),
}
```

### Testimonial
```js
{
  studentName: String (required),
  role: String (required),
  university: String,
  quote: String (required),
  rating: Number (default: 5),
  avatarUrl: String (required),
}
```

---

## Middleware & Security Layer

### Rate Limiters (`src/middleware/rateLimiter.js`)
| Limiter | Scope | Limit | Window |
|---|---|---|---|
| `globalLimiter` | All `/api/v1/*` | 300 req | 15 min |
| `authLimiter` | `/auth`, `/api/auth`, `/api/v1/auth` | 20 req | 15 min |
| `bookingLimiter` | `/api/v1/tutors/:id/book` | 15 req | 15 min |
| `aiLimiter` | `/api/v1/ai/*` | 40 req | 15 min |

### Authentication
- **JWT Secret**: `process.env.JWT_SECRET` (fallback: hardcoded dev key)
- **Token Expiry**: 30 days
- **Two middleware files**: `verifyJWT.js` and `authMiddleware.js` (near-identical)
- **Roles**: student, tutor, both, admin
- **Authorization**: `protect` (auth check) + `authorize(...roles)` (role check)

### Passport.js (Google OAuth)
- Strategy: Google OAuth2 + ID token verification
- Fallback: Unverified JWT decode if Google verification fails ⚠️
- Sessions disabled (`session: false`) — token-based only
- Serialize/deserialize implemented but unused (JWT stateless)

### Security Headers (`server.js`)
- `helmet` with CSP disabled (intentional for inline scripts)
- `crossOriginOpenerPolicy: same-origin-allow-popups`
- `cors({ origin: true, credentials: true })` — allows any origin ⚠️
- `trust proxy: 1` — for cloud platforms (Render)
- `express-async-errors` — auto-catches async errors

---

## Real-time (Socket.IO)

### Namespaces
1. `/community` — Thread live updates
   - `join-thread` / `leave-thread` events
   - Emits: `new-thread`, `new-comment`, `vote-update`, `thread-solved`

2. `/study-room` — Study room live collaboration
   - `join-room` / `leave-room` events
   - Events: `send-message`, `hand-raised`, `mic-toggled`, `camera-toggled`
   - Emits: `new-message`, `participant-joined`, `participant-left`, `room-created`, `room-ended`

### Socket Auth
- Optional JWT extraction from `handshake.auth.token` or `Authorization` header
- User attached to `socket.user` if valid
- Connection allowed even without valid token (anonymous access)

---

## Controllers (Key Logic)

### authController.js
- Signup: Validates input, checks duplicate email, creates User with hashed password
- Login: Finds user, includes password field, bcrypt compare
- OTP Flow: 6-digit OTP + crypto random token, 15-min expiry
- Profile Update: Handles name, phone, role, bio, rates, availability, password
- Password Reset: Multi-path lookup (OTP or token), clears all reset fields on success

### auth.controller.js
- Google Popup Auth: Verifies Google ID token via `@google/auth-library`
- Fallback: Unverified base64 decode of JWT payload (insecure)
- Callback: Returns HTML with postMessage or redirect
- getMe: Returns full user object (no password)

### communityController.js (21.5KB — largest controller)
- Karma system: 7 actions with point values
- AI bot: Gemini 1.5 Flash via prompt engineering (Socratic method — 2 guiding questions)
- Thread CRUD: Create, read, update, delete (soft)
- Voting: Idempotent up/down, toggle, switch
- Comments: Nested replies, role tagging, soft delete
- Bookmarking: Toggle on thread
- Solve flow: Author or admin can mark solved, awards 50 karma to solver
- Leaderboard: Top users by karma

### studyRoomController.js
- Room creation with UUID-based Jitsi room name
- Capacity checks, private room access codes
- Host transfer on host leave
- Auto-end when empty
- Thread-linked rooms
- Real-time emit on all actions

### tutorController.js
- Hybrid tutor source: DB + seeded fallback
- User tutors merged from User model where role is tutor/both
- Duplicate detection by name
- Booking: Time-slot conflict detection, 20-char hex ID match

### compileController.js
- Executes code in temp directory (auto-cleaned)
- Languages: Python, JavaScript, C++, Java, SQL (stub)
- Timeout: 8s compile, 5s execution
- Max buffer: 1MB
- No auth required ⚠️
- STDIN support for interactive programs

### homepageController.js
- Graceful degradation: DB data with hardcoded fallback
- Lead capture endpoint
- All endpoints return fallback data on DB failure

---

## Utilities

### generateToken.js
- JWT sign user ID, 30-day expiry
- Uses same secret fallback as middleware

### sendEmail.js
Three-tier delivery:
1. Brevo API v3 (HTTPS 443 — cloud-friendly)
2. Gmail SMTP (port 465)
3. Console log fallback (never fails)

Security concern: Hardcoded default credentials in fallback chain

### seed.js
- Deletes all data on each run (`deleteMany({})`) ⚠️
- Seeds: Users (2), PlatformStats (4), Tutors (3), FAQs (5)

---

## Environment Variables (.env.example)

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/socrates
JWT_SECRET=socrates_secret_jwt_key_2026_dev
JWT_EXPIRE=30d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
FRONTEND_URL=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
EMAIL_FROM_NAME=SOCRATES
BREVO_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GEMINI_API_KEY=
```

---

## Critical Security Issues

| # | Issue | File | Severity |
|---|---|---|---|
| 1 | Hardcoded credentials in `.env` | `.env` | Critical |
| 2 | Unverified JWT decode fallback | `passport.js:103-119` | Critical |
| 3 | `Math.random()` for OTP | `authController.js:228` | High |
| 4 | CORS allows all origins | `server.js:41` | High |
| 5 | Compile endpoint unprotected | `compileRoutes.js` | High |
| 6 | XSS risk in email template | `sendEmail.js:126` | Medium |
| 7 | Seed script nukes DB | `seed.js:21` | Medium |
| 8 | Stack traces leaked to client | `server.js:83` | Medium |
| 9 | No input sanitization | Multiple | Medium |
| 10 | Inconsistent rate limiting | Route definitions | Low |
| 11 | Duplicate auth middleware files | `verifyJWT.js` vs `authMiddleware.js` | Low |

---

## Architecture Notes

- **Monorepo pattern**: Backend + Frontend + AI-service coexist
- **Graceful degradation**: Every DB query has hardcoded fallback data
- **Microservice proxy**: Backend proxies AI requests to separate FastAPI service
- **Dual auth routes**: Both `/auth/*` and `/api/v1/auth/*` mounted (redundancy)
- **Socket.IO stores reference**: `app.set('io', io)` — controllers access via `req.app.get('io')`
- **Socratic AI**: First-responder bot on new threads (Gemini 1.5 Flash, async via `setImmediate`)
- **Karma system**: Reputation scoring with audit trail model

---

## Dependencies Summary

### Runtime
```
axios, bcrypt, cloudinary, compression, cors, dotenv, express,
express-async-errors, express-rate-limit, express-validator,
google-auth-library, helmet, joi, jsonwebtoken, mongoose, morgan,
multer, nodemailer, passport, passport-google-oauth20, razorpay,
sanitize-html, sharp, socket.io, uuid
```

### Dev
```
eslint, nodemon, prettier
```

---

## Docker Configuration

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
ENV PORT=5000
CMD ["npm", "start"]
```

`.dockerignore` excludes: `node_modules`, `.env`, `.git`, `.vscode`, `.agents`