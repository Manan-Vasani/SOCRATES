# SOCRATES: DevOps & Infrastructure Guide
## Architecture, Docker, CI/CD, Security, Database Optimization, Monitoring

> **Scope**: Production-grade infrastructure setup for the SOCRATES platform
> **Reference**: Level 1 (During Project) — see `SOCRATES_Cloud_SystemDesign_Track.md`. This guide focuses on implementation details and Level 2+.

---

## 🐳 DOCKER IMPLEMENTATION

### Backend Dockerfile
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

### AI Service Dockerfile
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

### Docker Compose (Local Development)
```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    depends_on:
      - mongo
      - redis

  ai-service:
    build: ./ai-service
    ports:
      - "8001:8001"
    env_file:
      - ./ai-service/.env
    depends_on:
      - redis

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme
    volumes:
      - n8n-data:/home/node/.n8n

volumes:
  mongo-data:
  redis-data:
  n8n-data:
```

**Run**: `docker-compose up -d` → All services on localhost ports.

---

## ⚙️ GITHUB ACTIONS CI/CD (`.github/workflows/ci.yml`)

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

  test-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: cd ai-service && pip install -r requirements.txt
      - run: cd ai-service && pytest

  deploy:
    needs: [test-backend, test-frontend, test-ai]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Auto-deploy triggered"
      # Vercel and Render auto-deploy from GitHub on main branch push
```

---

## 🔐 ENVIRONMENT & SECRET MANAGEMENT

### `.env.example` (Committed to Git)
```env
# Backend
PORT=5000
MONGODB_URI=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GEMINI_API_KEY=
NODEMAILER_EMAIL=
NODEMAILER_PASSWORD=
CLIENT_URL=http://localhost:5173
N8N_WEBHOOK_VERIFY_TUTOR=http://localhost:5678/webhook/tutor-verify
N8N_WEBHOOK_SUMMARY=http://localhost:5678/webhook/session-summary

# AI Service
AI_SERVICE_URL=http://localhost:8001
MONGODB_URI=
GEMINI_API_KEY=
REDIS_URL=redis://localhost:6379

# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8001
VITE_SOCKET_URL=http://localhost:5000
```

### Production Secrets (NEVER in Git)
Set in **Render Dashboard** (Backend) and **Vercel Dashboard** (Frontend):
- `MONGODB_URI` → Atlas connection string
- `JWT_SECRET` → 64-char random
- `RAZORPAY_KEY_SECRET` → From Razorpay dashboard
- `GEMINI_API_KEY` → From Google AI Studio
- `NODEMAILER_PASSWORD` → Gmail App Password
- `CLIENT_URL` → `https://your-app.vercel.app`

---

## 🛡️ 9-LAYER SECURITY IMPLEMENTATION (Backend)

```javascript
// backend/server.js (middleware order matters!)
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const { auth } = require('./middleware/auth');
const { validate } = require('./middleware/validate');

const app = express();

// Layer 1: Cloudflare (external - DDoS, SSL)
// Layer 2: Rate Limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' },
  keyGenerator: (req) => req.ip
}));

// Layer 3: Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "wss://*.jitsi.net"]
    }
  }
}));

// Layer 4: CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Layer 5: Body parsing + Sanitization
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [],
          allowedAttributes: {}
        });
      }
    });
  }
  next();
});

// Layer 6: JWT Auth
app.use('/api', auth); // Protected routes

// Layer 7: Validation (Joi/Zod per route)
// Applied in route handlers

// Layer 8: Controllers (Business Logic)

// Layer 9: MongoDB (Mongoose)
```

---

## 📊 DATABASE INDEXING (Critical for Performance)

```javascript
// backend/src/models/Tutor.js
tutorSchema.index({ subjects: 1, hourlyRate: 1, rating: -1 }); // Compound for search

// backend/src/models/Session.js
sessionSchema.index({ studentId: 1, status: 1 });           // "My upcoming sessions"
sessionSchema.index({ tutorId: 1, startTime: -1 });         // "Tutor's session history"
sessionSchema.index({ tutorId: 1, status: 1, startTime: 1 }); // Booking conflicts

// backend/src/models/Message.js
messageSchema.index({ conversationId: 1, createdAt: 1 });   // Chat history

// backend/src/models/Notification.js
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // TTL 30 days

// backend/src/models/Availability.js
availabilitySchema.index({ tutorId: 1, dayOfWeek: 1 });

// backend/src/models/Review.js
reviewSchema.index({ tutorId: 1, createdAt: -1 });
```

**Verify**: `db.collection.explain('executionStats').find({...})` → Look for `IXSCAN` not `COLLSCAN`.

---

## 📝 STRUCTURED LOGGING (Winston)

```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'socrates-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = require('uuid').v4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Usage in controllers
logger.info('Session booked', { 
  requestId: req.requestId,
  sessionId, 
  studentId, 
  tutorId,
  amount 
});

logger.error('Payment failed', { 
  requestId: req.requestId,
  error: err.message, 
  razorpayOrderId,
  stack: err.stack 
});
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Render (Backend + AI Service)
- [ ] Connect GitHub repo
- [ ] Build Command: `npm ci && npm run build` (or `pip install -r requirements.txt`)
- [ ] Start Command: `node server.js` / `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Environment Variables: All from `.env.example` (production values)
- [ ] Health Check Path: `/health`
- [ ] Auto-Deploy: Yes (on main branch)

### Vercel (Frontend)
- [ ] Connect GitHub repo
- [ ] Framework Preset: Vite
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Environment Variables: `VITE_API_URL`, `VITE_AI_URL`, `VITE_SOCKET_URL`
- [ ] Auto-Deploy: Yes (on main branch)

### MongoDB Atlas
- [ ] Cluster: M0 Free (512MB)
- [ ] Network Access: Add Render IPs (or 0.0.0.0/0 for dev)
- [ ] Database User: Read/Write
- [ ] Collections: Created via Mongoose auto-index

### Cloudinary
- [ ] Cloud Name, API Key, API Secret in env
- [ ] Upload Preset: `socrates_profile` (signed)
- [ ] Transformation: `w_400,h_400,c_fill,g_face` for avatars

### n8n
- [ ] Docker: `docker run -d --name n8n -p 5678:5678 -v n8n-data:/home/node/.n8n n8nio/n8n`
- [ ] Import workflows JSON
- [ ] Configure webhook URLs in backend `.env`
- [ ] Test each workflow execution

---

## 📈 MONITORING & ALERTING (Post-Launch)

| Tool | Purpose | Setup |
|------|---------|-------|
| **Render Metrics** | CPU, Memory, Requests, Latency | Built-in |
| **Vercel Analytics** | Core Web Vitals, Traffic | Enable in dashboard |
| **MongoDB Atlas** | Query performance, Connections | Built-in |
| **Winston Logs** | Error tracking, Debugging | File + CloudWatch (later) |
| **UptimeRobot** | External uptime monitoring | Free tier: 50 monitors |

**Alerts to Configure**:
- Backend 5xx > 1% for 5min
- API p99 latency > 2s
- MongoDB connections > 80% limit
- Disk usage > 80%

---

## 🔮 LEVEL 2+: POST-PROJECT GROWTH (See Cloud System Design Track)

- AWS Migration (EC2, S3, CloudFront, SES, CloudWatch, IAM)
- Redis Caching (tutor search, profiles, sessions)
- BullMQ / RabbitMQ (email, AI summaries, notifications)
- k6 Load Testing (100 VUs, 30s)
- Terraform IaC (full infrastructure as code)
- HLD Document (System Design interview prep)

---

**This guide covers implementation. For learning roadmap, see `SOCRATES_Cloud_SystemDesign_Track.md`.**