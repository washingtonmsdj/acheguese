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
    <div className="sticky top-0 z-20 border-b border-territory-border bg-territory-surface/95 backdrop-blur supports-[backdrop-filter]:bg-territory-surface/85">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-territory-border bg-territory-surface text-territory-ink transition-colors hover:bg-territory-raised"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-territory-ink sm:text-lg">
            Cadastrar serviço
          </h1>
          <p className="text-xs text-territory-muted">
            Etapa {currentStepIdx + 1} de {STEPS.length}
          </p>
        </div>

        <div className="rounded-full border border-territory-brand/25 bg-territory-brand/10 px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-territory-brand">
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
          action="cadastrando serviço como"
          className="w-full"
        />
      ) : null}

      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-2">
          {STEPS.map((item, index) => (
            <Fragment key={item.key}>
              <button
                type="button"
                onClick={() => onStepChange(item.key)}
                className={`flex min-w-[7.25rem] items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-medium transition-all ${
                  step === item.key
                    ? "border-territory-brand/30 bg-territory-brand text-territory-on-image shadow-sm"
                    : index < currentStepIdx
                      ? "border-territory-brand/20 bg-territory-brand/10 text-territory-brand"
                      : "border-territory-border bg-territory-surface text-territory-muted"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    step === item.key
                      ? "bg-territory-on-image/15 text-territory-on-image"
                      : index < currentStepIdx
                        ? "bg-territory-brand/15 text-territory-brand"
                        : "bg-territory-raised text-territory-muted"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="truncate">{item.label}</span>
              </button>

              {index < STEPS.length - 1 ? (
                <div
                  className={`h-px w-4 rounded sm:w-6 ${
                    index < currentStepIdx
                      ? "bg-territory-brand/40"
                      : "bg-territory-border"
                  }`}
                  aria-hidden="true"
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
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-territory-border bg-territory-surface/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 backdrop-blur supports-[backdrop-filter]:bg-territory-surface/85 sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {step !== "info" ? (
          <Button
            variant="outline"
            className="h-11 w-full border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised sm:flex-1"
            onClick={onBack}
          >
            Voltar
          </Button>
        ) : null}

        {step !== "review" ? (
          <Button
            className="h-11 w-full bg-territory-brand text-territory-on-image hover:bg-territory-brand/90 sm:flex-1"
            onClick={onNext}
          >
            Próximo
          </Button>
        ) : (
          <Button
            className="h-11 w-full bg-territory-brand text-territory-on-image hover:bg-territory-brand/90 sm:flex-1"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Publicar serviço
          </Button>
        )}
      </div>
    </div>
  );
}
