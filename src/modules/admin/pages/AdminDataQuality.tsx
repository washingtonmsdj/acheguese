import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, RefreshCw, SearchCheck, XCircle } from "lucide-react";
import { useState } from "react";

import {
  BUSINESS_PROFILE_CORRECTION_FIELDS,
  BusinessProfileCorrectionService,
  type BusinessProfileCorrectionQueueItem,
  type BusinessProfileCorrectionStatus,
} from "@/core/business/services/BusinessProfileCorrectionService";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useToast } from "@/shared/hooks/use-toast";

const STATUS_LABELS: Record<BusinessProfileCorrectionStatus, string> = {
  pending: "Pendentes",
  under_review: "Em analise",
  applied: "Aplicadas",
  rejected: "Rejeitadas",
};

function fieldLabel(item: BusinessProfileCorrectionQueueItem): string {
  return (
    BUSINESS_PROFILE_CORRECTION_FIELDS.find(
      (field) => field.id === item.field_code,
    )?.label ?? item.field_code
  );
}

export default function AdminDataQuality() {
  const [status, setStatus] =
    useState<BusinessProfileCorrectionStatus>("pending");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["admin", "business-profile-corrections", status],
    queryFn: () => BusinessProfileCorrectionService.listQueue(status, 50),
  });

  const action = useMutation({
    mutationFn: async (input: {
      item: BusinessProfileCorrectionQueueItem;
      kind: "apply" | "review" | "reject";
    }) => {
      if (input.kind === "apply") {
        return BusinessProfileCorrectionService.apply(input.item.id);
      }
      return BusinessProfileCorrectionService.resolve({
        correctionId: input.item.id,
        status: input.kind === "review" ? "under_review" : "rejected",
        adminNotes:
          input.kind === "review"
            ? "Encaminhada para verificacao manual."
            : "Rejeitada apos revisao administrativa.",
      });
    },
    onSuccess: async (_, variables) => {
      toast({
        title:
          variables.kind === "apply"
            ? "Correcao aplicada"
            : variables.kind === "review"
              ? "Correcao em analise"
              : "Correcao rejeitada",
        description:
          variables.kind === "apply"
            ? "O valor canonico foi atualizado no SSOT."
            : "A fila de qualidade de dados foi atualizada.",
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "business-profile-corrections"],
      });
    },
    onError: (error) => {
      toast({
        title: "Falha ao processar correcao",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold font-display">
            <SearchCheck className="h-6 w-6 text-primary" />
            Qualidade de dados
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sugestoes factuais ficam separadas de denuncias. Campos seguros
            podem ser aplicados diretamente ao SSOT; os demais exigem revisao
            manual.
          </p>
        </div>

        <div className="flex gap-2">
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as BusinessProfileCorrectionStatus)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            aria-label="Atualizar fila"
          >
            <RefreshCw
              className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </header>

      {query.isLoading ? (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Carregando correcoes...
        </p>
      ) : query.isError ? (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-destructive">
            Nao foi possivel carregar a fila.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (query.data ?? []).length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Nenhuma correcao neste estado.
        </p>
      ) : (
        <div className="space-y-3">
          {(query.data ?? []).map((item) => {
            const canAutoApply =
              BusinessProfileCorrectionService.canAutoApply(item.field_code);
            const open =
              item.status === "pending" || item.status === "under_review";

            return (
              <article
                key={item.id}
                className="rounded-lg border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{item.business_name}</h2>
                      <Badge variant="secondary">{fieldLabel(item)}</Badge>
                      <Badge variant="outline">
                        {STATUS_LABELS[item.status]}
                      </Badge>
                      {canAutoApply ? (
                        <Badge className="bg-emerald-600 text-white">
                          Autoaplicavel
                        </Badge>
                      ) : (
                        <Badge variant="outline">Revisao manual</Badge>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Valor proposto
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {item.proposed_value}
                      </p>
                    </div>

                    {item.explanation ? (
                      <p className="text-sm text-muted-foreground">
                        {item.explanation}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(item.created_at))}
                      </span>
                      <span>Business {item.business_id.slice(0, 8)}</span>
                      <span>Profile {item.profile_id.slice(0, 8)}</span>
                      {item.source_url ? (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Abrir fonte
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {open ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {canAutoApply ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            action.mutate({ item, kind: "apply" })
                          }
                          disabled={action.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Aplicar ao SSOT
                        </Button>
                      ) : null}

                      {item.status === "pending" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            action.mutate({ item, kind: "review" })
                          }
                          disabled={action.isPending}
                        >
                          Em analise
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          action.mutate({ item, kind: "reject" })
                        }
                        disabled={action.isPending}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
