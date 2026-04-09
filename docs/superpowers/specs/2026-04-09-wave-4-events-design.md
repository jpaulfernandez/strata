# Wave 4 — Event CRUD: Design Specification

**Date:** 2026-04-09
**Status:** Approved
**Wave:** 4 — Event CRUD

---

## 1. Event List Page (4.1)

### Layout
- Toggle buttons (top-right): Grid view / List view
- Search bar with filter by status (All / Draft / Open / Closed)
- Empty state with "Create First Event" CTA

### Grid View
- 3-column responsive grid
- Card shows: cover image (or placeholder gradient), title, date, location, status badge, registrant count, action menu (edit, duplicate, toggle status)

### List View
- Table with columns: Event | Date | Location | Status | Registrants | Actions
- Sortable by date, status

### Actions (per event)
- Edit button → `/admin/events/[id]/edit`
- Duplicate button → immediately creates draft copy
- Status toggle button → cycles through draft → open → closed

---

## 2. Create Event Page (4.2)

**Route:** `/admin/events/new`

### Form Sections

**1. Event Details**
- Title (text input, required)
- Slug (auto-generated from title, editable, required, unique)
- Description (textarea)
- Location (text input)
- Event Date & Time (datetime-local)
- Event End Date & Time (datetime-local, optional)
- Cover Image URL (text input, optional)

**2. Form Builder**
- See Section 4 below

**3. Actions**
- Save as Draft (primary button)
- Save & Open (secondary button)

---

## 3. Edit Event Page (4.3)

**Route:** `/admin/events/[id]/edit`

- Pre-populated with existing data
- Same form as Create, plus additional fields:
  - Created date (read-only)
  - Registrant count
  - Duplicate button in header

---

## 4. Form Builder (4.4-4.6) — Unified Approach

### Single combined section with drag-and-drop reordering

**Left Panel: Available Fields**
- Search/filter global fields
- Checkbox to enable each global field
- Drag to reorder within enabled list

**Right Panel: Custom Questions**
- "Add Question" button
- Each question: Question text, field type dropdown, options (for dropdown/checkboxes), required checkbox
- Drag to reorder
- Delete button per question

**Combined Preview**
- Live preview showing final form order
- Drag items between sections to reorder

---

## 5. Share Panel (4.7)

**Route:** `/admin/events/[id]/share` (modal or slide-over)

### Content
- Public registration URL: `https://[app]/events/[slug]`
- Copy button for URL

---

## 6. Duplicate Event (4.8)

- Server action: copies all fields except status (always resets to draft)
- Creates new event with title: "[Original Title] (Copy)"
- Redirects to edit the new event

---

## 7. Status Toggle (4.9)

- Quick toggle on event card/list
- Cycles: draft → open → closed → draft
- Badge changes color: gray (draft), green (open), red (closed)

---

## Data Model

No schema changes needed — `events` table already has:
- `formFields: jsonb` — enabled global fields with order
- `customQuestions: jsonb` — custom questions with order

---

## Server Actions

| Action | Purpose |
|--------|---------|
| `getEvents()` | List all events (for admin) |
| `getEvent(id)` | Get single event |
| `createEvent(data)` | Create new event |
| `updateEvent(id, data)` | Update event |
| `deleteEvent(id)` | Delete event |
| `duplicateEvent(id)` | Copy event as draft |
| `toggleEventStatus(id)` | Cycle status |

---

## Implementation Notes

- Follow existing UI patterns from Wave 3 (client components with useEffect for data loading)
- Use Zod for validation schemas
- Use Drizzle ORM for database operations
- Follow DESIGN.md tokens (no 1px borders, glassmorphism, tonal elevation)
- Implement grid/list toggle with React state
- Use @dnd-kit or @hello-pangea/dnd for drag-and-drop reordering

---

## Dependencies

- Wave 2 (auth) — required for route protection
- Wave 3 (global fields) — required for form builder
- Task 6.2 (QR utility) — required for Share Panel

---

**Approved by:** User
**Date:** 2026-04-09