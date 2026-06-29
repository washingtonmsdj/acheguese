import type { ComponentProps } from "react";
import { Fragment } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import { Button } from "@/shared/components/ui/button";
import { STEPS, type Step } from "./CadastrarServicoPage.model";

type ActiveProfile = ComponentProps<typeof ActiveProfileBadge>["profile"];

type HeaderProps = {
  step: Step;
  onBack: () => void;
};

export function CadastrarServicoHeader({ step, onBack }: HeaderProps) {
  const currentStepIdx = STEPS.findIndex((item) => item.key === step);
  const currentStep = STEPS[currentStepIdx];

  return (
    <div className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-secondary"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
            Cadastrar servico
          </h1>
          <p className="text-xs text-muted-foreground">
            Etapa {currentStepIdx + 1} de {STEPS.length}
          </p>
        </div>

        <div className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-primary">
          {currentStep?.label ?? "Fluxo"}
        </div>
      </div>
    </div>
  );
}

type StepIndicatorProps = {
  step: Step;
  effectiveProfile: ActiveProfile | null | undefined;
  onStepChange: (step: Step) => void;
};

export function CadastrarServicoStepIndicator({
  step,
  effectiveProfile,
  onStepChange,
}: StepIndicatorProps) {
  const currentStepIdx = STEPS.findIndex((item) => item.key === step);

  return (
    <div className="space-y-3">
      {effectiveProfile ? (
        <ActiveProfileBadge
          profile={effectiveProfile}
          action="cadastrando servico como"
          className="w-full"
        />
      ) : null}

      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-2">
          {STEPS.map((item, index) => (
            <Fragment key={item.key}>
              <button
                onClick={() => onStepChange(item.key)}
                className={`flex min-w-[7.25rem] items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-medium transition-all ${
                  step === item.key
                    ? "border-primary/30 bg-primary text-primary-foreground shadow-[0_12px_30px_-18px_rgba(0,214,201,0.95)]"
                    : index < currentStepIdx
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-border/70 bg-card text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    step === item.key
                      ? "bg-primary-foreground/16 text-primary-foreground"
                      : index < currentStepIdx
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{item.label}</span>
              </button>

              {index < STEPS.length - 1 ? (
                <div
                  className={`h-px w-4 rounded sm:w-6 ${
                    index < currentStepIdx ? "bg-primary/40" : "bg-border"
                  }`}
                />
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

type NavigationProps = {
  step: Step;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

export function CadastrarServicoNavigation({
  step,
  loading,
  onBack,
  onNext,
  onSubmit,
}: NavigationProps) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border/70 bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:mx-0 sm:rounded-2xl sm:border sm:bg-card/90 sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {step !== "info" ? (
          <Button variant="outline" className="h-11 w-full sm:flex-1" onClick={onBack}>
            Voltar
          </Button>
        ) : null}

        {step !== "review" ? (
          <Button className="h-11 w-full sm:flex-1" onClick={onNext}>
            Proximo
          </Button>
        ) : (
          <Button className="h-11 w-full sm:flex-1" onClick={onSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publicar servico
          </Button>
        )}
      </div>
    </div>
  );
}
