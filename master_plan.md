# EventFlow — Master Implementation Plan

**Version:** 1.0  
**Last Updated:** 2026-04-09  
**Spec Reference:** `../eventflow-spec.md`

---

## Executive Summary

EventFlow is an event registration and check-in platform with three user-facing surfaces:
1. **Admin portal** — Event management, settings, live dashboard
2. **Staff portal** — QR scanner, manual check-in
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

*This plan is derived from the EventFlow v1.0 spec. Changes to scope should be reflected here before implementation begins.*
