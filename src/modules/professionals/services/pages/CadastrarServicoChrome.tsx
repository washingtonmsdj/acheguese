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

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
      <button
        onClick={onBack}
        className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div>
        <h1 className="text-lg font-bold font-display">Cadastrar Serviço</h1>
        <p className="text-xs text-muted-foreground">
          Etapa {currentStepIdx + 1} de {STEPS.length}
        </p>
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
    <div className="px-4 pt-4 pb-2">
      {effectiveProfile && (
        <ActiveProfileBadge
          profile={effectiveProfile}
          action="cadastrando serviço como"
          className="mb-3"
        />
      )}
      <div className="flex items-center gap-1">
        {STEPS.map((item, index) => (
          <Fragment key={item.key}>
            <button
              onClick={() => onStepChange(item.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === item.key
                  ? "bg-primary text-primary-foreground"
                  : index < currentStepIdx
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 rounded ${
                  index < currentStepIdx ? "bg-primary/40" : "bg-border"
                }`}
              />
            )}
          </Fragment>
        ))}
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
    <div className="flex gap-3 pt-2">
      {step !== "info" && (
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Voltar
        </Button>
      )}

      {step !== "review" ? (
        <Button className="flex-1" onClick={onNext}>
          Próximo
        </Button>
      ) : (
        <Button className="flex-1" onClick={onSubmit} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Cadastrar Serviço
        </Button>
      )}
    </div>
  );
}
