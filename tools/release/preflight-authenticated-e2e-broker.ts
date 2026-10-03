import {
  resolveGithubOidcEnvironment,
  signInFixtureViaGithubOidcBroker,
} from "../../tests/e2e/helpers/fixtureAuthGithubOidcBroker";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`Authenticated E2E broker preflight requires ${name}.`);
  }
  return value;
}

export async function runAuthenticatedE2EBrokerPreflight(): Promise<void> {
  const oidcEnv = resolveGithubOidcEnvironment();
  if (!oidcEnv) {
    throw new Error(
      "Authenticated E2E broker preflight requires GitHub Actions OIDC identity.",
    );
  }

  await signInFixtureViaGithubOidcBroker({
    supabaseUrl: requiredEnv("E2E_SUPABASE_URL"),
    email: requiredEnv("E2E_USER_EMAIL"),
    password: requiredEnv("E2E_USER_PASSWORD"),
    ...oidcEnv,
  });

  process.stdout.write(
    `[auth-broker-preflight] fixture broker accepted exact SHA ${oidcEnv.expectedSha}.\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthenticatedE2EBrokerPreflight().catch((error) => {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`[auth-broker-preflight] ${message}`);
    process.exitCode = 1;
  });
}
