import { z } from "zod";

const MIN_AUTH_SECRET_LENGTH = 32;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  AUTH_SECRET: z.string().min(MIN_AUTH_SECRET_LENGTH),
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

let cachedConfig: AppConfig | undefined;

// Lazy so that importing a module never fails at build time; the check runs
// on first use at runtime.
export function getConfig(): AppConfig {
  cachedConfig ??= parseConfig(process.env);
  return cachedConfig;
}
