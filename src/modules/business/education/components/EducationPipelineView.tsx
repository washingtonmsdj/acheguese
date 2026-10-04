import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Phone, Calendar } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import type { EducationLead, EducationLeadStatus } from '@/core/education';
import { EducationStatusBadge } from './EducationStatusBadge';

export interface EducationPipelineViewProps {
  leads: EducationLead[];
  onMoveLead?: (leadId: string, toStatus: EducationLeadStatus) => void;
  statusCounts?: Partial<Record<EducationLeadStatus, number>>;
  className?: string;
}

const PIPELINE_STAGES: {
  status: EducationLeadStatus;
  label: string;
  className: string;
}[] = [
  { status: 'new', label: 'Novo', className: 'border-territory-info/25 bg-territory-info/10' },
  { status: 'contacted', label: 'Contactado', className: 'border-territory-brand/25 bg-territory-brand/10' },
  { status: 'visit_scheduled', label: 'Visita', className: 'border-territory-warning/25 bg-territory-warning/10' },
  { status: 'proposal_sent', label: 'Proposta', className: 'border-territory-sun/45 bg-territory-sun/20' },
  { status: 'enrolled', label: 'Matriculado', className: 'border-territory-success/25 bg-territory-success/10' },
  { status: 'lost', label: 'Perdido', className: 'border-territory-error/25 bg-territory-error/10' },
];

export const EducationPipelineView = memo(function EducationPipelineView({
  leads,
  onMoveLead,
  statusCounts,
  className,
}: EducationPipelineViewProps) {
  const leadsByStage = (status: EducationLeadStatus) =>
    leads.filter((lead) => lead.status === status);

  return (
    <div className={cn('space-y-6', className)}>
      {PIPELINE_STAGES.map((stage, index) => {
        const stageLeads = leadsByStage(stage.status);
        return (
          <motion.section
            key={stage.status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'rounded-2xl border p-4 text-territory-ink',
              stage.className,
            )}
            aria-labelledby={`education-pipeline-${stage.status}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4
                  id={`education-pipeline-${stage.status}`}
                  className="text-sm font-semibold text-territory-ink"
                >
                  {stage.label}
                </h4>
                <Badge
                  variant="secondary"
                  className="border-territory-border bg-territory-surface/80 text-xs text-territory-ink"
                >
                  {statusCounts?.[stage.status] ?? stageLeads.length}
                </Badge>
              </div>
              {index < PIPELINE_STAGES.length - 1 ? (
                <ArrowRight
                  className="h-4 w-4 text-territory-muted"
                  aria-hidden="true"
                />
              ) : null}
            </div>

            {stageLeads.length === 0 ? (
              <p className="py-2 text-center text-xs text-territory-muted">
                Nenhum lead nesta etapa
              </p>
            ) : (
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <article
                    key={lead.id}
                    className="rounded-xl border border-territory-border bg-territory-surface p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-territory-ink">
                          {lead.full_name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-territory-muted">
                          <span className="flex min-w-0 items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{lead.email}</span>
                          </span>
                          {lead.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" aria-hidden="true" />
                              {lead.phone}
                            </span>
                          ) : null}
                        </div>
                        {lead.child_name ? (
                          <p className="mt-1 text-xs text-territory-muted">
                            Aluno: {lead.child_name}
                            {lead.child_age ? ` (${lead.child_age} anos)` : ''}
                          </p>
                        ) : null}
                      </div>

                      {onMoveLead &&
                      lead.status !== 'enrolled' &&
                      lead.status !== 'lost' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 shrink-0 px-2 text-xs text-territory-brand hover:bg-territory-raised hover:text-territory-brand"
                          onClick={() =>
                            onMoveLead(
                              lead.id,
                              PIPELINE_STAGES[index + 1].status,
                            )
                          }
                        >
                          Avançar
                          <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                        </Button>
                      ) : null}
                    </div>

                    {lead.interest_note ? (
                      <p className="mt-2 line-clamp-2 text-xs text-territory-muted">
                        {lead.interest_note}
                      </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-territory-muted">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      <span>
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <EducationStatusBadge status={lead.status} type="lead" />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </motion.section>
        );
      })}
    </div>
  );
});
