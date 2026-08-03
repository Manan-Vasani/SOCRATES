# Agent Rules & Guidelines

## Associated Paths
- **Strict CSS File**: [strict css.txt](file:///d:/SOCRATES/Usefull%20Tools/strict%20css.txt)
- **Design Spec**: [DESIGN-apple.md](file:///d:/SOCRATES/DESIGN-apple.md)
- **Frontend Workspace**: [frontend/](file:///d:/SOCRATES/frontend)
- **Backend Workspace**: [backend/](file:///d:/SOCRATES/backend)

## 🚨 MANDATORY GROUP COLLABORATION RULE
- **Check Latest Git Commits First**: This project is an active group collaboration on the `main` branch. BEFORE starting any task, research, or writing code, ALWAYS run `git fetch origin` (and inspect `git status` or `git diff HEAD origin/main`) to check for remote commits from teammates. If remote changes exist, pull them (`git pull origin main`) immediately.

## UI & Aesthetics
- **Pixel-Perfect CSS Perfectionism (MANDATORY)**: The product creator is a strict perfectionist. Visual defects like misalignments, sloppy margins/paddings, inconsistent borders, lazy layout wrappers, or missing shadows/transitions are unacceptable. Write clean, complete, responsive, and gorgeous CSS for every element.
- **No Raw Emojis in UI**: Never use raw Unicode emojis (e.g. 🚀, 🔒, ⭐) as UI icons. Use SVG vector icons from `lucide-react` or `react-icons`.
- **Mandatory Strict CSS Rules**: You MUST follow all strict CSS performance, GPU acceleration, and anti-jank rules defined in [strict css.txt](file:///d:/SOCRATES/Usefull%20Tools/strict%20css.txt).
  - **No Reflow Animations**: Animate ONLY `transform` and `opacity`. Never animate `width`, `height`, `margin`, `padding`, `top`, `left`.
  - **Font Antialiasing**: Enforce `-webkit-font-smoothing: antialiased`.
  - **GPU Layer Promotion**: Use `transform-gpu` (`transform: translateZ(0)`) to ensure 60fps animations.
- **Component Design**: Keep UI components pure, accessible, and responsive across screens.

## Code Quality & Standards
- **TypeScript (Frontend)**: Strict type checking. Avoid `any` types; define explicit interfaces or types.
- **JavaScript (Backend)**: Clean CommonJS code structure, clear function names, proper error propagation.
- **API Contracts**: All API responses must follow a consistent JSON envelope `{ success: boolean, data?: any, message?: string, error?: string }`.
- **Database**: Use Mongoose schemas with proper indexes and validation.
