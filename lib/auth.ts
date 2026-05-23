/**
 * NextAuth configuration for BadgerIQ.
 *
 * Uses Google OAuth with a hardcoded allowlist — only the emails in
 * ALLOWED_EMAILS can sign in. Anyone else gets rejected in the signIn
 * callback before a session is ever created.
 *
 * Sessions are JWT-based with an 8-hour expiry.
 */

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Add Wisconsin staff emails here to grant access
export const ALLOWED_EMAILS = [
  "smukherjee39@wisc.edu",
  "nbb@athletics.wisc.edu",
  "nwj@athletics.wisc.edu",
  "twsmith3@athletics.wisc.edu",
  "sjb@athletics.wisc.edu",
];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Block sign-in for any email not in the allowlist
    async signIn({ user }) {
      return ALLOWED_EMAILS.includes(user.email ?? "");
    },
    // Forward name/email/image from the JWT into the session object
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name  = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    // Persist user info into the JWT on first sign-in
    async jwt({ token, user }) {
      if (user) {
        token.email   = user.email;
        token.name    = user.name;
        token.picture = user.image;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login", // redirect auth errors back to login instead of a separate error page
  },
  session: {
    strategy: "jwt",
    maxAge:   60 * 60 * 8, // 8 hours
  },
};
