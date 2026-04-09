import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API Route Handler
 *
 * This route handles all better-auth endpoints:
 * - POST /api/auth/sign-in
 * - POST /api/auth/sign-up
 * - POST /api/auth/sign-out
 * - GET /api/auth/session
 * - POST /api/auth/forgot-password
 * - POST /api/auth/reset-password
 * - POST /api/auth/verify-email
 * - etc.
 *
 * The toNextJsHandler wraps the auth handler for Next.js App Router.
 * We use dynamic import to avoid initialization issues during build.
 */
const authHandlerPromise = import("@/server/auth").then(({ auth }) => toNextJsHandler(auth));

export async function GET(request: Request) {
  const { GET: handler } = await authHandlerPromise;
  return handler(request);
}

export async function POST(request: Request) {
  const { POST: handler } = await authHandlerPromise;
  return handler(request);
}