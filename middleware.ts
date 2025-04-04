import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/about", 
    "/api/socket", 
    "/rooms",
    "/api/rooms"
  ],
});

// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/"
  ],
};
