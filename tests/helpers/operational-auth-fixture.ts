import type { User } from "@supabase/supabase-js";
import { TERMS_OF_SERVICE_VERSION } from "../../src/core/legal/termsOfService";
import type { OperationalSupabaseClient } from "./operational-env";

interface ConfirmedOperationalUserInput {
  alphaAccessMode?: "invite" | "operational";
  email: string;
  handle: string;
  name: string;
  password: string;
  userMetadata?: Record<string, unknown>;
}

interface ActiveProfileBrokerResponse {
  data?: {
    profile?: {
      id?: string;
    } | null;
  };
  error?: string;
}

export async function createConfirmedOperationalUser(
  admin: OperationalSupabaseClient,
  input: ConfirmedOperationalUserInput,
): Promise<User> {
  const issuesOwnInvite = input.alphaAccessMode !== "invite";
  if (issuesOwnInvite) {
    const issued = await admin.rpc("alpha_access_issue_invite", {
      p_email: input.email,
      p_note: "operational_test",
    });
    if (issued.error) throw issued.error;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      display_name: input.name,
      handle: input.handle,
      name: input.name,
      terms_accepted: true,
      terms_version: TERMS_OF_SERVICE_VERSION,
      ...input.userMetadata,
    },
  });

  if (error || !data.user) {
    if (issuesOwnInvite) {
      await admin.rpc("alpha_access_delete_operational_invite", {
        p_email: input.email,
      });
    }
    throw error ?? new Error("Falha ao criar usuario operacional confirmado.");
  }

  return data.user;
}

export async function deleteOperationalUser(
  admin: OperationalSupabaseClient,
  userId: string,
): Promise<void> {
  const lookup = await admin.auth.admin.getUserById(userId);
  if (lookup.error) throw lookup.error;

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;

  if (lookup.data.user?.email) {
    const inviteCleanup = await admin.rpc(
      "alpha_access_delete_operational_invite",
      { p_email: lookup.data.user.email },
    );
    if (inviteCleanup.error) throw inviteCleanup.error;
  }
}

export async function deleteOperationalUserWithOwnedProfiles(
  admin: OperationalSupabaseClient,
  userId: string,
): Promise<void> {
  const profileDelete = await admin
    .from("profiles")
    .delete()
    .eq("user_id", userId);
  if (profileDelete.error) throw profileDelete.error;

  await deleteOperationalUser(admin, userId);
}

export async function getOperationalActiveProfileId(
  client: OperationalSupabaseClient,
): Promise<string> {
  const { data, error } =
    await client.functions.invoke<ActiveProfileBrokerResponse>("session-rpc", {
      body: { action: "getActiveProfile", params: {} },
    });
  const profileId = data?.data?.profile?.id;

  if (error || data?.error || !profileId) {
    throw (
      error ??
      new Error(
        data?.error ?? "O session-rpc nao retornou o perfil ativo operacional.",
      )
    );
  }

  return profileId;
}
