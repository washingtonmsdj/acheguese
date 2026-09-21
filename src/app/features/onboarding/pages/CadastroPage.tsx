import { useEffect, useMemo, useRef, useState } from "react";
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
import { normalizePublicUsernameDraft } from "@/core/public-identity/utils/usernameDraft";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
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
  const { signInWithGoogle, googleAuthAvailable } = useAuth();
  const { user, isLoading: sessionLoading } = useSessionContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);
  const authActionInFlightRef = useRef(false);

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
    if (sessionLoading || !user) return;
    completeStandardLoginJourney();
    navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, sessionLoading, user]);

  const authBusy = sessionLoading || user !== null || loading || googleLoading;
  const usernameBlocked =
    usernameAvailability.result !== null &&
    usernameAvailability.result.identifier === username &&
    usernameAvailability.result.status !== "available";
  const canSubmit =
    !authBusy &&
    !usernameAvailability.isChecking &&
    !usernameBlocked &&
    termsAccepted &&
    turnstile.isReady;

  const handleEmailSignup = async () => {
    if (sessionLoading || user || authActionInFlightRef.current) return;
    if (!turnstile.isReady) {
      toast({
        title: "Verificação necessária",
        description: "Conclua a verificação de segurança para continuar.",
        variant: "destructive",
      });
      return;
    }

    authActionInFlightRef.current = true;
    try {
      // Feedback visual e verificação autoritativa permanecem separados: o hook
      // de cadastro consulta novamente o SSOT antes de criar a conta.
      await submit(turnstile.token ?? undefined, turnstile.reset);
    } finally {
      authActionInFlightRef.current = false;
    }
  };

  const handleGoogleSignup = async () => {
    if (
      sessionLoading ||
      user ||
      !googleAuthAvailable ||
      googleLoading ||
      authActionInFlightRef.current
    ) {
      return;
    }
    authActionInFlightRef.current = true;
    setGoogleLoading(true);
    prepareGoogleSignup(redirectTo);
    try {
      await signInWithGoogle();
    } catch (error) {
      authActionInFlightRef.current = false;
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

      <div className="auth-concept-canvas min-h-[100dvh]">
        <AuthBrandHeader secondaryHref={AUTH_PATHS.login} secondaryLabel="Entrar" />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-4 pt-3 focus:outline-none lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-16 lg:px-10 lg:pb-10 lg:pt-8"
        >
          <section className="hidden lg:block" aria-label="Sobre o cadastro">
            <div className="max-w-[430px]">
              <h1 className="font-heading text-[46px] font-extrabold leading-[.94] tracking-[-0.05em] text-primary">
                Comece<br />por você.
              </h1>
              <p className="mt-4 max-w-[360px] text-[17px] leading-6 text-foreground">
                Seu perfil pessoal é o primeiro. Outros perfis podem ser criados depois.
              </p>
              <img
                src="/auth/signup-hero.webp"
                alt="Ilustração de uma moradora usando o Achegue-se em seu território"
                className="mt-5 w-full max-w-[390px] object-cover"
              />
              <div className="mt-3 max-w-[360px] -rotate-1">
                <p className="font-heading text-base font-semibold italic text-primary">
                  Pode participar mesmo morando fora do Complexo.
                </p>
                <span aria-hidden="true" className="mt-1 block h-[3px] w-12 rotate-[-4deg] rounded-full bg-accent" />
              </div>
            </div>
          </section>

          <section className="w-full lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-7 lg:shadow-md">
            <div className="lg:hidden">
              <h1 className="max-w-[284px] font-heading text-[31px] font-extrabold leading-[1.04] tracking-[-0.045em] text-primary">
                Comece pelo seu perfil pessoal.
              </h1>
              <p className="mt-1.5 max-w-[330px] text-[15px] leading-[21px] text-foreground">
                Depois, adicione perfis de negócio ou profissional.
              </p>
            </div>

            <h2 className="hidden font-heading text-[24px] font-extrabold tracking-[-0.035em] text-foreground lg:block">
              Criar minha conta
            </h2>

            {googleAuthAvailable ? (
              <div className="hidden lg:block">
                <button
                  type="button"
                  onClick={() => void handleGoogleSignup()}
                  disabled={authBusy}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-card text-[14px] font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-55"
                >
                  <AuthConceptIcon name="google" />
                  {googleLoading ? "Abrindo Google…" : "Continuar com Google"}
                </button>
                <div className="my-4 flex items-center gap-3 text-[12px] text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>ou crie com e-mail</span>
                  <span className="h-px flex-1 bg-border" />
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
                aria-busy={authBusy}
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleEmailSignup();
                }}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[14px] font-semibold text-foreground">
                        <span className="lg:hidden">Nome</span>
                        <span className="hidden lg:inline">Nome completo</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          aria-label="Nome"
                          autoComplete="name"
                          disabled={authBusy}
                          className={cn(
                            "h-11 rounded-lg border-input bg-card px-3 text-[16px] shadow-none",
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
                      <FormLabel className="text-[14px] font-semibold text-foreground">Nome de usuário</FormLabel>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-muted-foreground">@</span>
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            disabled={authBusy}
                            aria-describedby="cadastro-username-status"
                            onChange={(event) => {
                              const normalized = normalizePublicUsernameDraft(
                                event.target.value,
                              );
                              field.onChange(normalized);
                              form.clearErrors("username");
                              if (normalized.length >= 3) {
                                usernameAvailability.checkDebounced(normalized);
                              } else {
                                usernameAvailability.reset();
                              }
                            }}
                            className={cn(
                              "h-11 rounded-lg border-input bg-card pl-8 pr-3 text-[16px] shadow-none",
                              fieldState.error && "border-destructive",
                              usernameAvailability.result?.identifier === username &&
                                usernameAvailability.result.status === "available" &&
                                "border-success",
                            )}
                          />
                        </FormControl>
                      </div>
                      <div id="cadastro-username-status" aria-live="polite" className="min-h-4 text-[11.5px] leading-4">
                        {usernameAvailability.isChecking ? (
                          <span className="text-muted-foreground">Verificando disponibilidade…</span>
                        ) : usernameAvailability.result?.identifier === username && usernameAvailability.result.status === "available" ? (
                          <span className="font-medium text-success">Nome de usuário disponível.</span>
                        ) : usernameAvailability.result?.identifier === username && usernameAvailability.result.status !== "available" ? (
                          <span className="text-destructive">
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
                          <span className="text-muted-foreground">
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
                      <FormLabel className="text-[14px] font-semibold text-foreground">E-mail</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          disabled={authBusy}
                          className={cn(
                            "h-11 rounded-lg border-input bg-card px-3 text-[16px] shadow-none",
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
                      <FormLabel className="text-[14px] font-semibold text-foreground">Senha</FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          id="cadastro-password"
                          autoComplete="new-password"
                          disabled={authBusy}
                          invalid={Boolean(fieldState.error)}
                          strengthValue={password}
                          showStrength={false}
                          className="h-11 rounded-lg border-input bg-card text-[16px] shadow-none"
                        />
                      </FormControl>
                      <p className="text-[11.5px] leading-4 text-muted-foreground">
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
                            disabled={authBusy}
                            aria-invalid={Boolean(fieldState.error)}
                            className="mt-0.5 h-5 w-5 rounded-[3px] border-primary"
                          />
                        </FormControl>
                        <Label
                          htmlFor="cadastro-terms-acceptance"
                          className="cursor-pointer text-[13px] font-normal leading-[18px] text-foreground"
                        >
                          Aceito os{" "}
                          <Link className="text-primary underline underline-offset-2" to={TERMS_OF_SERVICE_PATH} target="_blank" rel="noreferrer">Termos</Link>{" "}
                          e as{" "}
                          <Link className="text-primary underline underline-offset-2" to={COMMUNITY_GUIDELINES_PATH} target="_blank" rel="noreferrer">Diretrizes da comunidade</Link>.
                        </Label>
                      </div>
                      <FormMessage className="pl-8 text-xs" />
                    </FormItem>
                  )}
                />

                <details className="group rounded-xl bg-muted text-foreground lg:hidden">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 py-2 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35">
                    <AuthConceptIcon name="info" />
                    <span className="flex-1">Como usamos seus dados</span>
                    <AuthConceptIcon
                      name="chevron-right"
                      className="h-4 w-4 transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <p className="px-3 pb-3 pl-11 text-[11px] leading-4 text-muted-foreground">
                    Usamos os dados necessários para criar sua identidade, proteger o acesso e operar sua conta. Cidade e bairro podem ser informados depois.
                  </p>
                </details>

                <Link
                  to={PRIVACY_POLICY_PATH}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden min-h-8 items-center text-[12px] font-medium text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 lg:inline-flex"
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
                  className="mt-1 flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-[15px] font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading ? "Criando conta…" : "Criar minha conta"}
                </button>

                <p className="text-center text-[11.5px] text-muted-foreground">
                  <span className="lg:hidden">Você pode se cadastrar de qualquer lugar.</span>
                  <span className="hidden lg:inline">
                    Já tem conta?{" "}
                    <Link
                      to={buildLoginPath(redirectTo)}
                      className="font-medium text-primary underline underline-offset-2"
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
