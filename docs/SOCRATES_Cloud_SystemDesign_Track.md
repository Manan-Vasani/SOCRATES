# SOCRATES: Cloud & System Design — Your Personal Growth Track
## What YOU Should Do Beyond the Base Project

> **Your field**: Cloud Computing & System Design  
> **Your role in team**: Likely Member 4 (Backend + DevOps + AI/ML) — the most aligned with your career  
> **Goal**: Turn a college SGP into a portfolio piece that shows real cloud & system design skills

> **Note**: Level 1 (During Project) implementation details are in `DEVOPS_GUIDE.md`. This doc focuses on Level 2+ (Post-Project) growth.

---

## LEVEL 2 — DO AFTER THE PROJECT (Portfolio & Interview Prep)

These are things you add after the SGP is submitted, to make this project shine on your resume and in interviews.

### 8. Write a System Design Document (HLD)

Create a proper High-Level Design doc like engineers write at companies:

```markdown
# SOCRATES: High-Level Design Document

## 1. Requirements
  - Functional: User auth, search, booking, payments, chat, video, AI tutoring, admin
  - Non-Functional: <100ms API response (p99), 99.9% uptime, handle 1000 concurrent users

## 2. Capacity Estimation
  - 1000 daily active users
  - 50 sessions/day average
  - 500 messages/day
  - Storage: ~2GB/month (profiles + chat + embeddings)

## 3. API Design (REST + WebSocket)
  - REST: Auth, Users, Tutors, Sessions, Payments, Reviews, Admin, AI proxy
  - WebSocket: Chat, Typing, Presence, Notifications
  - AI Service: Matching, Recommendations, Sentiment, Intent, Prediction, Scheduling

## 4. Database Design
  - 8 Collections: Users, Tutors, Sessions, Payments, Reviews, Messages, Availability, Notifications
  - Relationships: User→Tutor (1:1), User→Sessions (1:M), Session→Payment (1:1), etc.
  - Indexes: Compound (subjects+rate+rating), TTL (notifications), Unique (booking slots)
  - Why NoSQL: Flexible schemas, horizontal scaling, JSON-native, tutor profile variability

## 5. High-Level Architecture
  - See diagram in DEVOPS_GUIDE.md / Final Tech Stack
  - Components: FE (Vercel), BE (Render), AI (Render), MongoDB Atlas, Cloudinary, Jitsi, n8n, Redis

## 6. Detailed Component Design
  - Auth Flow: JWT access (15min) + Refresh (7d, httpOnly cookie) → Rotation on use
  - Booking Flow: State machine (available → booked → in_progress → completed/cancelled)
  - Payment Flow: Razorpay Order → Client Checkout → Webhook Verify → Session Confirm
  - Chat Flow: Socket.IO rooms (userId) → Persist to MongoDB → Push to recipient
  - AI Flow: BE proxies → AI Service (Local ML) → Gemini (Socratic only) → n8n (async)

## 7. Scalability Considerations
  - Horizontal: BE stateless (scale Render instances), AI Service stateless
  - Database: Read replicas (Atlas), Sharding by tenant (future), Redis cache
  - Caching: Redis for tutor search (5min), profiles (10min), embeddings
  - Queue: BullMQ for email, AI summaries, notifications, image processing
  - CDN: Cloudflare for static assets, Cloudinary for images

## 8. Failure Handling
  - MongoDB down → Read from replica, queue writes, degrade gracefully
  - Razorpay webhook fails → Idempotent handler, retry with exponential backoff, manual reconcile
  - Socket.IO disconnect → Client reconnect (exponential backoff), fetch missed messages
  - AI Service down → Fallback to Gemini only, cache last embeddings
  - n8n down → Queue webhook payloads, retry on recovery
  - Jitsi down → Fallback to Google Meet links (manual)
```

---

### 9. Migrate to AWS (Free Tier)

After the project is done, migrate the entire thing to AWS to learn real cloud:

```
Current (Free Tiers)              AWS Migration (Free Tier)
────────────────────              ──────────────────────────
Vercel (Frontend)            →    AWS S3 + CloudFront
Render (Backend)             →    AWS EC2 (t2.micro) or ECS Fargate
MongoDB Atlas                →    AWS DocumentDB or keep Atlas
Cloudinary                   →    AWS S3 + Lambda (image resize)
Email (Gmail)                →    AWS SES
—                            →    AWS Route 53 (DNS)
—                            →    AWS CloudWatch (monitoring)
—                            →    AWS IAM (access management)
```

**AWS services to learn through this migration**:

| Service | What You'll Learn |
|---------|------------------|
| **EC2** | Virtual machines, SSH, security groups, user data |
| **S3** | Object storage, bucket policies, static hosting, lifecycle |
| **CloudFront** | CDN, edge caching, HTTPS, origin shielding |
| **ECS / Fargate** | Container orchestration (run your Docker images) |
| **RDS / DocumentDB** | Managed databases, backups, read replicas |
| **SES** | Transactional email at scale, bounce/complaint handling |
| **CloudWatch** | Logs, metrics, alarms, dashboards, X-Ray tracing |
| **IAM** | Users, roles, policies (most important for cloud jobs) |
| **Route 53** | DNS management, health checks, failover |
| **Elastic Load Balancer** | Distribute traffic across instances, health checks |
| **ElastiCache** | Managed Redis for caching layer |
| **SQS / SNS** | Message queues, pub/sub for async processing |

---

### 10. Add a Caching Layer (Redis)

```
Without Redis:
  Client → Backend → MongoDB (every request hits DB)
  Response time: 50-200ms

With Redis:
  Client → Backend → Redis (cached?) → YES → return cached data (2ms)
                                      → NO  → MongoDB → cache in Redis → return
  Response time: 2-50ms
```

Things to cache:
- Tutor search results (cache for 5 minutes, key: `search:{filters_hash}`)
- Tutor profile data (cache for 10 minutes, key: `tutor:{id}`)
- Session counts / stats for admin dashboard (cache for 1 minute)
- Popular search queries (cache for 1 hour)
- AI embeddings (cache for 24 hours, key: `embedding:{tutor_id}`)

```javascript
// backend/src/utils/cache.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

async function getTutorProfile(tutorId) {
  const cached = await redis.get(`tutor:${tutorId}`);
  if (cached) return JSON.parse(cached);

  const tutor = await Tutor.findById(tutorId).populate('userId');
  await redis.setex(`tutor:${tutorId}`, 600, JSON.stringify(tutor));
  return tutor;
}

async function getTutorSearch(filters) {
  const key = `search:${require('crypto').createHash('md5').update(JSON.stringify(filters)).digest('hex')}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const results = await Tutor.search(filters);
  await redis.setex(key, 300, JSON.stringify(results));
  return results;
}
```

---

### 11. Add a Message Queue (BullMQ / RabbitMQ)

For heavy tasks that shouldn't block the API response:

```
Without Queue (blocking):
  User books session → API sends email → API creates invoice → API responds
  Response time: 3-5 seconds (user waits)

With Queue (non-blocking):
  User books session → API responds immediately (200ms)
                      → Queue processes email in background
                      → Queue generates invoice in background
                      → Queue sends notification in background
```

What to put in queues:
- Email sending (verification, booking confirmation, password reset, summaries)
- AI session summarization (takes 3-5 seconds via Gemini)
- Image processing (resize, compress uploads via Sharp)
- Notification dispatch (Socket.IO push, push notifications)
- n8n webhook triggers (decouple from request)

```javascript
// backend/src/queues/emailQueue.js
const { Queue, Worker } = require('bullmq');
const redis = require('../utils/redis');

const emailQueue = new Queue('email', { connection: redis });

// Producer (in controller)
await emailQueue.add('booking-confirmation', {
  to: student.email,
  template: 'booking-confirmation',
  data: { session, tutor }
});

// Worker (separate process)
const worker = new Worker('email', async (job) => {
  await sendEmail(job.data);
}, { connection: redis });
```

---

### 12. Load Testing (k6)

Use tools to simulate many users hitting your app:

```bash
# Install k6
# Run 100 virtual users for 30 seconds
k6 run --vus 100 --duration 30s load-test.js
```

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

const BASE_URL = 'https://your-app.onrender.com';

export default function() {
  // Test health
  let res = http.get(`${BASE_URL}/health`);
  check(res, { 'health OK': (r) => r.status === 200 });

  // Test tutor search
  res = http.get(`${BASE_URL}/api/tutors/search?subject=Math&page=1`);
  check(res, { 'search OK': (r) => r.status === 200 });

  sleep(1);
}
```

Document the results:
- How many requests/second can your API handle?
- At what point does it break?
- What's the average response time under load?
- Where's the bottleneck (CPU, memory, database, network)?

---

### 13. Infrastructure as Code (Terraform)

Instead of clicking buttons in AWS console, define infrastructure in code:

```hcl
# main.tf — Define your entire infrastructure
provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "backend" {
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2023
  instance_type = "t2.micro"

  vpc_security_group_ids = [aws_security_group.backend.id]
  subnet_id              = aws_subnet.public.id

  user_data = base64encode(templatefile("user_data.sh", {}))

  tags = {
    Name = "socrates-backend"
  }
}

resource "aws_security_group" "backend" {
  name        = "socrates-backend-sg"
  description = "Allow HTTP/HTTPS and SSH"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["YOUR_IP/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_s3_bucket" "frontend" {
  bucket = "socrates-frontend-${random_id.suffix.hex}"
  website {
    index_document = "index.html"
    error_document = "index.html"
  }
}

resource "aws_db_instance" "database" {
  engine               = "docdb"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  username             = "admin"
  password             = var.db_password
  skip_final_snapshot  = true
}

resource "random_id" "suffix" {
  byte_length = 4
}
```

**Why**: Companies don't set up servers by hand. Terraform lets you create/destroy entire environments in minutes. Version control your infrastructure.

---

## 🗺️ YOUR PERSONAL LEARNING ROADMAP

```
DURING PROJECT (Weeks 1-16)              AFTER PROJECT
─────────────────────────────             ─────────────

Week 1-2:   Docker + Docker Compose        Month 1: AWS Migration
Week 3-5:   CI/CD with GitHub Actions              (EC2, S3, CloudFront)
Week 6-8:   Database Indexing                        
Week 9-11:  Socket.IO Architecture              Month 2: Redis Caching
Week 12-14: AI Service + n8n + Local ML                 Message Queues (BullMQ)
Week 15-16: Deployment + Monitoring             
                                               Month 3: Terraform
                                                        Load Testing
                                                        System Design Doc (HLD)
```

---

## 📝 HOW TO PRESENT THIS IN INTERVIEWS

When asked "Tell me about a project you've built":

> "I built an AI-powered tutoring marketplace with a 4-person team. My role was **backend infrastructure, DevOps, and ML engineering**. I designed the **system architecture** with 9 layers of request processing — from CDN to rate limiting to JWT auth to database queries. I **containerized** the app with Docker, set up **CI/CD** with GitHub Actions, implemented **database indexing** that reduced search queries from 200ms to 15ms, and deployed to **Vercel + Render** with zero-downtime deploys. I built a **Python FastAPI AI microservice** with local ML models (sentence-transformers for tutor matching, scikit-learn for predictions, Xenova/transformers for sentiment) — **Local-First architecture** reserving Gemini only for Socratic tutoring. I automated async workflows with **n8n** (tutor verification, session summaries, leaderboards). After the academic submission, I migrated the entire infrastructure to **AWS** using EC2, S3, CloudFront, and SES, and wrote a **High-Level Design document** covering scalability to 10,000 concurrent users."

That answer covers: system design, Docker, CI/CD, database optimization, deployment, AWS, local ML, n8n, and scalability — everything cloud interviewers want to hear.

---

## 📚 RESOURCES TO LEARN ALONGSIDE

| Topic | Resource | Time |
|-------|----------|------|
| System Design Basics | "System Design Primer" (GitHub) | 2-3 hours |
| Docker | TechWorld with Nana — Docker crash course (YouTube) | 2 hours |
| AWS Basics | AWS Cloud Practitioner — free course on AWS Skill Builder | 6 hours |
| CI/CD | GitHub Actions documentation | 1 hour |
| Redis | Redis University (free courses) | 3 hours |
| Database Design | MongoDB University M001 (free) | 4 hours |
| Load Testing | k6 documentation | 1 hour |
| Terraform | HashiCorp Learn (free) | 3 hours |
| Message Queues | BullMQ docs / RabbitMQ tutorials | 2 hours |
| Local ML | Sentence-Transformers docs, scikit-learn user guide | 3 hours |

---

**Your project is the same as your teammates'. Your understanding of WHY it's built this way is what sets you apart.** 🚀