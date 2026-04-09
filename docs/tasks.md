# EventFlow — Developer Tasks

Granular, developer-ready task cards for implementing EventFlow v1.0.

---

## Epic 1: Infrastructure & Database Setup

### Task 1.1: Project Initialization & Environment Setup

**Type:** Config  
**Effort:** S (<4 hours)  
**Parallelizable:** YES  
**Blocked By:** NONE

**Description:**  
Initialize Next.js 14 project with TypeScript, ESLint, and base folder structure. Configure better-auth and database client libraries.

**Acceptance Criteria:**
- [ ] Next.js 14 App Router project created with TypeScript
- [ ] Base folder structure: `/app/(admin)`, `/app/(public)`, `/lib`, `/components`, `/types`
- [ ] better-auth installed (`better-auth`, `better-sqlite3` or database driver)
- [ ] Database client installed (Drizzle ORM recommended with better-auth)
- [ ] Environment variables documented in `.env.example`
- [ ] README with local setup instructions

**Tech Notes:**  
Use `create-next-app@latest` with App Router template. Configure path aliases in `tsconfig.json` (`@/components`, `@/lib`). better-auth works with Drizzle, Prisma, or direct database connections.

**Outputs:**  
Boilerplate Next.js app, `.env.example`, `README.md`

---

### Task 1.2: Database Schema — Core Tables

**Type:** Infra  
**Effort:** M (4-8 hours)  
**Parallelizable:** YES  
**Blocked By:** NONE

**Description:**  
Write database migration file to create all tables: `events`, `registrants`, `checkins`, `vip_notifications`, `global_fields`, `users`, plus better-auth required tables (`user`, `session`, `account`, `verification`).

**Acceptance Criteria:**
- [ ] Migration file created (Drizzle Kit or raw SQL depending on ORM choice)
- [ ] All tables created with correct columns, types, and constraints
- [ ] Enums created: `event_status` ('draft','open','closed'), `user_role` ('super_admin','admin','staff'), `checkin_method` ('qr','manual_email')
- [ ] better-auth tables: `user` (id, name, email, emailVerified, image, createdAt, updatedAt), `session` (id, userId, token, expiresAt, createdAt, updatedAt), `account` (id, userId, accountId, providerId, accessToken, refreshToken, etc.)
- [ ] Foreign keys and indexes in place
- [ ] Migration runs successfully on target database

**Tech Notes:**  
better-auth provides built-in adapters for Drizzle, Prisma, MongoDB, etc. Use Drizzle with PostgreSQL/MySQL/SQLite for this project. The `users` table for app data should reference `user.id` from better-auth.

**Outputs:**  
`db/schema.ts` (Drizzle), `db/migrations/001_initial.sql`

---

### Task 1.3: Database Indexes & Constraints

**Type:** Infra  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 1.2

**Description:**  
Add indexes for query performance and unique constraints on critical columns.

**Acceptance Criteria:**
- [ ] Unique index on `registrants.email` + `event_id` (prevent duplicate registration)
- [ ] Unique index on `registrants.qr_token`
- [ ] Index on `checkins.event_id`, `checkins.registrant_id`
- [ ] Index on `events.slug`
- [ ] Index on `sessions.userId` for auth lookups
- [ ] All indexes tested with EXPLAIN ANALYZE

**Tech Notes:**  
better-auth handles session indexing automatically. Add custom indexes for application tables. Use Drizzle's `index()` or raw SQL.

**Outputs:**  
Migration file for indexes

---

### Task 1.4: better-auth Configuration & Database Client

**Type:** Config  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 1.2

**Description:**  
Configure better-auth with database adapter and create typed database client utilities.

**Acceptance Criteria:**
- [ ] better-auth initialized in `/lib/auth.ts` with email/password provider
- [ ] Database adapter configured (Drizzle/Prisma)
- [ ] Session strategy set to JWT + database sessions
- [ ] Auth helpers created: `getSession()`, `getUser()`, `requireAuth()`, `auth` object
- [ ] TypeScript types for User extended with `role` field

**Tech Notes:**  
better-auth provides first-class Next.js integration. Extend the User type to include `role` field for authorization. Use `better-auth/adapters/drizzle` or similar.

**Outputs:**  
`/lib/auth.ts`, `/lib/db.ts` (database client), `/types/auth.ts`

---

### Task 1.5: Database Seed Script

**Type:** Testing  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 1.2, 1.4

**Description:**  
Create seed script to populate test data for local development.

**Acceptance Criteria:**
- [ ] Script creates 1 super admin, 2 admins, 2 staff users (using better-auth `createUser`)
- [ ] Script creates 3 sample events with varying statuses
- [ ] Script creates 20 sample registrants across events
- [ ] Script creates sample global fields
- [ ] Script can be run with `npm run seed` and is idempotent

**Tech Notes:**  
Use better-auth admin APIs or direct database insert. Passwords should be hashed with `bcrypt` or better-auth's built-in hashing. Check for existing data before inserting.

**Outputs:**  
`/scripts/seed.ts`, `npm run seed` command in package.json

---

## Epic 2: Authentication & Authorization

### Task 2.1: better-auth Configuration

**Type:** Config  
**Effort:** S (<4 hours)  
**Parallelizable:** YES  
**Blocked By:** 1.4

**Description:**  
Configure better-auth with email/password provider, session settings, and email integration.

**Acceptance Criteria:**
- [ ] better-auth configured in `/lib/auth.ts` with email/password provider
- [ ] Email configuration set up (Resend for verification/password reset emails)
- [ ] Session strategy: database sessions with cookie-based token
- [ ] Auth helpers exported: `getSession()`, `getUser()`, `requireAuth()`, `auth` object
- [ ] Custom User schema extended with `role` field (super_admin, admin, staff)

**Tech Notes:**  
better-auth has built-in email/password auth. Configure the `emailVerification` option with Resend. Use `callbackURL` pattern for post-login redirects.

**Outputs:**  
`/lib/auth.ts` (better-auth instance), `/types/auth.ts` (extended User type)

---

### Task 2.2: Login Page & Auth Actions

**Type:** UI + Feature  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 2.1

**Description:**  
Build login page at `/login` with email/password form. Implement server actions for sign in, sign out, and password reset using better-auth.

**Acceptance Criteria:**
- [ ] Login form with email + password fields
- [ ] Server action `signIn(email, password)` using better-auth `signIn()`
- [ ] Server action `signOut()` using better-auth `signOut()`
- [ ] Password reset flow with email token (better-auth `resetPassword`)
- [ ] Redirect to `/admin` on success, show error on failure
- [ ] Loading state during auth check

**Tech Notes:**  
better-auth provides `signIn.email()` and `signOut()` server actions. Use `callbackURL` for redirects. Password reset uses token-based flow.

**Outputs:**  
`/app/(admin)/login/page.tsx`, `/lib/actions/auth.ts`

---

### Task 2.3: Auth Middleware & Route Protection

**Type:** Infra  
**Effort:** S (<4 hours)  
**Parallelizable:** YES  
**Blocked By:** 2.1

**Description:**  
Create Next.js middleware to protect `/admin/*` routes and redirect unauthenticated users to `/login`.

**Acceptance Criteria:**
- [ ] Middleware at `/middleware.ts` checks session on `/admin/*` routes
- [ ] Unauthenticated users redirected to `/login?redirect=<original>`
- [ ] Authenticated users redirected away from `/login` to `/admin`
- [ ] Middleware uses better-auth `getSession()` helper
- [ ] Middleware respects redirect query param after login

**Tech Notes:**  
better-auth provides `getSession()` for middleware. Use `cookies()` to check session token. Cache session to avoid redundant lookups.

**Outputs:**  
`/middleware.ts`

---

### Task 2.4: Role-Based Access Control

**Type:** Infra  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 2.3

**Description:**  
Extend middleware to enforce role-based access: staff can only access scanner and dashboard; admins can access all.

**Acceptance Criteria:**
- [ ] User role loaded from `user` table in session (extended via better-auth)
- [ ] Staff users blocked from `/admin/events/*`, `/admin/settings`
- [ ] Staff users allowed on `/admin/scan/[id]` and `/admin/dashboard/[id]`
- [ ] Admin/super_admin can access all routes
- [ ] 403 error page for unauthorized access

**Tech Notes:**  
Extend better-auth User type with `role` field. Check `session.user.role` in middleware. Use pattern matching for route guards.

**Outputs:**  
Updated `/middleware.ts`, `/app/(admin)/403/page.tsx`

---

### Task 2.5: User Role Initialization

**Type:** Infra  
**Effort:** XS (<2 hours)  
**Parallelizable:** YES  
**Blocked By:** 1.2

**Description:**  
Create mechanism to set user roles when accounts are created. better-auth doesn't have automatic triggers—roles must be set on user creation.

**Acceptance Criteria:**
- [ ] Server action `createUserWithRole` wraps better-auth signup with role assignment
- [ ] Default role set to `'staff'` for new users
- [ ] Super admin can assign admin role during invite
- [ ] Role stored in `user` table `role` column

**Tech Notes:**  
better-auth allows extending the user creation flow. Use `hooks` or wrap the signup action to set the role. First user should be manually set as super_admin via script.

**Outputs:**  
Server action `/lib/actions/auth.ts`, role assignment logic

---

## Epic 3: Settings — Global Fields & Staff Management

### Task 3.1: Settings Page Layout & Navigation

**Type:** UI  
**Effort:** S (<4 hours)  
**Parallelizable:** YES  
**Blocked By:** 2.3

**Description:**  
Create `/admin/settings` page with tabbed navigation: Fields tab, Staff tab.

**Acceptance Criteria:**
- [ ] Tabs: "Global Fields" | "Staff Management"
- [ ] Active tab state persisted in URL (`/admin/settings?tab=staff`)
- [ ] Layout component wraps settings pages
- [ ] Breadcrumb navigation: Settings > [Tab]

**Tech Notes:**  
Use Next.js search params for tab state. Create shared layout component.

**Outputs:**  
`/app/(admin)/admin/settings/layout.tsx`, `/page.tsx`

---

### Task 3.2: Global Fields List UI

**Type:** UI  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 3.1

**Description:**  
Display list of all global fields with label, type, required status, and actions.

**Acceptance Criteria:**
- [ ] Table or card list showing all global fields
- [ ] Columns: Label, Type, Required, Actions
- [ ] Edit and Delete buttons per field
- [ ] Empty state with "Create your first global field" CTA
- [ ] Loading and error states

**Tech Notes:**  
Fetch from `global_fields` table. Use optimistic updates for delete.

**Outputs:**  
`/app/(admin)/admin/settings/fields/page.tsx`

---

### Task 3.3: Create/Edit Global Field Form

**Type:** UI + Feature  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 3.2

**Description:**  
Modal or inline form to create/edit a global field with label, type selector, options editor, and required toggle.

**Acceptance Criteria:**
- [ ] Form fields: Label (text), Type (dropdown), Options (dynamic list), Required (toggle)
- [ ] Options editor shows/hides based on type (only for dropdown/MC/checkboxes)
- [ ] Inline validation: label required
- [ ] Server action `upsertGlobalField` handles create/update
- [ ] Form resets on success, returns to list

**Tech Notes:**  
Use `react-hook-form` + `zod` for form validation. Store options as JSONB array.

**Outputs:**  
`/components/settings/GlobalFieldForm.tsx`, server action

---

### Task 3.4: Delete Global Field Action

**Type:** Feature  
**Effort:** XS (<2 hours)  
**Parallelizable:** YES  
**Blocked By:** 3.2

**Description:**  
Implement delete action for global fields with confirmation dialog.

**Acceptance Criteria:**
- [ ] Confirmation modal: "Are you sure you want to delete this field?"
- [ ] Warning: "This won't affect existing events"
- [ ] Server action `deleteGlobalField` with hard delete
- [ ] Optimistic UI update on success

**Tech Notes:**  
Hard delete is fine per spec (§8). Use `confirm()` or custom modal.

**Outputs:**  
Server action, confirmation UI

---

### Task 3.5: Staff List UI

**Type:** UI  
**Effort:** S (<4 hours)  
**Parallelizable:** YES  
**Blocked By:** 3.1

**Description:**  
Display list of all staff/admin accounts with name, email, role, and actions.

**Acceptance Criteria:**
- [ ] Table showing: Name, Email, Role, Created Date, Actions
- [ ] Filter by role (All | Admin | Staff)
- [ ] Edit role button per user
- [ ] Remove user button (disabled for last super admin)
- [ ] Empty state if no staff

**Tech Notes:**  
Fetch from `users` table joined with `auth.users`. Cache with React Query or SWR.

**Outputs:**  
`/app/(admin)/admin/settings/staff/page.tsx`

---

### Task 3.6: Invite Staff Form

**Type:** UI + Feature  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 3.5, 2.1

**Description:**  
Form to invite new staff member via email with role selection. Send invitation email with magic link or password setup link.

**Acceptance Criteria:**
- [ ] Form: Email (required), Role dropdown (Staff | Admin)
- [ ] Server action `inviteStaff` creates user with `emailVerified: false` and sends verification email
- [ ] Email contains magic link or password setup link (better-auth `sendVerificationEmail` or custom)
- [ ] Success message: "Invite sent to [email]"
- [ ] Error handling: duplicate email, invalid email
- [ ] Only super_admin can see this form (check in UI + server)

**Tech Notes:**  
better-auth provides `sendVerificationEmail()` for sending verification emails. Alternatively, create unverified user and send magic link for first-time login. Use Resend for email delivery.

**Outputs:**  
`/components/settings/InviteStaffForm.tsx`, server action

---

### Task 3.7: Edit User Role Action

**Type:** Feature  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 3.5

**Description:**  
Allow admins to promote/demote users between staff and admin roles.

**Acceptance Criteria:**
- [ ] Dropdown to change role: Staff | Admin
- [ ] Server action `updateUserRole` with authorization check
- [ ] Optimistic UI update
- [ ] Cannot demote the last super_admin

**Tech Notes:**  
Update `users.role` column. Add server-side check for caller's role.

**Outputs:**  
Server action, role dropdown component

---

### Task 3.8: Remove Staff Account Action

**Type:** Feature  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 3.5

**Description:**  
Allow removal of staff accounts with confirmation.

**Acceptance Criteria:**
- [ ] Confirmation modal: "Remove [user] from the team?"
- [ ] Server action `removeStaff` deletes user from `user` table (better-auth)
- [ ] Disabled for last super_admin
- [ ] Error if user has associated check-ins (optional constraint)
- [ ] Cascades to sessions and accounts tables

**Tech Notes:**  
better-auth stores users in `user` table. Delete cascades to `session` and `account` tables. Use transaction to ensure data integrity.

**Outputs:**  
Server action, confirmation UI

---

## Epic 4: Event CRUD & Form Builder

### Task 4.1: Event List Page

**Type:** UI  
**Effort:** M (4-8 hours)  
**Parallelizable:** YES  
**Blocked By:** 2.3

**Description:**  
Display all events in a table with title, date, status, registrant count, and actions.

**Acceptance Criteria:**
- [ ] Table columns: Title, Date, Status Badge, Registrants, Actions
- [ ] Status filter dropdown: All | Draft | Open | Closed
- [ ] Sort by date (newest first default)
- [ ] "Create New Event" CTA at top
- [ ] Empty state with CTA if no events
- [ ] Duplicate button per row

**Tech Notes:**  
Fetch from `events` table with left join on `registrants` for count. Use server component for initial fetch.

**Outputs:**  
`/app/(admin)/admin/events/page.tsx`

---

### Task 4.2: Create Event — Details Panel

**Type:** UI + Feature  
**Effort:** L (1-2 days)  
**Parallelizable:** NO  
**Blocked By:** 4.1

**Description:**  
Event creation form with details: title, slug, description, cover image, location, dates, status.

**Acceptance Criteria:**
- [ ] Form fields: Title (required), Slug (auto-gen, editable), Description (rich text), Cover Image (upload), Location, Event Date, End Date, Status toggle
- [ ] Slug auto-generates from title on blur, validates uniqueness
- [ ] Image upload to Supabase Storage, returns URL
- [ ] Server action `createEvent` inserts row, redirects to edit page
- [ ] Inline validation with Zod schema

**Tech Notes:**  
Use `react-hook-form` + `zod` for form validation. Slug validation via server action. Image upload via presigned URL.

**Outputs:**  
`/app/(admin)/admin/events/new/page.tsx`, server action

---

### Task 4.3: Edit Event — Details Panel

**Type:** UI + Feature  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 4.2

**Description:**  
Edit existing event details (same fields as create).

**Acceptance Criteria:**
- [ ] Pre-populated form with existing event data
- [ ] Same fields as create (4.2)
- [ ] Server action `updateEvent` handles update
- [ ] Delete event button with confirmation (only if no registrants)
- [ ] 404 if event doesn't exist

**Tech Notes:**  
Reuse form component from 4.2. Fetch event by ID.

**Outputs:**  
`/app/(admin)/admin/events/[id]/edit/page.tsx`, server action

---

### Task 4.4: Event Form Builder — Global Fields Toggle

**Type:** UI + Feature  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 4.3, 3.2

**Description:**  
Interface to toggle which global fields appear on this event's form, with per-field required override.

**Acceptance Criteria:**
- [ ] List of all global fields with toggle (on/off)
- [ ] Per-field "Required for this event" toggle (only active if field is on)
- [ ] Toggles persist to `events.form_fields` JSONB
- [ ] Visual indicator of field order
- [ ] Preview mode shows how form will render

**Tech Notes:**  
Store as JSONB array per spec (§9). Update on toggle change (optimistic).

**Outputs:**  
`/components/events/GlobalFieldsToggle.tsx`, updated server action

---

### Task 4.5: Event Form Builder — Custom Questions

**Type:** UI + Feature  
**Effort:** L (1-2 days)  
**Parallelizable:** NO  
**Blocked By:** 4.4

**Description:**  
Google Form-style builder to add custom questions per event: label, help text, type, options, required.

**Acceptance Criteria:**
- [ ] "Add Question" button opens inline editor
- [ ] Question editor: Label, Help Text, Type dropdown, Options (dynamic), Required toggle
- [ ] Questions stored in `events.custom_questions` JSONB
- [ ] Drag-and-drop reordering of questions
- [ ] Delete question with confirmation
- [ ] Inline preview of full form

**Tech Notes:**  
Use `@dnd-kit/core` for drag-drop. Store questions as JSONB array per spec (§9).

**Outputs:**  
`/components/events/CustomQuestionBuilder.tsx`, server action

---

### Task 4.6: Event Form Builder — Combined Ordering

**Type:** UI  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 4.5

**Description:**  
Unified interface to reorder global fields and custom questions together.

**Acceptance Criteria:**
- [ ] Single list showing both global fields and custom questions in order
- [ ] Drag to reorder across both types
- [ ] Order persisted to `events.form_fields` + `events.custom_questions` with order index
- [ ] Visual separation between global fields section and custom questions section

**Tech Notes:**  
Maintain separate arrays but render combined. Use `order` field in each array item.

**Outputs:**  
`/components/events/FormOrderEditor.tsx`

---

### Task 4.7: Share Panel — Public Link & QR Preview

**Type:** UI  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 4.3, 6.2

**Description:**  
Panel showing public registration link with copy button and QR code preview.

**Acceptance Criteria:**
- [ ] Display full URL: `https://<domain>/e/[slug]`
- [ ] Copy-to-clipboard button with toast confirmation
- [ ] QR code preview (uses same QR generation as Epic 6)
- [ ] QR downloadable as PNG

**Tech Notes:**  
Reuse QR component from 6.2. QR encodes the public URL.

**Outputs:**  
`/components/events/SharePanel.tsx`

---

### Task 4.8: Duplicate Event Action

**Type:** Feature  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 4.3

**Description:**  
Duplicate an existing event, copying title, form config, fields, and questions. Reset date and slug.

**Acceptance Criteria:**
- [ ] Duplicate button on event list and edit page
- [ ] Server action `duplicateEvent` copies all fields except: id, slug (regenerated), created_at, updated_at, event_date
- [ ] Redirects to new event's edit page
- [ ] Toast: "Event duplicated as '[Copy] <original title>'"

**Tech Notes:**  
Deep copy JSONB fields. Generate new slug from "Copy of <title>".

**Outputs:**  
Server action `/lib/actions/events.ts`

---

### Task 4.9: Event Status Toggle

**Type:** Feature  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 4.3

**Description:**  
Quick toggle for event status (Draft/Open/Closed) from event list or edit page.

**Acceptance Criteria:**
- [ ] Dropdown or segmented control: Draft | Open | Closed
- [ ] Status badge updates on change
- [ ] Server action `updateEventStatus` with optimistic update
- [ ] Registration form shows "closed" message when status != 'open'

**Tech Notes:**  
Use PATCH endpoint or server action. Update UI optimistically.

**Outputs:**  
`/components/events/StatusToggle.tsx`, server action

---

## Epic 5: Public Registration Flow

### Task 5.1: Public Event Page Layout

**Type:** UI  
**Effort:** M (4-8 hours)  
**Parallelizable:** YES  
**Blocked By:** 4.1

**Description:**  
Full-bleed event page with cover image, title, date, location, and registration form below.

**Acceptance Criteria:**
- [ ] Full-width cover image at top (or gradient fallback per §17)
- [ ] Event title, date, location displayed prominently
- [ ] Description rendered below header
- [ ] Sticky "Register" button on mobile
- [ ] Responsive design for mobile/desktop

**Tech Notes:**  
Use public page layout without admin sidebar. Fetch event by slug (server component).

**Outputs:**  
`/app/(public)/e/[slug]/page.tsx`, layout component

---

### Task 5.2: Dynamic Form Renderer

**Type:** UI  
**Effort:** L (1-2 days)  
**Parallelizable:** NO  
**Blocked By:** 5.1

**Description:**  
Render registration form dynamically based on event's `form_fields` and `custom_questions` JSONB configs.

**Acceptance Criteria:**
- [ ] Built-in fields rendered first: First Name, Last Name, Email
- [ ] Global fields rendered in order with correct input types
- [ ] Custom questions rendered in order with correct input types
- [ ] Field types supported: short_text, long_text, dropdown, multiple_choice, checkboxes
- [ ] Required fields validated client-side
- [ ] Form state managed with React Hook Form

**Tech Notes:**  
Create field component map: `short_text` → `<Input>`, `dropdown` → `<Select>`, etc. Use schema from JSONB.

**Outputs:**  
`/components/public/RegistrationForm.tsx`, field components

---

### Task 5.3: Registration Submit Action

**Type:** Feature  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 5.2

**Description:**  
Server action to handle registration form submission, validate data, insert registrant, generate QR token.

**Acceptance Criteria:**
- [ ] Server action `submitRegistration` receives form data
- [ ] Validates: required fields, email format, unique email per event
- [ ] Generates unique `qr_token` (UUID)
- [ ] Inserts row into `registrants` table
- [ ] Returns registrant object with QR token on success
- [ ] Returns error object on failure (duplicate email, validation)

**Tech Notes:**  
Use `zod` for server-side validation. Generate QR token with `crypto.randomUUID()`.

**Outputs:**  
Server action `/lib/actions/registration.ts`

---

### Task 5.4: Duplicate Email Detection & Recovery

**Type:** Feature  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 5.3

**Description:**  
Detect duplicate email on submit and show friendly recovery message with ticket link.

**Acceptance Criteria:**
- [ ] Server action checks for existing email in event
- [ ] Returns existing registrant's QR token if duplicate
- [ ] UI shows: "Looks like you're already registered! Here's your ticket."
- [ ] Link to `/ticket/[token]` shown
- [ ] Inline error (not full page reload)

**Tech Notes:**  
Query registrants by email + event_id. Return token in action response.

**Outputs:**  
Updated server action, UI error handling

---

### Task 5.5: Thank-You Page

**Type:** UI  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 5.3, 6.2

**Description:**  
Post-registration success page with QR code, event details, and instructions.

**Acceptance Criteria:**
- [ ] Route: `/e/[slug]/thanks?token=<qr_token>`
- [ ] Celebratory message: "You're in!"
- [ ] Event name, date, location displayed
- [ ] QR code rendered (SVG/PNG)
- [ ] Instruction: "Save this page or screenshot your QR code"
- [ ] Link to permanent ticket page
- [ ] "Email confirmation sent" note

**Tech Notes:**  
Fetch registrant by token. Reuse QR component.

**Outputs:**  
`/app/(public)/e/[slug]/thanks/page.tsx`

---

### Task 5.6: Ticket Page

**Type:** UI  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 6.2

**Description:**  
Permanent, mobile-optimized ticket page at `/ticket/[qr_token]`.

**Acceptance Criteria:**
- [ ] Route: `/ticket/[qr_token]`
- [ ] Minimal design: event name, date, location, registrant name, QR code
- [ ] No login required
- [ ] 404 if token invalid
- [ ] Works offline (screenshot-friendly)

**Tech Notes:**  
Fetch registrant + event by token. Server-render for SEO + speed.

**Outputs:**  
`/app/(public)/ticket/[token]/page.tsx`

---

## Epic 6: Email & QR Code Generation

### Task 6.1: Resend Client & Email Template

**Type:** Config + Feature  
**Effort:** S (<4 hours)  
**Parallelizable:** YES  
**Blocked By:** 1.1

**Description:**  
Configure Resend client and create React email template for confirmation.

**Acceptance Criteria:**
- [ ] Resend package installed (`resend` npm)
- [ ] Resend client initialized with `RESEND_API_KEY`
- [ ] Email template created: greeting, event details, QR code image, ticket link
- [ ] Template uses registrant's first name
- [ ] Subject line: "Your ticket for [Event Name]"

**Tech Notes:**  
Use `resend.emails.send` with React component template. Store template in `/emails`.

**Outputs:**  
`/lib/resend.ts`, `/emails/confirmation.tsx`

---

### Task 6.2: QR Code Generation Utility

**Type:** Feature  
**Effort:** S (<4 hours)  
**Parallelizable:** YES  
**Blocked By:** NONE

**Description:**  
Server-side QR code generation using `qrcode` npm package.

**Acceptance Criteria:**
- [ ] Package installed: `qrcode`
- [ ] Utility function `generateQRCode(url: string): Promise<string>` returns base64 PNG
- [ ] QR code is high-contrast, mobile-readable
- [ ] Export as both PNG (for email) and SVG (for web)

**Tech Notes:**  
Use `qrcode.toDataURL()` for PNG, `qrcode.toString()` for SVG.

**Outputs:**  
`/lib/qr.ts`

---

### Task 6.3: Send Confirmation Email Action

**Type:** Feature  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 6.1, 6.2, 5.3

**Description:**  
Server action to send confirmation email after successful registration.

**Acceptance Criteria:**
- [ ] Called after registration insert (5.3)
- [ ] Sends to registrant's email
- [ ] Includes QR code as embedded PNG
- [ ] Includes link to ticket page
- [ ] Logs failure but doesn't block registration
- [ ] Rate limit: 10 emails/minute per IP (Vercel edge middleware)

**Tech Notes:**  
Use Resend send. Rate limit with in-memory Map for simplicity or `@vercel/kv`.

**Outputs:**  
Server action `/lib/actions/email.ts`

---

## Epic 7: Check-in System (Scanner + Manual)

### Task 7.1: Check-in API Endpoint

**Type:** API  
**Effort:** M (4-8 hours)  
**Parallelizable:** YES  
**Blocked By:** 2.1, 1.2

**Description:**  
POST `/api/checkin` endpoint to handle QR or manual check-in.

**Acceptance Criteria:**
- [ ] Accepts: `qr_token` (for QR) or `email` + `event_id` (for manual)
- [ ] Validates auth (staff or admin role required)
- [ ] Finds registrant by token or email + event
- [ ] Checks if already checked in
- [ ] If not checked in: sets `checked_in=true`, records `checked_in_at`, `checked_in_by`
- [ ] Inserts row into `checkins` table
- [ ] Returns: success/fail, registrant profile, check-in status

**Tech Notes:**  
Use Next.js API route. Transaction for registrant + checkin insert.

**Outputs:**  
`/app/api/checkin/route.ts`

---

### Task 7.2: Scanner Page UI

**Type:** UI  
**Effort:** L (1-2 days)  
**Parallelizable:** NO  
**Blocked By:** 7.1

**Description:**  
Full-screen QR scanner page optimized for mobile, using `html5-qrcode`.

**Acceptance Criteria:**
- [ ] Camera activates on page load
- [ ] Permission request handled gracefully
- [ ] Full-screen camera view
- [ ] QR code decoded → instant API call to `/api/checkin`
- [ ] Haptic feedback on scan (if supported)
- [ ] Sound toggle for scan feedback

**Tech Notes:**  
Use `html5-qrcode` React wrapper. Handle camera permissions.

**Outputs:**  
`/app/(admin)/admin/scan/[id]/page.tsx`, scanner component

---

### Task 7.3: Scan Result Overlays

**Type:** UI  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 7.2

**Description:**  
Full-screen overlays for scan results: success, already checked in, not found.

**Acceptance Criteria:**
- [ ] **Success (green):** Name, avatar initials, VIP badge, form answers summary, "Notify Admin (VIP)" button, "Done" button
- [ ] **Already checked in (amber):** Name, original check-in time
- [ ] **Not found (red):** "QR code not recognized"
- [ ] Overlays dismiss on action, camera resumes

**Tech Notes:**  
Use full-screen fixed overlay components. Different background colors per state.

**Outputs:**  
`/components/scanner/ScanOverlay.tsx`

---

### Task 7.4: Manual Check-in Modal

**Type:** UI + Feature  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 7.1

**Description:**  
"Can't scan?" modal for manual email lookup and check-in.

**Acceptance Criteria:**
- [ ] "Can't scan?" link on scanner page opens modal
- [ ] Email input field with search/submit button
- [ ] Same success/fail overlays as QR scan
- [ ] Check-in recorded with `method = 'manual_email'`

**Tech Notes:**  
Reuse check-in API (7.1) with email parameter.

**Outputs:**  
`/components/scanner/ManualCheckinModal.tsx`

---

### Task 7.5: VIP Notify Action

**Type:** Feature  
**Effort:** S (<4 hours)  
**Parallelizable:** YES  
**Blocked By:** 7.1

**Description:**  
Action to flag a registrant as VIP and trigger notification to admin dashboard.

**Acceptance Criteria:**
- [ ] Server action `notifyVIP` inserts row into `vip_notifications`
- [ ] Updates registrant's `is_vip = true`
- [ ] Realtime pushes to admin dashboard
- [ ] Button changes to checkmark after tapping (no spam)

**Tech Notes:**  
Use Supabase Realtime channel `vip:[event_id]`.

**Outputs:**  
Server action `/lib/actions/vip.ts`

---

## Epic 8: Live Dashboard & VIP Notifications

### Task 8.1: Live Dashboard Page

**Type:** UI  
**Effort:** M (4-8 hours)  
**Parallelizable:** YES  
**Blocked By:** 4.1

**Description:**  
Admin dashboard with stats bar and realtime check-in feed.

**Acceptance Criteria:**
- [ ] Stats bar: Total registered, Checked in, Remaining, Check-in rate %
- [ ] Feed shows: avatar, name, time, VIP badge, check-in method
- [ ] Auto-scrolls to new entries
- [ ] Works on desktop and mobile

**Tech Notes:**  
Server component for initial fetch, client component for Realtime.

**Outputs:**  
`/app/(admin)/admin/dashboard/[id]/page.tsx`

---

### Task 8.2: Supabase Realtime Subscriptions

**Type:** Infra  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 1.2

**Description:**  
Set up Realtime channels for check-ins and VIP notifications.

**Acceptance Criteria:**
- [ ] Channel `checkins:[event_id]` subscribes to new check-ins
- [ ] Channel `vip:[event_id]` subscribes to VIP notifications
- [ ] Realtime only enabled on admin pages
- [ ] Connection cleanup on unmount

**Tech Notes:**  
Use Supabase `.channel()` with filters. Broadcast changes to dashboard.

**Outputs:**  
`/lib/realtime.ts`, hooks: `useCheckinSubscription`, `useVIPSubscription`

---

### Task 8.3: VIP Notification Alert Component

**Type:** UI  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 8.2

**Description:**  
Highlighted alert component for VIP notifications in dashboard feed.

**Acceptance Criteria:**
- [ ] Alert appears at top of feed with highlight
- [ ] Shows registrant name, event, who flagged
- [ ] "Acknowledge" button dismisses alert
- [ ] Only admins can acknowledge

**Tech Notes:**  
Update `vip_notifications.acknowledged` and `acknowledged_by` on acknowledge.

**Outputs:**  
`/components/dashboard/VIPAlert.tsx`

---

### Task 8.4: Registrant List Page

**Type:** UI  
**Effort:** M (4-8 hours)  
**Parallelizable:** NO  
**Blocked By:** 4.1

**Description:**  
Full table of registrants with search, filter, and CSV export.

**Acceptance Criteria:**
- [ ] Table: Name, Email, Registered At, Check-in Status, VIP Badge
- [ ] Search by name or email
- [ ] Filter: All | Checked In | Not Checked In | VIP
- [ ] Click row → side panel with full profile
- [ ] Toggle VIP status per registrant

**Tech Notes:**  
Use server-side pagination for large lists.

**Outputs:**  
`/app/(admin)/admin/events/[id]/registrants/page.tsx`

---

### Task 8.5: CSV Export

**Type:** Feature  
**Effort:** S (<4 hours)  
**Parallelizable:** NO  
**Blocked By:** 8.4

**Description:**  
Export registrant data to CSV with dynamic columns based on event form config.

**Acceptance Criteria:**
- [ ] "Export CSV" button on registrant list page
- [ ] Columns: Built-in fields + Global Fields + Custom Questions
- [ ] Multi-select answers joined with ` | `
- [ ] Timestamps in ISO 8601 format
- [ ] Filename: `[event-slug]-registrants-[YYYY-MM-DD].csv`

**Tech Notes:**  
Generate server-side in API route. Stream response for large files.

**Outputs:**  
`/app/api/events/[id]/export/route.ts`

---

## Task Summary

```
Total Tasks: 46

By Effort:
- XS (<2h):  2 tasks
- S  (<4h): 17 tasks
- M  (4-8h):18 tasks
- L  (1-2d): 6 tasks

By Type:
- UI:         15 tasks
- Feature:    16 tasks
- Infra:       8 tasks
- Config:      5 tasks
- API:         1 task
- Testing:     1 task
```
