import { z } from "zod";

// Schema for creating/updating a global field
export const globalFieldSchema = z.object({
  label: z.string().min(1, "Label is required").max(100, "Label too long"),
  fieldType: z.enum([
    "short_text",
    "long_text",
    "dropdown",
    "multiple_choice",
    "checkboxes",
  ]),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
});

export type GlobalFieldInput = z.infer<typeof globalFieldSchema>;