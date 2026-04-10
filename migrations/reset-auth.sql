-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS vip_notifications CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS registrants CASCADE;
DROP TABLE IF EXISTS global_fields CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS checkin_method CASCADE;
DROP TYPE IF EXISTS field_type CASCADE;

-- Recreate enums
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff');
CREATE TYPE event_status AS ENUM ('draft', 'open', 'closed');
CREATE TYPE checkin_method AS ENUM ('qr', 'manual_email');
CREATE TYPE field_type AS ENUM ('short_text', 'long_text', 'dropdown', 'multiple_choice', 'checkboxes');

-- Create better-auth tables
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  role user_role DEFAULT 'admin' NOT NULL
);

CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create application tables
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  event_end_date TIMESTAMP WITH TIME ZONE,
  status event_status DEFAULT 'draft' NOT NULL,
  form_fields JSONB,
  custom_questions JSONB,
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE registrants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  qr_token TEXT UNIQUE NOT NULL,
  is_vip BOOLEAN DEFAULT FALSE NOT NULL,
  checked_in BOOLEAN DEFAULT FALSE NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  form_data JSONB,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registrant_id UUID NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  scanned_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  method checkin_method NOT NULL
);

CREATE TABLE vip_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registrant_id UUID NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
  triggered_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE NOT NULL,
  acknowledged_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE global_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  field_type field_type NOT NULL,
  options JSONB,
  is_required BOOLEAN DEFAULT FALSE NOT NULL,
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_session_token ON "session"(token);
CREATE INDEX idx_session_user_id ON "session"(user_id);
CREATE INDEX idx_account_user_id ON "account"(user_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_registrants_event_id ON registrants(event_id);
CREATE INDEX idx_registrants_qr_token ON registrants(qr_token);