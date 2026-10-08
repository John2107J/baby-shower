import type { PrismaClient } from "@/generated/prisma/client";
import { consumeRateLimit, resetRateLimit } from "@/lib/rate-limit";
import {
  LOGIN_RATE_LIMIT,
  loginRateLimitKeys,
} from "@/modules/auth/domain/login-rules";
import { findAdminUserByEmail } from "@/modules/auth/repositories/admin-user-repository";
import { credentialsSchema } from "@/modules/auth/schemas/credentials";
import { hashPassword, verifyPassword } from "@/modules/auth/services/password";

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  sessionVersion: number;
};

export type AuthenticationResult =
  | { ok: true; admin: AuthenticatedAdmin }
  | { ok: false; reason: "invalid_credentials" | "rate_limited" };

const UNKNOWN_EMAIL_KEY = "invalid-input";

let dummyHashPromise: Promise<string> | undefined;

// Verifying against a dummy hash when the user does not exist keeps response
// times similar, so attackers cannot discover which emails are registered.
function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword("dummy-password-for-timing-equalization");
  return dummyHashPromise;
}

export async function authenticateAdmin(
  db: PrismaClient,
  rawCredentials: unknown,
  clientIp: string,
): Promise<AuthenticationResult> {
  const parsed = credentialsSchema.safeParse(rawCredentials);
  const email = parsed.success ? parsed.data.email : UNKNOWN_EMAIL_KEY;
  const keys = loginRateLimitKeys(clientIp, email);

  const [ipLimit, emailLimit] = await Promise.all([
    consumeRateLimit(db, keys.byIp, LOGIN_RATE_LIMIT),
    consumeRateLimit(db, keys.byEmail, LOGIN_RATE_LIMIT),
  ]);
  if (!ipLimit.allowed || !emailLimit.allowed)
    return { ok: false, reason: "rate_limited" };
  if (!parsed.success) return { ok: false, reason: "invalid_credentials" };

  const user = await findAdminUserByEmail(db, parsed.data.email);
  const passwordMatches = await verifyPassword(
    user?.passwordHash ?? (await getDummyHash()),
    parsed.data.password,
  );
  if (!user || !passwordMatches)
    return { ok: false, reason: "invalid_credentials" };

  await Promise.all([
    resetRateLimit(db, keys.byIp),
    resetRateLimit(db, keys.byEmail),
  ]);
  return {
    ok: true,
    admin: {
      id: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion,
    },
  };
}
