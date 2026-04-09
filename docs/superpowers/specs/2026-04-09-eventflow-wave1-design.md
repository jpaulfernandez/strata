# EventFlow — Wave 1: Foundation

**Date:** 2026-04-09
**Status:** Approved
**Parent Plan:** master_plan.md

---

## Overview

Wave 1 establishes the foundational infrastructure for EventFlow:
- Project initialization with Next.js 14 App Router
- Database schema via Drizzle ORM
- QR code generation utility

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) + Drizzle ORM |
| Auth | better-auth |
| Styling | Tailwind CSS (configured with DESIGN.md tokens) |
| Email | Resend |
| QR | `qrcode` (generation), `html5-qrcode` (scanning) |

---

## Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2",
    "drizzle-orm": "^0.29",
    "better-auth": "^1",
    "@tanstack/react-query": "^5",
    "react-hook-form": "^7",
    "zod": "^3",
    "qrcode": "^1.5",
    "html5-qrcode": "^2.3",
    "resend": "^3",
    "lucide-react": "^0.300"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20",
    "@types/qrcode": "^1.5"
  }
}
```

---

## Project Structure

```
/app                    Routes, layouts, pages
  /api                  API routes
  /(auth)               Auth routes
  /(admin)              Admin routes
  /(public)             Public event routes
/components
  /ui                   Generic UI components
  /features             Feature-specific components
/lib
  /db                   Drizzle database client
  /auth                 Auth utilities
  /email                Resend helpers
  /qr                   QR generation
  /validations          Zod schemas
/hooks                  Custom React hooks
/server
  /actions              Server actions
  /db                   Data access layer
/types                  TypeScript types
```

---

## Database Schema

### `users`
```typescript
users = pgTable('users', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name'),
  role: text('role').$type<'super_admin' | 'admin' | 'staff'>().default('admin'),
  createdAt: timestamp('created_at').defaultNow()
});
```

### `events`
```typescript
events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique(),
  title: text('title').notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  location: text('location'),
  eventDate: timestamp('event_date'),
  eventEndDate: timestamp('event_end_date'),
  status: text('status').$type<'draft' | 'open' | 'closed'>().default('draft'),
  formFields: jsonb('form_fields'),
  customQuestions: jsonb('custom_questions'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### `registrants`
```typescript
registrants = pgTable('registrants', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  qrToken: text('qr_token').unique().notNull(),
  isVip: boolean('is_vip').default(false),
  checkedIn: boolean('checked_in').default(false),
  checkedInAt: timestamp('checked_in_at'),
  checkedInBy: uuid('checked_in_by').references(() => users.id),
  formData: jsonb('form_data'),
  registeredAt: timestamp('registered_at').defaultNow()
});
```

### `checkins`
```typescript
checkins = pgTable('checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  registrantId: uuid('registrant_id').references(() => registrants.id),
  eventId: uuid('event_id').references(() => events.id),
  scannedBy: uuid('scanned_by').references(() => users.id),
  scannedAt: timestamp('scanned_at').defaultNow(),
  method: text('method').$type<'qr' | 'manual_email'>()
});
```

### `vip_notifications`
```typescript
vipNotifications = pgTable('vip_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id),
  registrantId: uuid('registrant_id').references(() => registrants.id),
  triggeredBy: uuid('triggered_by').references(() => users.id),
  triggeredAt: timestamp('triggered_at').defaultNow(),
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  acknowledgedAt: timestamp('acknowledged_at')
});
```

### `global_fields`
```typescript
globalFields = pgTable('global_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: text('label').notNull(),
  fieldType: text('field_type').$type<
    'short_text' | 'long_text' | 'dropdown' | 'multiple_choice' | 'checkboxes'
  >(),
  options: jsonb('options'),
  isRequired: boolean('is_required').default(false),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
});
```

---

## QR Code Utility

Location: `/lib/qr.ts`

```typescript
import QRCode from 'qrcode';

export async function generateQRCode(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
    color: {
      dark: '#1a1c1d',
      light: '#ffffff'
    }
  });
}

export async function generateQRCodeSVG(token: string): Promise<string> {
  return QRCode.toString(token, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
    color: {
      dark: '#1a1c1d',
      light: '#ffffff'
    }
  });
}
```

---

## Environment Variables

Create `.env.example`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/eventflow

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# better-auth
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxx
```

---

## Tailwind Configuration

Configure `tailwind.config.ts` with DESIGN.md tokens:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2e2536',
          container: '#453b4d'
        },
        surface: {
          DEFAULT: '#faf9fb',
          'container-low': '#f4f3f5',
          'container-lowest': '#ffffff',
          'container-high': '#e8e6e9',
          'container-highest': '#dcdadd',
          bright: '#e6e4e7'
        },
        secondary: {
          container: '#e8dbef'
        },
        on: {
          primary: '#ffffff',
          secondary: '#685f70',
          surface: '#1a1c1d'
        },
        outline: {
          variant: '#ccc4cc'
        }
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['Inter', 'sans-serif']
      },
      boxShadow: {
        ghost: '0 12px 40px rgba(74, 69, 75, 0.06)'
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.75rem',
        xl: '1.5rem',
        full: '9999px'
      }
    }
  }
}
```

---

## Implementation Tasks

| Task | ID | Effort |
|------|-----|--------|
| Initialize Next.js project | 1.1 | S |
| Install dependencies | 1.1 | S |
| Configure Tailwind with DESIGN.md tokens | 1.1 | S |
| Set up Drizzle ORM and Supabase client | 1.2 | M |
| Create database schema (tables + relations) | 1.2 | M |
| Implement QR code generation utility | 6.2 | S |
| Create environment configuration | 1.1 | S |

---

## Acceptance Criteria

- [ ] Next.js project scaffolded with App Router
- [ ] All dependencies installed
- [ ] Tailwind configured with DESIGN.md color system
- [ ] Drizzle ORM connected to Supabase
- [ ] All 6 database tables created with proper types
- [ ] QR generation utility functional
- [ ] `.env.example` created with all required variables
- [ ] ESLint and TypeScript pass with zero errors