# EventFlow — Product Specification

**Version:** 1.0  
**Stack:** Next.js · Supabase · Resend · Vercel  
**Target cost:** $0/month within free tier limits  
**Audience:** Internal admin + staff team, public event registrants

---

## 1. Overview

EventFlow is a lightweight event registration and check-in platform. Admins create and manage events with flexible, customizable forms. Participants register via a public link and receive a QR code ticket. Staff scan QR codes at the door, view attendee profiles, and flag VIPs — all from a phone browser, no app required.

---

## 2. User Roles

| Role | Description |
|---|---|
| **Super Admin** | Full access. Creates events, manages staff accounts, configures global settings. |
| **Admin** | Same as Super Admin minus account management. |
| **Staff / Scanner** | Can only access the scanner and live check-in dashboard for events they're assigned to. Cannot create or edit events. |
| **Participant** | Public. Registers for events, receives QR ticket. No login required. |

All admin/staff roles authenticate via Supabase Auth (email + password). Participants are unauthenticated.

---

## 3. Tech Stack & Services

| Layer | Service | Free Tier Limit |
|---|---|---|
| Framework | Next.js 14 (App Router) | — |
| Hosting | Vercel (Hobby) | 100GB bandwidth/mo |
| Database + Auth + Realtime | Supabase | 500MB DB, 50k MAU, 200 concurrent Realtime connections |
| Transactional email | Resend | 3,000 emails/month |
| QR generation | `qrcode` npm (server-side) | No limit |
| QR scanning | `html5-qrcode` npm (browser camera) | No limit |
| CSV export | Native (no library needed) | — |
| Validation | Zod | — |
| Styling | Tailwind CSS | — |

**Cost note:** At 2 events/month × 500 registrants = 1,000 confirmation emails/month. Safely within Resend's free 3,000/month limit.

---

## 4. Database Schema

### `events`
```
id              uuid PK
slug            text UNIQUE          -- used in public URL: /e/[slug]
title           text NOT NULL
description     text
cover_image_url text
location        text
event_date      timestamptz
event_end_date  timestamptz
status          enum('draft','open','closed')
form_fields     jsonb                -- ordered array of field configs (see §8)
custom_questions jsonb               -- array of question configs (see §9)
created_by      uuid FK → users
created_at      timestamptz
updated_at      timestamptz
```

### `registrants`
```
id              uuid PK
event_id        uuid FK → events
email           text NOT NULL
first_name      text NOT NULL
last_name       text NOT NULL
qr_token        text UNIQUE NOT NULL  -- random UUID, used to encode QR
is_vip          boolean DEFAULT false
checked_in      boolean DEFAULT false
checked_in_at   timestamptz
checked_in_by   uuid FK → users
form_data       jsonb                 -- answers to global fields + custom questions
registered_at   timestamptz
```

### `checkins`
```
id              uuid PK
registrant_id   uuid FK → registrants
event_id        uuid FK → events
scanned_by      uuid FK → users
scanned_at      timestamptz
method          enum('qr','manual_email')
```

### `vip_notifications`
```
id              uuid PK
event_id        uuid FK → events
registrant_id   uuid FK → registrants
triggered_by    uuid FK → users      -- staff who flagged VIP
triggered_at    timestamptz
acknowledged    boolean DEFAULT false
acknowledged_by uuid FK → users
acknowledged_at timestamptz
```

### `global_fields` (Settings — reusable fields)
```
id              uuid PK
label           text NOT NULL
field_type      enum('short_text','long_text','dropdown','multiple_choice','checkboxes')
options         jsonb                -- for dropdown/MC/checkboxes: array of strings
is_required     boolean DEFAULT false
created_by      uuid FK → users
created_at      timestamptz
```

### `users` (extends Supabase auth.users)
```
id              uuid PK (= auth.users.id)
full_name       text
role            enum('super_admin','admin','staff')
created_at      timestamptz
```

---

## 5. URL Structure

### Admin
```
/login                          Sign in page
/admin                          Redirect → /admin/events
/admin/events                   Event list
/admin/events/new               Create event
/admin/events/[id]              Edit event
/admin/events/[id]/registrants  Registrant list + CSV export
/admin/dashboard/[id]           Live check-in dashboard
/admin/scan/[id]                QR scanner
/admin/settings                 Global fields + staff management

```

### Public (Participant)
```
/e/[slug]                       Public registration form
/e/[slug]/thanks                Thank-you page with QR code
/ticket/[qr_token]              Shareable ticket page (mobile-friendly)
```

---

## 6. Features — Admin

### 6.1 Event List (`/admin/events`)

- Table of all events with: title, date, status badge (Draft / Open / Closed), registrant count, quick actions.
- **Duplicate** button on each row — copies event title, form config, fields, and questions into a new Draft. Date and slug are reset (slug auto-generated from new title).
- **Create new event** CTA at top right.
- Filter by status. Sort by date.

### 6.2 Event Creation & Editing (`/admin/events/new` and `/admin/events/[id]`)

Two-panel layout (sidebar nav + main content):

**Details panel:**
- Event title (required)
- Slug (auto-generated, editable, unique validation)
- Description (rich text — simple markdown or basic WYSIWYG)
- Cover image upload (stored in Supabase Storage)
- Location (free text)
- Event date + end date (datetime pickers)
- Status toggle: Draft / Open / Closed

**Form builder panel:**

Two sections:

1. **Global fields toggle list** — all fields created in Settings appear here as toggles. Admin turns on/off which global fields appear on this event's form. For each toggled-on field, admin can override whether it's required for this event.

2. **Custom questions** (per-event only, not reusable) — a Google Form-style builder:
   - Add question button opens a question editor
   - Supported types: short text, long text/paragraph, dropdown, multiple choice, radio), checkboxes
   - Each question has: question label, help text (optional), required toggle, field type selector
   - Questions and global fields share an ordering interface (drag to reorder)
   - Inline preview of how the form will look

**Share panel:**
- Shows the public link: `yourdomain.com/e/[slug]`
- One-click copy button
- QR code preview of the registration link (for posters/flyers)

### 6.3 Registrant List (`/admin/events/[id]/registrants`)

- Full table: name, email, registered at, check-in status, VIP badge, check-in time, check-in method (QR / manual).
- Search by name or email.
- Filter: All / Checked In / Not Yet Checked In / VIP.
- **CSV export** — exports all registrant data including custom field answers. Column headers are dynamic based on which fields/questions are in the event.
- Click a row → side panel with full registrant profile (all form answers, QR code preview).
- Toggle **VIP status** per registrant from this view.

### 6.4 Live Dashboard (`/admin/dashboard/[id]`)

- Realtime feed of check-ins as they happen (Supabase Realtime subscription on `checkins` table).
- Top stats bar: Total registered · Checked in · Remaining · Check-in rate %.
- Feed shows: avatar initials + name + time · VIP badge if applicable · how they were checked in.
- VIP notifications appear as highlighted alerts at the top of the feed, with an "Acknowledge" button to dismiss. This is the only place VIP alerts appear — there is no separate global inbox.
- Auto-scrolls to new entries.
- Works well on desktop (full dashboard for command center staff) and mobile (compact view for roving admin).

---

## 7. Features — Staff / Scanner

### 7.1 Scanner Page (`/admin/scan/[id]`)

Designed for one-handed use on a phone. Full-screen camera view.

**QR scan flow:**
1. Camera activates on page load (requests permission if needed).
2. Point at participant's QR code → instant decode.
3. API call to `/api/checkin` with `qr_token`.
4. Result shown as full-screen overlay:
   - **Success (not yet checked in):** Green overlay — registrant's name, photo initials avatar, VIP badge if applicable, all their form answers (compact profile card). Two action buttons: **"Notify Admin (VIP)"** and **"Done"** (closes overlay, camera resumes).
   - **Already checked in:** Amber overlay — name + original check-in time. Prevents duplicate check-in.
   - **Not found:** Red overlay — "QR code not recognized."

**Notify Admin (VIP) button:**
- Appears on the success overlay for every scan (staff decides if the person is VIP-worthy).
- Tapping it inserts a row into `vip_notifications` and updates the registrant's `is_vip = true`.
- Realtime pushes the alert to the admin dashboard and notification inbox immediately.
- Button changes to a checkmark confirmation after tapping — cannot spam.

**Manual check-in by email:**
- A small "Can't scan?" link below the camera opens a modal.
- Staff types the registrant's email address.
- System searches the event's registrant list for exact email match.
- Same success/already-checked-in/not-found overlays as QR scan.
- Check-in recorded with `method = 'manual_email'`.

**UX details:**
- Camera stays active between scans — no need to tap anything to scan again.
- Haptic feedback on mobile (if supported) on success/fail.
- Sound feedback optional (toggle in scanner UI).
- Scanner only shows events that are `status = 'open'` and that the staff member is assigned to.

---

## 8. Global Fields (Settings)

Located at `/admin/settings` → Fields tab.

- List of all global fields with: label, type, required default, actions (edit, delete).
- **Add field** button → inline form:
  - Label (e.g. "Company Name", "T-shirt size", "Dietary restriction")
  - Field type: short text · long text · dropdown · multiple choice · checkboxes
  - Options (for dropdown/MC/checkboxes): add/remove options inline
  - Default required: yes/no
- Editing a global field does **not** retroactively change past events — changes only affect future event form toggles.
- Deleting a global field removes it from the settings list but preserves existing event configs (stored as JSONB snapshots on the event).

**Built-in always-present fields** (not shown in global fields list, always collected):
- First name (required)
- Last name (required)
- Email address (required, unique per event)

---

## 9. Form Field & Question Schema (JSONB)

### Global field toggle on event (`form_fields` array item):
```json
{
  "global_field_id": "uuid",
  "label": "Company Name",
  "field_type": "short_text",
  "options": [],
  "is_required": true,
  "order": 1
}
```

### Custom question on event (`custom_questions` array item):
```json
{
  "id": "local-uuid",
  "label": "How did you hear about us?",
  "help_text": "Select all that apply",
  "field_type": "checkboxes",
  "options": ["Social media", "Friend", "Email newsletter", "Other"],
  "is_required": false,
  "order": 2
}
```

**Supported `field_type` values:**
- `short_text` — single-line input
- `long_text` — multi-line textarea
- `dropdown` — single select from list
- `multiple_choice` — radio buttons (single answer)
- `checkboxes` — multiple answers allowed

---

## 10. Participant Experience

### Registration Form (`/e/[slug]`)

**Design goals:** Luma-quality — clean, focused, one thing at a time. Fast on mobile.

- Full-bleed cover image (if uploaded) at top.
- Event title, date, location clearly shown.
- Form renders below: built-in fields first, then global fields in order, then custom questions.
- Inline validation on blur (not on submit-only).
- Submit button is sticky on mobile.
- If event is `closed` or `draft`, show a friendly "Registration is closed" message — no form shown.
- Duplicate email detection: if the same email is already registered for this event, show a gentle "You're already registered!" message with a link to retrieve their ticket.

### Thank-You Page (`/e/[slug]/thanks`)

- Celebratory but clean. Confirmation message with event name and date.
- QR code displayed prominently (SVG, high contrast, works on screenshots).
- Instruction: "Save this page or screenshot your QR code to check in."
- Email confirmation sent automatically via Resend (see §11).
- Link to `/ticket/[qr_token]` for a permanent ticket page.

### Ticket Page (`/ticket/[qr_token]`)

- Mobile-optimized, minimal.
- Shows: event name, date, location, registrant name, QR code.
- This is the URL sent in the confirmation email — always accessible.
- No login required.

---

## 11. Email (Resend)

### Confirmation email (sent on registration)

**Subject:** `Your ticket for [Event Name]`

**Contents:**
- Greeting with first name.
- Event details: name, date, location.
- QR code as an embedded PNG image (generated server-side with `qrcode` npm, converted to base64).
- Link to ticket page: `yourdomain.com/ticket/[qr_token]`
- Plain-text fallback included.

**Sending trigger:** Next.js API route `/api/register` — after successful DB insert, fires Resend call. If email fails, registration still succeeds (log the failure, don't block the user).

---

## 12. CSV Export

Located on `/admin/events/[id]/registrants` → "Export CSV" button.

**Columns (dynamic, based on event config):**
```
Registration ID, First Name, Last Name, Email, Registered At,
Checked In, Checked In At, Check-in Method, Is VIP,
[Global Field 1 Label], [Global Field 2 Label], ...,
[Custom Question 1 Label], [Custom Question 2 Label], ...
```

- Multi-select answers (checkboxes) joined with ` | ` separator.
- Timestamps in ISO 8601 format.
- Generated server-side in a Next.js API route (`/api/events/[id]/export`) — streams the CSV response.
- Filename: `[event-slug]-registrants-[YYYY-MM-DD].csv`

---

## 13. API Routes

```
POST   /api/register                 Public. Submit registration form.
GET    /api/ticket/[token]           Public. Fetch ticket data for ticket page.
POST   /api/checkin                  Staff-auth. QR or manual check-in.
POST   /api/vip-notify               Staff-auth. Flag VIP, insert notification (dashboard only).
PATCH  /api/events/[id]/status       Admin-auth. Open/close event.
POST   /api/events/[id]/duplicate    Admin-auth. Duplicate event.
GET    /api/events/[id]/export       Admin-auth. Stream CSV.

```

---

## 14. Realtime Subscriptions

Two Supabase Realtime channels:

| Channel | Table | Filter | Used by |
|---|---|---|---|
| `checkins:[event_id]` | `checkins` | `event_id=eq.[id]` | Live dashboard — new check-ins |
| `vip:[event_id]` | `vip_notifications` | `event_id=eq.[id]` | Admin dashboard VIP alerts |

Realtime connections are only open on admin dashboard and scanner pages — participants never hold a Realtime connection.

---

## 15. Settings (`/admin/settings`)

Two tabs:

### Fields tab
Global fields management — see §8.

### Staff tab
- List of all staff/admin accounts: name, email, role, created date.
- **Invite staff** — enter email + role → Supabase Auth sends invite email → user sets password on first login.
- Edit role (promote/demote between admin ↔ staff).
- Remove staff account.
- Super Admin cannot be deleted from this UI.

---

## 16. Security & Access Control

- All `/admin/*` routes protected by Next.js middleware — redirect to `/login` if no valid session.
- Staff role (`staff`) can only access: `/admin/scan/[id]` and `/admin/dashboard/[id]`.
- Row-level security (RLS) on Supabase:
  - `registrants` table: readable only by authenticated users (admins + staff).
  - `events` table: writable only by admin/super_admin role.
  - `vip_notifications`: insertable by any authenticated user; updatable (acknowledge) only by admin.
- `qr_token` is a random UUID — not guessable. Ticket pages are technically public but obscured.
- Registration API rate-limited by IP (Vercel edge middleware) — 10 submissions per minute per IP.

---

## 17. Luma-Inspired UX Principles

These apply across the entire product:

1. **Zero friction for participants** — registration form feels like filling in one card, not a government form. Progress is implicit, not shown as a step counter.
2. **Mobile-first everywhere** — scanner, dashboard, and ticket pages designed phone-first. Admin event management is desktop-first but responsive.
3. **Instant feedback** — no full-page reloads. Form validation inline. Check-in overlays appear in <300ms.
4. **Delightful empty states** — new event list is encouraging ("Create your first event →"), not blank.
5. **Copy that sounds human** — "You're in!" not "Registration successful." "Looks like you're already registered." not "Duplicate email error."
6. **Cover images set the mood** — event pages lead with a full-bleed image. No image? A tasteful gradient based on event title hash.
7. **QR codes are beautiful** — high-contrast, appropriately sized, with a subtle logo/icon watermark in the center (optional, configured in settings).

---

## 18. Open Questions / Future Scope

The following are **out of scope for v1** but worth noting:

- **Waitlist** — if closed, allow registrants to join a waitlist. Notify them if spots open.
- **Multi-ticket registration** — register on behalf of a group.
- **Event reminders** — scheduled email 24h before event via Vercel Cron + Resend.
- **Analytics** — registration over time chart, peak registration hours.
- **Public event listing page** — `/events` showing all open events (currently no public listing).
- **Resend sender domain** — for production, custom domain on Resend avoids spam folder. Free but requires DNS setup.
- **Capacity limits** — deferred per spec decision; manual open/close only in v1.

---

## 19. Build Sequence (Recommended Order)

1. **Supabase setup** — schema, RLS policies, auth config
2. **Auth + middleware** — login page, session handling, role-based route protection
3. **Settings: staff + global fields** — foundational before events
4. **Event CRUD** — create, edit, duplicate, open/close
5. **Registration form + thank-you page** — public-facing, highest visibility
6. **Email confirmation** — Resend integration + QR generation
7. **Ticket page** — `/ticket/[token]`
8. **Registrant list + CSV export**
9. **Scanner page** — QR scan + manual email fallback
10. **Live dashboard + Realtime**
11. **VIP notifications** — dashboard alert + acknowledge flow
12. **Polish pass** — empty states, error states, mobile QA

---

*Spec written for EventFlow v1.0. Questions or scope changes should be reflected here before implementation begins.*
