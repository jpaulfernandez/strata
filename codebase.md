# Codebase Documentation

This file serves as the source of truth for the Strata codebase. It provides a comprehensive overview of the project's architecture, technology stack, and key components.

---

## Project Overview

**Strata** is an event registration and check-in platform built with Next.js. It enables organizers to create events, manage registrations, and check in attendees via QR codes or manual lookup.

### Key Features

- Event creation and management with custom registration forms
- QR code generation for attendee check-in
- Role-based access control (RBAC): super_admin, admin, staff
- Real-time check-in tracking with dashboard analytics
- VIP notifications for special attendees

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (via Drizzle ORM) |
| Auth | Better Auth |
| Storage | Supabase |
| Validation | Zod + React Hook Form |
| Email | Resend |
| QR Codes | qrcode + html5-qrcode |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |
| Date Utils | date-fns |

---

## Project Structure

```
/app                    # Next.js App Router routes
  /api                  # API routes
    /auth/[...all]      # Better Auth catch-all handler
  /admin                # Admin protected routes (requires admin+)
    layout.tsx          # Floating sidebar with glassmorphism
    page.tsx            # Admin dashboard redirect
    /events
      page.tsx          # Event list (grid/list view, persisted)
      /new              # Create event page
      /[id]/edit        # Edit event (tabbed: Details/Form)
      /[id]/share       # Share panel
      /[id]/registrants # Registrant list with CSV export
    /dashboard/[id]     # Live check-in dashboard
    /settings           # Settings pages
      /fields           # Global form fields
      /fields/new       # Create global field
      /staff            # Staff management
      /general          # General settings (e-ticket message)
  /scan/[id]            # Mobile-optimized QR scanner (fullscreen, bypasses admin layout)
  /e/[slug]             # Public event registration
    page.tsx            # Registration form
    /thanks             # Thank-you page with QR
  /ticket/[qrToken]     # Public ticket page (mobile-friendly)
  /login                # Login page
  /signup               # Signup page
  layout.tsx            # Root layout with fonts
  page.tsx              # Home page
  middleware.ts         # Auth + RBAC middleware

/components            # Reusable UI components
  /ui                   # Generic UI primitives
    button.tsx          # Button with variants (primary, secondary, ghost)
    card.tsx            # Card container
    input.tsx           # Text input with error state
    label.tsx           # Form label
    textarea.tsx        # Multi-line input
    select.tsx          # Dropdown selection
    dialog.tsx          # Modal dialog
    badge.tsx           # Status tag with variants (primary, secondary, error, warning)
    dropdown-menu.tsx   # Portal-based dropdown menu
    index.ts            # Barrel exports
  /features             # Feature-specific components
    /events
      event-card.tsx    # Event card with ellipsis menu, share button
      event-list.tsx    # Event list with grid/list toggle (localStorage)
      form-builder.tsx  # Unified form builder (single column, dnd-kit)
      form-preview.tsx  # Live preview of registration form

/lib                   # Shared utilities
  /db                   # Database schema and connection
    schema.ts           # Drizzle schema with events, registrants, etc.
    index.ts            # Database client
  /validations          # Zod schemas (NOT in "use server" files!)
    auth.ts             # Auth-related schemas (signIn, signUp)
    events.ts           # Event validation (title, slug, startTime, endTime, mapsLink)
    settings.ts         # Global field schemas
    staff.ts            # Staff invitation/role schemas
    registration.ts     # Public registration validation
  /permissions.ts       # Permission constants and helpers
  /utils.ts             # General utilities (generateSlug, formatDateTime, zodErrorToFormErrors)
  /qr.ts                # QR code generation

/server                # Server-only code (not exposed to client)
  /auth                # Auth configuration and middleware helpers
    auth.ts             # Better Auth configuration
    rbac.ts             # getCurrentUser, requireRole
    client.ts           # authClient for client-side auth
  /actions             # Server Actions for mutations
    events.ts           # CRUD for events (create, update, delete, duplicate, toggleStatus)
    registrants.ts      # Registration and registrant management
    checkin.ts          # Check-in operations (QR, manual, VIP toggle)
    settings.ts         # Global fields management
    staff.ts            # Staff CRUD operations
    export.ts           # CSV export functionality
  /email               # Email templates and sending
    index.ts            # Resend integration with confirmation emails
  /db                  # Database seeds

/types                 # TypeScript type definitions

/public                # Static assets (empty - uses next/image)
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `user` | Staff/admin accounts with roles (Better Auth) |
| `session` | User sessions (Better Auth) |
| `account` | OAuth accounts (Better Auth) |
| `verification` | Email verification tokens (Better Auth) |
| `events` | Event definitions with form configurations |
| `registrants` | Attendees registered for events |
| `checkins` | Check-in records with timestamps |
| `vipNotifications` | VIP arrival notifications |
| `globalFields` | Reusable form field templates |
| `global_settings` | Global app settings (e-ticket message, etc.) |

### Events Table Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `slug` | text | URL-friendly identifier (unique) |
| `title` | text | Event title |
| `description` | text | Event description |
| `coverImageUrl` | text | Cover image URL |
| `location` | text | Event location |
| `eventDate` | timestamp with timezone | Event date (date + start time combined) |
| `startTime` | text | Start time in HH:MM format (e.g., "10:00") |
| `endTime` | text | End time in HH:MM format (e.g., "17:00") |
| `mapsLink` | text | Optional Google Maps URL |
| `status` | enum | draft, open, or closed |
| `formFields` | jsonb | Enabled global fields configuration |
| `customQuestions` | jsonb | Custom questions for this event |
| `createdBy` | text | User ID who created the event |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

### Enums

- `user_role`: `super_admin | admin | staff`
- `event_status`: `draft | open | closed | ended`
- `checkin_method`: `qr | manual_email`
- `field_type`: `short_text | long_text | dropdown | multiple_choice | checkboxes`

### Key Relationships

- `events.createdBy` → `user.id`
- `registrants.eventId` → `events.id`
- `checkins.registrantId` → `registrants.id`
- `checkins.eventId` → `events.id`

---

## Authentication & Authorization

### Auth System

Uses **Better Auth** with email/password authentication. Sessions are cookie-based with 30-day expiration.

### RBAC (Role-Based Access Control)

Defined in `server/auth/rbac.ts`:

| Role | Permissions |
|------|-------------|
| `super_admin` | Full access to all features |
| `admin` | Can create/edit events, manage settings, check-in |
| `staff` | View assigned events, check-in registrants only |

### Permission Categories

- **Dashboard**: `dashboard:view`, `dashboard:view_own`
- **Events**: `events:create`, `events:edit`, `events:edit_any`, `events:delete`, `events:view`, `events:view_any`
- **Registrants**: `registrants:view`, `registrants:view_any`, `registrants:checkin`
- **Settings**: `settings:manage`
- **Staff**: `staff:manage`, `staff:edit_role`
- **Data**: `data:export`

### Middleware Protection

Route protection is enforced in `app/middleware.ts`:

- `/admin/*` — requires admin role
- `/scan/*` — requires staff role (mobile-optimized scanner)
- `/settings/*` — requires admin role
- `/checkin/*` — requires authenticated
- `/api/admin/*` — requires admin role

---

## Key Components

### UI Primitives (`components/ui/`)

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, ghost variants with purple gradient for primary |
| `Card` | Content container with elevation |
| `Input` | Text input field with error state |
| `Label` | Form label |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown selection |
| `Dialog` | Modal dialog |
| `Badge` | Status/category tag with variants: primary (purple), secondary, error, warning |
| `DropdownMenu` | Portal-based dropdown with items and separators |

### Feature Components (`components/features/`)

| Component | Description |
|-----------|-------------|
| `events/event-card.tsx` | Event card with cover image, status badge, clickable title (draft→edit, published→public), ellipsis menu (duplicate, toggle status, delete), share button with "Copied" feedback |
| `events/event-list.tsx` | Event list with grid/list toggle (persisted to localStorage), search, status filter |
| `events/form-builder.tsx` | Unified form builder with single-column layout, drag-and-drop for global fields and custom questions using @dnd-kit |
| `events/form-preview.tsx` | Live preview of registration form as it appears to registrants |

---

## Admin Layout

### Floating Sidebar

The admin layout (`app/admin/layout.tsx`) features:
- **Floating sidebar** with glassmorphism effect (`backdrop-blur-xl`, semi-transparent background)
- **Sticky positioning** within content area
- **Purple gradient** for active navigation items
- **Purple gradient text** for "Strata" brand
- **Sign Out** with red hover state

---

## Event Management

### Event List Page

- **Grid/List toggle**: User preference saved to `localStorage` (key: `strata-events-view-mode`)
- **Search**: Filters by title, location, or slug
- **Status filter**: All, Draft, Open, Closed
- **Purple badges** for "Open" status events
- **Hydration-safe**: Uses `mounted` state to prevent localStorage read during SSR

### Event Card

- **Clickable title**: Draft events navigate to `/edit`, published events navigate to public page
- **Ellipsis menu**: Contains Duplicate, Toggle Status, Delete actions
- **Share button**: Copies public URL with "Copied" feedback
- **Edit button**: Direct link to edit page

### Edit Event Page

- **Tabbed layout**: "Event Details" tab and "Registration Form" tab
- **Event Details tab**: Title, slug, description, location, date, start/end time, maps link, cover image, status
- **Registration Form tab**: Split view with FormBuilder (left) and FormPreview (right)
- **Unsaved changes detection**: Tracks all form state, shows warning banner and fixed save bar
- **Fixed save bar**: Appears at bottom when changes detected, with "Discard" and "Save Changes" buttons
- **Success toast**: Green notification when event is saved successfully
- **Browser warning**: Alerts user if they try to leave with unsaved changes

### Form Builder

- **Single-column layout**: Global Fields section on top, Custom Questions section below
- **Drag-and-drop**: Using @dnd-kit for reordering enabled fields
- **Toggle checkboxes**: Enable/disable global fields per event
- **Custom questions**: Add, edit, delete with dialog form

---

## Routes

### Public Routes

| Path | Description |
|------|-------------|
| `/` | Home page |
| `/login` | Login page |
| `/signup` | Signup page |
| `/e/[slug]` | Public event registration form |
| `/e/[slug]/thanks` | Thank-you page with QR code |
| `/ticket/[qrToken]` | Shareable ticket page (mobile-friendly) |

### Protected Routes (Admin+)

| Path | Description |
|------|-------------|
| `/admin` | Admin dashboard |
| `/admin/events` | Event list (grid/list view) |
| `/admin/events/new` | Create new event |
| `/admin/events/[id]/edit` | Edit existing event (tabbed) |
| `/admin/events/[id]/share` | Share event public link |
| `/admin/events/[id]/registrants` | Registrant list with CSV export |
| `/admin/dashboard/[id]` | Live check-in dashboard |
| `/admin/settings` | App settings |
| `/admin/settings/fields` | Global form fields |
| `/admin/settings/fields/new` | Create global field |
| `/admin/settings/staff` | Staff management |
| `/admin/settings/general` | General settings (e-ticket message) |

### Protected Routes (Staff+)

| Path | Description |
|------|-------------|
| `/scan/[id]` | Mobile-optimized QR scanner (fullscreen, bottom nav: Scanner/History/Stats/Manual) |

### Auth API

| Path | Handler |
|------|---------|
| `/api/auth/[...all]` | Better Auth catch-all |

---

## Server Actions (`server/actions/`)

| File | Purpose |
|------|---------|
| `events.ts` | Event CRUD operations (create, update, delete, duplicate, status toggle) |
| `registrants.ts` | Registration and registrant management (register, get by QR, check duplicate) |
| `checkin.ts` | Check-in operations (QR scan, manual email, VIP toggle) |
| `settings.ts` | Manage global settings, global fields, and e-ticket message |
| `staff.ts` | Staff CRUD operations |
| `export.ts` | CSV export functionality |

### Important: "use server" Constraints

Files with `"use server"` directive **can only export async functions**. Never export:
- Zod schemas (objects)
- TypeScript types
- Constants or configuration objects

**Pattern:**
```
/lib/validations/*.ts    → Zod schemas & types (shared, no "use server")
/server/actions/*.ts     → Async server actions only (import schemas, don't export)
/app/*/page.tsx          → Client components import schemas from /lib/validations
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `next.config.js` | Next.js configuration |
| `tailwind.config.ts` | Tailwind with custom theme tokens |
| `drizzle.config.ts` | Drizzle ORM configuration |
| `tsconfig.json` | TypeScript configuration |
| `.eslintrc.json` | ESLint rules |
| `postcss.config.js` | PostCSS for Tailwind |

### Environment Variables (`.env.example`)

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Design System

See `DESIGN.md` for the complete design system documentation. Key principles:

- **Color**: Deep purple primary (#453B4D), no pure black
- **Typography**: Manrope (display/headlines), Inter (labels/data)
- **Elevation**: Tonal layering, ghost shadows
- **Components**: No 1px borders, 1.5rem border radius, gradient buttons
- **No-lines**: Use background color shifts for sectioning
- **Glassmorphism**: Semi-transparent backgrounds with backdrop blur for floating elements

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:generate # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database
```

---

## React Hydration Patterns

### Stable IDs (Input, Textarea)

Components that generate IDs must use `React.useId()` to ensure consistency between SSR and CSR:

```tsx
const generatedId = React.useId()
const inputId = id || generatedId
```

**Never use** `Math.random()` for IDs - values differ between server and client renders.

### localStorage After Mount

Components reading localStorage must defer until after mount to prevent hydration mismatches:

```tsx
const [mounted, setMounted] = React.useState(false)
const [viewMode, setViewMode] = React.useState<ViewMode>("grid")

React.useEffect(() => {
  const saved = localStorage.getItem(VIEW_MODE_KEY)
  if (saved === "grid" || saved === "list") {
    setViewMode(saved)
  }
  setMounted(true)
}, [])

// Use mounted check in render
variant={mounted && viewMode === "grid" ? "primary" : "ghost"}
```

---

## Mobile-Optimized Scanner

The `/scan/[id]` route is designed for mobile use with:

- **Fullscreen camera**: No sidebar, header, or navigation chrome
- **Bottom navigation**: 4 tabs (Scanner, History, Stats, Manual)
- **Custom QR overlay**: Centered scanning region with corner markers
- **Slide-up attendee panel**: Shows attendee details after successful scan
- **Html5Qrcode config**: No `qrbox` option, CSS hides library UI elements

### Scanner Permissions

Scanner explicitly requests camera permission before starting:

```tsx
await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
await scannerRef.current.start({ facingMode: "environment" }, { fps: 10 }, ...)
```

---

## Related Documentation

- `DESIGN.md` — Design system and visual guidelines
- `master_plan.md` — Feature progress tracking
- `bugs.md` — Bug log
- `docs/epics.md` — Feature epics
- `docs/tasks.md` — Task breakdown