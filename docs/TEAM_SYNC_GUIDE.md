# 🚀 SOCRATES - Team Sync & AI Setup Guide

> **Instructions for AI Agent / Developer**: This guide contains step-by-step commands and procedures to sync your local environment with the latest `main` branch, fix Python interpreter & IDE errors, and safely push updates without conflicts.

---

## 📌 Quick Summary of System Architecture

* **Repository Name**: `SOCRATES`
* **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 (`/frontend`)
* **Backend API**: Node.js + Express + MongoDB (`/backend`)
* **AI Microservice**: FastAPI + Python 3.14 + Hybrid ML Recommender (`/ai-service`)

---

## 🛠️ Step-by-Step Sync Protocol

### Step 1: Sync & Pull Latest Remote Code
Before starting any work or pushing code, fetch and pull the latest updates from `main` to eliminate merge conflicts:

```bash
# 1. Fetch all remote changes
git fetch --all

# 2. Switch to main branch
git checkout main

# 3. Pull latest commits from GitHub
git pull origin main
```

---

### Step 2: Configure Python Virtual Environment & Clear IDE Errors

If VS Code shows Python module errors (`fastapi`, `sklearn`, `numpy` missing) or `Select Python Interpreter`:

#### A. Activate the Python Virtual Environment
```bash
# Windows PowerShell
.\ai-service\.venv\Scripts\Activate.ps1
```

#### B. Verify / Reinstall Python Dependencies
```bash
python -m pip install -r ai-service/requirements.txt
```

#### C. Set Python Interpreter in VS Code
1. Open VS Code Command Palette: `Ctrl + Shift + P`
2. Type and select: **`Python: Select Interpreter`**
3. Choose: **`ai-service\.venv\Scripts\python.exe`**
4. Reload VS Code window: `Ctrl + Shift + P` -> **`Developer: Reload Window`**

---

### Step 3: Run Local Development Servers

Open 3 separate terminal tabs to run the full stack:

#### Terminal 1: Frontend Dev Server
```bash
cd frontend
npm run dev
```

#### Terminal 2: Backend Express API
```bash
cd backend
npm run dev
```

#### Terminal 3: Python AI Microservice
```bash
cd ai-service
.\.venv\Scripts\python.exe main.py
```

---

### Step 4: Verify the Hybrid AI Recommendation Model
To ensure the AI recommendation microservice is working cleanly on your machine with zero errors:

```bash
.\ai-service\.venv\Scripts\python.exe ai-service/hybrid_recommender.py
```
*Expected Output*: `HYBRID RECOMMENDER VERIFICATION SUCCESSFUL`

---

### Step 5: Commit & Push Your Work Safely

When you finish making changes, follow this standard Git push flow:

```bash
# 1. Stage your changed files
git add .

# 2. Create a clean commit message
git commit -m "feat: description of your new feature or fix"

# 3. Pull latest main to ensure no team conflicts
git pull origin main --rebase

# 4. Push to main
git push origin main
```

If you are working on the `feature/initial-push` branch:
```bash
git push origin main:feature/initial-push
```

---

### ❓ Troubleshooting FAQ

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| `ModuleNotFoundError: No module named 'fastapi'` | Wrong Python interpreter selected in VS Code | Run `Ctrl+Shift+P` -> `Python: Select Interpreter` -> choose `ai-service\.venv\Scripts\python.exe`. |
| `fatal: refusing to merge unrelated histories` | Branch divergence | Always pull from `main` using `git pull origin main`. |
| Yellow warning lines in `.vscode/settings.json` | Missing optional extension IDs | Settings are already cleaned up. Ignore or reload VS Code (`Ctrl+Shift+P` -> `Developer: Reload Window`). |

---

> **Ready!** Follow the steps above to stay synchronized with the latest codebase.
