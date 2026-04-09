# CLAUDE.md

This file governs how Claude should behave when working on this Next.js / React project. Read this before making any changes.

---

## Project Files

Always keep these files in sync:

| File             | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `master_plan.md` | Features, milestones, and progress tracking             |
| `bugs.md`        | Log of all discovered and resolved bugs                 |
| `DESIGN.md`      | Design system — colors, typography, spacing, components |
| `codebase.md`    | Source of truth for code architecture and structure     |

- After every task, update `master_plan.md` with what was completed, what is in progress, and what is next.
- When a bug is found, log it in `bugs.md` immediately with description, steps to reproduce, severity, and status.
- Before writing any UI code, read `DESIGN.md` and follow it. Do not introduce colors, tokens, or patterns not already defined there.
- When adding new files, routes, components, or significant code changes, update `codebase.md` to reflect the new architecture.

---

## Project Structure

Use the App Router (`/app` directory):

```
/app          Routes, layouts, pages (Server Components by default)
/components   Reusable UI components
  /ui         Generic, stateless presentational components
  /features   Feature-specific components
/lib          Utility functions, helpers, constants
/hooks        Custom React hooks
/server       Server-only code (DB access, auth, data access layer)
/types        Shared TypeScript types and interfaces
/public       Static assets
```

- Never put server-only logic inside `/components`. Use `/server` for DB calls and sensitive operations.
- Co-locate tests next to the files they test (e.g., `Button.test.tsx` beside `Button.tsx`).

---

## React

- Use functional components with hooks. No class components.
- Keep components small and single-responsibility. If it does more than one thing, split it.
- Default to Server Components. Only add `"use client"` when the component needs interactivity, browser APIs, or React state.
- Avoid prop drilling. Use Context API for lightweight global state; use Zustand or Jotai only for complex shared state.

**State management decision order:**

1. Local state → `useState`
2. Complex local logic → `useReducer`
3. Shared across components → `useContext` or Zustand/Jotai
4. Server/async data → React Query or SWR

**Performance:**

- Use `React.memo()` to prevent unnecessary re-renders on pure components.
- Use `useMemo()` and `useCallback()` only when there is a measurable benefit — do not over-memoize.
- Avoid cascading `useEffect` chains. If one effect triggers another, redesign the logic.
- Parse expensive values (e.g., `JSON.parse`) inside a `useState` initializer callback, not on every render.

---

## Next.js

**Rendering — choose the right strategy per route:**

| Strategy         | When to use                                     |
| ---------------- | ----------------------------------------------- |
| Server Component | Data-heavy or static content; reduces JS bundle |
| Client Component | Interactivity, hooks, browser APIs              |
| SSG              | Fully static pages — blogs, marketing, docs     |
| SSR              | Real-time or user-specific data                 |
| ISR              | Mostly static but updates periodically          |
| CSR              | Highly dynamic UIs where SEO is not needed      |

Prefer server rendering. Push `"use client"` as far down the component tree as possible.

**Data fetching:**

- Fetch inside Server Components using `async/await` directly.
- Run independent fetches in parallel with `Promise.all()` — avoid waterfalls.
- Use Next.js caching directives intentionally and verify caching behavior.
- All DB calls go through `/server` — never directly from a component.

**Routing:**

- Use `<Link>` for all internal navigation, never raw `<a>` tags.
- Add `loading.tsx` per route segment for streaming.
- Add `error.tsx` per route for error boundaries.
- Add `app/global-error.tsx` for a top-level fallback.
- Add `app/not-found.tsx` for custom 404s.

**Images and fonts:**

- Always use `<Image>` from `next/image`. Set `priority` for above-the-fold images.
- Use `next/font` to eliminate layout shift.

**Server Actions:**

- Use Server Actions for form submissions and mutations when possible.
- Always validate and authenticate inside each action — do not rely on layout-level checks.
- Rate-limit expensive operations.

**Environment variables:**

- Never commit `.env` files. Keep them in `.gitignore`.
- Only expose variables prefixed with `NEXT_PUBLIC_` to the client.
- Document all required variables in `.env.example`.

---

## Security

- Add a Content Security Policy header in `next.config.js` or middleware.
- Authenticate and authorize inside every Server Action and API route.
- Never expose database errors or stack traces to the client.
- Sanitize all user inputs before processing.

---

## Code Quality

- TypeScript is required. All files must be `.ts` or `.tsx`. Avoid `any` — document it if unavoidable.
- ESLint and Prettier must pass with zero errors before committing.
- Use named exports. Avoid default exports where possible.
- Import only what you need: `import { ArrowRight } from 'lucide-react'`, not `import * as Icons`.
- Write descriptive names. Avoid abbreviations.

---

## Testing

- Unit tests: Jest + React Testing Library.
- E2E tests: Playwright or Cypress for critical user flows.
- Write tests against behavior, not implementation details.
- Tests must pass before marking a task complete in `master_plan.md`.

---

## Libraries

- **Zod** — Schema validation for all forms and server actions. Define schemas in `/lib/validations`.
- **Tailwind CSS** — Utility-first styling. Follow DESIGN.md tokens.
- **React Hook Form** — Form management with Zod integration.

---

## Accessibility

- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<button>`, etc.).
- Add meaningful `alt` text to all images.
- All interactive elements must be keyboard-navigable.
- Use ARIA attributes only where semantic HTML is insufficient.

---

## SEO

- Use the Next.js Metadata API (`export const metadata`) on every route.
- Generate `sitemap.xml` and `robots.txt` via route handlers.
- Add Open Graph images using `opengraph-image.tsx`.

---

## Bug Log Format (bugs.md)

```markdown
## BUG-XXX: Short Title

- **Date**: YYYY-MM-DD
- **Severity**: Critical | High | Medium | Low
- **Status**: Open | In Progress | Resolved
- **Description**:
- **Expected behavior**:
- **Steps to reproduce**:
- **Root cause**:
- **Fix applied**:
```

Never delete bug entries. Mark them as Resolved when fixed.

---

## Progress Format (master_plan.md)

```markdown
## Feature or Milestone Name

- **Status**: Not Started | In Progress | Complete
- **Last updated**: YYYY-MM-DD
- **Completed**:
  - [x] Task
- **In progress**:
  - [ ] Task
- **Remaining**:
  - [ ] Task
- **Notes**:
```

---

## Workflow

Before starting:

1. Read `master_plan.md` to understand current state and priorities.
2. Read `codebase.md` for architectural context and codebase structure.
3. Read `DESIGN.md` if the task involves UI.
4. Check `bugs.md` for related known issues.

While working: 5. Follow the practices in this file. 6. Log any newly discovered bugs in `bugs.md` immediately.

After completing: 7. Update `master_plan.md` with progress. 8. Confirm ESLint and tests pass. 9. Update `bugs.md` if any bugs were resolved. 10. Update `codebase.md` if new routes, components, or significant code patterns were added.
