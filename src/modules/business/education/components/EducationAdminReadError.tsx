import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface EducationAdminReadErrorProps {
  title: string;
  error?: unknown;
  onRetry?: () => void | Promise<void>;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "A leitura dos dados falhou. Nenhum estado vazio artificial foi exibido.";
}

export function EducationAdminReadError({
  title,
  error,
  onRetry,
}: EducationAdminReadErrorProps) {
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="mb-3 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <h1 className="font-semibold">{title}</h1>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {errorMessage(error)}
        </p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void onRetry()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        ) : null}
      </div>
    </div>
  );
}
