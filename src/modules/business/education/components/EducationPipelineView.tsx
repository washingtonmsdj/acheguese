import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, User, Mail, Phone, Calendar } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import type { EducationLead, EducationLeadStatus } from '@/core/education';
import { EducationStatusBadge } from './EducationStatusBadge';

export interface EducationPipelineViewProps {
  leads: EducationLead[];
  onMoveLead?: (leadId: string, toStatus: EducationLeadStatus) => void;
  className?: string;
}

const PIPELINE_STAGES: { status: EducationLeadStatus; label: string; color: string }[] = [
  { status: 'new', label: 'Novo', color: 'bg-blue-50 border-blue-200' },
  { status: 'contacted', label: 'Contactado', color: 'bg-purple-50 border-purple-200' },
  { status: 'visit_scheduled', label: 'Visita', color: 'bg-orange-50 border-orange-200' },
  { status: 'proposal_sent', label: 'Proposta', color: 'bg-cyan-50 border-cyan-200' },
  { status: 'enrolled', label: 'Matriculado', color: 'bg-green-50 border-green-200' },
  { status: 'lost', label: 'Perdido', color: 'bg-red-50 border-red-200' },
];

export const EducationPipelineView = memo(function EducationPipelineView({
  leads,
  onMoveLead,
  className,
}: EducationPipelineViewProps) {
  const leadsByStage = (status: EducationLeadStatus) =>
    leads.filter((lead) => lead.status === status);

  return (
    <div className={cn('space-y-6', className)}>
      {PIPELINE_STAGES.map((stage, index) => {
        const stageLeads = leadsByStage(stage.status);
        return (
          <motion.div
            key={stage.status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn('rounded-xl border p-4', stage.color)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{stage.label}</h4>
                <Badge variant="secondary" className="text-xs">
                  {stageLeads.length}
                </Badge>
              </div>
              {index < PIPELINE_STAGES.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {stageLeads.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">
                Nenhum lead nesta etapa
              </p>
            ) : (
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {lead.full_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </span>
                          )}
                        </div>
                        {lead.child_name && (
                          <p className="text-xs text-gray-400 mt-1">
                            Aluno: {lead.child_name}
                            {lead.child_age && ` (${lead.child_age} anos)`}
                          </p>
                        )}
                      </div>

                      {onMoveLead && index < PIPELINE_STAGES.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 h-7 px-2 text-xs"
                          onClick={() =>
                            onMoveLead(lead.id, PIPELINE_STAGES[index + 1].status)
                          }
                        >
                          Avançar
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>

                    {lead.interest_note && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {lead.interest_note}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      <EducationStatusBadge status={lead.status} type="lead" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
});
