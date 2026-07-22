import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import {
  AuthTurnstileGate,
} from "@/app/components/auth/AuthTurnstileGate";
import { useAuthTurnstile } from "@/app/components/auth/useAuthTurnstile";
import { PasswordInput } from "@/app/components/auth/PasswordInput";
import { useCadastroForm } from "@/app/features/onboarding/hooks/useCadastro";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  COMMUNITY_GUIDELINES_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/core/legal/termsOfService";
import { AUTH_PASSWORD_MIN_LENGTH } from "@/core/auth/utils/passwordPolicy";
import { useLocationCascade } from "@/core/location/hooks/useLocationCascade";
import { Button } from "@/shared/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/cn";

const STEPS = [
  { id: "personal", label: "Dados", icon: User },
  { id: "location", label: "Bairro", icon: MapPin },
  { id: "confirm", label: "Confirmar", icon: CheckCircle2 },
] as const;

function StepIndicator({
  currentStep,
  onBack,
  loading,
}: {
  currentStep: number;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isDone = index < currentStep;

        return (
          <React.Fragment key={step.id}>
            {index > 0 ? (
              <div
                className={cn(
                  "h-px w-8 transition-colors sm:w-12",
                  isDone ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (index < currentStep && !loading) onBack();
              }}
              disabled={index > currentStep || loading}
              aria-label={step.label}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl border transition-all sm:h-12 sm:w-auto sm:min-w-[8.5rem] sm:gap-2 sm:px-4",
                isActive && "border-primary/40 bg-primary/12 text-primary",
                isDone &&
                  "border-primary/25 bg-primary/6 text-primary hover:bg-primary/10",
                !isActive &&
                  !isDone &&
                  "border-border/70 bg-card/60 text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden text-sm font-medium sm:inline">
                {step.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function CadastroPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    form,
    currentStep,
    loading,
    handleNext,
    handleBack,
    selectState,
    selectCity,
    selectNeighborhood,
    submit,
  } = useCadastroForm();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [navigate, user]);

  const stateId = form.watch("stateId");
  const cityId = form.watch("cityId");
  const password = form.watch("password");
  const neighborhoodName = form.watch("neighborhoodName");
  const cityName = form.watch("cityName");
  const stateName = form.watch("stateName");
  const street = form.watch("street");
  const nameValue = form.watch("name");
  const usernameValue = form.watch("username");
  const emailValue = form.watch("email");
  const termsAcceptedValue = form.watch("termsAccepted");

  const {
    states,
    cities,
    neighborhoods,
    loadingStates,
    loadingCities,
    loadingNeighborhoods,
  } = useLocationCascade(stateId || null, cityId || null);

  const [capsLock, setCapsLock] = useState(false);

  const activeStep = STEPS.at(currentStep) ?? STEPS[0];
  const stepId = activeStep.id;
  const nextStepLabel =
    currentStep < STEPS.length - 1 ? STEPS[currentStep + 1]?.label : null;

  const isLastStep = currentStep === STEPS.length - 1;
  const turnstile = useAuthTurnstile();
  const canSubmit =
    !loading && termsAcceptedValue === true && turnstile.isReady;

  return (
    <>
      <Helmet>
        <title>Criar conta | Achegue-se</title>
        <meta
          name="description"
          content="Crie sua conta Achegue-se para participar da comunidade, conectar-se ao seu bairro e acessar serviços e negócios locais."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <AuthBrandHeader
          secondaryHref="/login"
          secondaryLabel="Já tenho conta"
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl items-start justify-center px-4 pb-36 pt-4 focus:outline-none sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:pb-10 sm:pt-8 lg:items-center"
        >
          <div className="w-full max-w-md space-y-4 sm:max-w-lg sm:space-y-6">
            <div className="rounded-[24px] border border-border/60 bg-card/55 px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                    Cadastro local
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    Conta, território e comunidade no mesmo fluxo.
                  </p>
                </div>
                {nextStepLabel ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.68rem] font-medium text-primary">
                    Próximo: {nextStepLabel}
                  </span>
                ) : null}
              </div>
            </div>
            <StepIndicator currentStep={currentStep} onBack={handleBack} loading={loading} />

            <Form {...form}>
              <form
                aria-busy={loading}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (isLastStep && !loading) void submit();
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.section
                    key={stepId}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.22 }}
                    className="rounded-[28px] border border-border/70 bg-card/78 p-5 shadow-[0_32px_120px_-64px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-8"
                  >
                    {stepId === "personal" ? (
                      <div className="space-y-4 sm:space-y-5">
                        <div className="space-y-1.5 text-center">
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                            Criação de conta
                          </p>
                          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-[2rem]">
                            Crie sua conta
                          </h1>
                          <p className="text-sm leading-6 text-muted-foreground">
                            Conecte-se com o que acontece no seu bairro.
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>Nome completo *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Seu nome"
                                  autoComplete="name"
                                  disabled={loading}
                                  className={cn(
                                    "h-10 sm:h-11",
                                    fieldState.error && "border-destructive",
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>Nome de usuário *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    @
                                  </span>
                                  <Input
                                    {...field}
                                    placeholder="seunome"
                                    autoComplete="username"
                                    disabled={loading}
                                    onChange={(event) =>
                                      field.onChange(
                                        event.target.value
                                          .replace(/[^a-z0-9_]/g, "")
                                          .toLowerCase(),
                                      )
                                    }
                                    onKeyDown={(event) =>
                                      setCapsLock(
                                        event.getModifierState("CapsLock"),
                                      )
                                    }
                                    onKeyUp={(event) =>
                                      setCapsLock(
                                        event.getModifierState("CapsLock"),
                                      )
                                    }
                                    className={cn(
                                      "h-10 pl-8 sm:h-11",
                                      fieldState.error && "border-destructive",
                                    )}
                                  />
                                </div>
                              </FormControl>
                              {capsLock ? (
                                <p className="text-xs text-amber-500">
                                  Caps Lock ativo. Apenas letras minúsculas são
                                  aceitas.
                                </p>
                              ) : null}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="seu@email.com"
                                  autoComplete="email"
                                  disabled={loading}
                                  className={cn(
                                    "h-10 sm:h-11",
                                    fieldState.error && "border-destructive",
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>Senha *</FormLabel>
                              <FormControl>
                                <PasswordInput
                                  {...field}
                                  placeholder={`M\u00ednimo ${AUTH_PASSWORD_MIN_LENGTH} caracteres`}
                                  invalid={Boolean(fieldState.error)}
                                  showStrength
                                  strengthValue={password || ""}
                                  autoComplete="new-password"
                                  disabled={loading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>Confirmar senha *</FormLabel>
                              <FormControl>
                                <PasswordInput
                                  {...field}
                                  placeholder="Repita a senha"
                                  invalid={Boolean(fieldState.error)}
                                  autoComplete="new-password"
                                  disabled={loading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : null}

                    {stepId === "location" ? (
                      <div className="space-y-4 sm:space-y-5">
                        <div className="space-y-1.5 text-center">
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                            {"Territ\u00f3rio"}
                          </p>
                          <h2 className="font-heading text-2xl font-bold text-foreground">
                            {"Onde voc\u00ea mora?"}
                          </h2>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {
                              "Isso conecta voc\u00ea ao bairro certo e melhora a descoberta local."
                            }
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="stateId"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>Estado *</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(id) => {
                                  const found = states.find(
                                    (state) => state.id === id,
                                  );
                                  if (found) selectState(found.id, found.name);
                                }}
                                disabled={loadingStates || loading}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    className={cn(
                                      "h-10 sm:h-11",
                                      fieldState.error &&
                                        "border-destructive",
                                    )}
                                  >
                                    <SelectValue
                                      placeholder={
                                        loadingStates
                                          ? "Carregando..."
                                          : "Selecione o estado"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-64">
                                  {states.map((state) => (
                                    <SelectItem key={state.id} value={state.id}>
                                      {state.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cityId"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>Cidade *</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(id) => {
                                  const found = cities.find(
                                    (city) => city.id === id,
                                  );
                                  if (found) selectCity(found.id, found.name);
                                }}
                                disabled={!stateId || loadingCities || loading}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    className={cn(
                                      "h-10 sm:h-11",
                                      fieldState.error && "border-destructive",
                                    )}
                                  >
                                    <SelectValue
                                      placeholder={
                                        !stateId
                                          ? "Selecione o estado primeiro"
                                          : loadingCities
                                            ? "Carregando..."
                                            : "Selecione a cidade"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-64">
                                  {cities.map((city) => (
                                    <SelectItem key={city.id} value={city.id}>
                                      {city.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="neighborhoodId"
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>Bairro *</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(id) => {
                                  const found = neighborhoods.find(
                                    (n) => n.id === id,
                                  );
                                  if (found)
                                    selectNeighborhood(found.id, found.name);
                                }}
                                disabled={!cityId || loadingNeighborhoods || loading}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    className={cn(
                                      "h-10 sm:h-11",
                                      fieldState.error && "border-destructive",
                                    )}
                                  >
                                    <SelectValue
                                      placeholder={
                                        !cityId
                                          ? "Selecione a cidade primeiro"
                                          : loadingNeighborhoods
                                            ? "Carregando..."
                                            : "Selecione seu bairro"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-64">
                                  {neighborhoods.map((n) => (
                                    <SelectItem key={n.id} value={n.id}>
                                      {n.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="street"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rua</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ex: Rua Afonso Lopes"
                                  disabled={loading}
                                  className="h-10 sm:h-11"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {neighborhoodName ? (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/6 p-4"
                          >
                            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">
                                {neighborhoodName}, {cityName}
                              </p>
                              <p className="text-xs leading-5 text-muted-foreground">
                                {
                                  "Voc\u00ea ser\u00e1 conectado \u00e0 comunidade local e aos m\u00f3dulos do seu territ\u00f3rio."
                                }
                              </p>
                            </div>
                          </motion.div>
                        ) : null}
                      </div>
                    ) : null}

                    {stepId === "confirm" ? (
                      <div className="space-y-4 sm:space-y-5">
                        <div className="space-y-1.5 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <h2 className="font-heading text-2xl font-bold text-foreground">
                            Tudo pronto
                          </h2>
                          <p className="text-sm leading-6 text-muted-foreground">
                            Confirme seus dados antes de criar a conta.
                          </p>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-border/70 bg-secondary/30">
                          <div className="flex items-start gap-3 border-b border-border/60 p-4">
                            <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                Nome
                              </p>
                              <p className="truncate text-sm font-medium text-foreground">
                                {nameValue}
                              </p>
                            </div>
                          </div>

                          {usernameValue ? (
                            <div className="flex items-start gap-3 border-b border-border/60 p-4">
                              <span className="mt-0.5 shrink-0 text-sm text-muted-foreground">
                                @
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                  Usuário
                                </p>
                                <p className="truncate text-sm font-medium text-foreground">
                                  @{usernameValue}
                                </p>
                              </div>
                            </div>
                          ) : null}

                          <div className="flex items-start gap-3 border-b border-border/60 p-4">
                            <span className="mt-0.5 shrink-0 text-sm text-muted-foreground">
                              @
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                Email
                              </p>
                              <p className="truncate text-sm font-medium text-foreground">
                                {emailValue}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-4">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                Localização
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                {neighborhoodName}, {cityName} - {stateName}
                              </p>
                              {street ? (
                                <p className="text-xs text-muted-foreground">
                                  {street}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="termsAccepted"
                          render={({ field, fieldState }) => (
                            <FormItem className="rounded-xl border border-border/70 bg-background/45 p-3">
                              <div className="flex items-start gap-3">
                                <FormControl>
                                  <Checkbox
                                    id="cadastro-terms-acceptance"
                                    checked={field.value === true}
                                    onCheckedChange={(checked) =>
                                      field.onChange(checked === true)
                                    }
                                    disabled={loading}
                                    aria-invalid={Boolean(fieldState.error)}
                                    className="mt-0.5"
                                  />
                                </FormControl>
                                <Label
                                  htmlFor="cadastro-terms-acceptance"
                                  className="cursor-pointer text-sm leading-5 text-foreground"
                                >
                                  Li e aceito os Termos de Uso, incluindo as
                                  Diretrizes da Comunidade.
                                </Label>
                              </div>
                              <p className="mt-2 pl-7 text-xs leading-5 text-muted-foreground">
                                Leia os{" "}
                                <Link
                                  to={TERMS_OF_SERVICE_PATH}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-primary hover:underline"
                                >
                                  Termos de Uso
                                </Link>{" "}
                                e as{" "}
                                <Link
                                  to={COMMUNITY_GUIDELINES_PATH}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-primary hover:underline"
                                >
                                  Diretrizes da Comunidade
                                </Link>{" "}
                                antes de confirmar. A Política de Privacidade
                                permanece disponível em{" "}
                                <Link
                                  to="/privacidade"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-primary hover:underline"
                                >
                                  Privacidade
                                </Link>
                                .
                              </p>
                              <div className="pl-7">
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : null}

                    {isLastStep && turnstile.enabled ? (
                      <div className="mt-4">
                        <AuthTurnstileGate
                          action="signup"
                          onVerify={(token) => turnstile.setToken(token)}
                          onExpire={turnstile.reset}
                          onError={turnstile.reset}
                        />
                      </div>
                    ) : null}

                    {form.formState.errors.root?.serverError?.message ? (
                      <div
                        role="alert"
                        data-testid="cadastro-server-error"
                        className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                      >
                        {form.formState.errors.root.serverError.message}
                      </div>
                    ) : null}

                    <div className="mt-6 hidden items-center justify-between border-t border-border/70 pt-5 sm:flex">
                      {currentStep > 0 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleBack}
                          disabled={loading}
                          className="gap-1.5 px-0 sm:px-3"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Voltar
                        </Button>
                      ) : (
                        <span />
                      )}

                      {!isLastStep ? (
                        <Button
                          type="button"
                          onClick={() => void handleNext(STEPS.length)}
                          disabled={loading}
                          className="h-10 gap-1.5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 sm:h-11"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                          Próximo
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={!canSubmit}
                          className="h-10 gap-1.5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 sm:h-11"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Criar minha conta
                        </Button>
                      )}
                    </div>
                  </motion.section>
                </AnimatePresence>

                {/* Sticky footer mobile — mantém as ações principais sempre visíveis */}
                <div
                  className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur sm:hidden"
                >
                  <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
                    {currentStep > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleBack}
                        disabled={loading}
                        className="h-11 min-w-[44px] gap-1.5"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                      </Button>
                    ) : (
                      <span className="min-w-[44px]" />
                    )}

                    {!isLastStep ? (
                      <Button
                        type="button"
                        onClick={() => void handleNext(STEPS.length)}
                        disabled={loading}
                        className="h-11 flex-1 gap-1.5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        Próximo
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="h-11 flex-1 gap-1.5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Criar conta
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
