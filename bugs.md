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

---

## BUG-013: QR Scanner Camera Permission Not Requested

- **Date**: 2026-04-10
- **Severity**: Critical
- **Status**: Resolved
- **Description**: QR scanner failed to access camera, showing "Failed to access camera, try again?" error without ever requesting camera permission from the browser.
- **Expected behavior**: Scanner should request camera permission and access camera successfully
- **Steps to reproduce**:
  1. Navigate to `/admin/scan/[id]` (or later `/scan/[id]`)
  2. Page loads but camera never activates, shows error message
- **Root cause**: Html5Qrcode library was not properly initialized with explicit permission request. The scanner was relying on implicit permission handling which wasn't triggering the browser permission dialog.
- **Fix applied**: Rewrote scanner to explicitly call `navigator.mediaDevices.getUserMedia()` before starting Html5Qrcode, ensuring the browser permission dialog is triggered

---

## BUG-014: QR Scanner Infinite Refresh Loop

- **Date**: 2026-04-10
- **Severity**: Critical
- **Status**: Resolved
- **Description**: QR scanner page loaded and refreshed infinitely, creating an endless loop that prevented any interaction.
- **Expected behavior**: Scanner should load once and remain stable for scanning
- **Steps to reproduce**:
  1. Navigate to `/admin/scan/[id]`
  2. Page continuously refreshes, never stabilizing
- **Root cause**: Scanner component's `useEffect` had `isScanning` in its dependency array, causing the effect to re-run when state changed. Combined with improper ref usage for tracking scanner state, this created an infinite restart loop.
- **Fix applied**: 
  - Added `hasStartedRef` to track whether scanner has been started, preventing restart attempts
  - Removed `isScanning` from `useCallback` dependencies
  - Ensured scanner cleanup happens properly on component unmount

---

## BUG-015: Double QR Scanner Boxes

- **Date**: 2026-04-10
- **Severity**: Medium
- **Status**: Resolved
- **Description**: QR scanner showed two overlapping QR scanning boxes - one from the library's built-in UI and one from the custom overlay.
- **Expected behavior**: Only one QR scanning overlay should be visible
- **Steps to reproduce**:
  1. Navigate to `/scan/[id]`
  2. Camera activates with two visible QR box overlays
- **Root cause**: Html5Qrcode's `qrbox` config option creates its own visual overlay, which overlapped with the custom CSS overlay we created for the mobile-optimized view.
- **Fix applied**: 
  - Removed `qrbox` option from Html5Qrcode config
  - Added CSS to hide library's built-in UI elements: `.qr-shaded-region { display: none !important; }`
  - Use only custom overlay for mobile-optimized scanner

---

## BUG-016: Scanner Wrapped by Admin Layout

- **Date**: 2026-04-10
- **Severity**: High
- **Status**: Resolved
- **Description**: QR scanner at `/admin/scan/[id]` was wrapped by the admin layout (sidebar, header), preventing fullscreen mobile-optimized view.
- **Expected behavior**: Mobile scanner should be fullscreen with no surrounding UI elements
- **Steps to reproduce**:
  1. Navigate to `/admin/scan/[id]` on mobile device
  2. Sidebar and header still visible, camera view not fullscreen
- **Root cause**: Route was placed under `/admin/` directory which inherits the admin layout with sidebar and header.
- **Fix applied**: Moved scanner route from `/admin/scan/[id]` to `/scan/[id]` to bypass nested admin layouts. Added `/scan` route to middleware and RBAC with staff-level access.

---

## BUG-017: Hydration Error - Input/Textarea ID Mismatch

- **Date**: 2026-04-10
- **Severity**: Medium
- **Status**: Resolved
- **Description**: Browser console showed React hydration warnings: `Warning: Prop 'id' did not match. Server: "input-0.123..." Client: "input-0.456..."` for Input and Textarea components.
- **Expected behavior**: Input IDs should be consistent between server and client render
- **Steps to reproduce**:
  1. Load any page with Input or Textarea components
  2. Check browser console for hydration warnings
- **Root cause**: Input and Textarea components used `Math.random()` to generate IDs. Random values differ between server-side render (SSR) and client-side render (CSR), causing hydration mismatch.
- **Fix applied**: Changed both components to use `React.useId()` hook which generates stable IDs that are consistent between SSR and CSR.

---

## BUG-018: Hydration Error - EventList ClassName Mismatch

- **Date**: 2026-04-10
- **Severity**: Medium
- **Status**: Resolved
- **Description**: Browser console showed React hydration warning: `Warning: Prop 'className' did not match` for EventList view toggle buttons.
- **Expected behavior**: Button classNames should be consistent between server and client render
- **Steps to reproduce**:
  1. Navigate to `/admin/events`
  2. Check browser console for hydration warnings
- **Root cause**: EventList component read localStorage (`VIEW_MODE_KEY`) during render to set initial view mode state. localStorage is only available on client, so server renders with default "grid" while client may render with saved "list", causing className mismatch.
- **Fix applied**: 
  - Added `mounted` state to prevent reading localStorage until after component mount
  - Changed `useEffect` to read localStorage and set state after mount
  - Button variants now check `mounted && viewMode === "grid"` to ensure consistent rendering

---

## BUG-019: Vercel Build Error - Event Status Enum Missing "ended"

- **Date**: 2026-04-10
- **Severity**: High
- **Status**: Resolved
- **Description**: Deploying to Vercel failed with error: `Error fetching public events: invalid input value for enum event_status: 'ended'`
- **Expected behavior**: Build should succeed with "ended" status supported
- **Steps to reproduce**:
  1. Push code to Vercel
  2. Build fails with enum error in logs
- **Root cause**: Database schema defined "ended" status in `event_status` enum but production database (Vercel/Supabase) only had "draft", "open", "closed" values. PostgreSQL enums cannot have values added without explicit migration.
- **Fix applied**: Created migration script `migrations/add-ended-status.ts` to add "ended" value to enum via `ALTER TYPE event_status ADD VALUE 'ended'`. Migration runs before app starts.

---

## BUG-020: QR Code Not Centered on Thank You Page

- **Date**: 2026-04-10
- **Severity**: Medium
- **Status**: Resolved
- **Description**: The QR code displayed on the thank you page after registration was not properly centered. It appeared shifted to one side.
- **Expected behavior**: QR code should be horizontally centered within its container
- **Steps to reproduce**:
  1. Complete a registration for an event
  2. Navigate to the thank you page `/e/[slug]/thanks?token=...`
  3. QR code is not centered
- **Root cause**: The QR code wrapper div used `inline-block mx-auto` which doesn't work for centering. `mx-auto` (margin auto) only centers block-level elements with a defined width. For `inline-block`, the parent needs `text-center` or the element needs to be `block`.
- **Fix applied**: Changed the wrapper to use a flex container (`flex justify-center`) around the QR code div, removing the problematic `inline-block mx-auto` combination.

---

## BUG-021: QR Scanner Shows "QR Code Not Recognized" for Valid QR Codes

- **Date**: 2026-04-10
- **Severity**: Critical
- **Status**: Resolved
- **Description**: When scanning the QR code generated by the app (from the thank you page or ticket page), the scanner always showed "QR code not recognized" even though the QR was valid.
- **Expected behavior**: Scanner should recognize QR codes generated by the app and successfully check in registrants
- **Steps to reproduce**:
  1. Register for an event and receive QR code
  2. Navigate to `/scan/[id]` scanner page
  3. Scan the QR code
  4. Error: "QR code not recognized"
- **Root cause**: The QR codes encode full URLs like `http://localhost:3000/ticket/{token}`, but the `checkInByQrToken` function expected just the raw token UUID. When the scanner decoded the URL and passed it to the function, the database query compared `qrToken = decodedText` where `decodedText` was a full URL and `qrToken` in the database was just the UUID suffix.
- **Fix applied**: Updated scanner page to parse the URL and extract the token from the `/ticket/{token}` path before passing to `checkInByQrToken`. If the decoded text isn't a valid URL, it's treated as a raw token (backward compatible).

---

## BUG-022: Mobile View Not Responsive

- **Date**: 2026-04-10
- **Severity**: High
- **Status**: Resolved
- **Description**: The public pages (registration page, thank you page, ticket page) were not properly responsive on mobile devices. Elements had fixed sizes, excessive padding, and text that could overflow.
- **Expected behavior**: Pages should be fully responsive and usable on mobile devices
- **Steps to reproduce**:
  1. Open any public page on a mobile device or narrow browser window
  2. Text sizes too large, padding excessive, elements overflow
- **Root cause**: Multiple issues:
  - Hero title overlay had text sizes starting at `text-4xl` without smaller breakpoints
  - Bento cards had fixed `min-h-[180px]` too tall for mobile
  - Padding values like `py-12`, `p-8` too large for small screens
  - No responsive breakpoints for many sizing values
- **Fix applied**: 
  - Added responsive text sizes with breakpoints: `text-2xl sm:text-3xl md:text-4xl lg:text-5xl`
  - Removed fixed min-heights, using auto sizing
  - Added responsive padding: `px-4 sm:px-6`, `py-6 sm:py-8`
  - Adjusted icon sizes, card radius, and gap values for mobile

---

## FEATURE-002: Customizable Email Templates, Calendar Integration, Events Report

- **Date**: 2026-04-10
- **Severity**: Enhancement
- **Status**: Completed
- **Description**: Three major enhancements:
  1. **Email Templates**: Allow organizers to customize confirmation emails with default template in settings and per-event overrides
  2. **Calendar Integration**: Add "Add to Calendar" buttons on ticket page for Google, Outlook, and Apple calendars
  3. **Events Report**: Export all registrants across all events in a single CSV
- **Expected behavior**: 
  - Admins can set a default email template in settings
  - Each event can override the template
  - Registrants see calendar buttons on their ticket page
  - Admins can download a report of all registrants from all events
- **Root cause**: Missing features
- **Fix applied**:
  - Added `defaultEmailTemplate` field to `global_settings` table
  - Added `emailTemplate` field to `events` table
  - Created `lib/calendar.ts` with Google Calendar URL, Outlook URL, and ICS file generation
  - Created `components/features/calendar-buttons.tsx` for ticket page calendar buttons
  - Added `exportAllRegistrantsCsv()` function to `server/actions/export.ts`
  - Updated settings page with email template editor and all-events export button
  - Updated email module to support custom templates with variable substitution
  - Template variables: `{{firstName}}`, `{{lastName}}`, `{{fullName}}`, `{{email}}`, `{{eventName}}`, `{{eventDate}}`, `{{eventTime}}`, `{{eventLocation}}`, `{{ticketUrl}}`, `{{eventSlug}}`

---

## BUG-023: Edit Event URL Contains Extra Brace

- **Date**: 2026-04-10
- **Severity**: Medium
- **Status**: Resolved
- **Description**: Clicking "Edit Event" button on the dashboard navigated to `/admin/events/{id}/edit%7D` (with `%7D` being URL-encoded `}`) instead of `/admin/events/{id}/edit`.
- **Expected behavior**: Should navigate to `/admin/events/{id}/edit`
- **Steps to reproduce**:
  1. Navigate to `/admin/dashboard/{id}`
  2. Click "Edit Event" button
  3. URL shows `/edit%7D` instead of `/edit`
- **Root cause**: Typo in JSX - the Link href had an extra `}` character: `href={`/admin/events/${eventId}/edit}`}`
- **Fix applied**: Removed the extra `}` from the URL template string in `app/admin/dashboard/[id]/page.tsx`

---

## BUG-024: Ticket Page Shows Authentication Required Error

- **Date**: 2026-04-10
- **Severity**: Critical
- **Status**: Resolved
- **Description**: Clicking "View Permanent Ticket" from the thank-you page showed "Application error: a server-side exception has occurred" with logs indicating "Error: Authentication required".
- **Expected behavior**: Ticket page should be publicly accessible without authentication
- **Steps to reproduce**:
  1. Complete event registration
  2. Click "View Permanent Ticket" on thank-you page
  3. Error page appears
- **Root cause**: The ticket page (`app/ticket/[qrToken]/page.tsx`) called `getEvent()` which requires admin role via `requireRole("admin")`. Ticket pages are meant to be public and shareable, so they should not require authentication.
- **Fix applied**: Created a new public function `getEventById()` in `server/actions/events.ts` that fetches an event by ID without authentication requirements. Updated ticket page to use this public function instead of `getEvent()`.

---

## FEATURE-001: Dashboard Shows Pending Registrants

- **Date**: 2026-04-10
- **Severity**: Enhancement
- **Status**: Completed
- **Description**: The event dashboard only showed recent check-ins. Staff needed to see who hasn't checked in yet to manage the check-in process more effectively.
- **Expected behavior**: Dashboard should show both recent check-ins (limited to 5) and a list of registrants who haven't checked in
- **Root cause**: Missing feature - only check-ins were displayed
- **Fix applied**: 
  - Added `pendingRegistrants` memo to filter registrants who haven't checked in
  - Created `PendingItem` component to display pending registrants
  - Added new "Not Checked In" section below "Recent Check-ins"
  - Limited recent check-ins to 5 items (was 20)
  - Added scrollable container for pending list
  - Shows celebratory message when all registrants have checked in

---

## FEATURE-003: UX Improvements — Consolidated Ticket Page & Email Template Tab

- **Date**: 2026-04-10
- **Severity**: Enhancement
- **Status**: Completed
- **Description**: UX improvements requested by user:
  1. Consolidate thank-you page into permanent ticket page (eliminate redundancy)
  2. Add success banner for new registrations on ticket page
  3. Add download QR button on ticket page
  4. Add "Confirmation Email" tab to edit event page for per-event email templates
  5. Fix email sending issue (emails not received)
- **Expected behavior**: 
  - Registration redirects directly to ticket page with success indicator
  - Ticket page shows "You're Registered!" banner for new registrations
  - Admin can set custom email template per event
  - Confirmation emails are successfully sent
- **Root cause**: Multiple UX and configuration issues:
  - Thank-you page was redundant with ticket page
  - Email sending errors were swallowed silently (`.catch()` doesn't catch `{success: false}` returns)
  - Email from address hardcoded to unverified domain
- **Fix applied**:
  - Converted thank-you page to redirect page (`/e/[slug]/thanks` → `/ticket/{qrToken}?new=true`)
  - Added success banner to ticket page when `new=true` query param present
  - Added download QR button component
  - Added "Confirmation Email" tab to edit event page with toggle and template editor
  - Updated validation schema (`lib/validations/events.ts`) to include `emailTemplate`
  - Updated `updateEvent` action to save/clear email template
  - Fixed email sending to properly await and log results
  - Added configurable `EMAIL_FROM` environment variable (defaults to Resend test address)
  - Added detailed error logging for email failures

---

## BUG-025: Email Not Sending After Registration

- **Date**: 2026-04-10
- **Severity**: Critical
- **Status**: Resolved
- **Description**: Users did not receive confirmation emails after registering for events. No errors were visible to the user.
- **Expected behavior**: Confirmation email should be sent successfully to registrant's email address
- **Steps to reproduce**:
  1. Register for an event
  2. Check registrant's email inbox
  3. No confirmation email received
- **Root cause**: Multiple issues:
  1. Email sending code used `.catch()` which only catches promise rejections, not `{success: false}` return values
  2. Errors like "App URL not configured" or "Email service not configured" were returned as resolved promises and silently swallowed
  3. Email from address `noreply@strata.app` was not a verified domain in Resend
- **Fix applied**:
  - Changed email sending to use `.then()` to properly check `result.success`
  - Added console logging for both success and failure cases
  - Added configurable `EMAIL_FROM` environment variable
  - Default from address is `onboarding@resend.dev` (Resend's test address for development)
  - Updated `.env.example` with EMAIL_FROM documentation