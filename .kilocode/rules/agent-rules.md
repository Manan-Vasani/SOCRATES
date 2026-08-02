# Kilo Code Agent Rules

- **MANDATORY GIT REMOTE COMMIT CHECK**: This is an active group collaboration on `main`. BEFORE performing any task or writing code, ALWAYS run `git fetch origin` (and check `git status` or `git diff HEAD origin/main`) to inspect and pull (`git pull origin main`) remote commits from teammates.
- **Strict CSS Performance Rules (MANDATORY)**: You MUST strictly follow all CSS performance, rendering, and anti-jank guidelines written in [strict css.txt](file:///d:/SOCRATES/Usefull%20Tools/strict%20css.txt).
- **Design Guidelines**: Follow specifications in [DESIGN-apple.md](file:///d:/SOCRATES/DESIGN-apple.md).
- **Workspace Specs**: Refer to [docs/](file:///d:/SOCRATES/docs).
- **No Raw Emojis in UI**: Never use raw Unicode emojis as UI icons. Use SVG vector icons from `lucide-react` or `react-icons`.
- **Modularity**: Split large components into focused sub-components.
- **Async Safety**: Use `express-async-errors` in Express server controllers in [backend/](file:///d:/SOCRATES/backend) to prevent unhandled promise rejections.
