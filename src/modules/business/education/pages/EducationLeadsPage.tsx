/**
 * EducationLeadsPage
 *
 * Página de gestão de leads da instituição.
 * Rota: /central/empresas/:businessId/educacao/leads
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { useEducationLeads } from '../hooks/useEducationLeads';
import { useLeadPipeline } from '../hooks/useLeadPipeline';
import { EducationPipelineView } from '../components/EducationPipelineView';
import { EducationAdminReadError } from '../components/EducationAdminReadError';
import { EducationUrlService } from '../services/EducationUrlService';
import type { EducationLeadStatus } from '@/core/education';

export function EducationLeadsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useEducationProfile(businessId);
  const profileId = profile?.id;
  const dashboardUrl = businessId
    ? EducationUrlService.buildAdminDashboardUrl(businessId)
    : null;
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const {
    leads,
    totalCount,
    isLoading: isLeadsLoading,
    isError: isLeadsError,
    error: leadsError,
    refetch: refetchLeads,
  } = useEducationLeads(profileId, { page, pageSize });
  const {
    summary,
    moveLead,
    isError: isPipelineError,
    error: pipelineError,
    refetch: refetchPipeline,
  } = useLeadPipeline(profileId);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleMoveLead = async (leadId: string, toStatus: EducationLeadStatus) => {
    await moveLead({ leadId, toStatus });
  };

  const isLoading = isProfileLoading || isLeadsLoading;

  if (isProfileError || isLeadsError || isPipelineError) {
    return (
      <EducationAdminReadError
        title="Não foi possível carregar os leads"
        error={profileError ?? leadsError ?? pipelineError}
        onRetry={async () => {
          await Promise.all([
            refetchProfile(),
            refetchLeads(),
            refetchPipeline(),
          ]);
        }}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 text-territory-ink">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div className="flex min-w-0 items-center gap-3">
          {dashboardUrl ? (
            <Link
              to={dashboardUrl}
              aria-label="Voltar para a gestão de Educação"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-territory-muted transition hover:bg-territory-raised hover:text-territory-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand text-territory-on-image shadow-sm">
            <Users className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-territory-ink">
              Gestão de Leads
            </h1>
            <p className="text-sm text-territory-muted">
              Pipeline de matrículas e interessados
            </p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-6" role="status" aria-label="Carregando leads">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-territory-raised" />
          ))}
        </div>
      ) : (
        <>
          <EducationPipelineView
            leads={leads}
            onMoveLead={handleMoveLead}
            statusCounts={summary?.byStatus}
          />

          {totalCount > pageSize && (
            <div className="mt-8 flex flex-col gap-3 border-t border-territory-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-territory-muted">
                Exibindo {leads.length} leads nesta página de {totalCount} no total.
                As contagens por etapa consideram todo o pipeline.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised hover:text-territory-ink"
                >
                  Anterior
                </Button>
                <span className="text-sm text-territory-muted">
                  Página {page} de {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised hover:text-territory-ink"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EducationLeadsPage;
