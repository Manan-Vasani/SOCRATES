# SOCRATES - Claude Code Guide

## Project Summary & Essential Paths
SOCRATES is a full-stack educational platform built with React 19 + TypeScript on the frontend and Node.js + Express + MongoDB on the backend.

- **Documentation**: [docs/](file:///d:/SOCRATES/docs)
- **Docs Agent Configs**: [docs/.claude/CLAUDE.md](file:///d:/SOCRATES/docs/.claude/CLAUDE.md)
- **Strict CSS Performance Rules**: [strict css.txt](file:///d:/SOCRATES/Usefull%20Tools/strict%20css.txt)
- **Design Guidelines**: [docs/DESIGN-apple.md](file:///d:/SOCRATES/docs/DESIGN-apple.md)
- **Frontend Source**: [frontend/](file:///d:/SOCRATES/frontend)
- **Backend Source**: [backend/](file:///d:/SOCRATES/backend)

## 🚨 MANDATORY GROUP COLLABORATION RULE: CHECK LATEST GIT COMMITS FIRST
- **Always Check Remote Commits First**: This project is a group collaboration where multiple team members contribute directly to the same branch (`main`) in the same repository.
- **Required Action**: BEFORE starting any task, research, or writing code, ALWAYS run `git fetch origin` (and check `git status` or `git diff HEAD origin/main`) to inspect for remote commits pushed by teammates. If remote commits exist, pull them (`git pull origin main`) immediately to stay in sync.

## Quick Commands
```bash
# Frontend (React 19 + Vite + TypeScript)
cd frontend
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run oxlint / eslint

# Backend (Node.js + Express + MongoDB)
cd backend
npm run dev      # Start API dev server with nodemon
npm run start    # Production server
npm run seed     # Seed database
```

## Architecture & Mandatory Code Conventions
- **Frontend Stack**: React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), Zustand, TanStack Query, React Router v7, Framer Motion, Lucide React icons.
- **Backend Stack**: Node.js, Express (CommonJS), Mongoose, Socket.IO, JWT Auth, Cloudinary/Multer, Nodemailer, Razorpay.
- **UI & Performance Guidelines (MANDATORY)**:
  - You MUST strictly follow the anti-jank and performance rules in [strict css.txt](file:///d:/SOCRATES/Usefull%20Tools/strict%20css.txt).
  - Never use raw emojis as UI icons; use `lucide-react` or `react-icons`.
  - Maintain dark/light mode polished Apple-inspired aesthetic ([docs/DESIGN-apple.md](file:///d:/SOCRATES/docs/DESIGN-apple.md)).
  - Build local ML models (scikit-learn, PyTorch, HuggingFace, local embeddings) for recommendations, matching & classification. Only use cloud API keys for tasks requiring large open-ended generative LLMs.
- **API Guidelines**:
  - Express routes mapped under `/api/v1/`.
  - Controllers return `{ success: true, data: ... }` or pass errors to `express-async-errors`.
