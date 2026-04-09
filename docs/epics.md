# EventFlow — Epics

## Epic Overview

| Epic | Name | Goal | Estimated Effort |
|------|------|------|------------------|
| 1 | Infrastructure & Database Setup | Database schema with Drizzle ORM, better-auth tables, base project structure | 3 days |
| 2 | Authentication & Authorization | better-auth integration, role-based middleware | 2.5 days |
| 3 | Settings — Global Fields & Staff Management | Foundational settings before events can be created | 3.5 days |
| 4 | Event CRUD & Form Builder | Create, edit, duplicate events with customizable forms | 6 days |
| 5 | Public Registration Flow | Participant-facing registration and ticket pages | 3.5 days |
| 6 | Email & QR Code Generation | Resend integration, QR generation, confirmation emails | 2 days |
| 7 | Check-in System (Scanner + Manual) | QR scanner, manual email check-in, registrant profile view | 3 days |
| 8 | Live Dashboard & VIP Notifications | Realtime check-in feed, VIP alerts, CSV export | 3 days |

**Total Estimated Effort:** ~26.5 days (single developer)

---

## Epic 1: Infrastructure & Database Setup

**Goal:** Set up database schema with Drizzle ORM, better-auth tables, and base Next.js project structure.

**Scope:**
- Next.js 14 App Router project with TypeScript
- better-auth configuration with database adapter (Drizzle ORM)
- Database tables: users (auth), sessions, accounts (better-auth), events, registrants, checkins, vip_notifications, global_fields
- Enums: event_status, user_role, checkin_method
- Database indexes for performance
- TypeScript types generated from schema
- Seed script for local development

**Not Included:**
- Auth flows (Epic 2)
- API routes
- UI components

**Dependencies:** None — foundation epic

**Tasks:** 1.1 – 1.5 (5 tasks)

---

## Epic 2: Authentication & Authorization

**Goal:** Implement better-auth integration, login flow, session management, and role-based route protection.

**Scope:**
- better-auth configuration with email/password provider
- Login page with email/password
- Server actions: signIn, signOut, passwordReset
- Middleware for route protection
- Role-based access control (staff vs admin)
- User role initialization on signup

**Not Included:**
- Staff management UI (Epic 3)

**Dependencies:** Epic 1 (database schema, better-auth config)

**Tasks:** 2.1 – 2.5 (5 tasks)

---

## Epic 3: Settings — Global Fields & Staff Management

**Goal:** Build settings UI for managing global fields (reusable form fields) and staff accounts.

**Scope:**
- `/admin/settings` page with tabs (Fields, Staff)
- Global fields CRUD: list, create, edit, delete
- Staff list with role filtering
- Invite staff form (better-auth with email verification/magic link)
- Edit user role action
- Remove staff account action

**Not Included:**
- Event creation (Epic 4)

**Dependencies:** Epic 2 (auth + middleware)

**Tasks:** 3.1 – 3.8 (8 tasks)

---

## Epic 4: Event CRUD & Form Builder

**Goal:** Build full event management: create, edit, duplicate events with flexible form builder for registration forms.

**Scope:**
- Event list page with filters and actions
- Create/Edit event details panel
- Form builder: global fields toggle with required override
- Form builder: custom questions (Google Form-style)
- Combined ordering interface
- Share panel with public link + QR preview
- Duplicate event action
- Event status toggle

**Not Included:**
- Registrant management (Epic 5/6)

**Dependencies:** Epic 2 (auth), Epic 3 (global fields available)

**Tasks:** 4.1 – 4.9 (9 tasks)

---

## Epic 5: Public Registration Flow

**Goal:** Build participant-facing registration experience: event page, registration form, thank-you page, ticket page.

**Scope:**
- Public event page with full-bleed cover image
- Dynamic form renderer based on event config
- Registration submit action with validation
- Duplicate email detection and recovery
- Thank-you page with QR code
- Permanent ticket page

**Not Included:**
- Email sending (Epic 6)

**Dependencies:** Epic 4 (events with forms configured)

**Tasks:** 5.1 – 5.6 (6 tasks)

---

## Epic 6: Email & QR Code Generation

**Goal:** Implement Resend integration for confirmation emails and server-side QR code generation.

**Scope:**
- Resend client configuration
- Email template (React-based)
- QR code generation utility (PNG + SVG)
- Send confirmation email action
- Rate limiting (10/minute per IP)

**Not Included:**
- Public pages (Epic 5)

**Dependencies:** Epic 1 (database client), Epic 5 (registration flow)

**Tasks:** 6.1 – 6.3 (3 tasks)

---

## Epic 7: Check-in System (Scanner + Manual)

**Goal:** Build staff-facing check-in experience: QR scanner, manual email check-in, registrant profile view.

**Scope:**
- POST `/api/checkin` endpoint
- Scanner page with `html5-qrcode` integration
- Full-screen camera view with haptic/sound feedback
- Success/fail/not-found overlays
- Manual check-in modal (email lookup)
- VIP notify action

**Not Included:**
- Live dashboard (Epic 8)

**Dependencies:** Epic 2 (auth + role-based access), Epic 4 (events)

**Tasks:** 7.1 – 7.5 (5 tasks)

---

## Epic 8: Live Dashboard & VIP Notifications

**Goal:** Build realtime admin dashboard for monitoring check-ins and VIP notifications.

**Scope:**
- Live dashboard page with stats bar
- Realtime check-in feed (Supabase Realtime or polling fallback)
- VIP notifications Realtime channel
- Registrant list page with search/filter
- CSV export functionality
- VIP notification acknowledge action

**Not Included:**
- None — this is the final epic

**Dependencies:** Epic 4 (events), Epic 7 (check-in system)

**Tasks:** 8.1 – 8.5 (5 tasks)

---

## Epic Summaries

```
Total Epics: 8
Total Tasks: 46
Critical Path: Epic 1 → Epic 2 → Epic 4 → Epic 5 → Epic 6 → Epic 7 → Epic 8
```
