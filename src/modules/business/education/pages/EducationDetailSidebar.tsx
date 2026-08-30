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
  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="space-y-4">
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
              onClick={() => trackEnrollmentCTAClick('Agendar visita')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Agendar visita
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => trackEnrollmentCTAClick('Solicitar orçamento')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Solicitar orçamento
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <EducationLeadForm
            educationProfileId={profile.id}
            nicheKey={profile.niche_key}
            onSubmit={handleLeadSubmit}
          />
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-muted/40 to-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-emerald-500" /> Por que confiar
          </div>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" /> Perfil institucional publicado
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" /> Comunicação direta com a instituição
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" /> Dados declarados e rastreáveis por fonte
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
