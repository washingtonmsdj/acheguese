/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  User,
  MessageSquare,
  Shield,
  ExternalLink,
  FileCheck2,
} from "lucide-react";
import { adminBusinessService } from "@/core/admin";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { profileService } from "@/core/profiles/services/ProfileService";

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

export default function AdminReivindicacoes() {
  const { canModerate, isChecking } = useAdminGuard();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "pendente" | "aprovada" | "rejeitada" | "todos"
  >("pendente");
  const [processing, setProcessing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const fetchClaims = async () => {
    setLoading(true);
    const data = await adminBusinessService.getBusinessClaims(
      filter !== "todos" ? filter : undefined,
    );
    if (!data) {
      toast.error("Error load reivindicações");
      setLoading(false);
      return;
    }

    // Enrich with user and business names using ProfileService
    const enriched = await Promise.all(
      ((data || []) as BusinessClaimRecord[]).map(async (claim) => {
        const [profiles, biz] = await Promise.all([
          profileService.getAccessibleProfilesByUserIds([claim.user_id]),
          adminBusinessService.getBusinessClaimDetails(claim.business_id),
        ]);
        const profile = profiles[0] ?? null;
        return {
          ...claim,
          user_name: profile?.name || "Desconhecido",
          business_name:
            (Array.isArray(biz?.profiles) ? biz.profiles?.[0] : biz?.profiles)
              ?.name || "Removida",
          school_type: biz?.school_type ?? null,
        };
      }),
    );

    setClaims(enriched);
    setLoading(false);
  };

  useEffect(() => {
    if (!isChecking && canModerate) {
      fetchClaims();
    }
  }, [filter, canModerate, isChecking]);

  // Validação de admin
  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
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
    const ok = await adminBusinessService.updateClaimStatus(
      claimId,
      action,
      notes || undefined,
    );
    if (!ok) {
      toast.error("Erro ao atualizar reivindicação");
      setProcessing(null);
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
    setProcessing(null);
    fetchClaims();
  };

  const statusBadge = (s: string) => {
    if (s === "aprovada")
      return (
        <Badge className="bg-green-500/15 text-green-600 border-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovada
        </Badge>
      );
    if (s === "rejeitada")
      return (
        <Badge variant="destructive" className="border-0">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitada
        </Badge>
      );
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  const pendingCount = claims.filter((c) => c.status === "pendente").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display">
          Reivindicações de Empresas
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie solicitações de usuários que desejam gerenciar empresas.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["pendente", "aprovada", "rejeitada", "todos"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === "pendente" && pendingCount > 0 && filter !== "pendente" && (
              <span className="mr-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold inline-flex items-center justify-center">
                {pendingCount}
              </span>
            )}
            {f}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            Nenhuma reivindicação {filter !== "todos" ? filter : ""} encontrada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <Card key={claim.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-sm truncate">
                      {claim.business_name}
                    </span>
                    {statusBadge(claim.status)}
                    {claim.school_type === "public" ? (
                      <Badge variant="outline">Escola pública</Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{claim.user_name}</span>
                    <span>·</span>
                    <span>
                      {new Date(claim.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>

              {getOfficialEvidenceUrls(claim.documents).length > 0 && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                    Evidência institucional informada
                  </div>
                  <div className="mt-2 space-y-1">
                    {getOfficialEvidenceUrls(claim.documents).map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 break-all text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {claim.mensagem && (
                <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {claim.mensagem}
                  </p>
                </div>
              )}

              {claim.status === "pendente" && (
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
                  <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    disabled={
                      processing === claim.id ||
                      (claim.school_type === "public" &&
                        (getOfficialEvidenceUrls(claim.documents).length === 0 ||
                          (reviewNotes[claim.id]?.trim().length ?? 0) < 10))
                    }
                    onClick={() => handleAction(claim.id, "aprovada")}
                  >
                    <CheckCircle className="h-4 w-4" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1 text-destructive hover:text-destructive"
                    disabled={processing === claim.id}
                    onClick={() => handleAction(claim.id, "rejeitada")}
                  >
                    <XCircle className="h-4 w-4" /> Rejeitar
                  </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
