import { hash, verify } from "@node-rs/argon2";

// OWASP-recommended argon2id parameters (m=19 MiB, t=2, p=1).
// argon2id is the library default algorithm.
const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, ARGON2_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  plainPassword: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, plainPassword);
  } catch {
    // A malformed hash must never be treated as a match.
    return false;
  }
}

let dummyHashPromise: Promise<string> | undefined;

/**
 * Verifying against this hash when an account does not exist keeps response
 * times similar, so attackers cannot discover which emails are registered.
 */
export function getDummyPasswordHash(): Promise<string> {
  dummyHashPromise ??= hashPassword("dummy-password-for-timing-equalization");
  return dummyHashPromise;
}
