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

# Pin the prerequisite to a reviewed immutable commit. A later edit to
# #658 must fail this dependent test until #657 explicitly reviews and
# updates the commit + blob allowlist; never trust a moving PR ref silently.
expected_authority_sha="d7b3d3d36b66997354a9d7197e0ef452051829bd"
expected_authority_blobs=(
  "dd67e4f96931a042bf19309b8ab8b8b8fd65efab"
  "e625a8fb8b263fe88b1878619a54d20fd2d1cc29"
  "b426eb36e679dd94674856fd991e04a4007b8e7e"
  "a0bbe3e333664ee8893cbd18831cd50d7c48dec1"
)
prerequisite_paths=(
  "${authority_migration}"
  "tests/security/fixtures/address-verification-db-setup.sql"
  "tests/security/fixtures/address-verification-db-assert.sql"
  "tests/security/address-verification-authenticated-probe.sql"
)

# After #658 lands on main, use its checked-in files. Otherwise resolve the
# canonical head of #658 from the SAME repo. Do not duplicate migration SQL.
if [[ ! -f "${authority_migration}" ]]; then
  git fetch --no-tags --depth=1 origin refs/pull/658/head
  fetched_sha="$(git rev-parse FETCH_HEAD)"
  if [[ "${fetched_sha}" != "${expected_authority_sha}" ]]; then
    echo "FATAL: PR #658 changed; expected ${expected_authority_sha}, got ${fetched_sha}. Review dependency before updating pin." >&2
    exit 1
  fi
  echo "Authority source: pinned PR #658 ${fetched_sha}"
  for path in "${prerequisite_paths[@]}"; do
    mkdir -p "$(dirname "${path}")"
    git show "FETCH_HEAD:${path}" > "${path}"
  done
else
  echo "Authority source: canonical checkout"
fi

# Whether from canonical main after merge or from the pinned PR, the four
# prerequisite sources must be byte-for-byte identical to the reviewed blobs.
for i in "${!prerequisite_paths[@]}"; do
  path="${prerequisite_paths[$i]}"
  if [[ ! -f "${path}" ]]; then
    echo "FATAL: missing required prerequisite source ${path}" >&2
    exit 1
  fi
  actual_blob="$(git hash-object "${path}")"
  if [[ "${actual_blob}" != "${expected_authority_blobs[$i]}" ]]; then
    echo "FATAL: prerequisite ${path} drifted (blob ${actual_blob}). Re-review and pin the new version." >&2
    exit 1
  fi
done

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
