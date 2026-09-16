import { Shield } from "lucide-react";

interface AdminAccessDeniedProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export function AdminAccessDenied({
  title = "Acesso negado",
  description = "Apenas administradores podem acessar esta página.",
  compact = false,
}: AdminAccessDeniedProps) {
  return (
    <div
      className={
        compact
          ? "flex min-h-80 items-center justify-center"
          : "flex min-h-screen items-center justify-center bg-background p-4 text-foreground"
      }
      role="status"
    >
      <div className="space-y-2 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <Shield className="h-8 w-8 text-destructive" aria-hidden="true" />
        </span>
        <h1 className={compact ? "font-semibold text-foreground" : "text-2xl font-bold text-foreground"}>
          {title}
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
