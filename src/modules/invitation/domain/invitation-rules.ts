import { randomBytes } from "node:crypto";

export const MIN_GUEST_NAMES = 1;
export const MAX_GUEST_NAMES = 5;
export const MAX_GUEST_NAME_LENGTH = 60;

/** 32 random bytes = 256 bits of entropy (decision 23; CLAUDE.md requires ≥ 128). */
const TOKEN_BYTES = 32;

/** Unguessable token from Node's CSPRNG, URL-safe (base64url, 43 characters). */
export function generateInvitationToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
