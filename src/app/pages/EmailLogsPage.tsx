import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Mail,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/core/auth/hooks/useAuth";
import { useEmail } from "@/core/notifications/hooks/useEmail";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ptBR } from "@/shared/utils/dateLocale";

const surfaceClass =
  "border-territory-border bg-territory-surface text-territory-ink shadow-sm";

function getStatusIcon(status: string) {
  switch (status) {
    case "sent":
      return <CheckCircle className="h-4 w-4 text-territory-success" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-territory-error" />;
    case "bounced":
      return <AlertCircle className="h-4 w-4 text-territory-warning" />;
    default:
      return <Mail className="h-4 w-4 text-territory-muted" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "sent":
      return (
        <Badge className="bg-territory-success/12 text-territory-success hover:bg-territory-success/16">
          Enviado
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-territory-error/12 text-territory-error hover:bg-territory-error/16">
          Falhou
        </Badge>
      );
    case "bounced":
      return (
        <Badge className="bg-territory-warning/12 text-territory-warning hover:bg-territory-warning/16">
          Devolvido
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="border-territory-border bg-territory-raised text-territory-muted"
        >
          {status}
        </Badge>
      );
  }
}

function getCategoryBadge(category: string) {
  const className = (() => {
    switch (category) {
      case "transactional":
        return "bg-territory-info/12 text-territory-info";
      case "social":
        return "bg-territory-brand/10 text-territory-brand";
      case "system":
        return "bg-territory-warning/12 text-territory-warning";
      case "marketing":
        return "bg-territory-sun/35 text-territory-ink";
      default:
        return "bg-territory-raised text-territory-muted";
    }
  })();

  return <Badge className={className}>{category}</Badge>;
}

export default function EmailLogsPage() {
  const { user } = useAuth();
  const { emailLogs, isLoadingLogs, refetchLogs } = useEmail(user?.id);

  const sentCount = emailLogs.filter((log) => log.status === "sent").length;
  const failedCount = emailLogs.filter((log) => log.status === "failed").length;
  const bouncedCount = emailLogs.filter((log) => log.status === "bounced").length;

  const stats = [
    { label: "Total", value: emailLogs.length, className: "text-territory-ink" },
    { label: "Enviados", value: sentCount, className: "text-territory-success" },
    { label: "Falharam", value: failedCount, className: "text-territory-error" },
    { label: "Devolvidos", value: bouncedCount, className: "text-territory-warning" },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 text-territory-ink sm:px-6">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-territory-border bg-territory-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-territory-brand/10 text-territory-brand">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Histórico de e-mails
              </h1>
              <p className="mt-1 text-sm text-territory-muted">
                Acompanhe as mensagens enviadas para sua conta.
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => void refetchLogs()}
          disabled={isLoadingLogs}
          variant="outline"
          className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoadingLogs ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Atualizar
        </Button>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Resumo dos e-mails">
        {stats.map((stat) => (
          <Card key={stat.label} className={surfaceClass}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-territory-muted">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${stat.className}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className={surfaceClass}>
        <CardHeader>
          <CardTitle>E-mails enviados</CardTitle>
          <CardDescription className="text-territory-muted">
            Até 50 registros recentes vinculados à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="flex min-h-40 items-center justify-center text-sm text-territory-muted" role="status">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Carregando histórico…
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="py-10 text-center text-territory-muted">
              <Mail className="mx-auto mb-3 h-10 w-10 opacity-60" aria-hidden="true" />
              <p>Nenhum e-mail registrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => (
                <article
                  key={log.id}
                  className="flex items-start gap-3 rounded-2xl border border-territory-border bg-territory-canvas/45 p-4 transition-colors hover:bg-territory-raised/70"
                >
                  <div className="mt-1 shrink-0">{getStatusIcon(log.status)}</div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 truncate text-sm font-semibold text-territory-ink">
                        {log.subject}
                      </h2>
                      {getStatusBadge(log.status)}
                      {getCategoryBadge(log.category)}
                    </div>

                    <p className="mt-1 text-sm text-territory-muted">
                      Para: {log.recipient_email}
                    </p>

                    {log.error_message ? (
                      <div className="mt-2 rounded-xl border border-territory-error/25 bg-territory-error/10 p-2.5">
                        <p className="text-sm text-territory-error">
                          <strong>Erro:</strong> {log.error_message}
                        </p>
                      </div>
                    ) : null}

                    <p className="mt-2 text-xs text-territory-muted">
                      {formatDistanceToNow(new Date(log.sent_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={`mt-6 ${surfaceClass}`}>
        <CardHeader>
          <CardTitle className="text-sm">Sobre os tipos de e-mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-territory-muted">
          <p><strong className="text-territory-ink">Transacionais:</strong> confirmação de conta, recuperação de senha e outras ações essenciais.</p>
          <p><strong className="text-territory-ink">Sistema:</strong> segurança, autenticação e avisos operacionais.</p>
          <p><strong className="text-territory-ink">Sociais:</strong> interações e atividades relacionadas às superfícies sociais ativas.</p>
          <p><strong className="text-territory-ink">Marketing:</strong> comunicações opcionais, quando habilitadas nas preferências.</p>
        </CardContent>
      </Card>
    </div>
  );
}
