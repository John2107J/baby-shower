export type LogLevel = "debug" | "info" | "warn" | "error";

type LogValue = string | number | boolean | null | undefined;
export type LogContext = Readonly<Record<string, LogValue>>;

export const REDACTED = "[REDACTED]";

// Keys whose values must never reach the logs (secrets and personal data).
const SENSITIVE_KEY_PATTERN =
  /token|password|secret|authorization|cookie|cbu|alias|name|email|phone|amount|address/i;

// Technical keys that look sensitive to the pattern above but only carry the
// class name of an error (e.g. "BlobAccessError"), never user data.
const TECHNICAL_KEYS: ReadonlySet<string> = new Set(["errorName"]);

export function redact(context: LogContext): Record<string, LogValue> {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      !TECHNICAL_KEYS.has(key) && SENSITIVE_KEY_PATTERN.test(key)
        ? REDACTED
        : value,
    ]),
  );
}

export function formatLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext = {},
  now: Date = new Date(),
): string {
  return JSON.stringify({
    time: now.toISOString(),
    level,
    message,
    ...redact(context),
  });
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  const entry = formatLogEntry(level, message, context);
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    write("debug", message, context),
  info: (message: string, context?: LogContext) =>
    write("info", message, context),
  warn: (message: string, context?: LogContext) =>
    write("warn", message, context),
  error: (message: string, context?: LogContext) =>
    write("error", message, context),
};
