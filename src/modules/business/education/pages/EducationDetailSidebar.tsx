import { Link } from 'react-router-dom';
import { Calendar, Check, ChevronLeft, FileText, MessageCircle, Shield } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { EducationLeadForm, type LeadFormData } from '../components/EducationLeadForm';
import type { EducationProfile } from '@/core/education';

type EducationDetailSidebarProps = {
  handleLeadSubmit: (formData: LeadFormData) => Promise<void>;
  profile: EducationProfile;
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
  const isPublicDirectoryProfile = profile.school_type === 'public';

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
        {isPublicDirectoryProfile ? (
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Contato e matrícula
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Este é um perfil público de diretório. Para matrícula, visita ou informações
              operacionais, use os canais oficiais da rede ou da unidade.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              O Achegue-se não coleta dados de responsável ou aluno em nome de uma escola pública
              enquanto o perfil não possuir uma autoridade oficial de atendimento habilitada.
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

        <div className="rounded-3xl border border-border bg-gradient-to-br from-muted/40 to-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-emerald-500" /> Sobre este perfil
          </div>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
              {isPublicDirectoryProfile ? 'Registro público catalogado' : 'Perfil institucional publicado'}
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
              {isPublicDirectoryProfile
                ? 'Dados exibidos somente quando cadastrados ou sustentados por fonte'
                : 'Comunicação disponível conforme canais cadastrados'}
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
              {isPublicDirectoryProfile
                ? 'Formulários com dados de alunos ficam desabilitados por padrão'
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
