/**
 * Light HTTP load test (phase 7): many guests opening their invitation and the
 * gift list at the same time. Only against a LOCAL server, never production.
 *
 * Usage: npm run load:http -- <invitation-token> [requests=600] [concurrency=50]
 * The server must be running (e.g. `npm run build && npm start`) at LOAD_BASE_URL
 * (default http://localhost:3000).
 */
const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_REQUESTS = 600;
const DEFAULT_CONCURRENCY = 50;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const PERCENT = 100;

function readArgs() {
  const [token, requests, concurrency] = process.argv.slice(2);
  if (!token || !/^[A-Za-z0-9_-]{20,}$/.test(token))
    throw new Error(
      "Usage: npm run load:http -- <invitation-token> [requests] [concurrency]",
    );
  const baseUrl = new URL(process.env["LOAD_BASE_URL"] ?? DEFAULT_BASE_URL);
  // Safety: hammering the real site would cost the parents' Vercel/Neon quota.
  if (!LOCAL_HOSTS.has(baseUrl.hostname))
    throw new Error(`Only local servers are allowed, got ${baseUrl.hostname}.`);
  return {
    baseUrl: baseUrl.origin,
    token,
    requests: Number(requests ?? DEFAULT_REQUESTS),
    concurrency: Number(concurrency ?? DEFAULT_CONCURRENCY),
  };
}

const percentile = (sorted: number[], p: number) =>
  sorted[
    Math.min(sorted.length - 1, Math.floor((sorted.length * p) / PERCENT))
  ] ?? 0;

async function main(): Promise<void> {
  const { baseUrl, token, requests, concurrency } = readArgs();
  const paths = [`/i/${token}`, `/i/${token}/regalos`, "/"];
  const timings: number[] = [];
  const statuses = new Map<string, number>();
  let next = 0;

  async function worker() {
    while (next < requests) {
      const path = paths[next++ % paths.length]!;
      const started = performance.now();
      let status: string;
      try {
        const response = await fetch(baseUrl + path);
        await response.arrayBuffer();
        status = String(response.status);
      } catch {
        status = "network error";
      }
      timings.push(performance.now() - started);
      statuses.set(status, (statuses.get(status) ?? 0) + 1);
    }
  }

  const started = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const seconds = (performance.now() - started) / 1000;
  const sorted = [...timings].sort((a, b) => a - b);
  const ms = (value: number) => `${Math.round(value)} ms`;

  process.stdout.write(
    [
      `${requests} pedidos, ${concurrency} a la vez, en ${seconds.toFixed(1)} s (${Math.round(requests / seconds)}/s)`,
      `Respuestas: ${[...statuses].map(([s, n]) => `${s} × ${n}`).join(", ")}`,
      `Tiempos: mediana ${ms(percentile(sorted, 50))}, p95 ${ms(percentile(sorted, 95))}, máximo ${ms(sorted.at(-1) ?? 0)}`,
      "",
    ].join("\n"),
  );
  if ([...statuses.keys()].some((s) => s !== "200")) process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
