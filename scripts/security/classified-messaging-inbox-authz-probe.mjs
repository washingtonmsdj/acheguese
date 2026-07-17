import {
  createAnonClient,
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from "../lib/supabase-client.mjs";

const envFiles = [
  ".env.local",
  ".env.e2e.network",
  ".env.remote",
  ".env.test",
  ".env",
];
loadSupabaseScriptEnv(envFiles);

const credentialCandidates = [
  [process.env.E2E_USER_EMAIL, process.env.E2E_USER_PASSWORD],
  [process.env.TEST_DRIVER_EMAIL, process.env.TEST_DRIVER_PASSWORD],
  [process.env.E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD],
].filter(([email, password]) => email?.trim() && password?.trim());

if (credentialCandidates.length === 0) {
  throw new Error("At least one E2E credential pair is required");
}

const config = getSupabaseConfig({ envFiles });
if (!config.url || !config.anonKey) {
  throw new Error("Supabase URL and publishable key are required");
}

const rpcUrl = `${config.url}/rest/v1/rpc/list_classified_conversation_previews`;
const anonymousResponse = await fetch(rpcUrl, {
  method: "POST",
  headers: {
    apikey: config.anonKey,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    p_profile_id: "11111111-1111-4111-8111-111111111111",
    p_limit: 1,
  }),
});

if (anonymousResponse.status !== 401) {
  throw new Error(
    `Anonymous Classified inbox call returned ${anonymousResponse.status}`,
  );
}

const userClient = createAnonClient({ envFiles });
let activeProfileId;

try {
  for (const [rawEmail, rawPassword] of credentialCandidates) {
    const { data: authData, error: authError } =
      await userClient.auth.signInWithPassword({
        email: rawEmail.trim(),
        password: rawPassword.trim(),
      });
    if (authError || !authData.user) continue;

    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (!profileError && profile) {
      activeProfileId = profile.id;
      break;
    }
    await userClient.auth.signOut();
  }

  if (!activeProfileId) {
    throw new Error("No E2E credential owns an active Profile");
  }

  const { error: ownProfileError } = await userClient.rpc(
    "list_classified_conversation_previews",
    { p_profile_id: activeProfileId, p_limit: 1 },
  );
  if (ownProfileError) {
    throw new Error(
      `Owned Profile inbox call failed (${ownProfileError.code ?? "unknown"})`,
    );
  }

  const { error: foreignProfileError } = await userClient.rpc(
    "list_classified_conversation_previews",
    {
      p_profile_id: "11111111-1111-4111-8111-111111111111",
      p_limit: 1,
    },
  );
  if (!foreignProfileError || foreignProfileError.code !== "42501") {
    throw new Error("Foreign Profile inbox call was not denied");
  }

  console.log(
    "Classified Messaging inbox authz probe passed: anon=401 own=allowed foreign=denied",
  );
} finally {
  await userClient.auth.signOut();
}
