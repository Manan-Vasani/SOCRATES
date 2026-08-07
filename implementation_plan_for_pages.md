# Backend Implementation Plan: Community (Doubt Board) & Study Rooms

> **Scope**: Build all backend APIs, models, Socket.IO events, and AI integrations needed to power the [CommunityPage.tsx](file:///d:/SOCRATES/frontend/src/pages/CommunityPage.tsx) and [StudyRoom.tsx](file:///d:/SOCRATES/frontend/src/pages/StudyRoom.tsx) pages — currently running on **100% hardcoded demo data**.

---

## User Review Required

> [!IMPORTANT]
> The frontend for both pages already exists with rich UI but zero backend connectivity. Every interaction (post, vote, comment, study room join) currently operates on local `useState` arrays. This plan creates the full backend to replace that.

> [!WARNING]
> **Socratic AI Bot** (auto-comment on new doubts) requires a **Gemini API key** (`GEMINI_API_KEY` in `.env`). Without it, the first-responder bot feature will be skipped (threads still post, just no AI comment).

> [!IMPORTANT]
> **Socket.IO** is currently imported in [server.js](file:///d:/SOCRATES/backend/src/server.js) dependencies but the `/socket` directory is **empty** — no socket server is initialized. This plan sets up the Socket.IO server as a prerequisite.

## Open Questions

> [!IMPORTANT]
> 1. **Media Uploads**: The community page supports image/video attachments on threads & comments. Should we use **Cloudinary** (already in your stack) for media storage, or start with a simpler local disk/multer approach for MVP?
> 2. **Karma System**: The doc specifies `+10 Karma per upvote on tutor solutions`, `+15 Karma per comment`. Should karma be stored on the **User model** directly (simple) or in a separate **Karma/Activity ledger collection** (auditable)?
> 3. **Study Room Video**: The frontend uses hardcoded Jitsi room IDs. Should the backend generate unique Jitsi room names per session, or keep it frontend-only for now?
> 4. **Moderation**: Should we integrate **OpenAI Moderation API** for content safety on community posts from Day 1, or add it as a later phase?

---

## Proposed Changes

### Phase 0 — Prerequisites (Socket.IO Server Setup)

---

#### [NEW] [socketServer.js](file:///d:/SOCRATES/backend/src/socket/socketServer.js)

Initialize Socket.IO attached to the existing HTTP server. This is currently missing — the `/socket` directory is empty.

```javascript
// Creates and exports the io instance
// Handles: connection, disconnect, join-room, leave-room
// Namespaces: /community (threads), /study-room (live rooms)
```

#### [MODIFY] [server.js](file:///d:/SOCRATES/backend/src/server.js)

- Import and attach Socket.IO to the `server` instance
- Pass `io` to route handlers that need real-time broadcasting
- Add community and study-room route mounts

```diff
+const { createSocketServer } = require('./socket/socketServer');
+const communityRoutes = require('./routes/communityRoutes');
+const studyRoomRoutes = require('./routes/studyRoomRoutes');

 const server = app.listen(PORT, () => { ... });

+// Initialize Socket.IO
+const io = createSocketServer(server);
+app.set('io', io);

+// Mount new routes
+app.use('/api/v1/community', communityRoutes);
+app.use('/api/v1/study-rooms', studyRoomRoutes);
```

---

### Phase 1 — Community Feature (Doubt Board)

This is the core of the [SOCRATES_Community_Model.md](file:///d:/SOCRATES/docs/SOCRATES_Community_Model.md) — a Reddit/StackOverflow-style doubt-clearing forum.

---

#### [NEW] [DoubtThread.js](file:///d:/SOCRATES/backend/src/models/DoubtThread.js)

The main "post" model — a student's doubt/question.

```javascript
const doubtThreadSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true, maxlength: 300 },
  content:       { type: String, required: true, maxlength: 10000 },
  subject:       { type: String, required: true, trim: true },
  tags:          [{ type: String, trim: true }],
  codeSnippet:   { type: String, default: '' },
  media:         [{ url: String, type: { type: String, enum: ['image', 'video'] }, publicId: String }],
  
  author:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  upvotes:       { type: Number, default: 0 },
  downvotes:     { type: Number, default: 0 },
  voters:        [{
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote:   { type: String, enum: ['up', 'down'] }
  }],
  
  isSolved:      { type: Boolean, default: false },
  solvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  hasAiAnswer:   { type: Boolean, default: false },
  
  commentsCount: { type: Number, default: 0 },
  bookmarkedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viewCount:     { type: Number, default: 0 },
}, { timestamps: true });

// Indexes (aligned with SOCRATES_Final_Tech_Stack.md)
doubtThreadSchema.index({ subject: 1, isSolved: 1, createdAt: -1 }); // Feed filtering
doubtThreadSchema.index({ author: 1, createdAt: -1 });                 // User's posts
doubtThreadSchema.index({ tags: 1 });                                   // Tag search
doubtThreadSchema.index({ 'voters.user': 1 });                         // Prevent double-vote
```

#### [NEW] [Comment.js](file:///d:/SOCRATES/backend/src/models/Comment.js)

Supports **infinite nested replies** (adjacency list with `parentComment` ref).

```javascript
const commentSchema = new mongoose.Schema({
  thread:         { type: mongoose.Schema.Types.ObjectId, ref: 'DoubtThread', required: true },
  parentComment:  { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  
  author:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:           { type: String, enum: ['student', 'tutor', 'ai'], default: 'student' },
  isVerified:     { type: Boolean, default: false },
  
  text:           { type: String, required: true, maxlength: 5000 },
  media:          [{ url: String, type: { type: String, enum: ['image', 'video'] }, publicId: String }],
  
  upvotes:        { type: Number, default: 0 },
  downvotes:      { type: Number, default: 0 },
  voters:         [{
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote:  { type: String, enum: ['up', 'down'] }
  }],
  
  isEdited:       { type: Boolean, default: false },
  isDeleted:      { type: Boolean, default: false },  // Soft delete (keeps thread structure)
}, { timestamps: true });

// Indexes
commentSchema.index({ thread: 1, createdAt: 1 });          // Load thread comments in order
commentSchema.index({ parentComment: 1 });                   // Find replies
commentSchema.index({ author: 1, createdAt: -1 });          // User's comment history
```

#### [NEW] [Karma.js](file:///d:/SOCRATES/backend/src/models/Karma.js)

Activity ledger for transparent karma tracking (per [SOCRATES_Community_Model.md §3](file:///d:/SOCRATES/docs/SOCRATES_Community_Model.md) Karma & Leaderboards).

```javascript
const karmaSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:     { type: String, enum: [
    'post_thread', 'comment', 'reply', 'upvote_received',
    'downvote_received', 'solution_accepted', 'ai_assist'
  ], required: true },
  points:     { type: Number, required: true },   // +10, +15, -5, etc.
  reference:  { type: mongoose.Schema.Types.ObjectId },  // thread/comment ID
  refModel:   { type: String, enum: ['DoubtThread', 'Comment'] },
}, { timestamps: true });

karmaSchema.index({ user: 1, createdAt: -1 });   // Karma history
karmaSchema.index({ user: 1, action: 1 });        // Aggregation by action type
```

#### [MODIFY] [User.js](file:///d:/SOCRATES/backend/src/models/User.js)

Add community-specific fields to the existing User model:

```diff
+  karma:           { type: Number, default: 0 },
+  solvedCount:     { type: Number, default: 0 },
+  bookmarks:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'DoubtThread' }],
+  tutorBadge:      { type: String, default: null },  // e.g., 'Verified Master', 'Physics Scholar'
+  isTutorVerified: { type: Boolean, default: false },
```

---

#### [NEW] [communityRoutes.js](file:///d:/SOCRATES/backend/src/routes/communityRoutes.js)

All REST endpoints for the Community/Doubt Board:

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/threads` | Optional | List threads (paginated, filterable by subject/solved/search) |
| `GET` | `/threads/:id` | Optional | Get single thread with comments tree |
| `POST` | `/threads` | **Required** | Create a new doubt thread |
| `PUT` | `/threads/:id` | **Required** | Edit own thread |
| `DELETE` | `/threads/:id` | **Required** | Delete own thread (soft-delete) |
| `POST` | `/threads/:id/vote` | **Required** | Upvote/downvote a thread |
| `POST` | `/threads/:id/bookmark` | **Required** | Toggle bookmark |
| `POST` | `/threads/:id/solve` | **Required** | Mark thread as solved (OP or admin only) |
| `GET` | `/threads/:id/comments` | Optional | Get comments for a thread (nested tree) |
| `POST` | `/threads/:id/comments` | **Required** | Add a comment/reply to a thread |
| `PUT` | `/comments/:id` | **Required** | Edit own comment |
| `DELETE` | `/comments/:id` | **Required** | Soft-delete own comment |
| `POST` | `/comments/:id/vote` | **Required** | Upvote/downvote a comment |
| `GET` | `/leaderboard` | Public | Top contributors (karma aggregation) |
| `GET` | `/bookmarks` | **Required** | User's bookmarked threads |

#### [NEW] [communityController.js](file:///d:/SOCRATES/backend/src/controllers/communityController.js)

Business logic for all community endpoints. Key behaviors:

- **Thread listing**: MongoDB aggregation with `$lookup` for author info, sorting by `hot` (upvotes × recency decay), `new`, or `top`
- **Voting**: Idempotent — checks existing vote in `voters` array, prevents double-voting, atomically updates upvote/downvote counts
- **Nested comments**: Fetches flat list from DB, reconstructs tree in-memory using `parentComment` references (efficient for moderate depth)
- **Karma awarding**: On successful post/comment/upvote, creates `Karma` ledger entry and increments `User.karma` atomically
- **AI First Responder**: On `POST /threads`, after save, asynchronously calls Gemini API with thread content → creates an AI comment (role: 'ai') as the first reply

```javascript
// Socratic AI Bot auto-comment (async, non-blocking)
async function generateSocraticReply(thread) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `You are a Socratic tutor. A student posted this doubt:
Title: ${thread.title}
Subject: ${thread.subject}
Content: ${thread.content}
${thread.codeSnippet ? `Code: ${thread.codeSnippet}` : ''}

DO NOT give the answer. Ask 2 guiding questions to help the student discover the solution themselves.`;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

---

### Phase 2 — Study Room Feature

Per [SOCRATES_Community_Model.md §4](file:///d:/SOCRATES/docs/SOCRATES_Community_Model.md): "Students can launch a free, temporary voice/video study room directly from a doubt thread."

---

#### [MODIFY] [StudyRoom.js](file:///d:/SOCRATES/backend/src/models/StudyRoom.js)

The existing model is barebones (6 fields). Expand it significantly:

```diff
 const studyRoomSchema = new mongoose.Schema(
   {
     title:         { type: String, required: true, trim: true },
     subject:       { type: String, required: true, trim: true },
-    activeMembers: { type: Number, default: 1 },
-    maxCapacity:   { type: Number, default: 8 },
-    hostName:      { type: String, required: true },
-    tag:           { type: String, default: 'Public' },
-    isPrivate:     { type: Boolean, default: false },
+    description:   { type: String, default: '', maxlength: 500 },
+    
+    host:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
+    participants:  [{
+      user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
+      joinedAt: { type: Date, default: Date.now },
+      role:     { type: String, enum: ['host', 'member'], default: 'member' }
+    }],
+    maxCapacity:   { type: Number, default: 8, min: 2, max: 20 },
+    
+    tag:           { type: String, enum: ['Public', 'Private', 'Focus', 'Whiteboard', 'Code'], default: 'Public' },
+    isPrivate:     { type: Boolean, default: false },
+    accessCode:    { type: String, default: null },  // For private rooms
+    
+    linkedThread:  { type: mongoose.Schema.Types.ObjectId, ref: 'DoubtThread', default: null },
+    jitsiRoomName: { type: String, unique: true },  // Generated unique room name for Jitsi
+    
+    status:        { type: String, enum: ['active', 'ended'], default: 'active' },
+    endedAt:       { type: Date, default: null },
   },
   { timestamps: true }
 );
+
+// Indexes
+studyRoomSchema.index({ status: 1, subject: 1, createdAt: -1 }); // Browse active rooms
+studyRoomSchema.index({ host: 1, status: 1 });                    // Host's rooms
+studyRoomSchema.index({ jitsiRoomName: 1 }, { unique: true });    // Lookup by Jitsi room
+studyRoomSchema.index({ linkedThread: 1 });                        // Rooms from doubt threads
```

#### [NEW] [StudyRoomMessage.js](file:///d:/SOCRATES/backend/src/models/StudyRoomMessage.js)

Chat messages within a study room (persisted for session history).

```javascript
const studyRoomMessageSchema = new mongoose.Schema({
  room:    { type: mongoose.Schema.Types.ObjectId, ref: 'StudyRoom', required: true },
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, required: true, maxlength: 2000 },
  type:    { type: String, enum: ['text', 'system', 'ai'], default: 'text' },
}, { timestamps: true });

studyRoomMessageSchema.index({ room: 1, createdAt: 1 }); // Load chat in order
```

---

#### [NEW] [studyRoomRoutes.js](file:///d:/SOCRATES/backend/src/routes/studyRoomRoutes.js)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/` | Optional | List active study rooms (filterable by subject/tag) |
| `POST` | `/` | **Required** | Create a new study room |
| `GET` | `/:id` | Optional | Get room details + participants |
| `POST` | `/:id/join` | **Required** | Join a study room |
| `POST` | `/:id/leave` | **Required** | Leave a study room |
| `POST` | `/:id/end` | **Required** | End a study room (host only) |
| `GET` | `/:id/messages` | **Required** | Get room chat history (paginated) |
| `POST` | `/from-thread/:threadId` | **Required** | Create room linked to a doubt thread |

#### [NEW] [studyRoomController.js](file:///d:/SOCRATES/backend/src/controllers/studyRoomController.js)

Key behaviors:

- **Room creation**: Generates unique `jitsiRoomName` using `uuid` (e.g., `socrates-${uuid.v4().slice(0,8)}`)
- **Join/Leave**: Updates `participants` array, emits Socket.IO events to all room members
- **Capacity check**: Rejects join if `participants.length >= maxCapacity`
- **Private rooms**: Validates `accessCode` on join
- **Auto-cleanup**: Rooms with `status: 'active'` and no participants for >30min auto-close (via TTL or cron)
- **Thread linking**: When created from a doubt thread, stores `linkedThread` reference

---

### Phase 3 — Socket.IO Real-Time Events

#### [NEW] [socketServer.js](file:///d:/SOCRATES/backend/src/socket/socketServer.js)

Complete Socket.IO server with two namespaces:

**Community Namespace (`/community`)**:
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join-thread` | Client → Server | `{ threadId }` | User joins thread room for live updates |
| `leave-thread` | Client → Server | `{ threadId }` | User leaves thread room |
| `new-comment` | Server → Client | `{ comment }` | Broadcast new comment to all thread viewers |
| `vote-update` | Server → Client | `{ threadId, upvotes }` | Live vote count update |
| `thread-solved` | Server → Client | `{ threadId }` | Thread marked as solved |

**Study Room Namespace (`/study-room`)**:
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join-room` | Client → Server | `{ roomId, userId }` | Join a study room |
| `leave-room` | Client → Server | `{ roomId, userId }` | Leave a study room |
| `participant-joined` | Server → Client | `{ participant }` | New member joined |
| `participant-left` | Server → Client | `{ userId }` | Member left |
| `send-message` | Client → Server | `{ roomId, text }` | Send chat message |
| `new-message` | Server → Client | `{ message }` | Broadcast chat message |
| `room-ended` | Server → Client | `{ roomId }` | Host ended the room |
| `hand-raised` | Both | `{ userId, isRaised }` | Toggle hand raise |
| `mic-toggled` | Both | `{ userId, isMicOn }` | Mic state sync |
| `camera-toggled` | Both | `{ userId, isCameraOn }` | Camera state sync |

---

### Phase 4 — Media Upload Support

#### [NEW] [uploadRoutes.js](file:///d:/SOCRATES/backend/src/routes/uploadRoutes.js)

```
POST /api/v1/upload/media  →  Multer (memory) → Sharp (resize) → Cloudinary → return { url, publicId, type }
```

Reusable for both community threads/comments and study room chat attachments.

#### [NEW] [cloudinaryConfig.js](file:///d:/SOCRATES/backend/src/config/cloudinaryConfig.js)

Configure Cloudinary SDK with env vars (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).

---

## Summary of All New/Modified Files

| Status | File | Description |
|--------|------|-------------|
| **NEW** | `models/DoubtThread.js` | Doubt thread schema (title, content, votes, tags, media) |
| **NEW** | `models/Comment.js` | Nested comment schema (adjacency list) |
| **NEW** | `models/Karma.js` | Karma activity ledger |
| **NEW** | `models/StudyRoomMessage.js` | Study room chat message schema |
| **MODIFY** | `models/User.js` | Add `karma`, `solvedCount`, `bookmarks`, `tutorBadge`, `isTutorVerified` |
| **MODIFY** | `models/StudyRoom.js` | Expand with host ref, participants, jitsiRoomName, status, linkedThread |
| **NEW** | `controllers/communityController.js` | All community CRUD + voting + AI bot |
| **NEW** | `controllers/studyRoomController.js` | Room CRUD + join/leave + chat |
| **NEW** | `routes/communityRoutes.js` | 16 community REST endpoints |
| **NEW** | `routes/studyRoomRoutes.js` | 8 study room REST endpoints |
| **NEW** | `routes/uploadRoutes.js` | Media upload endpoint |
| **NEW** | `socket/socketServer.js` | Socket.IO server + community & study-room namespaces |
| **NEW** | `config/cloudinaryConfig.js` | Cloudinary SDK setup |
| **MODIFY** | `server.js` | Mount Socket.IO, community routes, study-room routes, upload routes |

---

## Verification Plan

### Automated Tests

```bash
# After implementation, test each endpoint with:
cd backend && npm run dev

# Postman / Thunder Client test sequence:
# 1. POST /api/v1/auth/login          → Get JWT token
# 2. POST /api/v1/community/threads   → Create a doubt thread (verify AI auto-comment)
# 3. GET  /api/v1/community/threads   → List threads (verify pagination, filters)
# 4. POST /api/v1/community/threads/:id/vote      → Vote (verify idempotent)
# 5. POST /api/v1/community/threads/:id/comments   → Add comment (verify karma)
# 6. GET  /api/v1/community/leaderboard            → Verify karma ranking
# 7. POST /api/v1/study-rooms         → Create room (verify jitsiRoomName generated)
# 8. POST /api/v1/study-rooms/:id/join → Join room (verify capacity check)
# 9. POST /api/v1/upload/media        → Upload image (verify Cloudinary URL returned)
```

### Manual Verification

- Connect frontend `CommunityPage.tsx` to the new APIs and verify:
  - Threads load from DB instead of hardcoded `INITIAL_THREADS`
  - New posts persist across page reloads
  - Votes persist and are unique per user
  - AI bot comment appears within ~5 seconds of posting
  - Comments nest correctly to unlimited depth
  - Leaderboard shows real karma data
- Connect frontend `StudyRoom.tsx` to the new APIs and verify:
  - Room list shows real active rooms
  - Joining a room generates a valid Jitsi room name
  - Chat messages broadcast in real-time via Socket.IO
  - Participant count updates live when users join/leave

### Database Verification

```bash
# Verify indexes are being used:
mongosh --eval "db.doubtthreads.getIndexes()"
mongosh --eval "db.comments.getIndexes()"
mongosh --eval "db.studyrooms.getIndexes()"
```
