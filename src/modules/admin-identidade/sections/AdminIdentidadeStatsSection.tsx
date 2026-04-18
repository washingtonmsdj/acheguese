/**
 * AdminIdentidadeStatsSection Component
 * 
 * Grid de estatísticas de identidade
 */

import { UserCog, AlertTriangle, ShieldCheck, MapPin, Star } from "lucide-react";
import { AdminStatsGrid, AdminStatsCard } from "@/modules/admin/components";
import type { AdminIdentidadeStatsSectionProps } from "./types";

export function AdminIdentidadeStatsSection({ stats, loading, error }: AdminIdentidadeStatsSectionProps) {
  return (
    <AdminStatsGrid>
      <AdminStatsCard
        title="Perfis totais"
        value={error ? "--" : stats?.totalProfiles || 0}
        subtitle={
          error
            ? "Falha ao carregar snapshot"
            : `${stats?.publicProfiles || 0} publicos e ${stats?.privateProfiles || 0} privados`
        }
        icon={UserCog}
        loading={loading}
      />
      <AdminStatsCard
        title="Username em risco"
        value={error ? "--" : stats?.publicWithoutUsername || 0}
        subtitle={
          error
            ? "Falha ao carregar risco"
            : `${stats?.missingUsername || 0} perfis sem username`
        }
        icon={AlertTriangle}
        iconColor="text-red-600"
        loading={loading}
      />
      <AdminStatsCard
        title="Contas multi-profile"
        value={error ? "--" : stats?.multiProfileUsers || 0}
        subtitle={
          error
            ? "Falha ao carregar vinculos"
            : `${stats?.withLinkedEntities || 0} perfis com vinculos`
        }
        icon={ShieldCheck}
        iconColor="text-violet-600"
        loading={loading}
      />
      <AdminStatsCard
        title="Residencias auditaveis"
        value={error ? "--" : stats?.withResidence || 0}
        subtitle={
          error
            ? "Falha ao carregar residencias"
            : `${stats?.withVerifiedResidence || 0} verificadas`
        }
        icon={MapPin}
        iconColor="text-sky-600"
        loading={loading}
      />
      <AdminStatsCard
        title="Escopos configurados"
        value={error ? "--" : stats?.withScopedPreferences || 0}
        subtitle={
          error
            ? "Falha ao carregar preferencias"
            : `${stats?.withNotificationScope || 0} com notificacoes configuradas`
        }
        icon={ShieldCheck}
        iconColor="text-emerald-600"
        loading={loading}
      />
      <AdminStatsCard
        title="Reputacao rastreavel"
        value={error ? "--" : stats?.withExternalReputation || 0}
        subtitle={
          error
            ? "Falha ao carregar reputacao"
            : `${stats?.withMultiOriginReputation || 0} perfis com 2+ origens`
        }
        icon={Star}
        iconColor="text-amber-600"
        loading={loading}
      />
    </AdminStatsGrid>
  );
}
