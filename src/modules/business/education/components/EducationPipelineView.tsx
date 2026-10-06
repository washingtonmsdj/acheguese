import { memo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Mail, Phone, Calendar } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import {
  getEducationLeadNextStatuses,
  type EducationLead,
  type EducationLeadStatus,
} from '@/core/education';
import { EducationStatusBadge } from './EducationStatusBadge';
import { EducationLeadLostDialog } from './EducationLeadLostDialog';

export interface EducationPipelineViewProps {
  leads: EducationLead[];
  onMoveLead?: (
    leadId: string,
    toStatus: EducationLeadStatus,
    lostReason?: string,
  ) => Promise<boolean> | boolean;
  statusCounts?: Partial<Record<EducationLeadStatus, number>>;
  isMoving?: boolean;
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
  isMoving = false,
  className,
}: EducationPipelineViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [lostLead, setLostLead] = useState<EducationLead | null>(null);
  const leadsByStage = (status: EducationLeadStatus) =>
    leads.filter((lead) => lead.status === status);

  return (
    <div className={cn('space-y-6', className)}>
      {PIPELINE_STAGES.map((stage, index) => {
        const stageLeads = leadsByStage(stage.status);
        const totalStageCount =
          statusCounts?.[stage.status] ?? stageLeads.length;
        const nextStatuses = getEducationLeadNextStatuses(stage.status);
        const nextForwardStatus = nextStatuses.find(
          (status) => status !== 'lost',
        );
        const nextForwardStage = PIPELINE_STAGES.find(
          (candidate) => candidate.status === nextForwardStatus,
        );
        const canMarkLost = nextStatuses.includes('lost');
        return (
          <motion.section
            key={stage.status}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1 }}
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
                  {totalStageCount}
                </Badge>
              </div>
              {nextForwardStatus ? (
                <ArrowRight
                  className="h-4 w-4 text-territory-muted"
                  aria-hidden="true"
                />
              ) : null}
            </div>

            {stageLeads.length === 0 ? (
              <p className="py-2 text-center text-xs text-territory-muted">
                {totalStageCount > 0
                  ? 'Nenhum lead desta etapa nesta página'
                  : 'Nenhum lead nesta etapa'}
              </p>
            ) : (
              <div className="space-y-2">
                {stageLeads.map((lead) => {
                  const studentName = lead.student_name ?? lead.child_name;
                  const studentAge = lead.student_age ?? lead.child_age;

                  return (
                    <article
                    key={lead.id}
                    className="rounded-xl border border-territory-border bg-territory-surface p-3 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                        {studentName ? (
                          <p className="mt-1 text-xs text-territory-muted">
                            Aluno: {studentName}
                            {studentAge != null ? ` (${studentAge} anos)` : ''}
                          </p>
                        ) : null}
                      </div>

                      {onMoveLead && nextStatuses.length > 0 ? (
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                          {canMarkLost ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-territory-error hover:bg-territory-error/10 hover:text-territory-error"
                              disabled={isMoving}
                              aria-label={`Marcar ${lead.full_name} como perdido`}
                              onClick={() => setLostLead(lead)}
                            >
                              Perdido
                            </Button>
                          ) : null}
                          {nextForwardStatus ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-territory-brand hover:bg-territory-raised hover:text-territory-brand"
                              disabled={isMoving}
                              aria-label={`Avançar ${lead.full_name} para ${
                                nextForwardStage?.label ?? nextForwardStatus
                              }`}
                              onClick={() =>
                                void onMoveLead(lead.id, nextForwardStatus)
                              }
                            >
                              {isMoving ? 'Atualizando...' : 'Avançar'}
                              <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                            </Button>
                          ) : null}
                        </div>
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
                  );
                })}
              </div>
            )}
          </motion.section>
        );
      })}

      <EducationLeadLostDialog
        open={Boolean(lostLead)}
        leadName={lostLead?.full_name}
        isSubmitting={isMoving}
        onOpenChange={(open) => {
          if (!open) setLostLead(null);
        }}
        onConfirm={async (reason) => {
          if (!lostLead || !onMoveLead) return false;
          const moved = await onMoveLead(lostLead.id, 'lost', reason);
          if (moved) setLostLead(null);
          return moved;
        }}
      />
    </div>
  );
});
