import { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  FileText,
  Flag,
  MessageCircle,
  PencilLine,
  Shield,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { EducationLeadForm, type LeadFormData } from '../components/EducationLeadForm';
import type { EducationPublicProfile } from '@/core/education';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { AUTH_PATHS } from '@/core/auth/constants/authFlow';
import { useToast } from '@/shared/hooks/use-toast';
import { BusinessClaimService } from '@/core/business/services/BusinessClaimService';
import { BusinessProfileCorrectionDialog } from '@/core/business/components/BusinessProfileCorrectionDialog';
import {
  BusinessProfileReportService,
  type BusinessProfileReportReason,
} from '@/core/business/services/BusinessProfileReportService';
import { ReportReasonDialog } from '@/core/moderation';

type EducationDetailSidebarProps = {
  handleLeadSubmit: (formData: LeadFormData) => Promise<void>;
  profile: EducationPublicProfile;
  showcaseHref: string;
  trackEnrollmentCTAClick: (label: string) => void;
  trackWhatsAppClick: () => void;
  whatsappHref: string | null;
};

const sidebarCardClassName =
  'rounded-3xl border border-territory-border bg-territory-surface p-5 text-territory-ink shadow-sm';
const outlineButtonClassName =
  'w-full rounded-full border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/40 hover:bg-territory-raised';

export function EducationDetailSidebar({
  handleLeadSubmit,
  profile,
  showcaseHref,
  trackEnrollmentCTAClick,
  trackWhatsAppClick,
  whatsappHref,
}: EducationDetailSidebarProps) {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [institutionalEvidenceUrl, setInstitutionalEvidenceUrl] = useState('');

  const isPublicInstitution = profile.school_type === 'public';
  const isUnclaimedDirectoryProfile = profile.is_claimable;
  const canCaptureInstitutionLeads =
    !isUnclaimedDirectoryProfile && !isPublicInstitution;
  const canRequestSelfServiceClaim =
    isUnclaimedDirectoryProfile &&
    !isPublicInstitution &&
    Boolean(profile.business_data_id);
  const canRequestInstitutionalClaim =
    isUnclaimedDirectoryProfile &&
    isPublicInstitution &&
    Boolean(profile.business_data_id);

  const redirectToLogin = () => {
    navigate(AUTH_PATHS.login, { state: { redirectTo: location.pathname } });
  };

  const requestClaim = async (officialEvidenceUrl?: string) => {
    if (!profile.business_data_id) return;

    if (!user) {
      redirectToLogin();
      return;
    }

    setIsClaiming(true);
    try {
      const result = await BusinessClaimService.requestClaim({
        businessId: profile.business_data_id,
        message: isPublicInstitution
          ? 'Solicitação de administração institucional iniciada a partir do perfil público de Educação.'
          : 'Solicitação iniciada a partir do perfil público de Educação.',
        officialEvidenceUrls: officialEvidenceUrl
          ? [officialEvidenceUrl]
          : undefined,
      });
      setClaimSubmitted(true);
      toast({
        title: result.created
          ? 'Reivindicação enviada'
          : 'Reivindicação já pendente',
        description:
          'A equipe revisará a titularidade antes de liberar o controle do perfil.',
      });
    } catch (error) {
      toast({
        title: 'Não foi possível reivindicar',
        description:
          error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const openReport = () => {
    if (!user) {
      redirectToLogin();
      return;
    }
    setReportOpen(true);
  };

  const openCorrection = () => {
    if (!user) {
      redirectToLogin();
      return;
    }
    setCorrectionOpen(true);
  };

  const submitReport = async (
    reason: BusinessProfileReportReason,
    description?: string,
  ) => {
    if (!profile.business_data_id) {
      throw new Error('Perfil empresarial não localizado.');
    }

    try {
      await BusinessProfileReportService.report({
        businessId: profile.business_data_id,
        reason,
        description,
      });
      toast({
        title: 'Denúncia enviada',
        description: 'A equipe de moderação receberá o caso para triagem.',
      });
    } catch (error) {
      toast({
        title: 'Não foi possível enviar a denúncia',
        description:
          error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const focusLeadForm = (trackingLabel: string) => {
    trackEnrollmentCTAClick(trackingLabel);
    const form = document.getElementById('education-lead-form');
    form?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
    const nameInput = document.getElementById('fullName');
    if (nameInput instanceof HTMLElement) {
      nameInput.focus({ preventScroll: true });
    }
  };

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="space-y-4">
        {!canCaptureInstitutionLeads ? (
          <div className={sidebarCardClassName}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-territory-muted">
              Contato e matrícula
            </h3>
            <p className="mt-3 text-sm text-territory-muted">
              Este é um perfil de diretório. Para matrícula, visita ou informações
              operacionais, confirme pelos canais oficiais da instituição ou da
              rede responsável.
            </p>
            <p className="mt-3 text-xs text-territory-muted">
              O Achegue-se não coleta dados de responsável ou aluno em nome de
              uma instituição enquanto o perfil não possui uma autoridade de
              atendimento habilitada.
            </p>
          </div>
        ) : (
          <>
            <div className={sidebarCardClassName}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-territory-muted">
                Falar com a instituição
              </h3>
              <div className="mt-3 space-y-2">
                {whatsappHref && (
                  <Button
                    asChild
                    className="w-full rounded-full bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
                  >
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      onClick={trackWhatsAppClick}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className={outlineButtonClassName}
                  onClick={() => focusLeadForm('Solicitar visita')}
                >
                  <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
                  Solicitar visita
                </Button>
                <Button
                  variant="outline"
                  className={outlineButtonClassName}
                  onClick={() => focusLeadForm('Solicitar informacoes')}
                >
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                  Solicitar informações
                </Button>
              </div>
            </div>

            <div className={sidebarCardClassName}>
              <EducationLeadForm
                nicheKey={profile.niche_key}
                onSubmit={handleLeadSubmit}
              />
            </div>
          </>
        )}

        {canRequestSelfServiceClaim && (
          <div className="rounded-3xl border border-territory-brand/25 bg-territory-brand/5 p-5 text-territory-ink shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-territory-brand" aria-hidden="true" />
              Esta instituição é sua?
            </div>
            <p className="mt-2 text-xs text-territory-muted">
              Solicite a titularidade. O controle só é liberado depois da revisão
              da reivindicação.
            </p>
            <Button
              type="button"
              variant="outline"
              className={`mt-3 ${outlineButtonClassName}`}
              disabled={isClaiming || claimSubmitted}
              onClick={() => void requestClaim()}
            >
              {claimSubmitted
                ? 'Reivindicação pendente'
                : isClaiming
                  ? 'Enviando...'
                  : 'Reivindicar este perfil'}
            </Button>
          </div>
        )}

        {canRequestInstitutionalClaim && (
          <div className="rounded-3xl border border-territory-border bg-territory-raised/70 p-5 text-territory-ink">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-territory-brand" aria-hidden="true" />
              Administração institucional
            </div>
            <p className="mt-2 text-xs text-territory-muted">
              Este cadastro público ainda não possui uma conta institucional
              responsável. A solicitação não libera acesso automaticamente: a
              equipe valida a comprovação antes de transferir a autoridade do perfil.
            </p>
            <div className="mt-3 space-y-2">
              <Input
                type="url"
                value={institutionalEvidenceUrl}
                onChange={(event) =>
                  setInstitutionalEvidenceUrl(event.target.value)
                }
                maxLength={1200}
                placeholder="https://fonte-oficial.gov.br/..."
                aria-label="Fonte oficial para comprovar autoridade institucional"
              />
              <p className="text-[11px] text-territory-muted">
                Informe uma fonte pública verificável, como site oficial da escola,
                Secretaria de Educação, rede responsável ou Diário Oficial. Não envie
                documentos pessoais ou dados de alunos por este campo.
              </p>
              <Button
                type="button"
                variant="outline"
                className={outlineButtonClassName}
                disabled={
                  isClaiming ||
                  claimSubmitted ||
                  institutionalEvidenceUrl.trim().length === 0
                }
                onClick={() =>
                  void requestClaim(institutionalEvidenceUrl.trim())
                }
              >
                {claimSubmitted
                  ? 'Solicitação institucional pendente'
                  : isClaiming
                    ? 'Enviando...'
                    : 'Solicitar administração institucional'}
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-territory-border bg-territory-raised/70 p-5 text-territory-ink">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-territory-success" aria-hidden="true" />
            Sobre este perfil
          </div>
          <ul className="mt-3 space-y-2 text-xs text-territory-muted">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-territory-success" aria-hidden="true" />
              {isUnclaimedDirectoryProfile
                ? 'Cadastro de diretório ainda não reivindicado'
                : isPublicInstitution
                  ? 'Cadastro institucional administrado'
                  : 'Perfil institucional administrado'}
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-territory-success" aria-hidden="true" />
              {isUnclaimedDirectoryProfile || isPublicInstitution
                ? 'Dados exibidos somente quando cadastrados ou sustentados por fonte'
                : 'Comunicação disponível conforme canais cadastrados'}
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-territory-success" aria-hidden="true" />
              {isUnclaimedDirectoryProfile
                ? 'Controle liberado somente após revisão de titularidade'
                : isPublicInstitution
                  ? 'Formulários com dados de alunos permanecem desabilitados por padrão'
                  : 'Dados do perfil rastreáveis no sistema'}
            </li>
          </ul>
        </div>

        {profile.business_data_id ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-center gap-2 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
              onClick={openCorrection}
            >
              <PencilLine className="h-4 w-4" aria-hidden="true" />
              Sugerir correção
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-center gap-2 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
              onClick={openReport}
            >
              <Flag className="h-4 w-4" aria-hidden="true" />
              Denunciar este perfil
            </Button>
          </div>
        ) : null}

        <Link
          to={showcaseHref}
          className="block rounded-3xl border border-dashed border-territory-border bg-territory-surface/70 p-4 text-center text-sm text-territory-muted transition hover:border-territory-brand/40 hover:bg-territory-raised hover:text-territory-ink"
        >
          <ChevronLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />
          Voltar para vitrine
        </Link>
      </div>

      {profile.business_data_id ? (
        <BusinessProfileCorrectionDialog
          businessId={profile.business_data_id}
          open={correctionOpen}
          onOpenChange={setCorrectionOpen}
        />
      ) : null}

      <ReportReasonDialog<BusinessProfileReportReason>
        open={reportOpen}
        onOpenChange={setReportOpen}
        contentLabel="este perfil"
        reasonOptions={[
          { id: 'fraud', label: 'Fraude ou instituição inexistente' },
          { id: 'impersonation', label: 'Finge ser outra instituição' },
          {
            id: 'misleading',
            label: 'Informação enganosa ou potencialmente fraudulenta',
          },
          { id: 'harmful', label: 'Conteúdo ofensivo ou prejudicial' },
          {
            id: 'privacy_or_safety',
            label: 'Privacidade ou segurança de aluno/menor',
          },
          { id: 'duplicate', label: 'Perfil duplicado' },
          { id: 'closed_or_not_here', label: 'Fechou ou não funciona neste local' },
          { id: 'policy_violation', label: 'Outra violação de política' },
          { id: 'other', label: 'Outro motivo' },
        ]}
        onSubmit={submitReport}
        maxDetailsLength={1000}
      />
    </aside>
  );
}
