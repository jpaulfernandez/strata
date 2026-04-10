import { z } from "zod";

export const registrationSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(200, "Email must be less than 200 characters"),
  formData: z.record(z.unknown()).optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;