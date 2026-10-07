import { z } from "zod";

const MAX_EMAIL_LENGTH = 254;
// Upper bound protects the hashing step from huge inputs.
const MAX_PASSWORD_LENGTH = 256;

// Non-strict on purpose: Auth.js adds its own fields (csrfToken, callbackUrl), which are stripped.
export const credentialsSchema = z.object({
  // Trim and lowercase before validating, so "  Padres@Example.com " is accepted.
  email: z.string().trim().toLowerCase().pipe(z.email().max(MAX_EMAIL_LENGTH)),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
