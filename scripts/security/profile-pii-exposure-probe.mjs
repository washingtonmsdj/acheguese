import {
  createAnonClient,
  loadSupabaseScriptEnv,
} from "../lib/supabase-client.mjs";

const envFiles = [".env.local", ".env.e2e.network", ".env.remote", ".env.test", ".env"];
loadSupabaseScriptEnv(envFiles);

const createPublicClient = () => createAnonClient({ envFiles });

const failures = [];
const anonymous = createPublicClient();

const anonymousPii = await anonymous
  .from("profiles")
  .select("id,phone,whatsapp,contact_email,street")
  .limit(1);
if (!anonymousPii.error) failures.push("anonymous profiles PII projection was accepted");

const safeProfiles = await anonymous
  .from("public_profiles")
  .select("id,display_name,avatar_url")
  .limit(1);
if (safeProfiles.error) failures.push(`public profile projection failed: ${safeProfiles.error.code}`);

let publicTerritoryBoundaryChecked = false;
const publicProfileId = safeProfiles.data?.[0]?.id;
if (publicProfileId) {
  const publicTerritory = await anonymous.rpc("profile_public_territory_projection", {
    p_profile_id: publicProfileId,
  });
  if (publicTerritory.error) {
    failures.push(`public territory boundary failed: ${publicTerritory.error.code}`);
  } else {
    publicTerritoryBoundaryChecked = true;
  }
}

const publicProfilePii = await anonymous.from("public_profiles").select("id,phone").limit(1);
if (!publicProfilePii.error) failures.push("public_profiles unexpectedly exposes phone");

const anonymousRawLocation = await anonymous
  .from("profiles")
  .select("id,location_id,main_territory_location_id")
  .limit(1);
if (!anonymousRawLocation.error) failures.push("anonymous raw profile location was accepted");

const hiddenLocationProjection = await anonymous
  .from("public_profiles")
  .select("id,location_id,city,neighborhood,public_city,public_neighborhood,state")
  .eq("public_location_visibility", "hidden")
  .limit(100);
const hiddenLocationLeak = (hiddenLocationProjection.data ?? []).some((profile) =>
  [
    profile.location_id,
    profile.city,
    profile.neighborhood,
    profile.public_city,
    profile.public_neighborhood,
    profile.state,
  ].some((value) => value !== null),
);
if (hiddenLocationProjection.error) {
  failures.push(`public location projection failed: ${hiddenLocationProjection.error.code}`);
} else if (hiddenLocationLeak) {
  failures.push("hidden public profile exposed residence-derived territory");
}

const safeClassifieds = await anonymous
  .from("classifieds")
  .select("id,seller:profiles!seller_id(id,name,avatar_url)")
  .limit(1);
if (safeClassifieds.error) failures.push(`safe classified seller projection failed: ${safeClassifieds.error.code}`);

const classifiedPii = await anonymous
  .from("classifieds")
  .select("id,seller:profiles!seller_id(id,phone,whatsapp)")
  .limit(1);
if (!classifiedPii.error) failures.push("classified relation unexpectedly exposes seller contact");

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
let authenticatedChecked = false;
let authenticatedPiiRejected = false;
let brokerChecked = false;
let accessibleProfilesChecked = false;
let unboundedBrokerRejected = false;
let authenticatedRawLocationRejected = false;

if (email && password) {
  const authenticated = createPublicClient();
  const signIn = await authenticated.auth.signInWithPassword({ email, password });
  if (signIn.error) {
    failures.push(`authenticated probe sign-in failed: ${signIn.error.status ?? "unknown"}`);
  } else {
    authenticatedChecked = true;
    const authenticatedPii = await authenticated
      .from("profiles")
      .select("id,phone,whatsapp,contact_email,street")
      .limit(1);
    authenticatedPiiRejected = Boolean(authenticatedPii.error);
    if (!authenticatedPii.error) failures.push("authenticated profiles PII projection was accepted");

    const authenticatedRawLocation = await authenticated
      .from("profiles")
      .select("id,location_id,main_territory_location_id")
      .limit(1);
    authenticatedRawLocationRejected = Boolean(authenticatedRawLocation.error);
    if (!authenticatedRawLocation.error) {
      failures.push("authenticated raw profile location was accepted");
    }

    const unbounded = await authenticated.functions.invoke("profile-rpc", {
      body: { action: "getAccessibleProfiles", params: {} },
    });
    unboundedBrokerRejected = Boolean(unbounded.error || unbounded.data?.error);
    if (!unboundedBrokerRejected) failures.push("unbounded private profile broker request was accepted");

    const ownProfiles = await authenticated
      .from("profiles")
      .select("id")
      .eq("user_id", signIn.data.user.id)
      .limit(1);
    const profileId = ownProfiles.data?.[0]?.id;
    if (profileId) {
      const accessible = await authenticated.functions.invoke("profile-rpc", {
        body: {
          action: "getAccessibleProfiles",
          params: { profileIds: [profileId], targetUserId: signIn.data.user.id },
        },
      });
      const accessibleRows = accessible.data?.data;
      if (
        accessible.error ||
        accessible.data?.error ||
        !Array.isArray(accessibleRows) ||
        accessibleRows.length !== 1 ||
        accessibleRows[0]?.id !== profileId
      ) {
        failures.push("authorized private profile broker failed");
      } else {
        accessibleProfilesChecked = true;
      }

      const contact = await authenticated.functions.invoke("profile-rpc", {
        body: { action: "getVisibleContact", params: { profileId } },
      });
      if (contact.error || contact.data?.error) {
        failures.push("authorized profile contact broker failed");
      } else {
        brokerChecked = true;
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
        anonymousPiiRejected: Boolean(anonymousPii.error),
        authenticatedPiiRejected: !authenticatedChecked || authenticatedPiiRejected,
        publicProjectionSafe: !safeProfiles.error && Boolean(publicProfilePii.error),
        publicTerritoryBoundaryChecked,
        anonymousRawLocationRejected: Boolean(anonymousRawLocation.error),
        authenticatedRawLocationRejected:
          !authenticatedChecked || authenticatedRawLocationRejected,
        hiddenLocationProjectionSafe:
          !hiddenLocationProjection.error && !hiddenLocationLeak,
        classifiedContactRejected: Boolean(classifiedPii.error),
        accessibleProfilesChecked,
        unboundedBrokerRejected,
        authorizedBrokerChecked: brokerChecked,
      },
      failures,
    },
    null,
    2,
  ),
);

if (failures.length > 0) process.exitCode = 1;
