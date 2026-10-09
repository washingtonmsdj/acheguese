// HTTP/PostgREST integration: never connect to production. Only ephemeral CI.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

const endpoint = "http://localhost:3000";
const secret = process.env.POSTGREST_TEST_JWT_SECRET;
assert.ok(secret && secret.length >= 32, "Missing ephemeral JWT signing key");

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const ADDR_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const RES_A = "cccccccc-cccc-4ccc-8ccc-ccccccccccc1";

const base64Url = (input) => Buffer.from(input).toString("base64url");
function issueFixtureToken(userId) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    sub: userId, role: "authenticated",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 180,
  }));
  const signature = createHmac("sha256", secret)
    .update(`${header}.${claims}`).digest("base64url");
  return `${header}.${claims}.${signature}`;
}

const owner = issueFixtureToken(A);
const outsider = issueFixtureToken(B);
async function request(path, { token, method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(endpoint + path, {
    method, headers, body: body && JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}
function successful(result, label) {
  assert.equal(result.status, 200,
    `${label}: HTTP ${result.status} ${JSON.stringify(result.data).slice(0,300)}`);
  return result.data;
}
function patched(result, label) {
  assert.ok([200, 204].includes(result.status),
    `${label}: HTTP ${result.status} ${JSON.stringify(result.data).slice(0,300)}`);
}
function denied(result, label) {
  assert.ok([400, 401, 403].includes(result.status),
    `${label}: unexpectedly returned HTTP ${result.status} ${JSON.stringify(result.data).slice(0,300)}`);
}

const anonPhysical = successful(
  await request("/addresses?select=id,street,number,postal_code"),
  "anonymous private address read",
);
assert.deepEqual(anonPhysical, [], "RLS must hide physical rows from anonymous role");

const publicAddresses = successful(
  await request("/addresses_public?select=id,latitude,longitude,is_verified,verification_status"),
  "verified-only public projection",
);
assert.equal(publicAddresses.length, 2);
assert.ok(publicAddresses.some(a => a.id === "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee6"),
  "active business with no residential owner remains published");
assert.ok(publicAddresses.every(a => a.is_verified === true && a.verification_status === "verified"));
assert.ok(!publicAddresses.some(a => a.id.startsWith("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee")));
assert.ok(!publicAddresses.some(a => a.id === "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2"),
  "verified private address must not be published without a public entity");
denied(
  await request("/addresses_public?select=street"),
  "forbidden private column in public view",
);

const ownerRows = successful(
  await request(`/addresses?id=eq.${ADDR_A}&select=id,street`, { token: owner }),
  "owner private address read",
);
assert.equal(ownerRows.length, 1);
assert.equal(ownerRows[0].street, "Fixture rua alterada");

const otherRows = successful(
  await request(`/addresses?id=eq.${ADDR_A}&select=id,street`, { token: outsider }),
  "another user's private address read",
);
assert.deepEqual(otherRows, [], "Owner-only RLS must deny other JWTs");

denied(
  await request("/addresses?select=id", { token: owner + "invalid" }),
  "bad JWT signature",
);

const businessRows = successful(
  await request("/public_business_search?select=id,address:addresses!address_id(id,street)"),
  "business FK join without physical address read",
);
assert.equal(businessRows.length, 3);
assert.ok(businessRows.every(row => row.address === null),
  "Public Business FK embedding must not expose private physical addresses");

const professionals = successful(
  await request("/public_professional_search?select=slug,latitude,longitude"),
  "professional map public coordinates",
);
const valid = professionals.find(x => x.slug === "fixture-valid");
const ambiguous = professionals.find(x => x.slug === "fixture-ambiguous");
assert.ok(valid && ambiguous);
assert.equal(Number(valid.latitude), -12.98);
assert.equal(Number(valid.longitude), -38.51);
assert.equal(ambiguous.latitude, null);
assert.equal(ambiguous.longitude, null);
const forgedAssociation = professionals.find(x => x.slug === "fixture-foreign");
assert.ok(forgedAssociation, "public professional link is present for negative permission test");
assert.equal(forgedAssociation.latitude, null);
assert.equal(forgedAssociation.longitude, null);
const hidden = professionals.find(x => x.slug === "fixture-private");
assert.equal(hidden, undefined, "private professional listing must not appear publicly");

denied(
  await request(`/addresses?id=eq.${ADDR_A}`, {
    token: owner, method: "PATCH", body: { is_verified: true },
  }),
  "direct self-verification over HTTP",
);

patched(
  await request(`/addresses?id=eq.${ADDR_A}`, {
    token: owner, method: "PATCH", body: { street: "HTTP fixture updated" },
  }),
  "owner postal edit over HTTP",
);
const updated = successful(
  await request(`/addresses?id=eq.${ADDR_A}&select=id,street,is_verified,verification_status`, { token: owner }),
  "read after owner postal edit",
);
assert.equal(updated.length, 1);
assert.equal(updated[0].street, "HTTP fixture updated");
assert.equal(updated[0].is_verified, false);
assert.equal(updated[0].verification_status, "pending");

const residences = successful(
  await request(`/user_residences?id=eq.${RES_A}&select=is_verified,verification_requested_at`, { token: owner }),
  "linked residence after owner edit",
);
assert.equal(residences.length, 1);
assert.equal(residences[0].is_verified, false);
assert.equal(residences[0].verification_requested_at, null);

const after = successful(
  await request("/addresses_public?select=id,is_verified,verification_status"),
  "public projection after owner edit",
);
assert.equal(after.length, 1);
assert.equal(after[0].id, "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee6");
assert.ok(!after.some(x => x.id === ADDR_A));

patched(
  await request(`/addresses?id=eq.${ADDR_A}`, {
    token: outsider, method: "PATCH", body: { street: "Should be blocked" },
  }),
  "RLS update with foreign JWT returns no changes",
);
const preserved = successful(
  await request(`/addresses?id=eq.${ADDR_A}&select=street`, { token: owner }),
  "foreign edit did not affect owned row",
);
assert.equal(preserved[0]?.street, "HTTP fixture updated");

console.log("PASS: PostgREST JWT owner/outsider/anon, private residential coords, Business FK, public projection and revocation triggers");
