import { cn } from "@/shared/utils/cn";

interface Step {
  id: number;
  title: string;
  icon: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  totalSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="px-3 pb-2">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 transition-all",
              currentStep >= step.id ? "text-primary" : "text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all",
                currentStep >= step.id
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30",
              )}
            >
              {currentStep > step.id ? "✓" : step.icon}
            </div>
            <span className="text-xs font-medium hidden sm:block">
              {step.title}
            </span>
          </button>
        ))}
      </div>

      <div className="w-full bg-muted rounded-full h-1">
        <div
          className="bg-primary h-1 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}
