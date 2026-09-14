import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import { AuthTurnstileGate } from "@/app/components/auth/AuthTurnstileGate";
import { PasswordInput } from "@/app/components/auth/PasswordInput";
import { useAuthTurnstile } from "@/app/components/auth/useAuthTurnstile";
import { useCadastroForm } from "@/app/features/onboarding/hooks/useCadastro";
import {
  AUTH_PATHS,
  AUTH_QUERY_KEYS,
  buildLoginPath,
} from "@/core/auth/constants/authFlow";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  cancelGoogleSignup,
  completeStandardLoginJourney,
  prepareGoogleSignup,
} from "@/core/auth/utils/authJourney";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import {
  COMMUNITY_GUIDELINES_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/core/legal/termsOfService";
import { useIdentityAvailability } from "@/core/public-identity/hooks/useIdentityAvailability";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { PRIVACY_POLICY_PATH } from "@/shared/constants/legal";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";
import { cn } from "@/shared/utils/cn";
import { getPasswordRequirementsSummary } from "@/shared/validation/passwordPolicy";

type CadastroLocationState = { redirectTo?: unknown } | null;

const MOBILE_PASSWORD_HINT = getPasswordRequirementsSummary();
const DESKTOP_PASSWORD_HINT = getPasswordRequirementsSummary(true);

function getUsernameAvailabilityCopy(status?: string, fallback?: string) {
  if (fallback) return fallback;
  switch (status) {
    case "taken":
      return "Este nome de usuário já está em uso.";
    case "reserved":
      return "Este nome de usuário é reservado.";
    case "invalid":
      return "Escolha outro nome de usuário.";
    default:
      return "Não foi possível confirmar a disponibilidade.";
  }
}

export default function CadastroPage() {
  const { user, signInWithGoogle, googleAuthAvailable } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectTo = useMemo(() => {
    const stateRedirect = (location.state as CadastroLocationState)?.redirectTo;
    return resolveSafeInternalPath(
      stateRedirect ?? searchParams.get(AUTH_QUERY_KEYS.redirect),
      "/",
    );
  }, [location.state, searchParams]);

  const { form, loading, submit } = useCadastroForm(redirectTo);
  const turnstile = useAuthTurnstile();
  const usernameAvailability = useIdentityAvailability({
    entityType: "profile",
    debounceMs: 420,
  });
  const password = form.watch("password") ?? "";
  const username = form.watch("username") ?? "";
  const termsAccepted = form.watch("termsAccepted") === true;

  useEffect(() => {
    if (!user) return;
    completeStandardLoginJourney();
    navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, user]);

  const usernameBlocked =
    usernameAvailability.result !== null &&
    usernameAvailability.result.identifier === username &&
    usernameAvailability.result.status !== "available";
  const canSubmit =
    !loading &&
    !googleLoading &&
    !usernameAvailability.isChecking &&
    !usernameBlocked &&
    termsAccepted &&
    turnstile.isReady;

  const handleEmailSignup = () => {
    if (!turnstile.isReady) {
      toast({
        title: "Verificação necessária",
        description: "Conclua a verificação de segurança para continuar.",
        variant: "destructive",
      });
      return;
    }

    // Feedback visual e verificação autoritativa permanecem separados: o hook
    // de cadastro consulta novamente o SSOT antes de criar a conta.
    void submit();
  };

  const handleGoogleSignup = async () => {
    if (!googleAuthAvailable || googleLoading) return;
    setGoogleLoading(true);
    prepareGoogleSignup(redirectTo);
    try {
      await signInWithGoogle();
    } catch (error) {
      cancelGoogleSignup();
      toast({
        title: "Não foi possível continuar com Google",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Criar conta | Achegue-se</title>
        <meta
          name="description"
          content="Crie primeiro seu perfil pessoal. Cidade e bairro podem ser informados depois."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33] lg:bg-[radial-gradient(circle_at_16%_32%,rgba(216,234,224,.55),transparent_31%),radial-gradient(circle_at_70%_18%,rgba(255,236,185,.28),transparent_30%),#fffdfa]">
        <AuthBrandHeader secondaryHref={AUTH_PATHS.login} secondaryLabel="Entrar" />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-4 pt-3 focus:outline-none lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-16 lg:px-10 lg:pb-10 lg:pt-8"
        >
          <section className="hidden lg:block" aria-label="Sobre o cadastro">
            <div className="max-w-[430px]">
              <h1 className="font-heading text-[46px] font-extrabold leading-[.94] tracking-[-0.05em] text-[#0b3b3f]">
                Comece<br />por você.
              </h1>
              <p className="mt-4 max-w-[360px] text-[17px] leading-6 text-[#244448]">
                Seu perfil pessoal é o primeiro. Outros perfis podem ser criados depois.
              </p>
              <img
                src="/auth/signup-hero.webp"
                alt="Ilustração de uma moradora usando o Achegue-se em seu território"
                className="mt-5 w-full max-w-[390px] object-cover"
              />
              <div className="mt-3 max-w-[360px] -rotate-1">
                <p className="font-heading text-base font-semibold italic text-[#17464a]">
                  Pode participar mesmo morando fora do Complexo.
                </p>
                <span aria-hidden="true" className="mt-1 block h-[3px] w-12 rotate-[-4deg] rounded-full bg-[#f3bd18]" />
              </div>
            </div>
          </section>

          <section className="w-full lg:rounded-[10px] lg:bg-white lg:p-7 lg:shadow-[0_18px_55px_rgba(17,55,59,.08)]">
            <div className="lg:hidden">
              <h1 className="max-w-[284px] font-heading text-[31px] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#0b3b3f]">
                Comece pelo seu perfil pessoal.
              </h1>
              <p className="mt-1.5 max-w-[330px] text-[15px] leading-[21px] text-[#263f43]">
                Depois, adicione perfis de negócio ou profissional.
              </p>
            </div>

            <h2 className="hidden font-heading text-[24px] font-extrabold tracking-[-0.035em] text-[#102f33] lg:block">
              Criar minha conta
            </h2>

            {googleAuthAvailable ? (
              <div className="hidden lg:block">
                <button
                  type="button"
                  onClick={() => void handleGoogleSignup()}
                  disabled={loading || googleLoading}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-3 rounded-[9px] border border-[#8da1a3] bg-white text-[14px] font-bold text-[#17363a] transition-colors hover:bg-[#f7f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35 disabled:opacity-55"
                >
                  <AuthConceptIcon name="google" />
                  {googleLoading ? "Abrindo Google…" : "Continuar com Google"}
                </button>
                <div className="my-4 flex items-center gap-3 text-[12px] text-[#607477]">
                  <span className="h-px flex-1 bg-[#c7d0d0]" />
                  <span>ou crie com e-mail</span>
                  <span className="h-px flex-1 bg-[#c7d0d0]" />
                </div>
              </div>
            ) : null}

            <Form {...form}>
              <form
                className={cn(
                  "mt-5 space-y-3.5 lg:mt-4",
                  googleAuthAvailable && "lg:mt-0",
                )}
                noValidate
                aria-busy={loading || googleLoading}
                onSubmit={(event) => {
                  event.preventDefault();
                  handleEmailSignup();
                }}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[14px] font-semibold text-[#15383c]">
                        <span className="lg:hidden">Nome</span>
                        <span className="hidden lg:inline">Nome completo</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="name"
                          disabled={loading || googleLoading}
                          className={cn(
                            "h-11 rounded-lg border-[#b9c5c6] bg-white px-3 text-[16px] shadow-none",
                            fieldState.error && "border-destructive",
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[14px] font-semibold text-[#15383c]">Nome de usuário</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#223f43]">@</span>
                          <Input
                            {...field}
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            disabled={loading || googleLoading}
                            aria-describedby="cadastro-username-status"
                            onChange={(event) => {
                              const normalized = event.target.value
                                .replace(/^@/, "")
                                .replace(/[^a-z0-9_]/g, "")
                                .toLowerCase();
                              field.onChange(normalized);
                              form.clearErrors("username");
                              if (normalized.length >= 3) {
                                usernameAvailability.checkDebounced(normalized);
                              } else {
                                usernameAvailability.reset();
                              }
                            }}
                            className={cn(
                              "h-11 rounded-lg border-[#b9c5c6] bg-white pl-8 pr-3 text-[16px] shadow-none",
                              fieldState.error && "border-destructive",
                              usernameAvailability.result?.identifier === username &&
                                usernameAvailability.result.status === "available" &&
                                "border-[#4d9b78]",
                            )}
                          />
                        </div>
                      </FormControl>
                      <div id="cadastro-username-status" aria-live="polite" className="min-h-4 text-[11.5px] leading-4">
                        {usernameAvailability.isChecking ? (
                          <span className="text-[#607477]">Verificando disponibilidade…</span>
                        ) : usernameAvailability.result?.identifier === username && usernameAvailability.result.status === "available" ? (
                          <span className="font-medium text-[#287255]">Nome de usuário disponível.</span>
                        ) : usernameAvailability.result?.identifier === username && usernameAvailability.result.status !== "available" ? (
                          <span className="text-[#a83f37]">
                            {getUsernameAvailabilityCopy(
                              usernameAvailability.result.status,
                              usernameAvailability.result.message,
                            )}
                            {usernameAvailability.result.suggestion ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const suggestion = usernameAvailability.result?.suggestion ?? "";
                                  form.setValue("username", suggestion, { shouldDirty: true, shouldValidate: true });
                                  usernameAvailability.checkDebounced(suggestion);
                                }}
                                className="ml-1 font-semibold underline underline-offset-2"
                              >
                                Usar @{usernameAvailability.result.suggestion}
                              </button>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-[#607477]">
                            <span className="lg:hidden">Seu identificador público.</span>
                            <span className="hidden lg:inline">Seu identificador público. Use letras, números e _.</span>
                          </span>
                        )}
                      </div>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[14px] font-semibold text-[#15383c]">E-mail</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          disabled={loading || googleLoading}
                          className={cn(
                            "h-11 rounded-lg border-[#b9c5c6] bg-white px-3 text-[16px] shadow-none",
                            fieldState.error && "border-destructive",
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[14px] font-semibold text-[#15383c]">Senha</FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          id="cadastro-password"
                          autoComplete="new-password"
                          disabled={loading || googleLoading}
                          invalid={Boolean(fieldState.error)}
                          strengthValue={password}
                          showStrength={false}
                          className="h-11 rounded-lg border-[#b9c5c6] bg-white text-[16px] shadow-none"
                        />
                      </FormControl>
                      <p className="text-[11.5px] leading-4 text-[#607477]">
                        <span className="lg:hidden">{MOBILE_PASSWORD_HINT}</span>
                        <span className="hidden lg:inline">{DESKTOP_PASSWORD_HINT}</span>
                      </p>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-1.5 pt-1">
                      <div className="flex items-start gap-3">
                        <FormControl>
                          <Checkbox
                            id="cadastro-terms-acceptance"
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            disabled={loading || googleLoading}
                            aria-invalid={Boolean(fieldState.error)}
                            className="mt-0.5 h-5 w-5 rounded-[3px] border-[#31575a]"
                          />
                        </FormControl>
                        <Label
                          htmlFor="cadastro-terms-acceptance"
                          className="cursor-pointer text-[13px] font-normal leading-[18px] text-[#244448]"
                        >
                          Aceito os{" "}
                          <Link className="underline underline-offset-2" to={TERMS_OF_SERVICE_PATH} target="_blank" rel="noreferrer">Termos</Link>{" "}
                          e as{" "}
                          <Link className="underline underline-offset-2" to={COMMUNITY_GUIDELINES_PATH} target="_blank" rel="noreferrer">Diretrizes da comunidade</Link>.
                        </Label>
                      </div>
                      <FormMessage className="pl-8 text-xs" />
                    </FormItem>
                  )}
                />

                <details className="group rounded-xl bg-[#f3f1ea] text-[#244448] lg:hidden">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 py-2 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
                    <AuthConceptIcon name="info" />
                    <span className="flex-1">Como usamos seus dados</span>
                    <AuthConceptIcon
                      name="chevron-right"
                      className="h-4 w-4 transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <p className="px-3 pb-3 pl-11 text-[11px] leading-4 text-[#607477]">
                    Usamos os dados necessários para criar sua identidade, proteger o acesso e operar sua conta. Cidade e bairro podem ser informados depois.
                  </p>
                </details>

                <Link
                  to={PRIVACY_POLICY_PATH}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden min-h-8 items-center text-[12px] font-medium text-[#0b4e52] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35 lg:inline-flex"
                >
                  Como usamos seus dados
                </Link>

                {turnstile.enabled ? (
                  <AuthTurnstileGate
                    action="signup"
                    onVerify={turnstile.setToken}
                    onExpire={turnstile.reset}
                    onError={turnstile.reset}
                  />
                ) : null}

                {form.formState.errors.root?.serverError?.message ? (
                  <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {form.formState.errors.root.serverError.message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="mt-1 flex h-11 w-full items-center justify-center rounded-[9px] bg-[#ffc91a] px-4 text-[15px] font-extrabold text-[#102f33] shadow-[0_3px_10px_rgba(226,171,0,.16)] transition-colors hover:bg-[#f7bf00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading ? "Criando conta…" : "Criar minha conta"}
                </button>

                <p className="text-center text-[11.5px] text-[#607477]">
                  <span className="lg:hidden">Você pode se cadastrar de qualquer lugar.</span>
                  <span className="hidden lg:inline">
                    Já tem conta?{" "}
                    <Link
                      to={buildLoginPath(redirectTo)}
                      className="font-medium text-[#0b4e52] underline underline-offset-2"
                    >
                      Entrar
                    </Link>
                  </span>
                </p>
              </form>
            </Form>
          </section>
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
