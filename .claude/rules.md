# Claude Code Rules

- **MANDATORY GIT COMMIT CHECK**: This is an active group collaboration project on the `main` branch. BEFORE starting any task or writing code, ALWAYS run `git fetch origin` (and check `git status` or `git diff HEAD origin/main`) to verify and pull (`git pull origin main`) the latest remote commits pushed by team members.
- **MANDATORY CSS PERFORMANCE**: You MUST follow all strict CSS performance & anti-jank guidelines written in [strict css.txt](file:///d:/SOCRATES/Usefull%20Tools/strict%20css.txt).
- **Design Specifications**: Follow UI/UX specifications in [DESIGN-apple.md](file:///d:/SOCRATES/DESIGN-apple.md).
- **Workspace Architecture**: Refer to documentation in [docs/](file:///d:/SOCRATES/docs).
- Always verify code edits with `npm run build` or `npm run lint` in [frontend/](file:///d:/SOCRATES/frontend) when completing changes.
- Do not introduce raw emoji icons in frontend UI.
- Use modular components and strictly typed props in React.
- Ensure Mongoose models in [backend/](file:///d:/SOCRATES/backend) have appropriate indexes and error validation.
