import { CheckCircle2 } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ["Identidade", "Contato e local", "Apresentação"] as const;

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div
      className="business-edit-progress rounded-[24px] border border-territory-border bg-territory-surface p-3 sm:p-4"
      aria-label={`Etapa ${currentStep} de ${totalSteps}`}
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {Array.from({ length: totalSteps }, (_, index) => index + 1).map((step) => {
          const isCurrent = step === currentStep;
          const isCompleted = step < currentStep;
          const label = STEP_LABELS[step - 1] ?? `Etapa ${step}`;

          return (
            <div
              key={step}
              className={[
                "relative overflow-hidden rounded-2xl border px-3 py-3 transition-colors",
                isCurrent
                  ? "border-territory-brand/25 bg-territory-brand/[0.07]"
                  : isCompleted
                    ? "border-territory-brand/15 bg-territory-brand/[0.03]"
                    : "border-territory-border bg-territory-raised/60",
              ].join(" ")}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="business-edit-progress__item flex items-center gap-3">
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold",
                    isCurrent
                      ? "bg-territory-brand text-territory-on-image shadow-sm"
                      : isCompleted
                        ? "bg-territory-brand/12 text-territory-brand"
                        : "bg-territory-raised text-territory-muted",
                  ].join(" ")}
                >
                  {isCompleted ? <CheckCircle2 className="h-4.5 w-4.5" /> : step}
                </span>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-territory-muted">
                    Etapa {step}
                  </p>
                  <p
                    className={[
                      "mt-0.5 text-sm font-semibold",
                      isCurrent || isCompleted ? "text-territory-ink" : "text-territory-muted",
                    ].join(" ")}
                  >
                    {label}
                  </p>
                </div>
              </div>

              {isCurrent ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-territory-brand" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
