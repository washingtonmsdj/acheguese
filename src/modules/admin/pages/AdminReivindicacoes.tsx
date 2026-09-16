/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle,
  Clock,
  ExternalLink,
  FileCheck2,
  MessageSquare,
  User,
  XCircle,
} from "lucide-react";
import { adminBusinessService } from "@/core/admin";
import { profileService } from "@/core/profiles/services/ProfileService";
import { AdminAccessDenied } from "@/modules/admin/components/AdminAccessDenied";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";

interface Claim {
  id: string;
  user_id: string;
  business_id: string;
  mensagem: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  documents?: unknown;
  school_type?: string | null;
  user_name?: string;
  business_name?: string;
}

type BusinessClaimRecord = {
  id: string;
  user_id: string;
  business_id: string;
  mensagem: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  documents?: unknown;
};

type ClaimFilter = "pendente" | "aprovada" | "rejeitada" | "todos";

function getOfficialEvidenceUrls(documents: unknown): string[] {
  if (!Array.isArray(documents)) return [];

  return documents.flatMap((document) => {
    if (
      !document ||
      typeof document !== "object" ||
      !("kind" in document) ||
      !("url" in document)
    ) {
      return [];
    }

    const kind = (document as { kind?: unknown }).kind;
    const url = (document as { url?: unknown }).url;
    if (kind !== "official_source_url" || typeof url !== "string") {
      return [];
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return [];
      }
      return [parsed.toString()];
    } catch {
      return [];
    }
  });
}

function statusBadge(status: string) {
  if (status === "aprovada") {
    return (
      <Badge className="border-0 bg-success/10 text-success hover:bg-success/15">
        <CheckCircle className="mr-1 h-3 w-3" aria-hidden="true" />
        Aprovada
      </Badge>
    );
  }

  if (status === "rejeitada") {
    return (
      <Badge variant="destructive" className="border-0">
        <XCircle className="mr-1 h-3 w-3" aria-hidden="true" />
        Rejeitada
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
      Pendente
    </Badge>
  );
}

export default function AdminReivindicacoes() {
  const { canModerate, isChecking } = useAdminGuard();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ClaimFilter>("pendente");
  const [processing, setProcessing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await adminBusinessService.getBusinessClaims(
        filter !== "todos" ? filter : undefined,
      );
      if (!data) {
        toast.error("Não foi possível carregar as reivindicações.");
        setClaims([]);
        return;
      }

      const enriched = await Promise.all(
        (data as BusinessClaimRecord[]).map(async (claim) => {
          const [profiles, business] = await Promise.all([
            profileService.getAccessibleProfilesByUserIds([claim.user_id]),
            adminBusinessService.getBusinessClaimDetails(claim.business_id),
          ]);
          const profile = profiles[0] ?? null;
          return {
            ...claim,
            user_name: profile?.name || "Desconhecido",
            business_name:
              (Array.isArray(business?.profiles)
                ? business.profiles?.[0]
                : business?.profiles
              )?.name || "Removida",
            school_type: business?.school_type ?? null,
          };
        }),
      );

      setClaims(enriched);
    } catch {
      setClaims([]);
      toast.error("Não foi possível carregar as reivindicações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isChecking && canModerate) {
      void fetchClaims();
    }
  }, [filter, canModerate, isChecking]);

  if (!isChecking && !canModerate) {
    return <AdminAccessDenied />;
  }

  const handleAction = async (
    claimId: string,
    action: "aprovada" | "rejeitada",
  ) => {
    const claim = claims.find((item) => item.id === claimId);
    if (!claim) return;

    const notes = reviewNotes[claimId]?.trim() || "";
    const evidenceUrls = getOfficialEvidenceUrls(claim.documents);

    if (action === "aprovada" && claim.school_type === "public") {
      if (evidenceUrls.length === 0) {
        toast.error(
          "Escola pública exige uma referência oficial antes da aprovação.",
        );
        return;
      }
      if (notes.length < 10) {
        toast.error(
          "Registre uma justificativa de revisão com pelo menos 10 caracteres.",
        );
        return;
      }
    }

    setProcessing(claimId);
    try {
      const ok = await adminBusinessService.updateClaimStatus(
        claimId,
        action,
        notes || undefined,
      );
      if (!ok) {
        toast.error("Erro ao atualizar reivindicação");
        return;
      }

      toast.success(
        action === "aprovada"
          ? "Reivindicação aprovada!"
          : "Reivindicação rejeitada.",
      );
      setReviewNotes((current) => {
        const next = { ...current };
        delete next[claimId];
        return next;
      });
      await fetchClaims();
    } catch {
      toast.error("Erro ao atualizar reivindicação");
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = claims.filter((claim) => claim.status === "pendente").length;

  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h1 className="font-display text-xl font-bold">
          Reivindicações de empresas
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie solicitações de usuários que desejam gerenciar empresas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pendente", "aprovada", "rejeitada", "todos"] as const).map(
          (item) => (
            <Button
              key={item}
              size="sm"
              variant={filter === item ? "default" : "outline"}
              onClick={() => setFilter(item)}
              className="capitalize"
              aria-pressed={filter === item}
            >
              {item === "pendente" && pendingCount > 0 && filter !== "pendente" ? (
                <span className="mr-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {pendingCount}
                </span>
              ) : null}
              {item}
            </Button>
          ),
        )}
      </div>

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Carregando reivindicações">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Building2 className="mx-auto mb-2 h-10 w-10 opacity-40" aria-hidden="true" />
          <p className="text-sm">
            Nenhuma reivindicação {filter !== "todos" ? filter : ""} encontrada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => {
            const evidenceUrls = getOfficialEvidenceUrls(claim.documents);
            const publicSchoolApprovalBlocked =
              claim.school_type === "public" &&
              (evidenceUrls.length === 0 ||
                (reviewNotes[claim.id]?.trim().length ?? 0) < 10);

            return (
              <Card
                key={claim.id}
                className="space-y-3 border-border bg-card p-4 text-card-foreground"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="truncate text-sm font-semibold">
                        {claim.business_name}
                      </span>
                      {statusBadge(claim.status)}
                      {claim.school_type === "public" ? (
                        <Badge variant="outline">Escola pública</Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3" aria-hidden="true" />
                      <span>{claim.user_name}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {new Date(claim.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>

                {evidenceUrls.length > 0 ? (
                  <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <FileCheck2
                        className="h-3.5 w-3.5 text-success"
                        aria-hidden="true"
                      />
                      Evidência institucional informada
                    </div>
                    <div className="mt-2 space-y-1">
                      {evidenceUrls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 break-all text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ExternalLink
                            className="h-3 w-3 shrink-0"
                            aria-hidden="true"
                          />
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {claim.mensagem ? (
                  <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                    <MessageSquare
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-xs text-muted-foreground">{claim.mensagem}</p>
                  </div>
                ) : null}

                {claim.status === "pendente" ? (
                  <div className="space-y-2">
                    <Textarea
                      value={reviewNotes[claim.id] ?? ""}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [claim.id]: event.target.value,
                        }))
                      }
                      maxLength={500}
                      placeholder={
                        claim.school_type === "public"
                          ? "Justificativa da revisão institucional (obrigatória para aprovar)"
                          : "Notas da revisão (opcional)"
                      }
                      className="min-h-20 text-xs"
                    />
                    {claim.school_type === "public" ? (
                      <p className="text-[11px] text-muted-foreground">
                        A aprovação transfere a autoridade real do perfil. Confirme a
                        fonte oficial e registre como a titularidade foi verificada.
                      </p>
                    ) : null}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        className="flex-1 gap-1"
                        disabled={processing === claim.id || publicSchoolApprovalBlocked}
                        onClick={() => void handleAction(claim.id, "aprovada")}
                      >
                        <CheckCircle className="h-4 w-4" aria-hidden="true" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={processing === claim.id}
                        onClick={() => void handleAction(claim.id, "rejeitada")}
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
