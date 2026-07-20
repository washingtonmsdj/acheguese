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
import { PasswordInput } from "@/app/components/auth/PasswordInput";
import { useCadastro } from "@/app/features/onboarding/hooks/useCadastro";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  COMMUNITY_GUIDELINES_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/core/legal/termsOfService";
import { AUTH_PASSWORD_MIN_LENGTH } from "@/core/auth/utils/passwordPolicy";
import { useLocationCascade } from "@/core/location/hooks/useLocationCascade";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
}: {
  currentStep: number;
  onBack: () => void;
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
                if (index < currentStep) onBack();
              }}
              disabled={index > currentStep}
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
    currentStep,
    formData,
    errors,
    loading,
    updateField,
    setTermsAccepted,
    selectState,
    selectCity,
    selectNeighborhood,
    handleNext,
    handleBack,
    handleSubmit,
  } = useCadastro();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  const {
    states,
    cities,
    neighborhoods,
    loadingStates,
    loadingCities,
    loadingNeighborhoods,
  } = useLocationCascade(formData.stateId || null, formData.cityId || null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const passwordRequirements = getAuthPasswordRequirementStatus(
    formData.password,
  );

  const activeStep = STEPS.at(currentStep) ?? STEPS[0];
  const stepId = activeStep.id;
  const nextStepLabel =
    currentStep < STEPS.length - 1 ? STEPS[currentStep + 1]?.label : null;

  return (
    <>
      <Helmet>
        <title>Criar conta | Achegue-se</title>
        <meta
          name="description"
          content="Crie sua conta Achegue-se para participar da comunidade, conectar-se ao seu bairro e acessar servicos e negocios locais."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <AuthBrandHeader
          secondaryHref="/login"
          secondaryLabel="Ja tenho conta"
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
                    Conta, territorio e comunidade no mesmo fluxo.
                  </p>
                </div>
                {nextStepLabel ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.68rem] font-medium text-primary">
                    Proximo: {nextStepLabel}
                  </span>
                ) : null}
              </div>
            </div>
            <StepIndicator currentStep={currentStep} onBack={handleBack} />

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
                        Criacao de conta
                      </p>
                      <h1 className="font-heading text-2xl font-bold text-foreground sm:text-[2rem]">
                        Crie sua conta
                      </h1>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Conecte-se com o que acontece no seu bairro.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        value={formData.name}
                        onChange={(event) =>
                          updateField("name", event.target.value)
                        }
                        className={cn(
                          "h-10 sm:h-11",
                          errors.name && "border-destructive",
                        )}
                        autoComplete="name"
                      />
                      {errors.name ? (
                        <p className="text-xs text-destructive">
                          {errors.name}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="username">Nome de usuario *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          @
                        </span>
                        <Input
                          id="username"
                          placeholder="seunome"
                          value={formData.username}
                          onChange={(event) =>
                            updateField(
                              "username",
                              event.target.value
                                .replace(/[^a-z0-9_]/g, "")
                                .toLowerCase(),
                            )
                          }
                          onKeyDown={(event) =>
                            setCapsLock(event.getModifierState("CapsLock"))
                          }
                          onKeyUp={(event) =>
                            setCapsLock(event.getModifierState("CapsLock"))
                          }
                          className={cn(
                            "h-10 pl-8 sm:h-11",
                            errors.username && "border-destructive",
                          )}
                          autoComplete="username"
                        />
                      </div>
                      {capsLock ? (
                        <p className="text-xs text-amber-500">
                          Caps Lock ativo. Apenas letras minusculas sao aceitas.
                        </p>
                      ) : null}
                      {errors.username ? (
                        <p className="text-xs text-destructive">
                          {errors.username}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                        className={cn(
                          "h-10 sm:h-11",
                          errors.email && "border-destructive",
                        )}
                        autoComplete="email"
                      />
                      {errors.email ? (
                        <p className="text-xs text-destructive">
                          {errors.email}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password">Senha *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={`M\u00ednimo ${AUTH_PASSWORD_MIN_LENGTH} caracteres`}
                          value={formData.password}
                          onChange={(event) =>
                            updateField("password", event.target.value)
                          }
                          className={cn(
                            "h-10 pr-10 sm:h-11",
                            errors.password && "border-destructive",
                          )}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={
                            showPassword ? "Ocultar senha" : "Mostrar senha"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password ? (
                        <p className="text-xs text-destructive">
                          {errors.password}
                        </p>
                      ) : null}
                      {formData.password ? (
                        <div className="space-y-1 rounded-2xl border border-border/60 bg-secondary/35 p-3">
                          {passwordRequirements.map((requirement) => (
                            <div
                              key={requirement.id}
                              className={cn(
                                "text-xs",
                                requirement.satisfied
                                  ? "text-emerald-400"
                                  : "text-muted-foreground",
                              )}
                            >
                              {requirement.satisfied ? "OK" : "-"}{" "}
                              {requirement.label}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repita a senha"
                          value={formData.confirmPassword}
                          onChange={(event) =>
                            updateField("confirmPassword", event.target.value)
                          }
                          className={cn(
                            "h-10 pr-10 sm:h-11",
                            errors.confirmPassword && "border-destructive",
                          )}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((current) => !current)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={
                            showConfirmPassword
                              ? "Ocultar senha"
                              : "Mostrar senha"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword ? (
                        <p className="text-xs text-destructive">
                          {errors.confirmPassword}
                        </p>
                      ) : null}
                    </div>
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

                    <div className="space-y-1.5">
                      <Label>Estado *</Label>
                      <Select
                        value={formData.stateId}
                        onValueChange={(id) => {
                          const found = states.find((state) => state.id === id);
                          if (found) selectState(found.id, found.name);
                        }}
                        disabled={loadingStates}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10 sm:h-11",
                            errors.stateId && "border-destructive",
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
                        <SelectContent className="max-h-64">
                          {states.map((state) => (
                            <SelectItem key={state.id} value={state.id}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.stateId ? (
                        <p className="text-xs text-destructive">
                          {errors.stateId}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label>Cidade *</Label>
                      <Select
                        value={formData.cityId}
                        onValueChange={(id) => {
                          const found = cities.find((city) => city.id === id);
                          if (found) selectCity(found.id, found.name);
                        }}
                        disabled={!formData.stateId || loadingCities}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10 sm:h-11",
                            errors.cityId && "border-destructive",
                          )}
                        >
                          <SelectValue
                            placeholder={
                              !formData.stateId
                                ? "Selecione o estado primeiro"
                                : loadingCities
                                  ? "Carregando..."
                                  : "Selecione a cidade"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.cityId ? (
                        <p className="text-xs text-destructive">
                          {errors.cityId}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label>Bairro *</Label>
                      <Select
                        value={formData.neighborhoodId}
                        onValueChange={(id) => {
                          const found = neighborhoods.find(
                            (neighborhood) => neighborhood.id === id,
                          );
                          if (found) selectNeighborhood(found.id, found.name);
                        }}
                        disabled={!formData.cityId || loadingNeighborhoods}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10 sm:h-11",
                            errors.neighborhoodId && "border-destructive",
                          )}
                        >
                          <SelectValue
                            placeholder={
                              !formData.cityId
                                ? "Selecione a cidade primeiro"
                                : loadingNeighborhoods
                                  ? "Carregando..."
                                  : "Selecione seu bairro"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {neighborhoods.map((neighborhood) => (
                            <SelectItem
                              key={neighborhood.id}
                              value={neighborhood.id}
                            >
                              {neighborhood.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.neighborhoodId ? (
                        <p className="text-xs text-destructive">
                          {errors.neighborhoodId}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cadastro-street">Rua</Label>
                      <Input
                        id="cadastro-street"
                        value={formData.street}
                        onChange={(event) =>
                          updateField("street", event.target.value)
                        }
                        placeholder="Ex: Rua Afonso Lopes"
                        className={cn(
                          "h-10 sm:h-11",
                          errors.street && "border-destructive",
                        )}
                      />
                      {errors.street ? (
                        <p className="text-xs text-destructive">
                          {errors.street}
                        </p>
                      ) : null}
                    </div>

                    {formData.neighborhoodName ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/6 p-4"
                      >
                        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {formData.neighborhoodName}, {formData.cityName}
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
                          <p className="text-xs text-muted-foreground">Nome</p>
                          <p className="truncate text-sm font-medium text-foreground">
                            {formData.name}
                          </p>
                        </div>
                      </div>

                      {formData.username ? (
                        <div className="flex items-start gap-3 border-b border-border/60 p-4">
                          <span className="mt-0.5 shrink-0 text-sm text-muted-foreground">
                            @
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              Usuario
                            </p>
                            <p className="truncate text-sm font-medium text-foreground">
                              @{formData.username}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-start gap-3 border-b border-border/60 p-4">
                        <span className="mt-0.5 shrink-0 text-sm text-muted-foreground">
                          Mail
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="truncate text-sm font-medium text-foreground">
                            {formData.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Localizacao
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {formData.neighborhoodName}, {formData.cityName} -{" "}
                            {formData.stateName}
                          </p>
                          {formData.street ? (
                            <p className="text-xs text-muted-foreground">
                              {formData.street}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/45 p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="cadastro-terms-acceptance"
                          checked={formData.termsAccepted}
                          onCheckedChange={(checked) =>
                            setTermsAccepted(checked === true)
                          }
                          aria-invalid={Boolean(errors.termsAccepted)}
                          aria-describedby={
                            errors.termsAccepted
                              ? "cadastro-terms-acceptance-error"
                              : undefined
                          }
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor="cadastro-terms-acceptance"
                          className="cursor-pointer text-sm leading-5 text-foreground"
                        >
                          Li e aceito os Termos de Uso, incluindo as Diretrizes
                          da Comunidade.
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
                        antes de confirmar. A Política de Privacidade permanece
                        disponível em{" "}
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
                      {errors.termsAccepted ? (
                        <p
                          id="cadastro-terms-acceptance-error"
                          role="alert"
                          className="mt-2 pl-7 text-xs font-medium text-destructive"
                        >
                          {errors.termsAccepted}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-5">
                  {currentStep > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleBack}
                      className="gap-1.5 px-0 sm:px-3"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar
                    </Button>
                  ) : (
                    <span />
                  )}

                  {currentStep < STEPS.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => handleNext(STEPS.length)}
                      className="h-10 gap-1.5 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 sm:h-11"
                    >
                      Próximo
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading || !formData.termsAccepted}
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
          </div>
        </main>
      </div>
    </>
  );
}
