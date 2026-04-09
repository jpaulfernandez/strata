"use server";

import { authClient } from "@/server/auth/client";
import { redirect } from "next/navigation";
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export async function signInAction(formData: FormData) {
  const validatedFields = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors[0]?.message || "Invalid input",
      field: validatedFields.error.errors[0]?.path[0],
    };
  }

  try {
    await authClient.signIn.email({
      email: validatedFields.data.email,
      password: validatedFields.data.password,
    });

    redirect("/admin");
  } catch (error) {
    console.error("Sign in error:", error);

    const err = error as { message?: string; code?: string };

    if (err.code === "INVALID_CREDENTIALS" || err.message?.includes("credentials")) {
      return { error: "Invalid email or password", field: "email" };
    }

    return { error: "An error occurred during sign in. Please try again." };
  }
}

export async function signUpAction(formData: FormData) {
  const validatedFields = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors[0]?.message || "Invalid input",
      field: validatedFields.error.errors[0]?.path[0] as string,
    };
  }

  try {
    await authClient.signUp.email({
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      name: validatedFields.data.name,
    });

    redirect("/admin");
  } catch (error) {
    console.error("Sign up error:", error);

    const err = error as { message?: string; code?: string };

    if (err.code === "USER_ALREADY_EXISTS" || err.message?.includes("already exists")) {
      return { error: "An account with this email already exists", field: "email" };
    }

    return { error: "An error occurred during sign up. Please try again." };
  }
}

export async function signOutAction() {
  try {
    await authClient.signOut();
    redirect("/login");
  } catch (error) {
    console.error("Sign out error:", error);
    return { error: "An error occurred during sign out. Please try again." };
  }
}