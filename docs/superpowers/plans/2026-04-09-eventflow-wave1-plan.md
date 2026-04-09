# EventFlow Wave 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize Next.js project with Drizzle ORM, Supabase schema, and QR utility — the foundation for the entire EventFlow platform.

**Architecture:** Create a Next.js 14 App Router project with TypeScript, configure Tailwind with DESIGN.md tokens, set up Drizzle ORM connected to Supabase, define all 6 database tables, and implement QR generation utility.

**Tech Stack:** Next.js 14, TypeScript, Drizzle ORM, Supabase, Tailwind CSS, qrcode

---

## File Structure

```
/Users/polaris/projects/strata/
├── package.json                 # Project dependencies
├── next.config.js               # Next.js configuration
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts           # Tailwind with DESIGN.md tokens
├── postcss.config.js            # PostCSS for Tailwind
├── .env.example                 # Environment variables template
├── drizzle.config.ts            # Drizzle configuration
├── .eslintrc.json               # ESLint config
├── app/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page (redirects)
│   └── globals.css              # Global styles + CSS variables
├── lib/
│   ├── db/
│   │   ├── index.ts             # Drizzle Supabase client
│   │   └── schema.ts            # All table definitions
│   ├── qr.ts                    # QR code generation
│   └── utils.ts                 # Helper functions
├── types/
│   └── index.ts                 # Shared TypeScript types
└── docs/superpowers/
    ├── specs/                   # (already created)
    └── plans/                   # (this file)
```

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `.eslintrc.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "eventflow",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "drizzle-orm": "^0.29.0",
    "better-auth": "^1.0.0",
    "@tanstack/react-query": "^5.17.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "qrcode": "^1.5.3",
    "resend": "^3.2.0",
    "lucide-react": "^0.312.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/qrcode": "^1.5.5",
    "drizzle-kit": "^0.20.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.2.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 2: Create next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2e2536',
          container: '#453b4d',
        },
        surface: {
          DEFAULT: '#faf9fb',
          'container-low': '#f4f3f5',
          'container-lowest': '#ffffff',
          'container-high': '#e8e6e9',
          'container-highest': '#dcdadd',
          bright: '#e6e4e7',
        },
        secondary: {
          container: '#e8dbef',
        },
        on: {
          primary: '#ffffff',
          secondary: '#685f70',
          surface: '#1a1c1d',
        },
        outline: {
          variant: '#ccc4cc',
        },
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        ghost: '0 12px 40px rgba(74, 69, 75, 0.06)',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.75rem',
        xl: '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create .eslintrc.json**

```json
{
  "extends": "next/core-web-vitals"
}
```

- [ ] **Step 7: Create app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@400;500;600;700&display=swap');

:root {
  --color-primary: #2e2536;
  --color-primary-container: #453b4d;
  --color-surface: #faf9fb;
  --color-surface-container-low: #f4f3f5;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-high: #e8e6e9;
  --color-surface-container-highest: #dcdadd;
  --color-surface-bright: #e6e4e7;
  --color-secondary-container: #e8dbef;
  --color-on-primary: #ffffff;
  --color-on-secondary: #685f70;
  --color-on-surface: #1a1c1d;
  --color-outline-variant: #ccc4cc;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  font-family: 'Manrope', sans-serif;
  background-color: var(--color-surface);
  color: var(--color-on-surface);
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 8: Create app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EventFlow',
  description: 'Event registration and check-in platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body">{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Create app/page.tsx**

```typescript
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-display-lg mb-4">EventFlow</h1>
        <p className="text-body-lg text-on-surface/60">
          Event registration and check-in platform
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 10: Install dependencies**

Run: `npm install`
Expected: All dependencies installed successfully

- [ ] **Step 11: Commit**

```bash
git add package.json next.config.js tsconfig.json tailwind.config.ts postcss.config.js .eslintrc.json app/
git commit -m "chore: initialize Next.js 14 project with Tailwind"
```

---

## Task 2: Set Up Drizzle ORM and Database Schema

**Files:**
- Create: `drizzle.config.ts`
- Create: `lib/db/index.ts`
- Create: `lib/db/schema.ts`
- Create: `.env`
- Modify: `tsconfig.json` (add path alias)

- [ ] **Step 1: Create drizzle.config.ts**

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

- [ ] **Step 2: Create lib/db/schema.ts**

```typescript
import { pgTable, uuid, text, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'staff']);
export const eventStatusEnum = pgEnum('event_status', ['draft', 'open', 'closed']);
export const fieldTypeEnum = pgEnum('field_type', [
  'short_text',
  'long_text',
  'dropdown',
  'multiple_choice',
  'checkboxes',
]);
export const checkinMethodEnum = pgEnum('checkin_method', ['qr', 'manual_email']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name'),
  role: userRoleEnum('role').default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Events table
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique(),
  title: text('title').notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  location: text('location'),
  eventDate: timestamp('event_date'),
  eventEndDate: timestamp('event_end_date'),
  status: eventStatusEnum('status').default('draft').notNull(),
  formFields: jsonb('form_fields').$type<
    Array<{
      globalFieldId: string;
      label: string;
      fieldType: string;
      options: string[];
      isRequired: boolean;
      order: number;
    }>
  >(),
  customQuestions: jsonb('custom_questions').$type<
    Array<{
      id: string;
      label: string;
      helpText?: string;
      fieldType: string;
      options: string[];
      isRequired: boolean;
      order: number;
    }>
  >(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Registrants table
export const registrants = pgTable('registrants', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  qrToken: text('qr_token').unique().notNull(),
  isVip: boolean('is_vip').default(false),
  checkedIn: boolean('checked_in').default(false),
  checkedInAt: timestamp('checked_in_at'),
  checkedInBy: uuid('checked_in_by').references(() => users.id),
  formData: jsonb('form_data').$type<Record<string, unknown>>(),
  registeredAt: timestamp('registered_at').defaultNow(),
});

// Checkins table
export const checkins = pgTable('checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  registrantId: uuid('registrant_id')
    .references(() => registrants.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  scannedBy: uuid('scanned_by').references(() => users.id),
  scannedAt: timestamp('scanned_at').defaultNow(),
  method: checkinMethodEnum('method').notNull(),
});

// VIP Notifications table
export const vipNotifications = pgTable('vip_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  registrantId: uuid('registrant_id')
    .references(() => registrants.id, { onDelete: 'cascade' })
    .notNull(),
  triggeredBy: uuid('triggered_by').references(() => users.id),
  triggeredAt: timestamp('triggered_at').defaultNow(),
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  acknowledgedAt: timestamp('acknowledged_at'),
});

// Global Fields table
export const globalFields = pgTable('global_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: text('label').notNull(),
  fieldType: fieldTypeEnum('field_type').notNull(),
  options: jsonb('options').$type<string[]>(),
  isRequired: boolean('is_required').default(false),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Registrant = typeof registrants.$inferSelect;
export type NewRegistrant = typeof registrants.$inferInsert;
export type Checkin = typeof checkins.$inferSelect;
export type NewCheckin = typeof checkins.$inferInsert;
export type VipNotification = typeof vipNotifications.$inferSelect;
export type NewVipNotification = typeof vipNotifications.$inferInsert;
export type GlobalField = typeof globalFields.$inferSelect;
export type NewGlobalField = typeof globalFields.$inferInsert;
```

- [ ] **Step 3: Create lib/db/index.ts**

```typescript
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Admin client for server operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Drizzle client (for type-safe queries)
export const db = drizzle(process.env.DATABASE_URL!, { schema });

// Re-export schema for convenience
export { schema };
```

- [ ] **Step 4: Create .env file with placeholder values**

```bash
# Database (Supabase connection string)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]

# better-auth
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
```

- [ ] **Step 5: Commit**

```bash
git add drizzle.config.ts lib/db/
git commit -feat: set up Drizzle ORM and database schema
```

---

## Task 3: QR Code Utility

**Files:**
- Create: `lib/qr.ts`

- [ ] **Step 1: Create lib/qr.ts**

```typescript
import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate QR code as a data URL (PNG base64)
 * @param data - The data to encode in the QR code (e.g., qr_token)
 * @param options - Optional configuration
 * @returns Promise resolving to base64 data URL
 */
export async function generateQRCode(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const { width = 300, margin = 2, errorCorrectionLevel = 'M' } = options;

  return QRCode.toDataURL(data, {
    errorCorrectionLevel,
    width,
    margin,
    color: {
      dark: '#1a1c1d',
      light: '#ffffff',
    },
  });
}

/**
 * Generate QR code as SVG string
 * @param data - The data to encode in the QR code
 * @param options - Optional configuration
 * @returns Promise resolving to SVG string
 */
export async function generateQRCodeSVG(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const { width = 300, margin = 2, errorCorrectionLevel = 'M' } = options;

  return QRCode.toString(data, {
    type: 'svg',
    errorCorrectionLevel,
    width,
    margin,
    color: {
      dark: '#1a1c1d',
      light: '#ffffff',
    },
  });
}

/**
 * Generate a simple QR code for URL
 * @param url - The URL to encode
 * @returns Promise resolving to base64 data URL
 */
export async function generateQRCodeForUrl(url: string): Promise<string> {
  return generateQRCode(url);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/qr.ts
git commit -m "feat: add QR code generation utility"
```

---

## Task 4: Utility Helpers

**Files:**
- Create: `lib/utils.ts`

- [ ] **Step 1: Create lib/utils.ts**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a datetime for display
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Generate a slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get initials from a name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/utils.ts
git commit -m "feat: add utility helper functions"
```

---

## Task 5: TypeScript Types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Create types/index.ts**

```typescript
import type {
  User,
  Event,
  Registrant,
  Checkin,
  VipNotification,
  GlobalField,
} from '@/lib/db/schema';

// Re-export schema types
export type { User, Event, Registrant, Checkin, VipNotification, GlobalField };

// Form field types
export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'dropdown'
  | 'multiple_choice'
  | 'checkboxes';

// Event form field (from global fields)
export interface EventFormField {
  globalFieldId: string;
  label: string;
  fieldType: FieldType;
  options: string[];
  isRequired: boolean;
  order: number;
}

// Custom question (per event)
export interface CustomQuestion {
  id: string;
  label: string;
  helpText?: string;
  fieldType: FieldType;
  options: string[];
  isRequired: boolean;
  order: number;
}

// Form data from registrant
export interface FormData {
  [key: string]: unknown;
}

// Check-in result
export interface CheckinResult {
  success: boolean;
  registrant?: Registrant;
  message: string;
  method: 'qr' | 'manual_email';
}

// Dashboard stats
export interface DashboardStats {
  totalRegistered: number;
  checkedIn: number;
  remaining: number;
  checkInRate: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 6: Create .env.example

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

```bash
# Database (Supabase connection string)
# Get this from Supabase Dashboard > Settings > Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres

# Supabase
# Get these from Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]

# better-auth
# Generate a secure random string (at least 32 characters)
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend
# Get this from Resend Dashboard > API Keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add environment variables template"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Run build to verify no errors**

Run: `npm run build`
Expected: Build completes with zero errors

- [ ] **Step 2: Run lint to verify no errors**

Run: `npm run lint`
Expected: Lint passes with zero errors

- [ ] **Step 3: Commit final changes**

```bash
git add -A
git commit -m "feat: complete Wave 1 foundation - Next.js, Drizzle, QR utility"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Initialize Next.js project | 9 files |
| 2 | Set up Drizzle ORM + schema | 4 files |
| 3 | QR code utility | 1 file |
| 4 | Utility helpers | 1 file |
| 5 | TypeScript types | 1 file |
| 6 | .env.example | 1 file |
| 7 | Final verification | - |

**Total files created:** ~17 files
**Total commits:** ~7 commits