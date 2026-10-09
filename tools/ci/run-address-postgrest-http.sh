#!/usr/bin/env bash
# Disposable GitHub Actions PostgreSQL + PostgREST REST/JWT integration.
# Requires the combined #658 then #657 fixture/migrations already applied.
set -euo pipefail
if [[ "${PGHOST:-}" != "localhost" || "${PGDATABASE:-}" != "postgres" || "${PGPORT:-}" != "5432" ]]; then
  echo "FATAL: refusing PostgREST probe outside ephemeral local PostgreSQL" >&2
  exit 1
fi

# Credentials are random per CI run, never shared with Supabase environments.
auth_password="$(openssl rand -hex 24)"
jwt_secret="$(openssl rand -hex 32)"

psql -X -v ON_ERROR_STOP=1 -v pgrst_password="${auth_password}" <<'SQL'
CREATE ROLE authenticator LOGIN PASSWORD :'pgrst_password';
GRANT anon, authenticated TO authenticator;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
SQL

container_name="acheguese-address-postgrest-ci"
cleanup() { docker rm -f "${container_name}" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run --pull=always --rm -d --name "${container_name}" --network host \
  -e "PGRST_DB_URI=postgres://authenticator:${auth_password}@localhost:5432/postgres" \
  -e "PGRST_DB_SCHEMAS=public" \
  -e "PGRST_DB_ANON_ROLE=anon" \
  -e "PGRST_JWT_SECRET=${jwt_secret}" \
  -e "PGRST_DB_CHANNEL_ENABLED=false" \
  -e "PGRST_SERVER_PORT=3000" \
  postgrest/postgrest:v14.13 > /dev/null

ready=false
for attempt in $(seq 1 40); do
  if curl --silent --fail --output /dev/null http://localhost:3000/; then
    ready=true
    break
  fi
  sleep 1
done
if [[ "${ready}" != "true" ]]; then
  docker logs "${container_name}" >&2
  echo "FATAL: ephemeral PostgREST did not become healthy" >&2
  exit 1
fi
POSTGREST_TEST_JWT_SECRET="${jwt_secret}" node tools/ci/assert-address-postgrest-http.mjs
