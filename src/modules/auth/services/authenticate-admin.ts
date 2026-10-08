import type { PrismaClient } from "@/generated/prisma/client";
import { consumeRateLimit, resetRateLimit } from "@/lib/rate-limit";
import {
  LOGIN_RATE_LIMIT,
  loginRateLimitKey,
} from "@/modules/auth/domain/login-rules";
import { findAdminUserByEmail } from "@/modules/auth/repositories/admin-user-repository";
import { credentialsSchema } from "@/modules/auth/schemas/credentials";
import {
  getDummyPasswordHash,
  verifyPassword,
} from "@/modules/auth/services/password";

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  sessionVersion: number;
};

export type AuthenticationResult =
  | { ok: true; admin: AuthenticatedAdmin }
  | { ok: false; reason: "invalid_credentials" | "rate_limited" };

export async function authenticateAdmin(
  db: PrismaClient,
  rawCredentials: unknown,
  clientIp: string,
): Promise<AuthenticationResult> {
  const parsed = credentialsSchema.safeParse(rawCredentials);
  const ipKey = loginRateLimitKey(clientIp);

  // Phase 7c, answer 3: only the connection that keeps failing is blocked;
  // nobody can lock the parents out just by knowing their email.
  const ipLimit = await consumeRateLimit(db, ipKey, LOGIN_RATE_LIMIT);
  if (!ipLimit.allowed) return { ok: false, reason: "rate_limited" };
  if (!parsed.success) return { ok: false, reason: "invalid_credentials" };

  const user = await findAdminUserByEmail(db, parsed.data.email);
  const passwordMatches = await verifyPassword(
    user?.passwordHash ?? (await getDummyPasswordHash()),
    parsed.data.password,
  );
  if (!user || !passwordMatches)
    return { ok: false, reason: "invalid_credentials" };

  await resetRateLimit(db, ipKey);
  return {
    ok: true,
    admin: {
      id: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion,
    },
  };
}
