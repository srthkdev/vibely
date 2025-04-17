import { NextResponse } from 'next/server';
import { authMiddleware } from "@clerk/nextjs";

// Default export for Clerk's auth middleware
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/about", 
    "/api/socket", 
    "/api/webhook",
    "/rooms"  // Allow browsing rooms without auth
  ],
  // Redirect unauthenticated users trying to access protected routes
  afterAuth(auth, req) {
    // If the user is not authenticated and trying to access a room
    if (!auth.userId && req.nextUrl.pathname.startsWith('/rooms/')) {
      return NextResponse.redirect(new URL('/signup', req.url));
    }
    return NextResponse.next();
  }
});

// Configure Clerk to apply this middleware to all routes including API routes
export const config = {
  matcher: [
    // Match all pages
    "/((?!.*\\..*|_next).*)",
    // Match API routes
    "/api/:path*",
    // Skip static files
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};