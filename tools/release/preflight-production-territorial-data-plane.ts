const TERRITORIAL_TABLES = ["locations", "territorial_groups"] as const;

type TerritorialTable = (typeof TERRITORIAL_TABLES)[number];
type FetchLike = typeof fetch;

export interface TerritorialDataPlaneProbeOptions {
  supabaseUrl: string;
  publishableKey: string;
  fetchImpl?: FetchLike;
  rounds?: number;
  delayMs?: number;
  timeoutMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
}

export interface TerritorialProbeResult {
  round: number;
  table: TerritorialTable;
  durationMs: number;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Production territorial data-plane preflight requires ${label}.`);
  }
  return normalized;
}

function buildEndpoint(supabaseUrl: string, table: TerritorialTable): URL {
  const base = required(supabaseUrl, "E2E_SUPABASE_URL").replace(/\/+$/, "");
  const url = new URL(`${base}/rest/v1/${table}`);
  url.searchParams.set("select", "id");
  url.searchParams.set("status", "eq.active");
  url.searchParams.set("limit", "1");
  return url;
}

async function probeTable({
  round,
  table,
  supabaseUrl,
  publishableKey,
  fetchImpl,
  timeoutMs,
}: {
  round: number;
  table: TerritorialTable;
  supabaseUrl: string;
  publishableKey: string;
  fetchImpl: FetchLike;
  timeoutMs: number;
}): Promise<TerritorialProbeResult> {
  const startedAt = Date.now();
  let response: Response;

  try {
    response = await fetchImpl(buildEndpoint(supabaseUrl, table), {
      method: "GET",
      headers: {
        Accept: "application/json",
        apikey: publishableKey,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[territorial-data-plane] round=${round} table=${table} request failed: ${message}`,
    );
  }

  const durationMs = Date.now() - startedAt;
  if (response.status !== 200) {
    throw new Error(
      `[territorial-data-plane] round=${round} table=${table} HTTP ${response.status} after ${durationMs}ms`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      `[territorial-data-plane] round=${round} table=${table} returned invalid JSON`,
    );
  }

  if (!Array.isArray(payload) || payload.length < 1) {
    throw new Error(
      `[territorial-data-plane] round=${round} table=${table} returned no active row`,
    );
  }

  return { round, table, durationMs };
}

export async function probeProductionTerritorialDataPlane(
  options: TerritorialDataPlaneProbeOptions,
): Promise<TerritorialProbeResult[]> {
  const supabaseUrl = required(options.supabaseUrl, "E2E_SUPABASE_URL");
  const publishableKey = required(
    options.publishableKey,
    "E2E_SUPABASE_PUBLISHABLE_KEY",
  );
  const fetchImpl = options.fetchImpl ?? fetch;
  const rounds = options.rounds ?? 3;
  const delayMs = options.delayMs ?? 1_000;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 5) {
    throw new Error(
      "Production territorial data-plane rounds must be an integer from 1 to 5.",
    );
  }
  if (!Number.isFinite(delayMs) || delayMs < 0 || delayMs > 5_000) {
    throw new Error(
      "Production territorial data-plane delayMs must be between 0 and 5000.",
    );
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 30_000) {
    throw new Error(
      "Production territorial data-plane timeoutMs must be between 1000 and 30000.",
    );
  }

  const results: TerritorialProbeResult[] = [];
  for (let round = 1; round <= rounds; round += 1) {
    const roundResults = await Promise.all(
      TERRITORIAL_TABLES.map((table) =>
        probeTable({
          round,
          table,
          supabaseUrl,
          publishableKey,
          fetchImpl,
          timeoutMs,
        }),
      ),
    );
    results.push(...roundResults);

    if (round < rounds && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return results;
}

function requiredEnv(name: string): string {
  return required(process.env[name] ?? "", name);
}

export async function runProductionTerritorialDataPlanePreflight(): Promise<void> {
  const results = await probeProductionTerritorialDataPlane({
    supabaseUrl: requiredEnv("E2E_SUPABASE_URL"),
    publishableKey: requiredEnv("E2E_SUPABASE_PUBLISHABLE_KEY"),
  });

  for (const result of results) {
    process.stdout.write(
      `[territorial-data-plane] round=${result.round} table=${result.table} status=200 durationMs=${result.durationMs}\n`,
    );
  }
  process.stdout.write(
    `[territorial-data-plane] passed ${results.length} bounded read-only probes with no fallback.\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionTerritorialDataPlanePreflight().catch((error) => {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`[territorial-data-plane] ${message}`);
    process.exitCode = 1;
  });
}
