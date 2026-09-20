import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function readWebpDimensions(path: string): { width: number; height: number } {
  const filePath = resolve(repoRoot, path);
  const data = readFileSync(filePath);

  expect(data.subarray(0, 4).toString("ascii"), `${path} must start with RIFF`).toBe(
    "RIFF",
  );
  expect(data.subarray(8, 12).toString("ascii"), `${path} must be WEBP`).toBe(
    "WEBP",
  );
  expect(
    data.readUInt32LE(4) + 8,
    `${path} RIFF length must match the checked-in blob`,
  ).toBe(data.length);

  const chunk = data.subarray(12, 16).toString("ascii");
  expect(chunk, `${path} must use a supported WebP frame`).toBe("VP8 ");

  const payload = 20;
  expect(
    Array.from(data.subarray(payload + 3, payload + 6)),
    `${path} must contain a valid VP8 keyframe`,
  ).toEqual([0x9d, 0x01, 0x2a]);

  return {
    width: data.readUInt16LE(payload + 6) & 0x3fff,
    height: data.readUInt16LE(payload + 8) & 0x3fff,
  };
}

describe("account and access concept contract", () => {
  it("keeps the mobile viewport notch-safe without disabling zoom", () => {
    const html = readProjectFile("index.html");
    const header = readProjectFile("src/app/components/auth/AuthBrandHeader.tsx");
    const footer = readProjectFile("src/app/components/auth/AuthFooter.tsx");

    expect(html).toContain(
      'content="width=device-width, initial-scale=1.0, viewport-fit=cover"',
    );
    expect(html).not.toMatch(/user-scalable\s*=\s*no/i);
    expect(html).not.toMatch(/maximum-scale\s*=\s*1/i);
    expect(header).toContain('env(safe-area-inset-top)');
    expect(header).toContain("location.pathname === AUTH_PATHS.passwordReset");
    expect(header).toContain(">Voltar</span>");
    expect(header).not.toContain("setPendingAuthReturn");
    expect(footer).toContain('env(safe-area-inset-bottom)');
  });

  it("keeps Google OAuth visible in production and wired through the real provider flow", () => {
    const productionEnv = readProjectFile(".env.production");
    const remoteEnv = readProjectFile(".env.remote.example");
    const login = readProjectFile("src/app/pages/LoginPage.tsx");
    const cadastro = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPage.tsx",
    );
    const journey = readProjectFile("src/core/auth/utils/authJourney.ts");
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");

    expect(productionEnv).toContain("VITE_AUTH_GOOGLE_ENABLED=true");
    expect(remoteEnv).toContain('VITE_AUTH_GOOGLE_ENABLED="true"');
    expect(login).toContain("Continuar com Google");
    expect(login).toContain("googleAuthAvailable");
    expect(login).toContain("prepareGoogleLogin(redirectTo)");
    expect(cadastro).toContain("Continuar com Google");
    expect(cadastro).toContain("prepareGoogleSignup(redirectTo)");
    expect(journey).toContain("setPendingReturn(AUTH_PATHS.firstAccess)");
    expect(authService).toContain('provider: "google"');
    expect(authService).toContain("getTermsAcceptanceRedirectUrl");
  });

  it("keeps initial signup account-first, territory optional and username-aware", () => {
    const cadastro = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPage.tsx",
    );
    const cadastroHook = readProjectFile(
      "src/app/features/onboarding/hooks/useCadastro.ts",
    );
    const schema = readProjectFile(
      "src/app/features/onboarding/validation/registerInitial.schema.ts",
    );
    const authTypes = readProjectFile("src/core/auth/services/types.ts");
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");

    expect(cadastro).toContain("Comece pelo seu perfil pessoal.");
    expect(cadastro).toContain("Depois, adicione perfis de negócio ou profissional.");
    expect(cadastro).toContain("useIdentityAvailability");
    expect(cadastro).toContain("Verificando disponibilidade");
    expect(cadastro).toContain("Nome de usuário disponível.");
    expect(cadastroHook).toContain("PublicIdentityService.checkAvailability");
    expect(cadastroHook).toContain("prepareEmailSignupConfirmation");
    expect(schema).not.toContain("confirmPassword");
    expect(schema).not.toContain("neighborhood");
    expect(schema).not.toContain("city:");
    expect(cadastroHook).not.toContain("neighborhood_id:");
    expect(cadastroHook).not.toContain("state:");
    expect(cadastroHook).not.toContain("city:");
    expect(cadastroHook).not.toContain("as unknown as true");
    expect(cadastroHook).not.toContain("pendingSignup");
    expect(authTypes).not.toContain("neighborhood_id");
    expect(authTypes).not.toContain("display_name?:");
    expect(authTypes).not.toContain("username?:");
    expect(authService).not.toContain("data.neighborhood");
    expect(authService).not.toContain("data.city");
  });

  it("persists the username chosen during email signup instead of discarding it in the auth trigger", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260920094751_honor_signup_username_in_auth_trigger.sql",
    );

    expect(migration).toContain("NEW.raw_user_meta_data->>'handle'");
    expect(migration).toContain("NEW.raw_user_meta_data->>'username'");
    expect(migration).toContain("private.profile_username_is_reserved");
    expect(migration).toContain("^[a-z][a-z0-9_]{2,29}$");
    expect(migration).toContain("signup-username:");
    expect(migration).toContain("INSERT INTO public.profiles");
    expect(migration).toContain("v_username");
    expect(migration).toContain("INSERT INTO public.user_roles");
  });

  it("always sends a confirmed new signup through first access before its return target", () => {
    const login = readProjectFile("src/app/pages/LoginPage.tsx");
    const firstAccess = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
    );

    expect(login).toContain("if (isEmailConfirmed) {");
    expect(login).toContain("completeEmailConfirmationJourney()");
    expect(login).toContain("navigate(AUTH_PATHS.firstAccess, { replace: true })");
    expect(login).not.toContain('isEmailConfirmed && redirectTo === "/"');

    expect(firstAccess).toContain("getSignupJourneyReturnTarget");
    expect(firstAccess).toContain("completeFirstAccessJourney");
    expect(firstAccess).not.toContain("pendingSignup");
    expect(firstAccess).toContain("Sua conversa está esperando");
    expect(firstAccess).toContain("Continuar para a conversa");
    expect(firstAccess).toContain("Completar meu perfil depois");
    expect(firstAccess).toContain("Informar cidade e bairro");
    expect(firstAccess).toContain("Agora não");
    expect(firstAccess).toContain('public_location_visibility: "hidden"');
    expect(firstAccess).toContain("getAuthReturnContext");
    expect(firstAccess).toContain("Tentar carregar novamente");
  });

  it("lets OAuth users replace an automatically allocated username without weakening identity enforcement", () => {
    const firstAccess = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
    );
    const profileMutations = readProjectFile(
      "src/core/profiles/services/profile.mutations.ts",
    );

    expect(firstAccess).toContain("GENERATED_USERNAME_SUFFIX");
    expect(firstAccess).toContain("useIdentityAvailability");
    expect(firstAccess).toContain("excludeEntityId: profile?.id");
    expect(firstAccess).toContain("Escolher meu @usuário");
    expect(firstAccess).toContain("await usernameAvailability.check(normalized)");
    expect(firstAccess).toContain("profileService.updateProfile(profile.id, {");
    expect(firstAccess).toContain("username: normalized");
    expect(firstAccess).toContain("Nome de usuário atualizado");

    expect(profileMutations).toContain("const { username, ...patch } = updates");
    expect(profileMutations).toContain("username ?? null");
    expect(profileMutations).toContain("ProfileRpcService.updateOwnedProfile");
  });

  it("keeps confirmation recoverable when signup context is missing", () => {
    const confirmation = readProjectFile(
      "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
    );

    expect(confirmation).toContain("getSignupConfirmationContext");
    expect(confirmation).toContain("restartEmailSignupJourney");
    expect(confirmation).toContain("AUTH_EMAIL_CONFIRMATION_INTENTS.login");
    expect(confirmation).toContain("cancelUnconfirmedEmailLoginJourney");
    expect(confirmation).not.toContain("pendingSignup");
    expect(confirmation).toContain("Vamos localizar sua inscrição.");
    expect(confirmation).toContain("Voltar para criar conta");
    expect(confirmation).toContain("Já confirmei — entrar");
    expect(confirmation).not.toContain('{email || "o e-mail informado"}');
  });

  it("keeps recovery states implemented instead of decorative-only screens", () => {
    const recovery = readProjectFile("src/app/pages/ResetPasswordPage.tsx");
    const callback = readProjectFile("src/core/auth/utils/authCallback.ts");
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");
    const passwordPolicy = readProjectFile("src/shared/validation/passwordPolicy.ts");

    for (const state of [
      '"request"',
      '"sent"',
      '"checking"',
      '"reset"',
      '"success"',
      '"invalid"',
    ]) {
      expect(recovery).toContain(state);
    }

    expect(recovery).toContain("resetPasswordByIdentifier");
    expect(recovery).toContain("AuthService.updateRecoveredPassword");
    expect(recovery).toContain("checkPasswordCompromise");
    expect(recovery).toContain("AuthService.onPasswordRecovery");
    expect(recovery).not.toContain("hasPasswordRecoverySessionMarker");
    expect(recovery).not.toContain("hasPendingPkceCode");
    expect(recovery).toContain("getAuthCallbackError");
    expect(recovery).toContain("Este link não está");
    expect(recovery).toContain("getPasswordConceptRequirementStatus");
    expect(recovery).not.toContain("getPasswordRequirementStatus(newPassword)");
    expect(callback).toContain("AUTH_QUERY_VALUES.expiredOtp");
    expect(callback).toContain("isPasswordRecoveryRouteIntent");
    expect(authService).toContain("RECOVERY_SESSION_REQUIRED");
    expect(authService).not.toContain("captureAuthHash");
    expect(authService).not.toContain("getAuthHashError");
    expect(authService).not.toContain("isRecoveryRedirect");
    expect(passwordPolicy).toContain('label: "Maiúscula e minúscula"');
    expect(passwordPolicy).toContain('label: "Número e símbolo"');
    expect(passwordPolicy).toContain("getPasswordRequirementStatus(password)");
  });

  it("owns auth routes, query flags, redirect URLs and transient context centrally", () => {
    const flow = readProjectFile("src/core/auth/constants/authFlow.ts");
    const storage = readProjectFile("src/core/auth/utils/authFlowStorage.ts");
    const journey = readProjectFile("src/core/auth/utils/authJourney.ts");
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");
    const rootRoutes = readProjectFile("src/app/routes/AppRoutes.tsx");
    const login = readProjectFile("src/app/pages/LoginPage.tsx");
    const confirmation = readProjectFile(
      "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
    );
    const firstAccess = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
    );
    const terms = readProjectFile(
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
    );

    for (const path of [
      'login: "/login"',
      'signup: "/cadastro"',
      'signupConfirmation: "/cadastro/confirmacao"',
      'firstAccess: "/cadastro/primeiro-acesso"',
      'termsAcceptance: "/aceitar-termos"',
      'passwordReset: "/reset-password"',
    ]) {
      expect(flow).toContain(path);
    }
    expect(storage).toContain("expiresAt");
    expect(storage).toContain("Compatibilidade transitória");
    expect(storage).toContain("formato legado foi removida");
    expect(journey).toContain("AUTH_FLOW_STORAGE_KEYS.pendingReturn");
    expect(journey).toContain("AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail");
    expect(journey).toContain("AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect");
    expect(journey).toContain("AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent");
    expect(journey).toContain("prepareEmailSignupConfirmation");
    expect(journey).toContain("prepareUnconfirmedEmailLogin");
    expect(journey).toContain("getSignupConfirmationContext");
    expect(journey).toContain("getSignupJourneyReturnTarget");
    expect(journey).toContain("completeEmailConfirmationJourney");
    expect(journey).toContain("completeFirstAccessJourney");
    expect(journey).not.toContain("pendingAuthReturn");
    expect(
      existsSync(resolve(repoRoot, "src/core/auth/utils/pendingSignup.ts")),
    ).toBe(false);
    expect(authService).toContain("buildPublicAbsoluteUrl");
    expect(authService).not.toContain("window.location.origin");
    expect(rootRoutes).toContain("AUTH_PATHS.login");
    expect(rootRoutes).toContain("AUTH_PATHS.signupConfirmation");
    expect(login).not.toContain("pendingSignup");
    expect(confirmation).not.toContain("pendingSignup");
    expect(firstAccess).not.toContain("pendingSignup");
    expect(terms).not.toContain("pendingAuthReturn");
    expect(terms).not.toContain("pendingSignup");
  });

  it("keeps authorization outside the authentication facade", () => {
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");
    const adminLayout = readProjectFile("src/modules/admin/pages/AdminLayout.tsx");
    const vagasPermission = readProjectFile(
      "src/core/classifieds/jobs/services/VagasPublishPermissionService.ts",
    );

    expect(authService).not.toContain("RoleService");
    expect(authService).not.toContain("isAdmin(");
    expect(authService).not.toContain("clearAdminCache");
    expect(authService).not.toContain("getAdminUserId");
    expect(adminLayout).toContain("RoleService.isAdmin(user.id)");
    expect(adminLayout).toContain("enabled: adminBypassEnabled || isAdmin");
    expect(adminLayout).toContain("buildLoginPath(window.location.pathname)");
    expect(vagasPermission).toContain("RoleService.isAdmin(userId)");
    expect(vagasPermission).not.toContain("AuthService");
  });

  it("ships valid concept raster artwork with the approved crop dimensions", () => {
    const expectedAssets = [
      {
        path: "public/auth/login-hero.webp",
        width: 376,
        height: 264,
        minBytes: 9_000,
      },
      {
        path: "public/auth/signup-hero.webp",
        width: 340,
        height: 186,
        minBytes: 5_000,
      },
      {
        path: "public/auth/confirm-hero.webp",
        width: 355,
        height: 188,
        minBytes: 5_000,
      },
      {
        path: "public/auth/recovery-hero.webp",
        width: 368,
        height: 149,
        minBytes: 7_000,
      },
      {
        path: "public/auth/confirm-envelope.webp",
        width: 120,
        height: 115,
        minBytes: 1_000,
      },
    ] as const;

    for (const asset of expectedAssets) {
      const absolutePath = resolve(repoRoot, asset.path);
      expect(existsSync(absolutePath), `${asset.path} must exist`).toBe(true);
      const data = readFileSync(absolutePath);
      expect(
        data.length,
        `${asset.path} must not be a truncated placeholder`,
      ).toBeGreaterThanOrEqual(asset.minBytes);
      expect(readWebpDimensions(asset.path), `${asset.path} crop dimensions`).toEqual({
        width: asset.width,
        height: asset.height,
      });
    }

    expect(readProjectFile("src/app/pages/LoginPage.tsx")).toContain(
      '/auth/login-hero.webp',
    );
    expect(
      readProjectFile("src/app/features/onboarding/pages/CadastroPage.tsx"),
    ).toContain('/auth/signup-hero.webp');
    expect(
      readProjectFile(
        "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
      ),
    ).toContain('/auth/confirm-hero.webp');
    expect(readProjectFile("src/app/pages/ResetPasswordPage.tsx")).toContain(
      '/auth/recovery-hero.webp',
    );
  });

  it("does not reintroduce generic SVG icon packages in concept-owned auth components", () => {
    const conceptOwnedFiles = [
      "src/app/components/auth/AuthBrandHeader.tsx",
      "src/app/components/auth/AuthConceptIcon.tsx",
      "src/app/components/auth/PasswordInput.tsx",
      "src/app/pages/LoginPage.tsx",
      "src/app/pages/ResetPasswordPage.tsx",
      "src/app/features/onboarding/pages/CadastroPage.tsx",
      "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
      "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
      "src/shared/components/ui/checkbox.tsx",
    ];

    for (const path of conceptOwnedFiles) {
      const source = readProjectFile(path);
      expect(source, `${path} must not import lucide-react`).not.toContain(
        "lucide-react",
      );
      expect(source, `${path} must not embed svg markup`).not.toMatch(/<svg\b/i);
    }

    const iconCss = readProjectFile(
      "src/app/components/auth/auth-concept-icons.css",
    );
    expect(iconCss).toContain("conic-gradient");
    expect(iconCss).not.toContain("content:'G'");

    const firstAccess = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
    );
    expect(firstAccess).not.toContain('@/shared/components/ui/select');
    expect(firstAccess).toContain("function ConceptSelect(");
  });
});
