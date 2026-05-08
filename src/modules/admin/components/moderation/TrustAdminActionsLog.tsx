import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Search } from "lucide-react";
import { TrustEventService, type TrustAdminAction } from "@/core/trust";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionLabel(actionType: TrustAdminAction["action_type"]) {
  switch (actionType) {
    case "warning":
      return "Aviso";
    case "temporary_restriction":
      return "Restricao temporaria";
    case "clear_restriction":
      return "Desbloqueio";
    default:
      return actionType;
  }
}

export function TrustAdminActionsLog() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "trust-admin-actions-log"],
    queryFn: async () => {
      const result = await TrustEventService.listAdminActions(200);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const actions = data ?? [];
    if (!term) return actions;
    return actions.filter((item) => {
      const text = [
        item.action_type,
        item.reason,
        item.notes ?? "",
        item.subject_role,
        item.subject_profile_id,
        item.applied_by_profile_id,
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(term);
    });
  }, [data, search]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Audit Log de moderacao ({filtered.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por acao, motivo, perfil ou admin"
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando auditoria...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma acao administrativa registrada.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{actionLabel(item.action_type)}</Badge>
                  <Badge variant="secondary">{item.subject_role}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                </div>
                <p className="mt-2 text-sm font-medium">{item.reason}</p>
                {item.notes ? <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  Perfil alvo #{item.subject_profile_id.slice(0, 8)} - Admin #
                  {item.applied_by_profile_id.slice(0, 8)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
