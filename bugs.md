# Bug Log

> Format: See CLAUDE.md for bug entry format

## Getting Started

When a bug is discovered during development, log it here immediately with:
- Description
- Steps to reproduce
- Severity (Critical | High | Medium | Low)
- Status (Open | In Progress | Resolved)

---

## BUG-001: Build Warning - JSON Parse Error

- **Date**: 2026-04-09
- **Severity**: Low
- **Status**: Resolved
- **Description**: During `npm run build`, a SyntaxError appears: `"undefined" is not valid JSON` at `Np.on` in the webpack runtime. Build completes successfully despite the warning.
- **Expected behavior**: Build should complete without JSON parsing errors
- **Steps to reproduce**: Run `npm run build`
- **Root cause**: Calling `getCurrentUser()` in the admin layout during static generation caused serialization issues. The auth session isn't available at build time.
- **Fix applied**: Removed auth calls from admin layout. Settings pages now use client components with `useEffect` to load data at runtime.

---

## BUG-002: Database Index Definitions Cause JSON Parse Error

- **Date**: 2026-04-09
- **Severity**: High
- **Status**: Open
- **Description**: Database index definitions in `lib/db/schema.ts` cause `SyntaxError: "undefined" is not valid JSON` when running `npm run db:push` or accessing pages that import the schema.
- **Expected behavior**: Database indexes should be created without errors
- **Steps to reproduce**: 
  1. Run `npm run db:push` - fails with JSON parse error
  2. Or access any page that imports the schema (e.g., `/admin/events`)
- **Root cause**: Unknown - appears to be a bug in drizzle-orm v0.41.0 with how index definitions reference columns. The `index().on()` method receives undefined columns.
- **Fix applied**: Temporarily commented out all index definitions in schema.ts. App works without indexes. Need to investigate further or upgrade drizzle-orm.

---

## BUG-003: Supabase Environment Variables Missing

- **Date**: 2026-04-09
- **Severity**: Medium
- **Status**: Resolved
- **Description**: The `.env` file is missing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` values.
- **Expected behavior**: Supabase client should be initialized with valid credentials
- **Root cause**: Variables were added to `.env.example` but not populated in `.env`
- **Fix applied**: Added placeholder values in .env (will need real values for production)

---

## BUG-004: Zod Schema Import from "use server" File

- **Date**: 2026-04-09
- **Severity**: Critical
- **Status**: Resolved
- **Description**: Signup page showed `TypeError: o[(intermediate value)] is not a function` from zod.mjs when using `zodResolver` with `signUpSchema`.
- **Expected behavior**: Form validation should work without Zod runtime errors
- **Steps to reproduce**: 
  1. Navigate to `/signup`
  2. Fill in the form
  3. Submit → error in console
- **Root cause**: Zod schemas were exported from `actions.ts` with `"use server"` directive. Next.js cannot properly bundle non-async-function exports (like Zod schema objects) from server files. The `.refine()` method creates complex validation logic that fails during this serialization.
- **Fix applied**: Moved Zod schemas to `/lib/validations/auth.ts` (without `"use server"`). Client pages now import schemas from this shared location, while server actions import for validation only.

---

## BUG-005: NEXT_REDIRECT Caught in Error Handler

- **Date**: 2026-04-09
- **Severity**: High
- **Status**: Resolved
- **Description**: After successful signup, `NEXT_REDIRECT` error was logged to console instead of redirecting to `/admin`.
- **Expected behavior**: After successful auth, redirect should work without error logging
- **Root cause**: `redirect()` was inside the `try` block in server actions. Next.js uses a special `NEXT_REDIRECT` "error" internally to trigger navigation, which gets caught by the catch block.
- **Fix applied**: Moved `redirect()` calls outside try-catch blocks in `signInAction`, `signUpAction`, and `signOutAction`.

---

## BUG-006: Missing Admin Root Page (404)

- **Date**: 2026-04-09
- **Severity**: Medium
- **Status**: Resolved
- **Description**: Navigating to `/admin` after login showed 404 error.
- **Expected behavior**: `/admin` should redirect to a valid admin page
- **Root cause**: No `app/admin/page.tsx` file existed - only sub-pages like `/admin/events` and `/admin/settings`.
- **Fix applied**: Created `app/admin/page.tsx` that redirects to `/admin/events`. Dashboard (Wave 7) not yet implemented.

---

## BUG-007: Zod Schemas Exported from Server Action Files

- **Date**: 2026-04-09
- **Severity**: Critical
- **Status**: Resolved
- **Description**: Multiple server action files (`server/actions/events.ts`, `server/actions/staff.ts`, `server/actions/settings.ts`) exported Zod schemas and types alongside async functions, causing `Error: A "use server" file can only export async functions, found object`.
- **Expected behavior**: Server action files should only export async functions
- **Root cause**: `"use server"` directive enforces that only async functions can be exported. Zod schema objects and type exports violate this rule.
- **Fix applied**: 
  - Created `/lib/validations/events.ts`, `/lib/validations/staff.ts`, `/lib/validations/settings.ts` for schemas
  - Updated server action files to import schemas (not export them)
  - Updated client pages to import schemas from shared location

---

## BUG-008: Session Not Found in Server Actions

- **Date**: 2026-04-09
- **Severity**: Critical
- **Status**: Resolved
- **Description**: Authenticated users get `Error: Authentication required` when accessing `/admin/events`. The `getCurrentUser()` function in `server/auth/rbac.ts` couldn't find the session.
- **Expected behavior**: Server actions should correctly read session from cookies
- **Root cause**: Multiple issues:
  1. `auth.api.getSession()` was called with empty `new Headers()` instead of actual request headers
  2. Login actions used `authClient` (client-side) instead of `auth.api` (server-side) for authentication
  3. Middleware session validation wasn't passing cookies properly to the auth API
- **Fix applied**: 
  - Import `headers` from `next/headers` and pass `await headers()` to `auth.api.getSession()`
  - Changed login actions to use `auth.api.signInEmail()` and `auth.api.signUpEmail()` directly
  - Fixed middleware-rbac.ts to use `auth.api.getSession()` with proper headers
  - Added `runtime = "nodejs"` to middleware for database access compatibility

**Sources:**
- [Better-Auth Documentation](https://better-auth.com)
- [Better-Auth GitHub](https://github.com/better-auth/better-auth)

---

## BUG-009: Better-Auth Schema Mismatch (Complete Auth Overhaul)

- **Date**: 2026-04-09
- **Severity**: Critical
- **Status**: Resolved
- **Description**: Authentication was fundamentally broken. Better-auth was configured incorrectly with mismatched table names and field mappings. The `users` table used `fullName` but better-auth expected `name`, and the table names didn't match what better-auth's Drizzle adapter expects.
- **Expected behavior**: Sign up and sign in should work correctly with proper session management
- **Root cause**: Multiple architectural issues:
  1. Table name mismatch: `users` vs better-auth's expected `user`
  2. Field name mismatch: `fullName` vs better-auth's expected `name`
  3. Using `authClient` (client SDK) in server actions instead of `auth.api`
  4. Missing better-auth tables (`session`, `account`, `verification`)
  5. Incorrect session validation in middleware
- **Fix applied**: Complete auth system overhaul:
  - Created proper better-auth tables in schema: `user`, `session`, `account`, `verification`
  - Added `role` field to `user` table for RBAC
  - Updated all foreign keys to use `user.id` (text UUID) instead of `users.id`
  - Configured better-auth with proper schema mapping
  - Fixed server actions to use `auth.api.signInEmail` and `auth.api.signUpEmail`
  - Updated middleware to validate sessions correctly
  - Updated all server actions and pages to use new table/field names

---

## BUG-010: Dropdown Menu Cut Off by Parent Container

- **Date**: 2026-04-10
- **Severity**: Medium
- **Status**: Resolved
- **Description**: When clicking the ellipsis menu on event cards or list rows, the dropdown options were cut off and not fully visible. The menu was being clipped by parent containers with `overflow: hidden` styles.
- **Expected behavior**: Dropdown menu should display all options without being clipped
- **Steps to reproduce**:
  1. Navigate to `/admin/events`
  2. Click the ellipsis button on any event card
  3. Dropdown appears but options are cut off/invisible
- **Root cause**: Dropdown was rendered inline within the card container, which had `overflow: hidden` and `rounded-[1.5rem]` clipping the portal content
- **Fix applied**: Created new `/components/ui/dropdown-menu.tsx` that uses React `createPortal` to render dropdown at `document.body` level with fixed positioning based on trigger element's position

---

## BUG-011: False Positive Unsaved Changes Warning

- **Date**: 2026-04-10
- **Severity**: Medium
- **Status**: Resolved
- **Description**: On the Registration Form tab of the edit event page, the system always showed "unsaved changes" even when no changes were made. The warning banner and fixed save bar appeared immediately after navigating to the tab.
- **Expected behavior**: Unsaved changes detection should only trigger when actual changes are made
- **Steps to reproduce**:
  1. Navigate to `/admin/events/[id]/edit`
  2. Switch to "Registration Form" tab
  3. Warning banner and save bar appear even though nothing was changed
- **Root cause**: Form fields state (`formFields`, `customQuestions`) was initialized as empty arrays, then populated asynchronously from the event data. The comparison between current state and initial state happened before the async state updates completed, causing false positives.
- **Fix applied**: 
  - Changed from separate state variables to single JSON string comparison using `JSON.stringify()`
  - Added `isInitialLoadComplete` flag to prevent comparison before data is fully loaded
  - Used `setTimeout` with 0ms delay to set initial values after all React state updates complete
  - Created `getCurrentStateJson()` callback that captures all form state for comparison

---

## BUG-012: Build Error on Admin Events Page

- **Date**: 2026-04-10
- **Severity**: High
- **Status**: Resolved
- **Description**: Running `npm run build` failed with error on `/admin/events` route due to prerendering attempting to execute server-side auth checks at build time.
- **Expected behavior**: Build should succeed without prerendering errors
- **Steps to reproduce**: Run `npm run build`
- **Root cause**: Next.js attempted to statically prerender `/admin/events` page which contains `getCurrentUser()` call requiring session cookies (not available at build time)
- **Fix applied**: Added `export const dynamic = 'force-dynamic'` to `/app/admin/events/page.tsx` to force server-side rendering and skip static generation