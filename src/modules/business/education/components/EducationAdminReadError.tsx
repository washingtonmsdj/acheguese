import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface EducationAdminReadErrorProps {
  title: string;
  error?: unknown;
  onRetry?: () => void | Promise<void>;
}

const AUTHORIZATION_HINTS = [
  "permission denied",
  "not authorized",
  "unauthorized",
  "forbidden",
  "row-level security",
  "rls",
];

const CONNECTIVITY_HINTS = [
  "failed to fetch",
  "network",
  "networkerror",
  "timeout",
  "timed out",
  "connection",
];

function normalizeErrorHint(error: unknown): string {
  if (error instanceof Error) return error.message.toLowerCase();
  if (typeof error === "string") return error.toLowerCase();
  return "";
}

/**
 * Converts infrastructure failures into a small, safe user-facing vocabulary.
 *
 * Never return the raw backend/Supabase error here: this component is rendered
 * in authenticated product UI and must not expose SQL, policy or provider
 * internals to the browser surface.
 */
export function getEducationAdminReadErrorMessage(error: unknown): string {
  const hint = normalizeErrorHint(error);

  if (AUTHORIZATION_HINTS.some((token) => hint.includes(token))) {
    return "Sua conta não tem permissão para consultar estes dados de Educação.";
  }

  if (CONNECTIVITY_HINTS.some((token) => hint.includes(token))) {
    return "Não foi possível conectar ao serviço de Educação. Verifique a conexão e tente novamente.";
  }

  return "Não foi possível carregar os dados de Educação agora. Tente novamente.";
}

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
