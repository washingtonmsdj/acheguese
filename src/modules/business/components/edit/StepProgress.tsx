// @ts-nocheck
import { CheckCircle2 } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center flex-1">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
              step === currentStep
                ? "bg-primary text-primary-foreground"
                : step < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
            }`}
          >
            {step < currentStep ? <CheckCircle2 className="h-5 w-5" /> : step}
          </div>
          {step < totalSteps && (
            <div
              className={`h-1 flex-1 mx-2 ${step < currentStep ? "bg-primary" : "bg-secondary"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
