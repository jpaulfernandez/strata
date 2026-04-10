import { z } from "zod";

// Schema for adding a new staff member
export const addStaffSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "staff"]),
});

// Schema for updating a staff member's role
export const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["admin", "staff"]),
});

export type AddStaffInput = z.infer<typeof addStaffSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;