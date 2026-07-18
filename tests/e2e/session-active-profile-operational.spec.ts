import { expect, test } from "@playwright/test";

import { login } from "../../e2e/helpers/auth";
import {
  createConfirmedOperationalUser,
  deleteOperationalUserWithOwnedProfiles,
} from "../helpers/operational-auth-fixture";
import {
  createOptionalOperationalAdminClient,
  hasOperationalAdminEnv,
  hasOperationalAnonEnv,
} from "../helpers/operational-env";

const admin = createOptionalOperationalAdminClient();

test.describe("active profile session e2e", () => {
  test.skip(
    !admin || !hasOperationalAdminEnv() || !hasOperationalAnonEnv(),
    "Credenciais operacionais do Supabase nao configuradas.",
  );

  test("initializes the canonical active profile after login", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `session-profile-${suffix}@example.com`;
    const password = "SessionProfile@2026!";
    const user = await createConfirmedOperationalUser(admin!, {
      email,
      password,
      name: "Perfil de Sessao E2E",
      handle: `sessionprofile${suffix}`,
      userMetadata: { e2e_fixture: "active-profile-session" },
    });

    try {
      const { data: personalProfile, error: profileError } = await admin!
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("profile_type", "personal")
        .single();
      if (profileError) throw profileError;

      await login(page, email, password);

      await expect
        .poll(
          () =>
            page.evaluate(() =>
              window.localStorage.getItem("active_profile_id"),
            ),
          {
            message: "Perfil ativo canonico nao inicializado apos o login.",
            timeout: 30_000,
          },
        )
        .toBe(personalProfile.id);
    } finally {
      await deleteOperationalUserWithOwnedProfiles(admin!, user.id);
    }
  });
});
