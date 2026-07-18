import type { User } from "@supabase/supabase-js";
import { TERMS_OF_SERVICE_VERSION } from "../../src/core/legal/termsOfService";
import type { OperationalSupabaseClient } from "./operational-env";

interface ConfirmedOperationalUserInput {
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
    throw error ?? new Error("Falha ao criar usuario operacional confirmado.");
  }

  return data.user;
}

export async function deleteOperationalUser(
  admin: OperationalSupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
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
