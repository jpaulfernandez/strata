# Strata — Master Implementation Plan

**Version:** 1.1  
**Last Updated:** 2026-04-10  
**Spec Reference:** `../eventflow-spec.md`

---

## Progress Tracker

### 🟢 Wave 1 — Foundation (Complete)

- **Status**: Complete
- **Last updated**: 2026-04-09
- **Completed**:
  - [x] Task 1.1: Project Initialization
  - [x] Task 1.2: Database Schema — Core Tables
  - [x] Task 6.2: QR Code Generation Utility
- **Notes**: Next.js 14 with App Router, Drizzle ORM, Tailwind with DESIGN.md tokens, all 6 database tables created

### 🟢 Wave 2 — Auth Layer (Complete)

- **Status**: Complete
- **Last updated**: 2026-04-09
- **Completed**:
  - [x] Task 1.3: Database Indexes
  - [x] Task 1.4: better-auth Configuration
  - [x] Task 2.1: better-auth API Route Handler
  - [x] Task 2.2: Login Page & Auth Actions
  - [x] Task 2.3: Auth Middleware
  - [x] Task 2.4: Role-Based Access Control
  - [x] Task 2.5: User Role Initialization
- **Notes**: Full auth layer implemented - email/password auth, session management, role-based access control, middleware protection

---

### 🟢 Wave 3 — Settings (Complete)

- **Status**: Complete
- **Last updated**: 2026-04-09
- **Completed**:
  - [x] Task 3.1: Settings Layout & Navigation
  - [x] Task 3.2: Global Fields List UI (client component with CRUD)
  - [x] Task 3.3: Create Global Field Form
  - [x] Task 3.4: Delete Global Field Action
  - [x] Task 3.5: Staff List UI (client component)
  - [x] Task 3.6: Invite Staff Form (stub)
  - [x] Task 3.7: Edit User Role Action
  - [x] Task 3.8: Remove Staff Account Action
- **Notes**: 
    - Settings pages implemented as client components for runtime data loading. UI components built following DESIGN.md tokens.
    - **General Settings page** added for editing e-ticket message (default: "Save or screenshot this QR code to check in at the event.")

---

### 🟢 Wave 4 — Event CRUD (Complete)

- **Status**: Complete
- **Last updated**: 2026-04-10
- **Completed**:
  - [x] Task 4.1: Event List Page
  - [x] Task 4.2: Create Event Page
  - [x] Task 4.3: Edit Event Page (Tabbed layout with form preview)
  - [x] Task 4.4: Global Fields Toggle
  - [x] Task 4.5: Custom Questions Builder
  - [x] Task 4.6: Combined Ordering
  - [x] Task 4.7: Share Panel
  - [x] Task 4.8: Duplicate Event Action
  - [x] Task 4.9: Event Status Toggle
- **Notes**: 
  - Full event CRUD implemented with grid/list toggle (persisted to localStorage), search, and status filtering
  - Edit page uses tabbed layout: "Event Details" tab and "Registration Form" tab with split view (FormBuilder left, FormPreview right)
  - Event date/time fields: date picker + start/end time inputs (default 10:00-17:00) + optional maps link
  - Removed `eventEndDate` field from schema
  - Unified form builder with @dnd-kit drag-and-drop for global fields toggle and custom questions (single column layout)
  - Event cards: clickable title (draft→edit, published→public), ellipsis menu for actions (duplicate, toggle status, delete), share button with "Copied" feedback
  - Unsaved changes detection with fixed save bar at bottom and success toast notification
  - Dropdown menu uses React portal to prevent clipping issues
  - Purple color scheme applied throughout admin UI (badges, navigation, hover states)
  - Floating sidebar with glassmorphism effect

---

### 🟢 Wave 5 — Public Registration + Email (Complete)

- **Status**: Complete
- **Last updated**: 2026-04-10
- **Completed**:
  - [x] Task 5.1: Public Event Page Layout (`/e/[slug]`)
  - [x] Task 5.2: Dynamic Form Renderer
  - [x] Task 5.3: Registration Submit Action
  - [x] Task 5.4: Duplicate Email Detection
  - [x] Task 6.1: Resend Client & Template
  - [x] Task 6.3: Send Confirmation Email
  - [x] Task 5.5: Thank-You Page (`/e/[slug]/thanks`)
  - [x] Task 5.6: Ticket Page (`/ticket/[qrToken]`)
- **Notes**: 
  - Public registration pages with dynamic form rendering
  - Email confirmation with embedded QR code via Resend
  - Duplicate email detection with friendly UX
  - Mobile-optimized ticket page

---

### 🟢 Wave 6 — Check-in System (Complete)

- **Status**: Complete
- **Last updated**: 2026-04-10
- **Completed**:
  - [x] Task 7.1: Check-in API Endpoint
  - [x] Task 7.2: Scanner Page UI
  - [x] Task 7.3: Scan Result Overlays
  - [x] Task 7.4: Manual Check-in Modal
  - [x] Task 7.5: VIP Notify Action
- **Notes**: 
  - QR scanner with html5-qrcode
  - Full-screen success/already-checked-in/not-found overlays
  - Manual check-in by email with modal
  - VIP toggle from scanner overlay
  - **Mobile-optimized scanner** at `/scan/[id]` with fullscreen camera view, bottom navigation (Scanner, History, Stats, Manual), and slide-up attendee profile panel. Bypasses admin layout for pure mobile experience.
  - **Mobile-optimized scanner** at `/scan/[id]` with fullscreen camera, bottom navigation (Scanner, History, Stats, Manual), and slide-up attendee panel

---

### 🟢 Wave 7 — Live Dashboard (Complete)

- **Status**: Complete
- **Last updated**: 2026-04-10
- **Completed**:
  - [x] Task 8.1: Live Dashboard Page (`/admin/dashboard/[id]`)
  - [x] Task 8.2: Realtime Updates (polling every 5s)
  - [x] Task 8.3: VIP Notification Badge
  - [x] Task 8.4: Registrant List Page (`/admin/events/[id]/registrants`)
  - [x] Task 8.5: CSV Export
- **Notes**: 
  - Dashboard shows live check-in stats with auto-refresh
  - Registrant list with search and status filtering
  - CSV export with dynamic form field columns
  - **Enhanced dashboard** (2026-04-10): Now shows both "Recent Check-ins" (max 5) and "Not Checked In" sections for better event management
  - Fixed typo in edit event URL (extra `}` character)

---

## Bug Fixes & Enhancements (Post-Wave 7)

### 2026-04-10 Session

**Bugs Resolved:**
- BUG-020: QR code not centered on thank-you page (fixed flex centering)
- BUG-021: QR scanner showing "not recognized" for valid QR codes (URL token extraction)
- BUG-022: Mobile responsiveness issues on public pages (responsive breakpoints)
- BUG-023: Edit event URL contained extra brace (typo fix)
- BUG-024: Ticket page authentication error (added public `getEventById` function)

**Enhancements:**
- FEATURE-001: Dashboard now shows pending registrants (not checked in) alongside recent check-ins
- Mobile-responsive design for registration, thank-you, and ticket pages
- QR scanner extracts token from URL path for reliable check-ins

**Files Modified:**
- `app/scan/[id]/page.tsx` - Token extraction from URL
- `app/e/[slug]/thanks/page.tsx` - QR centering, mobile responsive
- `app/e/[slug]/page.tsx` - Mobile responsive
- `app/ticket/[qrToken]/page.tsx` - Mobile responsive, public event fetching
- `app/admin/dashboard/[id]/page.tsx` - URL fix, pending registrants feature
- `server/actions/events.ts` - Added public `getEventById` function

---

## Feature Wave: Email Templates, Calendar, Reports (2026-04-10)

**Status**: Complete
**Last updated**: 2026-04-10

**Features Implemented:**
1. **Customizable Email Templates**
   - Default email template editable in General Settings
   - Per-event template override capability
   - Template variables: `{{firstName}}`, `{{lastName}}`, `{{fullName}}`, `{{email}}`, `{{eventName}}`, `{{eventDate}}`, `{{eventTime}}`, `{{eventLocation}}`, `{{ticketUrl}}`, `{{eventSlug}}`
   - HTML support in templates

2. **Calendar Integration**
   - "Add to Calendar" buttons on ticket page
   - Google Calendar support (opens pre-filled event)
   - Outlook Calendar support
   - Apple Calendar / generic ICS download

3. **Events Report**
   - Export all registrants across all events in single CSV
   - Includes Event Name column for identification
   - Accessible from General Settings page

**Files Created:**
- `lib/calendar.ts` - Calendar URL/ICS generation utilities
- `components/features/calendar-buttons.tsx` - Calendar button component

**Files Modified:**
- `lib/db/schema.ts` - Added `defaultEmailTemplate` and `emailTemplate` fields
- `server/actions/settings.ts` - Email template CRUD functions
- `server/actions/export.ts` - Added `exportAllRegistrantsCsv()`
- `server/email/index.ts` - Template support with variable substitution
- `server/actions/registrants.ts` - Pass template to email function
- `app/admin/settings/general/page.tsx` - Template editor and export button
- `app/ticket/[qrToken]/page.tsx` - Calendar buttons

---

## Session: UX Improvements (2026-04-10)

**Status**: Complete
**Last updated**: 2026-04-10

**Features Implemented:**
1. **Consolidated Thank You Page into Ticket Page**
   - Removed redundant thank-you page flow
   - Registration now redirects directly to `/ticket/{qrToken}?new=true`
   - Success banner shows "You're Registered!" for new registrations
   - Ticket page serves as both confirmation and permanent ticket

2. **Download QR Button**
   - Added "Save QR" button on ticket page
   - Downloads QR code as PNG file named after registrant

3. **Email Template Tab on Edit Event**
   - Added third tab "Confirmation Email" to edit event page
   - Toggle to enable/disable custom email template per event
   - HTML template editor with variable reference
   - Falls back to default template from settings when disabled

4. **Fixed Email Sending**
   - Email sending errors were being swallowed silently
   - Added proper result checking with `.then()` instead of `.catch()`
   - Added detailed console logging for success/failure
   - Added configurable `EMAIL_FROM` environment variable
   - Defaults to Resend's test address for development

**Files Created:**
- `components/features/download-qr-button.tsx` - QR download button component

**Files Modified:**
- `app/e/[slug]/thanks/page.tsx` - Converted to redirect page
- `app/e/[slug]/registration-form.tsx` - Redirect to ticket page with success flag
- `app/ticket/[qrToken]/page.tsx` - Added success banner, download button
- `app/admin/events/[id]/edit/page.tsx` - Added email template tab
- `lib/validations/events.ts` - Added `emailTemplate` field to schema
- `server/actions/events.ts` - Handle `emailTemplate` in `updateEvent`
- `server/actions/registrants.ts` - Proper email result handling
- `server/email/index.ts` - Configurable from address
- `.env.example` - Added EMAIL_FROM documentation

---

## Executive Summary

Strata is an event registration and check-in platform with three user-facing surfaces:
1. **Admin portal** — Event management, settings, live dashboard
2. **Staff portal** — QR scanner (mobile-optimized at `/scan/[id]`), manual check-in
3. **Public pages** — Registration form, ticket page

This plan organizes 46 tasks across 8 epics into a dependency-aware execution schedule optimized for parallel development.

**Total Estimated Effort:** ~26.5 days (single developer)  
**Critical Path Duration:** ~18 days (with parallelization)

---

## Dependency Graph

```
Legend: [Epic.Task] → indicates "blocks"

┌─────────────────────────────────────────────────────────────────┐
│                    WAVE 1 — Foundation                          │
│  [1.1] Project Init ──┬──► [1.2] Schema ──► [1.3] Indexes      │
│                       │                        │                │
│                       │                        ▼                │
│                       │                   [1.4] better-auth     │
│                       │                        │                │
│                       │                        ▼                │
│                       │                   [1.5] Seed           │
│                       │                                          │
│                       └──► [6.2] QR Utility (independent)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WAVE 2 — Auth Layer                          │
│  [2.1] better-auth Config ──► [2.2] Login Page                 │
│         │                                                        │
│         ▼                                                        │
│  [2.3] Middleware ──► [2.4] Role-Based Access                  │
│         │                                                        │
│         └── ► [2.5] User Role Initialization                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              WAVE 3 — Settings (parallel tracks)                │
│  [3.1] Settings Layout ──┬──► [3.2] Fields List ──► [3.3] Form │
│                          │                       │              │
│                          │                       ▼              │
│                          │                  [3.4] Delete        │
│                          │                                      │
│                          └──► [3.5] Staff List ──► [3.6] Invite│
│                                                  │              │
│                                                  ▼              │
│                                           [3.7] Role Edit      │
│                                                  │              │
│                                                  ▼              │
│                                           [3.8] Remove         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              WAVE 4 — Event CRUD (major epic)                   │
│  [4.1] Event List ──► [4.2] Create ──► [4.3] Edit             │
│                                  │                              │
│                                  ▼                              │
│  [4.4] Global Fields Toggle ◄──┤                               │
│         │                        │                              │
│         ▼                        │                              │
│  [4.5] Custom Questions ────────┤                               │
│         │                        │                              │
│         ▼                        │                              │
│  [4.6] Combined Ordering ◄───────┘                              │
│                                                                  │
│  [4.8] Duplicate ─────────────────────────────────► [4.9] Status│
│                                                                  │
│  [4.7] Share Panel (needs 6.2) ◄───────────────────────────────┐│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           WAVE 5 — Public Registration + Email                  │
│  [5.1] Public Page ──► [5.2] Form Renderer ──► [5.3] Submit   │
│                                                  │              │
│                    [6.1] Resend Config ──► [6.3] Email Action  │
│                                                  │              │
│                                                  ▼              │
│  [5.4] Duplicate Detection ◄─────────────────────┘              │
│         │                                                        │
│         ▼                                                        │
│  [5.5] Thank-You Page (needs 6.2 QR)                            │
│         │                                                        │
│         ▼                                                        │
│  [5.6] Ticket Page                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              WAVE 6 — Check-in System                           │
│  [7.1] Check-in API ◄──────────────────────┐                    │
│         │                                   │                    │
│         ▼                                   │                    │
│  [7.2] Scanner UI ──► [7.3] Overlays        │                    │
│         │                                   │                    │
│         ▼                                   │                    │
│  [7.4] Manual Modal ──► [7.5] VIP Notify ──┘                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              WAVE 7 — Live Dashboard                            │
│  [8.1] Dashboard UI ◄──────────────────────┐                    │
│         │                                   │                    │
│         ▼                                   │                    │
│  [8.2] Realtime Channels ──► [8.3] VIP Alert                   │
│                                                                  │
│  [8.4] Registrant List ──► [8.5] CSV Export                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Waves

### 🟢 Wave 1 — Foundation (Days 1-3)

**No prerequisites. Run all tasks in parallel.**

| Task | Name | Effort | Owner |
|------|------|--------|-------|
| 1.1 | Project Initialization | S | Any |
| 1.2 | Database Schema — Core Tables | M | Backend |
| 6.2 | QR Code Generation Utility | S | Any |

**After Wave 1:**
- Project scaffold exists
- Database schema deployed with better-auth tables
- QR codes can be generated

**Unlocks:** Wave 2 (Auth), Wave 3 (Settings)

---

### 🟡 Wave 2 — Auth Layer (Days 4-5)

**Requires:** Wave 1 complete

| Task | Name | Effort | Owner |
|------|------|--------|-------|
| 1.3 | Database Indexes | M | Backend |
| 1.4 | better-auth Configuration | S | Backend |
| 2.1 | better-auth Configuration | S | Backend |
| 2.2 | Login Page & Auth Actions | M | Full-stack |
| 2.3 | Auth Middleware | S | Backend |
| 2.4 | Role-Based Access Control | M | Backend |
| 2.5 | User Role Initialization | XS | Backend |

**After Wave 2:**
- Users can log in with email/password
- Admin routes are protected
- Role-based access enforced

**Unlocks:** Wave 3 (Settings), Wave 4 (Events)

---

### 🟠 Wave 3 — Settings (Days 6-8)

**Requires:** Wave 2 complete

| Task | Name | Effort | Owner |
|------|------|--------|-------|
| 3.1 | Settings Layout & Navigation | S | Frontend |
| 3.2 | Global Fields List UI | S | Frontend |
| 3.3 | Create/Edit Global Field Form | M | Full-stack |
| 3.4 | Delete Global Field Action | XS | Backend |
| 3.5 | Staff List UI | S | Frontend |
| 3.6 | Invite Staff Form | M | Full-stack |
| 3.7 | Edit User Role Action | S | Backend |
| 3.8 | Remove Staff Account Action | S | Backend |

**Parallelization:**
- 3.2, 3.3, 3.4 (Global Fields track) can run parallel with 3.5, 3.6, 3.7, 3.8 (Staff track)
- Both tracks require 3.1 (layout) first

**After Wave 3:**
- Admins can create reusable form fields
- Staff accounts can be managed
- Foundation for event form builder complete
- **General Settings** page for e-ticket message customization

**Unlocks:** Wave 4 (Event Form Builder depends on global fields)

---

### 🔵 Wave 4 — Event CRUD (Days 9-14)

**Requires:** Wave 2 (auth), Wave 3 (global fields) mostly complete

| Task | Name | Effort | Owner |
|------|------|--------|-------|
| 4.1 | Event List Page | M | Frontend |
| 4.2 | Create Event — Details | L | Full-stack |
| 4.3 | Edit Event — Details | M | Full-stack |
| 4.4 | Global Fields Toggle | M | Full-stack |
| 4.5 | Custom Questions Builder | L | Full-stack |
| 4.6 | Combined Ordering | M | Frontend |
| 4.7 | Share Panel (needs 6.2) | S | Frontend |
| 4.8 | Duplicate Event Action | S | Backend |
| 4.9 | Event Status Toggle | S | Backend |

**Parallelization:**
- 4.1 can start immediately after Wave 2
- 4.2, 4.3 are sequential (edit builds on create)
- 4.4, 4.5, 4.6 are sequential (form builder progression)
- 4.7 requires 6.2 from Wave 1
- 4.8, 4.9 can run parallel after 4.3

**After Wave 4:**
- Full event management exists
- Forms can be customized per event
- Events can be duplicated and status toggled

**Unlocks:** Wave 5 (Public Registration)

---

### 🟣 Wave 5 — Public Registration + Email (Days 15-18)

**Requires:** Wave 4 (events with forms), Wave 1 (QR utility)

| Task | Name | Effort | Owner |
|------|------|--------|-------|
| 5.1 | Public Event Page Layout | M | Frontend |
| 5.2 | Dynamic Form Renderer | L | Frontend |
| 5.3 | Registration Submit Action | M | Backend |
| 5.4 | Duplicate Email Detection | S | Full-stack |
| 6.1 | Resend Client & Template | S | Backend |
| 6.3 | Send Confirmation Email | M | Backend |
| 5.5 | Thank-You Page | S | Frontend |
| 5.6 | Ticket Page | S | Frontend |

**Parallelization:**
- 5.1, 5.2 can start after 4.1
- 5.3 requires 5.2
- 6.1, 6.3 can run parallel (6.1 first, then 6.3)
- 5.5 requires 5.3 and 6.2
- 5.6 requires 6.2

**After Wave 5:**
- Public can register for events
- QR tickets are generated and emailed
- Permanent ticket pages exist

**Unlocks:** Wave 6 (Check-in System)

---

### 🟤 Wave 6 — Check-in System (Days 19-21)

**Requires:** Wave 5 (registration flow), Wave 2 (auth)

| Task | Name | Effort | Owner |
|------|------|--------|-------|
| 7.1 | Check-in API Endpoint | M | Backend |
| 7.2 | Scanner Page UI | L | Frontend |
| 7.3 | Scan Result Overlays | M | Frontend |
| 7.4 | Manual Check-in Modal | S | Full-stack |
| 7.5 | VIP Notify Action | S | Backend |

**Parallelization:**
- 7.1 can start after Wave 2
- 7.2 requires 7.1
- 7.3 requires 7.2
- 7.4, 7.5 can run parallel after 7.1

**After Wave 6:**
- Staff can scan QR codes
- Manual check-in works
- VIP flagging functional

**Unlocks:** Wave 7 (Live Dashboard)

---

### ⚫ Wave 7 — Live Dashboard (Days 22-25)

**Requires:** Wave 6 (check-in), Wave 4 (events)

| Task | Name | Effort | Owner |
|------|------|--------|-------|
| 8.1 | Live Dashboard Page | M | Full-stack |
| 8.2 | Realtime Subscriptions | M | Backend |
| 8.3 | VIP Notification Alert | S | Frontend |
| 8.4 | Registrant List Page | M | Frontend |
| 8.5 | CSV Export | S | Backend |

**Parallelization:**
- 8.1, 8.4 can start after Wave 4
- 8.2 requires 1.2 (schema) and can run parallel
- 8.3 requires 8.2
- 8.5 requires 8.4

**After Wave 7:**
- Realtime check-in dashboard works
- VIP alerts appear live
- Registrant management complete
- CSV export functional

**PROJECT COMPLETE**

---

## Critical Path

The single longest chain of dependent tasks:

```
[1.1] Project Init
   └─► [1.2] Schema
         └─► [1.3] Indexes
               └─► [1.4] better-auth
                     └─► [2.1] better-auth Config
                           └─► [2.2] Login
                                 └─► [2.3] Middleware
                                       └─► [3.1] Settings Layout
                                             └─► [3.2] Fields List
                                                   └─► [3.3] Field Form
                                                         └─► [4.1] Event List
                                                               └─► [4.2] Create Event
                                                                     └─► [4.3] Edit Event
                                                                           └─► [4.4] Global Fields Toggle
                                                                                 └─► [4.5] Custom Questions
                                                                                       └─► [4.6] Combined Ordering
                                                                                             └─► [5.1] Public Page
                                                                                                   └─► [5.2] Form Renderer
                                                                                                         └─► [5.3] Registration Submit
                                                                                                               └─► [6.3] Email Action
                                                                                                                     └─► [7.1] Check-in API
                                                                                                                           └─► [7.2] Scanner UI
                                                                                                                                 └─► [7.3] Overlays
                                                                                                                                       └─► [8.2] Realtime
                                                                                                                                             └─► [8.3] VIP Alert
```

**Minimum Duration:** ~18 days (if all parallelizable work is staffed)  
**Single Developer Duration:** ~26.5 days

---

## Agent Swarm Dispatch Table

For parallel agent execution:

| Wave | Task ID | Task Name | Effort | Blocked By | Recommended Agent |
|------|---------|-----------|--------|------------|-------------------|
| 1 | 1.1 | Project Init | S | NONE | Frontend |
| 1 | 1.2 | Schema | M | NONE | Backend |
| 1 | 6.2 | QR Utility | S | NONE | Any |
| 2 | 1.3 | Indexes | M | 1.2 | Backend |
| 2 | 1.4 | better-auth Config | S | 1.2 | Backend |
| 2 | 2.1 | better-auth Config | S | 1.4 | Backend |
| 2 | 2.2 | Login Page | M | 2.1 | Full-stack |
| 2 | 2.3 | Middleware | S | 2.1 | Backend |
| 2 | 2.4 | Role Access | M | 2.3 | Backend |
| 2 | 2.5 | User Role Init | XS | 1.2 | Backend |
| 3 | 3.1 | Settings Layout | S | 2.3 | Frontend |
| 3 | 3.2 | Fields List | S | 3.1 | Frontend |
| 3 | 3.3 | Field Form | M | 3.2 | Full-stack |
| 3 | 3.4 | Field Delete | XS | 3.2 | Backend |
| 3 | 3.5 | Staff List | S | 3.1 | Frontend |
| 3 | 3.6 | Invite Staff | M | 3.5, 2.1 | Full-stack |
| 3 | 3.7 | Role Edit | S | 3.5 | Backend |
| 3 | 3.8 | Remove Staff | S | 3.5 | Backend |
| 3 | 3.9 | General Settings | S | 3.1 | Full-stack |
| 4 | 4.1 | Event List | M | 2.3 | Frontend |
| 4 | 4.2 | Create Event | L | 4.1 | Full-stack |
| 4 | 4.3 | Edit Event | M | 4.2 | Full-stack |
| 4 | 4.4 | Fields Toggle | M | 4.3, 3.2 | Full-stack |
| 4 | 4.5 | Questions | L | 4.4 | Full-stack |
| 4 | 4.6 | Ordering | M | 4.5 | Frontend |
| 4 | 4.7 | Share Panel | S | 4.3, 6.2 | Frontend |
| 4 | 4.8 | Duplicate | S | 4.3 | Backend |
| 4 | 4.9 | Status Toggle | S | 4.3 | Backend |
| 5 | 5.1 | Public Page | M | 4.1 | Frontend |
| 5 | 5.2 | Form Renderer | L | 5.1 | Frontend |
| 5 | 5.3 | Submit Action | M | 5.2 | Backend |
| 5 | 5.4 | Dup Detection | S | 5.3 | Full-stack |
| 5 | 6.1 | Resend Config | S | 1.1 | Backend |
| 5 | 6.3 | Email Action | M | 6.1, 6.2, 5.3 | Backend |
| 5 | 5.5 | Thank-You | S | 5.3, 6.2 | Frontend |
| 5 | 5.6 | Ticket Page | S | 6.2 | Frontend |
| 6 | 7.1 | Check-in API | M | 2.1, 1.2 | Backend |
| 6 | 7.2 | Scanner UI | L | 7.1 | Frontend |
| 6 | 7.3 | Overlays | M | 7.2 | Frontend |
| 6 | 7.4 | Manual Modal | S | 7.1 | Full-stack |
| 6 | 7.5 | VIP Notify | S | 7.1 | Backend |
| 7 | 8.1 | Dashboard UI | M | 4.1 | Full-stack |
| 7 | 8.2 | Realtime | M | 1.2 | Backend |
| 7 | 8.3 | VIP Alert | S | 8.2 | Frontend |
| 7 | 8.4 | Registrant List | M | 4.1 | Frontend |
| 7 | 8.5 | CSV Export | S | 8.4 | Backend |

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| better-auth plugin compatibility | High | Low | Use stable plugins only; check community adoption |
| Database migration issues | High | Medium | Test migrations locally first; use Drizzle Kit for type safety |
| QR scanner browser compatibility | Medium | Medium | Test `html5-qrcode` on iOS Safari, Android Chrome early; have fallback ready |
| Resend email deliverability | Medium | Low | Use verified domain; test spam score; have plain-text fallback |
| Realtime connection limits | Low | Low | Monitor connection count; implement reconnect logic |
| Form builder complexity creep | High | High | Stick to spec (§9); defer advanced features to v2 |
| Image upload complexity | Medium | Medium | Use Supabase Storage or direct S3 upload; keep simple |

---

## Environment Variables

Required `.env` configuration:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eventflow

# better-auth
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxx
```

---

## Build Order Summary

```
Phase 1 (Days 1-3):   Infrastructure ──────────────────────────────┐
Phase 2 (Days 4-5):   Auth ────────────────────────────────────────┤
Phase 3 (Days 6-8):   Settings ────────────────────────────────────┼──► Sequential
Phase 4 (Days 9-14):  Event CRUD ──────────────────────────────────┤
Phase 5 (Days 15-18): Public + Email ──────────────────────────────┤
Phase 6 (Days 19-21): Check-in ────────────────────────────────────┤
Phase 7 (Days 22-25): Dashboard ───────────────────────────────────┘
```

---

## Definition of Done

A task is considered complete when:
- [ ] All acceptance criteria are met
- [ ] Code is TypeScript with proper types
- [ ] Server actions have error handling
- [ ] UI has loading and error states
- [ ] Component works on mobile and desktop
- [ ] No console errors or warnings
- [ ] Manual testing passes for happy path + edge cases

---

*This plan is derived from the Strata v1.0 spec. Changes to scope should be reflected here before implementation begins.*
