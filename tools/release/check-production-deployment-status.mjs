const DEFAULT_STATUS_CONTEXT = "Vercel";

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(name + " is required to verify production deployment status.");
  }
  return value;
}

const repository = requireEnv("GITHUB_REPOSITORY");
const sha = requireEnv("GITHUB_SHA");
const token = requireEnv("GITHUB_TOKEN");
const statusContext =
  process.env.RELEASE_DEPLOYMENT_STATUS_CONTEXT?.trim() || DEFAULT_STATUS_CONTEXT;
const apiOrigin = (process.env.GITHUB_API_URL?.trim() || "https://api.github.com").replace(
  /\/+$/,
  "",
);
const statusUrl = new URL(
  apiOrigin + "/repos/" + repository + "/commits/" + sha + "/status",
);

if (statusUrl.protocol !== "https:") {
  throw new Error("GitHub API URL must use HTTPS.");
}

const response = await fetch(statusUrl, {
  headers: {
    accept: "application/vnd.github+json",
    authorization: "Bearer " + token,
    "x-github-api-version": "2022-11-28",
  },
  cache: "no-store",
  redirect: "error",
});

if (!response.ok) {
  throw new Error(
    "Could not read deployment status for " +
      sha +
      ": GitHub API returned HTTP " +
      response.status +
      ".",
  );
}

const payload = await response.json();
const statuses = Array.isArray(payload?.statuses) ? payload.statuses : [];
const providerStatus = statuses.find(
  (status) => status?.context === statusContext,
);

if (!providerStatus) {
  console.log(
    "[release-deployment] no " +
      statusContext +
      " commit status yet; release identity polling remains authoritative.",
  );
  process.exit(0);
}

const state = String(providerStatus.state ?? "unknown");
const description = String(providerStatus.description ?? "no description");
console.log(
  "[release-deployment] " +
    statusContext +
    " status=" +
    state +
    " description=" +
    description,
);

if (state === "failure" || state === "error") {
  throw new Error(
    "Production deployment provider rejected commit " +
      sha +
      " (" +
      statusContext +
      "): " +
      description,
  );
}
