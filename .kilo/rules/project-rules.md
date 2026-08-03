# Project Rules (Kilo AI)

1. **Mandatory Git Remote Commit Sync**: This is an active group collaboration on `main`. BEFORE performing any work or writing code, ALWAYS run `git fetch origin` (and check `git status` or `git diff HEAD origin/main`) to inspect and pull (`git pull origin main`) remote commits from teammates.
2. **Pixel-Perfect CSS Perfectionism (MANDATORY)**: The product creator is a strict perfectionist. Visual defects like misalignments, sloppy margins/paddings, inconsistent borders, lazy layout wrappers, or missing shadows/transitions are unacceptable. Write clean, complete, responsive, and gorgeous CSS for every element.
3. **Strict CSS Performance Rules (MANDATORY)**: You MUST follow all strict CSS performance & anti-jank guidelines written in [strict css.txt](file:///d:/SOCRATES/Usefull%20Tools/strict%20css.txt).
4. **UI Icons**: Never use raw Unicode emojis as UI icons. Use SVG vector icons from `lucide-react`.
5. **Tailwind Styling**: Tailwind CSS v4 is used in [frontend/](file:///d:/SOCRATES/frontend). Write utility classes directly; avoid standard CSS files unless necessary.
6. **State Management**:
   - Client UI state -> `zustand`
   - Server state & Caching -> `@tanstack/react-query`
7. **Backend REST API**: Express controllers in [backend/](file:///d:/SOCRATES/backend) must handle errors gracefully via standard middleware (`express-async-errors`).
