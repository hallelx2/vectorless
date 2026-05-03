import { betterAuth } from "better-auth";

import { controlPlaneAdapter } from "@/lib/auth-adapter";

/**
 * Better Auth instance — wired to the control plane via a custom HTTP
 * adapter. There's no local database; every CRUD call goes over the
 * wire to /admin/internal/identity/* on the control plane.
 *
 * Cookies are set on `.vectorless.store` so the same Better Auth session
 * works on `vectorless.store` (dashboard) and `mcp.vectorless.store`
 * (the remote MCP endpoint).
 */
export const auth = betterAuth({
  database: controlPlaneAdapter(),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Cookie shared between vectorless.store and mcp.vectorless.store
  advanced: {
    cookiePrefix: "vls",
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: process.env.COOKIE_DOMAIN || ".vectorless.store",
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh after 1 day of activity
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "https://vectorless.store",
    "https://www.vectorless.store",
    "https://mcp.vectorless.store",
  ],
});

export type Session = typeof auth.$Infer.Session;
