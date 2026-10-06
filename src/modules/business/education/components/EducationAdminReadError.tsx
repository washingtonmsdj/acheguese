import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface EducationAdminReadErrorProps {
  title: string;
  error?: unknown;
  onRetry?: () => void | Promise<void>;
}

import { getEducationAdminReadErrorMessage } from "./educationAdminErrorMessage";

export function EducationAdminReadError({
  title,
  error,
  onRetry,
}: EducationAdminReadErrorProps) {
  return (
    <div className="container mx-auto max-w-3xl p-6 text-territory-ink">
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-xl border border-territory-error/25 bg-territory-error/10 p-6"
      >
        <div className="mb-3 flex items-center gap-2 text-territory-error">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <h1 className="font-heading font-semibold">{title}</h1>
        </div>
        <p className="mb-4 text-sm text-territory-muted">
          {getEducationAdminReadErrorMessage(error)}
        </p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void onRetry()}
            className="gap-2 border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised hover:text-territory-ink"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </Button>
        ) : null}
      </div>
    </div>
  );
}
