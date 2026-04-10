import { z } from "zod";

// Validation schema for event slug
const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(100, "Slug too long")
  .regex(
    /^[a-z0-9-]+$/,
    "Slug can only contain lowercase letters, numbers, and hyphens"
  );

// Validation schema for form fields
const fieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const formFieldConfigSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required"),
  fieldType: z.enum([
    "short_text",
    "long_text",
    "dropdown",
    "multiple_choice",
    "checkboxes",
  ]),
  options: z.array(fieldOptionSchema).optional(),
  isRequired: z.boolean(),
});

const customQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1, "Question is required"),
  fieldType: z.enum([
    "short_text",
    "long_text",
    "dropdown",
    "multiple_choice",
    "checkboxes",
  ]),
  options: z.array(fieldOptionSchema).optional(),
  isRequired: z.boolean(),
});

// Time validation helper (format: HH:MM)
const timeSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)")
  .optional();

// Main validation schema for event details
export const eventDetailsSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  slug: slugSchema,
  description: z.string().max(5000, "Description too long").optional(),
  location: z.string().max(200, "Location too long").optional(),
  eventDate: z.coerce.date().nullable().optional(),
  startTime: timeSchema,
  endTime: timeSchema,
  mapsLink: z
    .string()
    .url("Invalid URL")
    .max(500, "URL too long")
    .optional()
    .or(z.literal("")),
  coverImageUrl: z
    .string()
    .url("Invalid URL")
    .max(500, "URL too long")
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "open", "closed", "ended"]).optional(),
  formFields: z.array(formFieldConfigSchema).optional(),
  customQuestions: z.array(customQuestionSchema).optional(),
});

export type EventDetailsInput = z.infer<typeof eventDetailsSchema>;