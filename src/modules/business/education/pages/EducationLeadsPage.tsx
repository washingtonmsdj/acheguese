/**
 * EducationLeadsPage
 *
 * Pagina de gestao de leads da instituicao.
 * Rota: /central/empresas/:businessId/education/leads
 */

import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { useEducationLeads } from '../hooks/useEducationLeads';
import { useLeadPipeline } from '../hooks/useLeadPipeline';
import { EducationPipelineView } from '../components/EducationPipelineView';
import type { EducationLeadStatus } from '../types';

export function EducationLeadsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data: profile, isLoading: isProfileLoading } = useEducationProfile(businessId);
  const profileId = profile?.id;

  const { leads, isLoading: isLeadsLoading } = useEducationLeads(profileId);
  const { moveLead, isMoving } = useLeadPipeline(profileId);

  const handleMoveLead = async (leadId: string, toStatus: EducationLeadStatus) => {
    await moveLead({ leadId, toStatus });
  };

  const isLoading = isProfileLoading || isLeadsLoading;

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
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Lead
        </Button>
      </motion.div>

      {/* Pipeline */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <EducationPipelineView
          leads={leads}
          onMoveLead={handleMoveLead}
        />
      )}
    </div>
  );
}

export default EducationLeadsPage;
