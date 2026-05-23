/**
 * Auth middleware — protects all routes except static assets, PDFs,
 * the login page, and NextAuth's own API routes.
 *
 * Uses next-auth's withAuth helper which checks for a valid JWT session
 * cookie. Unauthenticated requests are redirected to /login.
 */

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Match everything except Next.js internals, static files, and auth routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|pdfs/|login|api/auth).*)"],
};
