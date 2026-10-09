#!/usr/bin/env bash
# Exact two-stage PostgreSQL integration for PR #658 -> PR #657.
# This runs only against the ephemeral postgres:17 service in GitHub Actions.
# Cross-PR source is resolved once; migrations remain in canonical owners.
set -euo pipefail

: "${PGHOST:?Requires an explicit ephemeral PostgreSQL target}"
: "${PGDATABASE:?Requires the ephemeral PostgreSQL database}"
if [[ "${PGHOST}" != "localhost" ]] || [[ "${PGDATABASE}" != "postgres" ]]; then
  echo "FATAL: refuse to run integration fixture outside local ephemeral PostgreSQL" >&2
  exit 1
fi

authority_migration="supabase/migrations/20261008215900_restrict_address_verification_mutations.sql"
projection_migration="supabase/migrations/20261008220000_enforce_address_private_read_projection.sql"

# After #658 lands on main, use its checked-in files. Otherwise resolve the
# canonical head of #658 from the SAME repo. Do not duplicate migration SQL.
if [[ ! -f "${authority_migration}" ]]; then
  git fetch --no-tags --depth=1 origin refs/pull/658/head
  echo "Authority source: PR #658 $(git rev-parse FETCH_HEAD)"
  for path in \
    "${authority_migration}" \
    "tests/security/fixtures/address-verification-db-setup.sql" \
    "tests/security/fixtures/address-verification-db-assert.sql" \
    "tests/security/address-verification-authenticated-probe.sql"; do
    mkdir -p "$(dirname "${path}")"
    git show "FETCH_HEAD:${path}" > "${path}"
  done
else
  echo "Authority source: canonical checkout"
fi

run_sql() {
  local script="$1"
  if [[ ! -f "${script}" ]]; then
    echo "FATAL: required SQL fixture missing: ${script}" >&2
    exit 1
  fi
  echo "::group::PostgreSQL fixture ${script}"
  psql -X -v ON_ERROR_STOP=1 -f "${script}"
  echo "::endgroup::"
}

run_sql "tests/security/fixtures/address-verification-db-setup.sql"
run_sql "${authority_migration}"
run_sql "tests/security/fixtures/address-verification-db-assert.sql"
run_sql "tests/security/fixtures/address-public-view-db-setup.sql"
run_sql "${projection_migration}"
run_sql "tests/security/fixtures/address-public-view-db-assert.sql"
