import {
  createAnonClient,
  loadSupabaseScriptEnv,
} from "../supabase/supabase-client.mjs";

const envFiles = [".env.local", ".env.e2e.network", ".env.remote", ".env.test", ".env"];
loadSupabaseScriptEnv(envFiles);

const createPublicClient = () => createAnonClient({ envFiles });
const failures = [];
const anonymous = createPublicClient();

const businessLegacyContact = await anonymous
  .from("business_data")
  .select("id,email")
  .limit(1);
if (!businessLegacyContact.error) {
  failures.push("anonymous business_data email projection was accepted");
}

const professionalLegacyPrivate = await anonymous
  .from("professional_data")
  .select("id,email,whatsapp,license_number,license_state")
  .limit(1);
if (!professionalLegacyPrivate.error) {
  failures.push("anonymous professional legacy private projection was accepted");
}

const professionalOwnership = await anonymous
  .from("professional_data")
  .select("id,owner_user_id,updated_by_user_id")
  .limit(1);
if (!professionalOwnership.error) {
  failures.push("anonymous professional ownership projection was accepted");
}

const publicProfessionalPrivate = await anonymous
  .from("public_professional_search")
  .select("id,owner_user_id,license_number")
  .limit(1);
if (!publicProfessionalPrivate.error) {
  failures.push("public professional view exposes private columns");
}

const businessMetadata = await anonymous
  .from("business_data")
  .select("id,metadata")
  .limit(100);
const professionalMetadata = await anonymous
  .from("professional_data")
  .select("id,metadata")
  .limit(100);

const hasContactMetadata = (rows) =>
  (rows ?? []).some((row) => {
    const metadata = row?.metadata;
    return metadata && typeof metadata === "object" &&
      ["phone", "whatsapp", "email"].some((key) =>
        Object.prototype.hasOwnProperty.call(metadata, key)
      );
  });

if (businessMetadata.error) {
  failures.push(`business metadata probe failed: ${businessMetadata.error.code}`);
} else if (hasContactMetadata(businessMetadata.data)) {
  failures.push("business metadata still contains contact keys");
}
if (professionalMetadata.error) {
  failures.push(`professional metadata probe failed: ${professionalMetadata.error.code}`);
} else if (hasContactMetadata(professionalMetadata.data)) {
  failures.push("professional metadata still contains contact keys");
}

const anonymousContactBroker = await anonymous.functions.invoke("contact-rpc", {
  body: { action: "getVisible", params: { businessIds: [] } },
});
if (!anonymousContactBroker.error && !anonymousContactBroker.data?.error) {
  failures.push("anonymous contact broker request was accepted");
}

const anonymousCredentialsBroker = await anonymous.functions.invoke(
  "professional-credentials-rpc",
  { body: { action: "getOwned", params: {} } },
);
if (!anonymousCredentialsBroker.error && !anonymousCredentialsBroker.data?.error) {
  failures.push("anonymous professional credentials request was accepted");
}

let snapshotChecked = false;
const businessRouteCandidate = await anonymous
  .from("business_data")
  .select("slug,location:locations!location_id(geographic_path)")
  .eq("status", "active")
  .not("slug", "is", null)
  .limit(10);

if (!businessRouteCandidate.error) {
  for (const candidate of businessRouteCandidate.data ?? []) {
    const path = candidate.location?.geographic_path;
    const parts = typeof path === "string" ? path.split("/").filter(Boolean) : [];
    if (parts.length < 4 || !candidate.slug) continue;

    const snapshot = await anonymous.rpc("get_public_business_snapshot_by_slug", {
      p_state: parts[1],
      p_city: parts[2],
      p_district: parts[3],
      p_slug: candidate.slug,
    });
    if (snapshot.error || !snapshot.data) continue;

    snapshotChecked = true;
    const institutional = snapshot.data?.institutional ?? {};
    const business = institutional?.business ?? {};
    const leaked = [
      institutional.phone,
      institutional.whatsapp,
      institutional.email,
      business.phone,
      business.whatsapp,
      business.email,
    ].some((value) => typeof value === "string" && value.trim().length > 0);
    if (leaked) failures.push("anonymous business snapshot exposed contact values");
    break;
  }
}

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
let authenticatedChecked = false;
let authenticatedContactBrokerChecked = false;
let credentialsBrokerChecked = false;

if (email && password) {
  const authenticated = createPublicClient();
  const signIn = await authenticated.auth.signInWithPassword({ email, password });
  if (signIn.error) {
    failures.push(`authenticated probe sign-in failed: ${signIn.error.status ?? "unknown"}`);
  } else {
    authenticatedChecked = true;

    const businessIds = await authenticated
      .from("business_data")
      .select("id")
      .eq("status", "active")
      .limit(1);
    const businessId = businessIds.data?.[0]?.id;
    if (businessId) {
      const contact = await authenticated.functions.invoke("contact-rpc", {
        body: { action: "getVisible", params: { businessIds: [businessId] } },
      });
      if (contact.error || contact.data?.error || !Array.isArray(contact.data?.data)) {
        failures.push("authenticated contact broker failed");
      } else {
        authenticatedContactBrokerChecked = true;
      }
    }

    const accessible = await authenticated.functions.invoke("profile-rpc", {
      body: {
        action: "getAccessibleProfiles",
        params: { targetUserId: signIn.data.user.id },
      },
    });
    const professionalProfile = Array.isArray(accessible.data?.data)
      ? accessible.data.data.find((profile) => profile?.profile_type === "professional")
      : null;
    if (professionalProfile?.id) {
      const credentials = await authenticated.functions.invoke(
        "professional-credentials-rpc",
        {
          body: {
            action: "getOwned",
            params: { profileId: professionalProfile.id },
          },
        },
      );
      if (credentials.error || credentials.data?.error) {
        failures.push("authorized professional credentials broker failed");
      } else {
        credentialsBrokerChecked = true;
      }
    }

    await authenticated.auth.signOut();
  }
}

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      checks: {
        businessLegacyContactRejected: Boolean(businessLegacyContact.error),
        professionalLegacyPrivateRejected: Boolean(professionalLegacyPrivate.error),
        professionalOwnershipRejected: Boolean(professionalOwnership.error),
        publicProfessionalPrivateRejected: Boolean(publicProfessionalPrivate.error),
        businessMetadataSafe: !businessMetadata.error && !hasContactMetadata(businessMetadata.data),
        professionalMetadataSafe:
          !professionalMetadata.error && !hasContactMetadata(professionalMetadata.data),
        anonymousContactBrokerRejected:
          Boolean(anonymousContactBroker.error || anonymousContactBroker.data?.error),
        anonymousCredentialsBrokerRejected:
          Boolean(anonymousCredentialsBroker.error || anonymousCredentialsBroker.data?.error),
        snapshotChecked,
        authenticatedContactBrokerChecked:
          !authenticatedChecked || authenticatedContactBrokerChecked,
        credentialsBrokerChecked: !authenticatedChecked || credentialsBrokerChecked,
      },
      failures,
    },
    null,
    2,
  ),
);

if (failures.length > 0) process.exitCode = 1;
