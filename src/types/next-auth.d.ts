import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    sessionVersion?: number;
  }
  interface Session {
    user: { id: string; sessionVersion?: number } & DefaultSession["user"];
  }
}

// Auth.js v5 resolves the JWT type from @auth/core.
declare module "@auth/core/jwt" {
  interface JWT {
    sessionVersion?: number;
  }
}
