/**
 * EducationLeadsPage
 *
 * Pagina de gestao de leads da instituicao.
 * Rota: /central/empresas/:businessId/educacao/leads
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { useEducationLeads } from '../hooks/useEducationLeads';
import { useLeadPipeline } from '../hooks/useLeadPipeline';
import { EducationPipelineView } from '../components/EducationPipelineView';
import { EducationAdminReadError } from '../components/EducationAdminReadError';
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
        title="Nao foi possivel carregar os leads"
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Leads</h1>
            <p className="text-sm text-gray-500">
              Pipeline de matrículas e interessados
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pipeline */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
            <div className="mt-8 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Exibindo {leads.length} leads nesta pagina de {totalCount} no total.
                As contagens por etapa consideram todo o pipeline.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {page} de {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  Proxima
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
