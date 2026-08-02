# SOCRATES - AI Agent Instructions

## Overview
SOCRATES is a modern full-stack web application designed for learning management, scheduling, and real-time collaboration.

## Project Paths & Structure
- **Frontend App**: [frontend/](file:///d:/SOCRATES/frontend) (React 19 + TypeScript + Vite + Tailwind CSS v4)
- **Backend API**: [backend/](file:///d:/SOCRATES/backend) (Node.js + Express + MongoDB + Socket.IO)
- **Documentation**: [docs/](file:///d:/SOCRATES/docs) (Architecture, design specifications, and API specs)
- **Design Guidelines**: [DESIGN-apple.md](file:///d:/SOCRATES/DESIGN-apple.md) (UI/UX design specifications)
- **Strict CSS Performance Rules**: [strict css.txt](file:///d:/SOCRATES/Usefull%20Tools/strict%20css.txt) (Mandatory 60fps & anti-jank rendering rules)

## 🚨 Mandatory Execution Rule: Git Remote Sync (Group Collaboration)
- This project is a group collaboration with multiple contributors on `main`.
- BEFORE initiating any research, editing code, or executing tasks, ALWAYS run `git fetch origin` (and check `git status` or `git diff HEAD origin/main`).
- If teammates pushed new commits, pull them (`git pull origin main`) immediately to ensure you work on the latest remote commit.

## Quick Commands
### Frontend (`frontend/`)
- Dev Server: `npm run dev` (Runs Vite on default port)
- Build: `npm run build`
- Lint: `npm run lint` (uses Oxlint / ESLint)

### Backend (`backend/`)
- Dev Server: `npm run dev` (Runs Express with Nodemon)
- Production Start: `npm run start`
- Database Seed: `npm run seed`

## Core Architectural Rules
1. **Frontend Architecture**:
   - UI styling using Tailwind CSS v4 (`@tailwindcss/vite`).
   - Must adhere to GPU acceleration and font smoothing rules in [strict css.txt](file:///d:/SOCRATES/Usefull%20Tools/strict%20css.txt).
   - State management using Zustand for global client state and TanStack Query for server state.
   - Vector/SVG icons (`lucide-react` / `react-icons`). Never raw emojis as UI icons.
   - Form handling using React Hook Form + Zod validation schemas.

2. **Backend Architecture**:
   - Modular Express layout (`controllers/`, `routes/`, `models/`, `middleware/`, `services/`).
   - Secure authentication via JWT and bcrypt.
   - Input validation on all endpoints (Express Validator / Joi).
   - Centralized error handling middleware (`express-async-errors`).
   - Real-time communication via Socket.IO handlers in `src/socket/`.
