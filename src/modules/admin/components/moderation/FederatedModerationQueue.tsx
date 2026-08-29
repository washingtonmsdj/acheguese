import { ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useFederatedModerationQueue } from "@/modules/admin/hooks/useFederatedModerationQueue";
import {
  FEDERATED_MODERATION_DOMAINS,
  type FederatedModerationDomain,
  type FederatedModerationState,
} from "@/core/moderation/services/FederatedModerationQueueService";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const DOMAIN_LABELS: Record<FederatedModerationDomain, string> = {
  community_content: "Conteudo comunitario",
  classified: "Classificados",
  vaga: "Vagas",
  review: "Avaliacoes",
  ride: "Corridas",
  group_message: "Grupos",
  community_direct: "Mensagens diretas",
  community_alert: "Alertas comunitarios",
  community_issue: "Problemas comunitarios",
};

const DOMAIN_ROUTES: Partial<Record<FederatedModerationDomain, string>> = {
  classified: "/admin/classificados/denuncias",
  vaga: "/admin/vagas",
  review: "/admin/servicos",
  ride: "/admin/reports-passageiros",
  group_message: "/admin/mensagens",
  community_direct: "/admin/mensagens",
  community_alert: "/admin/community-alerts",
  community_issue: "/admin/community-issues",
};

const STATE_LABELS: Record<FederatedModerationState, string> = {
  open: "Pendentes",
  resolved: "Resolvidas",
  dismissed: "Descartadas",
};

function humanizeCode(value: string): string {
  const normalized = value.replace(/[_-]+/g, " ").trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function FederatedModerationQueue() {
  const [state, setState] = useState<FederatedModerationState>("open");
  const [domain, setDomain] = useState<FederatedModerationDomain | "all">(
    "all",
  );
  const query = useFederatedModerationQueue({
    state,
    domain: domain === "all" ? undefined : domain,
  });

  return (
    <section
      className="overflow-hidden rounded-lg border bg-card"
      aria-labelledby="federated-moderation-title"
    >
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2
            id="federated-moderation-title"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <ShieldAlert className="h-4 w-4 text-primary" />
            Triagem federada
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Leitura unificada; decisoes continuam no dominio responsavel.
          </p>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 sm:flex">
          <Select
            value={state}
            onValueChange={(value) =>
              setState(value as FederatedModerationState)
            }
          >
            <SelectTrigger className="h-10 min-w-0 sm:w-36" aria-label="Estado da fila">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={domain}
            onValueChange={(value) =>
              setDomain(value as FederatedModerationDomain | "all")
            }
          >
            <SelectTrigger className="h-10 min-w-0 sm:w-52" aria-label="Dominio da fila">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os dominios</SelectItem>
              {FEDERATED_MODERATION_DOMAINS.map((value) => (
                <SelectItem key={value} value={value}>
                  {DOMAIN_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-10 w-10"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            title="Atualizar triagem"
            aria-label="Atualizar triagem"
          >
            <RefreshCw
              className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Carregando triagem...
        </p>
      ) : query.isError ? (
        <div className="p-6 text-center">
          <p className="text-sm text-destructive">
            Nao foi possivel carregar a triagem federada.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : query.items.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Nenhum item neste filtro.
        </p>
      ) : (
        <div className="divide-y">
          {query.items.map((item) => {
            const domainRoute = DOMAIN_ROUTES[item.domain];
            return (
              <article
                key={`${item.domain}:${item.reportId}`}
                className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {DOMAIN_LABELS[item.domain]}
                    </span>
                    {item.reportCount > 1 ? (
                      <span className="rounded border px-1.5 py-0.5 text-xs text-muted-foreground">
                        {item.reportCount} denuncias
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {humanizeCode(item.reasonCode)} · {humanizeCode(item.sourceStatus)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTimestamp(item.createdAt)} · alvo {item.targetId.slice(0, 8)}
                  </p>
                </div>

                {item.domain === "community_content" ? (
                  <Button asChild variant="outline" size="sm">
                    <a href="#community-content-moderation-title">
                      Abrir fila
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : domainRoute ? (
                  <Button asChild variant="outline" size="sm">
                    <Link to={domainRoute}>
                      Abrir fila
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {query.hasNextPage ? (
        <div className="border-t p-3 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
