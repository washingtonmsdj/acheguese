import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import { AuthTurnstileGate } from "@/app/components/auth/AuthTurnstileGate";
import { PasswordInput } from "@/app/components/auth/PasswordInput";
import { useAuthTurnstile } from "@/app/components/auth/useAuthTurnstile";
import { useCadastroForm } from "@/app/features/onboarding/hooks/useCadastro";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  COMMUNITY_GUIDELINES_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/core/legal/termsOfService";
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
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";
import { cn } from "@/shared/utils/cn";
import { getPasswordRequirementStatus } from "@/shared/validation/passwordPolicy";

type CadastroLocationState = { redirectTo?: unknown } | null;

export default function CadastroPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const redirectTo = useMemo(() => {
    const stateRedirect = (location.state as CadastroLocationState)?.redirectTo;
    return resolveSafeInternalPath(stateRedirect ?? searchParams.get("redirect"), "/");
  }, [location.state, searchParams]);

  const { form, loading, submit } = useCadastroForm(redirectTo);
  const turnstile = useAuthTurnstile();
  const password = form.watch("password") ?? "";
  const termsAccepted = form.watch("termsAccepted") === true;
  const requirements = useMemo(
    () => getPasswordRequirementStatus(password),
    [password],
  );

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, user]);

  const canSubmit = !loading && termsAccepted && turnstile.isReady;

  return (
    <>
      <Helmet>
        <title>Criar conta | Achegue-se</title>
        <meta
          name="description"
          content="Crie primeiro seu perfil pessoal. Cidade e bairro podem ser informados depois."
        />
      </Helmet>

      <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33]">
        <AuthBrandHeader secondaryHref="/login" secondaryLabel="Entrar" />

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
                className="mt-5 w-full max-w-[390px] rounded-[24px] object-cover"
              />
              <p className="mt-3 max-w-[360px] -rotate-1 font-heading text-base font-semibold italic text-[#17464a]">
                Pode participar mesmo morando fora do Complexo.
              </p>
            </div>
          </section>

          <section className="w-full lg:rounded-[18px] lg:bg-white lg:p-7 lg:shadow-[0_18px_55px_rgba(17,55,59,.08)]">
            <div className="lg:hidden">
              <h1 className="max-w-[330px] font-heading text-[31px] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#0b3b3f]">
                Comece pelo seu perfil pessoal.
              </h1>
              <p className="mt-1.5 max-w-[330px] text-[15px] leading-[21px] text-[#263f43]">
                Depois, adicione perfis de negócio ou profissional.
              </p>
            </div>

            <h2 className="hidden font-heading text-[24px] font-extrabold tracking-[-0.035em] text-[#102f33] lg:block">
              Criar minha conta
            </h2>

            <Form {...form}>
              <form
                className="mt-5 space-y-3.5 lg:mt-4"
                noValidate
                aria-busy={loading}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!turnstile.isReady) {
                    toast({
                      title: "Verificação necessária",
                      description: "Conclua a verificação de segurança para continuar.",
                      variant: "destructive",
                    });
                    return;
                  }
                  void submit();
                }}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[14px] font-semibold text-[#15383c]">Nome</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="name"
                          disabled={loading}
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
                            disabled={loading}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value
                                  .replace(/^@/, "")
                                  .replace(/[^a-z0-9_]/g, "")
                                  .toLowerCase(),
                              )
                            }
                            className={cn(
                              "h-11 rounded-lg border-[#b9c5c6] bg-white pl-8 pr-3 text-[16px] shadow-none",
                              fieldState.error && "border-destructive",
                            )}
                          />
                        </div>
                      </FormControl>
                      <p className="text-[12px] leading-4 text-[#607477]">Seu identificador público.</p>
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
                          disabled={loading}
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
                          disabled={loading}
                          invalid={Boolean(fieldState.error)}
                          strengthValue={password}
                          showStrength={false}
                          className="h-11 rounded-lg border-[#b9c5c6] bg-white text-[16px] shadow-none"
                        />
                      </FormControl>
                      <p className="text-[11.5px] leading-4 text-[#607477]">
                        {requirements.map((requirement) => requirement.label).join(" · ")}
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
                            disabled={loading}
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

                <details className="group rounded-xl bg-[#f3f1ea] text-[#244448]">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 py-2 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
                    <AuthConceptIcon name="info" />
                    <span className="flex-1">Como usamos seus dados</span>
                    <span aria-hidden="true" className="text-lg leading-none transition-transform group-open:rotate-90">›</span>
                  </summary>
                  <p className="px-3 pb-3 pl-11 text-[11px] leading-4 text-[#607477]">
                    Usamos os dados necessários para criar sua identidade, proteger o acesso e operar sua conta. Cidade e bairro podem ser informados depois.
                  </p>
                </details>

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
                  Você pode se cadastrar de qualquer lugar.
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
