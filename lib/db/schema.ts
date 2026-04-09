import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "staff",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "open",
  "closed",
]);

export const checkinMethodEnum = pgEnum("checkin_method", ["qr", "manual_email"]);

export const fieldTypeEnum = pgEnum("field_type", [
  "short_text",
  "long_text",
  "dropdown",
  "multiple_choice",
  "checkboxes",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: userRoleEnum("role").default("admin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  location: text("location"),
  eventDate: timestamp("event_date", { withTimezone: true }),
  eventEndDate: timestamp("event_end_date", { withTimezone: true }),
  status: eventStatusEnum("status").default("draft").notNull(),
  formFields: jsonb("form_fields").$type<FormFieldConfig[]>(),
  customQuestions: jsonb("custom_questions").$type<CustomQuestion[]>(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Registrants table
export const registrants = pgTable("registrants", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  qrToken: text("qr_token").unique().notNull(),
  isVip: boolean("is_vip").default(false).notNull(),
  checkedIn: boolean("checked_in").default(false).notNull(),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  checkedInBy: uuid("checked_in_by").references(() => users.id, { onDelete: "set null" }),
  formData: jsonb("form_data").$type<Record<string, unknown>>(),
  registeredAt: timestamp("registered_at", { withTimezone: true }).defaultNow().notNull(),
});

// Checkins table
export const checkins = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrantId: uuid("registrant_id").references(() => registrants.id, { onDelete: "cascade" }).notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  scannedBy: uuid("scanned_by").references(() => users.id, { onDelete: "set null" }),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).defaultNow().notNull(),
  method: checkinMethodEnum("method").notNull(),
});

// VIP Notifications table
export const vipNotifications = pgTable("vip_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  registrantId: uuid("registrant_id").references(() => registrants.id, { onDelete: "cascade" }).notNull(),
  triggeredBy: uuid("triggered_by").references(() => users.id, { onDelete: "set null" }),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }).defaultNow().notNull(),
  acknowledged: boolean("acknowledged").default(false).notNull(),
  acknowledgedBy: uuid("acknowledged_by").references(() => users.id, { onDelete: "set null" }),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
});

// Global Fields table
export const globalFields = pgTable("global_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  fieldType: fieldTypeEnum("field_type").notNull(),
  options: jsonb("options").$type<FieldOption[]>(),
  isRequired: boolean("is_required").default(false).notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type definitions for JSONB fields
export interface FieldOption {
  label: string;
  value: string;
}

export interface FormFieldConfig {
  id: string;
  label: string;
  fieldType: "short_text" | "long_text" | "dropdown" | "multiple_choice" | "checkboxes";
  options?: FieldOption[];
  isRequired: boolean;
}

export interface CustomQuestion {
  id: string;
  question: string;
  fieldType: "short_text" | "long_text" | "dropdown" | "multiple_choice" | "checkboxes";
  options?: FieldOption[];
  isRequired: boolean;
}

// Type exports for tables
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

// Indexes for events table
export const eventsSlugIdx = index("events_slug_idx").on(events.slug);
export const eventsStatusIdx = index("events_status_idx").on(events.status);
export const eventsCreatedByIdx = index("events_created_by_idx").on(events.createdBy);
export const eventsEventDateIdx = index("events_event_date_idx").on(events.eventDate);

// Indexes for registrants table
export const registrantsEventIdIdx = index("registrants_event_id_idx").on(registrants.eventId);
export const registrantsEmailIdx = index("registrants_email_idx").on(registrants.email);
export const registrantsQrTokenIdx = index("registrants_qr_token_idx").on(registrants.qrToken);
export const registrantsCheckedInIdx = index("registrants_checked_in_idx").on(registrants.checkedIn);

// Indexes for checkins table
export const checkinsRegistrantIdIdx = index("checkins_registrant_id_idx").on(checkins.registrantId);
export const checkinsEventIdIdx = index("checkins_event_id_idx").on(checkins.eventId);
export const checkinsScannedAtIdx = index("checkins_scanned_at_idx").on(checkins.scannedAt);

// Indexes for vipNotifications table
export const vipNotificationsEventIdIdx = index("vip_notifications_event_id_idx").on(vipNotifications.eventId);
export const vipNotificationsRegistrantIdIdx = index("vip_notifications_registrant_id_idx").on(vipNotifications.registrantId);
export const vipNotificationsAcknowledgedIdx = index("vip_notifications_acknowledged_idx").on(vipNotifications.acknowledged);

// Indexes for globalFields table
export const globalFieldsCreatedByIdx = index("global_fields_created_by_idx").on(globalFields.createdBy);