import { lazy, Suspense } from "react";
import { Button } from "@/shared/components/ui/button";

type RequestMotoboyButtonProps = {
  sourceType: "business" | "passenger" | "classified" | "event" | string;
  sourceId: string;
  businessName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
};

const ModuleRequestMotoboyButton = lazy(() =>
  import("@/modules/mobility/components/RequestMotoboyButton").then((module) => ({
    default: module.RequestMotoboyButton,
  })),
);

export function RequestMotoboyButton(props: RequestMotoboyButtonProps) {
  return (
    <Suspense
      fallback={
        <Button variant={props.variant} size={props.size} className={props.className} disabled>
          Carregando...
        </Button>
      }
    >
      <ModuleRequestMotoboyButton {...props} />
    </Suspense>
  );
}

