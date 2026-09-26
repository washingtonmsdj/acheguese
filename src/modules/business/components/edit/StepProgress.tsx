import { CheckCircle2 } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ["Identidade", "Contato e local", "Apresentação"] as const;

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div
      className="mb-6 rounded-[24px] border border-border bg-card p-3 sm:p-4"
      aria-label={`Etapa ${currentStep} de ${totalSteps}`}
    >
      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
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
                  ? "border-primary/25 bg-primary/[0.07]"
                  : isCompleted
                    ? "border-primary/15 bg-primary/[0.03]"
                    : "border-border bg-background/60",
              ].join(" ")}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold",
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isCompleted
                        ? "bg-primary/12 text-primary"
                        : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {isCompleted ? <CheckCircle2 className="h-4.5 w-4.5" /> : step}
                </span>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Etapa {step}
                  </p>
                  <p
                    className={[
                      "mt-0.5 truncate text-sm font-semibold",
                      isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {label}
                  </p>
                </div>
              </div>

              {isCurrent ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
