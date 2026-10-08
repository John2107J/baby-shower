import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getClientIp } from "@/lib/client-ip";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ADMIN_ROUTES } from "@/lib/routes";
import { ADMIN_SESSION_MAX_AGE_SECONDS } from "@/modules/auth/domain/login-rules";
import { authenticateAdmin } from "@/modules/auth/services/authenticate-admin";

export const ADMIN_LOGIN_PATH = ADMIN_ROUTES.login;
export const ADMIN_HOME_PATH = ADMIN_ROUTES.home;

export const RATE_LIMITED_CODE = "rate_limited";

class RateLimitedSignin extends CredentialsSignin {
  override code = RATE_LIMITED_CODE;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: ADMIN_SESSION_MAX_AGE_SECONDS },
  pages: { signIn: ADMIN_LOGIN_PATH },
  // Route Auth.js logs through the central logger: no stack traces, no personal data.
  logger: {
    error(error) {
      // Failed logins are expected and already logged with their reason in authorize().
      if (error instanceof CredentialsSignin) return;
      logger.error("auth error", { errorName: error.name });
    },
    warn(code) {
      logger.warn("auth warning", { code });
    },
    debug() {},
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const result = await authenticateAdmin(
          getDb(),
          credentials,
          getClientIp(request.headers),
        );
        if (result.ok)
          return { id: result.admin.id, email: result.admin.email };

        logger.warn("admin login rejected", { reason: result.reason });
        if (result.reason === "rate_limited") throw new RateLimitedSignin();
        return null;
      },
    }),
  ],
  callbacks: {
    // Keep the session token minimal: only the admin id and email.
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
