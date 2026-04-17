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
} from "lucide-react";
import { adminBusinessService } from "@/core/admin";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { obterNicho } from "@/shared/utils/urlUtils";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { notificationService, NotificationType, NotificationPriority } from "@/core/notifications";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";

interface Claim {
  id: string;
  user_id: string;
  business_id: string;
  mensagem: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  user_name?: string;
  business_name?: string;
  business_slug?: string;
  business_category?: string;
  business_is_premium?: boolean;
}

export default function AdminReivindicacoes() {
  const { canModerate, isChecking } = useAdminGuard();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "pendente" | "aprovada" | "rejeitada" | "todos"
  >("pendente");
  const [processing, setProcessing] = useState<string | null>(null);

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
      (data || []).map(async (claim) => {
        const [profile, biz] = await Promise.all([
          profileService.getProfileById(claim.user_id),
          adminBusinessService.getBusinessClaimDetails(claim.business_id),
        ]);
        return {
          ...claim,
          user_name: profile?.name || "Desconhecido",
          business_name:
            (Array.isArray(biz?.profiles) ? biz.profiles?.[0] : biz?.profiles)
              ?.name || "Removida",
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
    setProcessing(claimId);
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;

    const ok = await adminBusinessService.updateClaimStatus(claimId, action);
    if (!ok) {
      toast.error("Erro ao atualizar reivindicação");
      setProcessing(null);
      return;
    }

    // Gerar URL canônica da business para notificação
    let businessUrl: string | null = null;
    if (claim.business_slug && claim.business_id) {
      try {
        // Buscar business completa para obter dados territoriais reais
        const businessDetails = await adminBusinessService.getBusinessClaimDetails(claim.business_id);
        if (businessDetails?.uf && businessDetails?.city) {
          // Só gerar URL canônica com dados territoriais reais
          businessUrl = BusinessUrlService.getCanonicalUrl({
            slug: claim.business_slug,
            uf: businessDetails.uf,
            city: businessDetails.city,
          });
        }
      } catch (error) {
        // Se falhar, não gerar URL (businessUrl permanece null)
        logger.error("Erro ao buscar dados da business para URL:", error);
      }
    }

    const msg =
      action === "aprovada"
        ? `Sua reivindicação da empresa "${claim.business_name}" foi aprovada!`
        : `Sua reivindicação da empresa "${claim.business_name}" foi rejeitada.`;

    await notificationService.createNotification({
      user_id: claim.user_id,
      type: "system" as const,
      title:
        action === "aprovada"
          ? "✅ Reivindicação aprovada"
          : "❌ Reivindicação rejeitada",
      message: msg,
      priority: "high" as const,
      metadata: businessUrl ? {
        action_url: businessUrl,
        action_label: "Ver empresa",
      } : undefined,
    });

    toast.success(
      action === "aprovada"
        ? "Reivindicação aprovada!"
        : "Reivindicação rejeitada.",
    );
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

              {claim.mensagem && (
                <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {claim.mensagem}
                  </p>
                </div>
              )}

              {claim.status === "pendente" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    disabled={processing === claim.id}
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
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
