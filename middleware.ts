import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|.*\\..*|api|trpc|sign-in|sign-up|user-profile).*)",
    // Optional: Protect API routes
    "/api/((?!rooms).*)"
  ],
}; 