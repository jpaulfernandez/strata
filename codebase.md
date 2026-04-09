# Codebase Documentation

This file serves as the source of truth for the EventFlow codebase. It provides a comprehensive overview of the project's architecture, technology stack, and key components.

---

## Project Overview

**EventFlow** is an event registration and check-in platform built with Next.js. It enables organizers to create events, manage registrations, and check in attendees via QR codes or manual lookup.

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

---

## Project Structure

```
/app                    # Next.js App Router routes
  /api                  # API routes
    /auth/[...all]      # Better Auth catch-all handler
  /admin                # Admin protected routes (requires admin+)
  /login                # Login page
  /checkin              # Check-in interface
  layout.tsx            # Root layout with fonts
  page.tsx              # Home page
  middleware.ts         # Auth + RBAC middleware

/components            # Reusable UI components
  /ui                   # Generic UI primitives (Button, Card, Input, etc.)
  /features             # Feature-specific components
    /events             # Event-related feature components
      event-card.tsx    # Event card display
      event-list.tsx    # Event list with actions
      form-builder.tsx  # Unified form builder with drag-and-drop (dnd-kit)

/lib                   # Shared utilities
  /db                   # Database schema and connection
  /permissions.ts       # Permission constants and helpers
  /utils.ts             # General utilities
  /qr.ts                # QR code generation

/server                # Server-only code (not exposed to client)
  /auth                # Auth configuration and middleware helpers
  /actions             # Server Actions for mutations
  /db                  # Database seeds

/types                 # TypeScript type definitions

/public                # Static assets (empty - uses next/image)
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Staff/admin accounts with roles |
| `events` | Event definitions with form configurations |
| `registrants` | Attendees registered for events |
| `checkins` | Check-in records with timestamps |
| `vipNotifications` | VIP arrival notifications |
| `globalFields` | Reusable form field templates |

### Enums

- `user_role`: `super_admin | admin | staff`
- `event_status`: `draft | open | closed`
- `checkin_method`: `qr | manual_email`
- `field_type`: `short_text | long_text | dropdown | multiple_choice | checkboxes`

### Key Relationships

- `events.createdBy` → `users.id`
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
- `/settings/*` — requires admin role
- `/checkin/*` — requires authenticated
- `/api/admin/*` — requires admin role

---

## Key Components

### UI Primitives (`components/ui/`)

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, ghost variants |
| `Card` | Content container with elevation |
| `Input` | Text input field |
| `Label` | Form label |
| `Textarea` | Multi-line text input |
| `Select` | Dropdown selection |
| `Dialog` | Modal dialog |
| `Badge` | Status/category tag |

### Feature Components (`components/features/`)

| Component | Description |
|-----------|-------------|
| `events/event-card.tsx` | Event card with cover image, status badge |
| `events/event-list.tsx` | Event list with actions menu |
| `events/form-builder.tsx` | Unified form builder with drag-and-drop for global fields and custom questions |

---

## Routes

### Public Routes

| Path | Description |
|------|-------------|
| `/` | Home page |
| `/login` | Login page |
| `/register` | Registration page |

### Protected Routes (Admin+)

| Path | Description |
|------|-------------|
| `/admin` | Admin dashboard |
| `/admin/events` | Event list |
| `/admin/events/new` | Create new event |
| `/admin/events/[id]/edit` | Edit existing event |
| `/admin/settings` | App settings |
| `/admin/settings/fields` | Global form fields |
| `/admin/settings/fields/new` | Create global field |
| `/admin/settings/staff` | Staff management |

### Auth API

| Path | Handler |
|------|---------|
| `/api/auth/[...all]` | Better Auth catch-all |

---

## Server Actions (`server/actions/`)

| File | Purpose |
|------|---------|
| `events.ts` | Event CRUD operations (create, update, delete, duplicate, status toggle) |
| `settings.ts` | Manage global settings and global fields |
| `staff.ts` | Staff CRUD operations |

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

## Related Documentation

- `DESIGN.md` — Design system and visual guidelines
- `master_plan.md` — Feature progress tracking
- `bugs.md` — Bug log
- `docs/epics.md` — Feature epics
- `docs/tasks.md` — Task breakdown