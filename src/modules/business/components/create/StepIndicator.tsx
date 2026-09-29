import { CheckCircle2 } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_LABELS = ["Dados básicos", "Localização", "Contato e horário", "Fotos", "Revisar e publicar"] as const;

export function StepIndicator({
  currentStep,
  totalSteps = 5,
}: StepIndicatorProps) {
  return (
    <div
      className="bcr-steps"
      aria-label={`Etapa ${currentStep} de ${totalSteps}`}
    >
      <div className="bcr-steps__track">
        {Array.from({ length: totalSteps }, (_, index) => index + 1).map((step) => {
          const isCurrent = step === currentStep;
          const isCompleted = step < currentStep;
          const label = STEP_LABELS[step - 1] ?? `Etapa ${step}`;

          return (
            <div
              key={step}
              className={`bcr-step${isCurrent ? " is-current" : ""}${isCompleted ? " is-complete" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="bcr-step__content">
                <span
                  className="bcr-step__number"
                >
                  {isCompleted ? <CheckCircle2 className="h-4.5 w-4.5" /> : step}
                </span>

                <div className="bcr-step__label">
                  <p>
                    {label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="bcr-steps__mobile-label" aria-hidden="true">
        Etapa {currentStep} de {totalSteps} · {STEP_LABELS[currentStep - 1] ?? `Etapa ${currentStep}`}
      </p>
    </div>
  );
}
