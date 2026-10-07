import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type AppConfig = z.infer<typeof envSchema>;

export class InvalidConfigError extends Error {
  constructor(public readonly invalidKeys: readonly string[]) {
    // Only key names are reported: values may be secrets.
    super(`Invalid environment variables: ${invalidKeys.join(", ")}`);
    this.name = "InvalidConfigError";
  }
}

export function parseConfig(
  env: Record<string, string | undefined>,
): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const keys = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ];
    throw new InvalidConfigError(keys);
  }
  return result.data;
}

export const config: AppConfig = parseConfig(process.env);
