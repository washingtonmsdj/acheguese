import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Calendar, Check, ChevronLeft, FileText, MessageCircle, Shield } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { EducationLeadForm, type LeadFormData } from '../components/EducationLeadForm';
import type { EducationPublicProfile } from '@/core/education';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';
import { BusinessClaimService } from '@/core/business/services/BusinessClaimService';

type EducationDetailSidebarProps = {
  handleLeadSubmit: (formData: LeadFormData) => Promise<void>;
  profile: EducationPublicProfile;
  showcaseHref: string;
  trackEnrollmentCTAClick: (label: string) => void;
  trackWhatsAppClick: () => void;
  whatsappHref: string | null;
};

export function EducationDetailSidebar({
  handleLeadSubmit,
  profile,
  showcaseHref,
  trackEnrollmentCTAClick,
  trackWhatsAppClick,
  whatsappHref,
}: EducationDetailSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  const isPublicInstitution = profile.school_type === 'public';
  const isUnclaimedDirectoryProfile = profile.is_claimable;
  const canCaptureInstitutionLeads = !isUnclaimedDirectoryProfile && !isPublicInstitution;
  const canRequestSelfServiceClaim =
    isUnclaimedDirectoryProfile &&
    !isPublicInstitution &&
    Boolean(profile.business_data_id);

  const requestClaim = async () => {
    if (!profile.business_data_id) return;

    if (!user) {
      navigate('/login', { state: { redirectTo: location.pathname } });
      return;
    }

    setIsClaiming(true);
    try {
      const result = await BusinessClaimService.requestClaim({
        businessId: profile.business_data_id,
        userId: user.id,
        message: 'Solicitacao iniciada a partir do perfil publico de Educacao.',
      });
      setClaimSubmitted(true);
      toast({
        title: result.created ? 'Reivindicacao enviada' : 'Reivindicacao ja pendente',
        description: 'A equipe revisara a titularidade antes de liberar o controle do perfil.',
      });
    } catch (error) {
      toast({
        title: 'Nao foi possivel reivindicar',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const focusLeadForm = (trackingLabel: string) => {
    trackEnrollmentCTAClick(trackingLabel);
    const form = document.getElementById('education-lead-form');
    form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const nameInput = document.getElementById('fullName');
    if (nameInput instanceof HTMLElement) {
      nameInput.focus({ preventScroll: true });
    }
  };

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="space-y-4">
        {!canCaptureInstitutionLeads ? (
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Contato e matrícula
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Este é um perfil de diretório. Para matrícula, visita ou informações operacionais,
              confirme pelos canais oficiais da instituição ou da rede responsável.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              O Achegue-se não coleta dados de responsável ou aluno em nome de uma instituição
              enquanto o perfil não possui uma autoridade de atendimento habilitada.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Falar com a instituição
              </h3>
              <div className="mt-3 space-y-2">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                    onClick={() => trackWhatsAppClick()}
                  >
                    <Button className="w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-600">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </a>
                )}
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => focusLeadForm('Solicitar visita')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Solicitar visita
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => focusLeadForm('Solicitar informacoes')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Solicitar informacoes
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <EducationLeadForm
                nicheKey={profile.niche_key}
                onSubmit={handleLeadSubmit}
              />
            </div>
          </>
        )}

        {canRequestSelfServiceClaim && (
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              Esta instituicao e sua?
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Solicite a titularidade. O controle so e liberado depois da revisao da reivindicacao.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full rounded-full"
              disabled={isClaiming || claimSubmitted}
              onClick={() => void requestClaim()}
            >
              {claimSubmitted
                ? 'Reivindicacao pendente'
                : isClaiming
                  ? 'Enviando...'
                  : 'Reivindicar este perfil'}
            </Button>
          </div>
        )}

        {isUnclaimedDirectoryProfile && isPublicInstitution && (
          <div className="rounded-3xl border border-border bg-muted/30 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-primary" />
              Administracao institucional
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Este cadastro publico ainda nao foi reivindicado por uma conta institucional.
              A transferencia exige comprovacao documental e revisao administrativa.
            </p>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-gradient-to-br from-muted/40 to-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-emerald-500" /> Sobre este perfil
          </div>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
              {isUnclaimedDirectoryProfile
                ? 'Cadastro de diretório ainda não reivindicado'
                : isPublicInstitution
                  ? 'Cadastro institucional administrado'
                  : 'Perfil institucional administrado'}
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
              {isUnclaimedDirectoryProfile || isPublicInstitution
                ? 'Dados exibidos somente quando cadastrados ou sustentados por fonte'
                : 'Comunicação disponível conforme canais cadastrados'}
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
              {isUnclaimedDirectoryProfile
                ? 'Controle liberado somente após revisão de titularidade'
                : isPublicInstitution
                  ? 'Formulários com dados de alunos permanecem desabilitados por padrão'
                  : 'Dados do perfil rastreáveis no sistema'}
            </li>
          </ul>
        </div>

        <Link
          to={showcaseHref}
          className="block rounded-3xl border border-dashed border-border bg-card/40 p-4 text-center text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <ChevronLeft className="mr-1 inline h-4 w-4" /> Voltar para vitrine
        </Link>
      </div>
    </aside>
  );
}
