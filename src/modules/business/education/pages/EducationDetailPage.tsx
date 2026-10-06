import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  Globe,
  GraduationCap,
  Heart,
  HelpCircle,
  Info,
  Map as MapIcon,
  MapPin,
  PlayCircle,
  Quote,
  Share2,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { cn } from '@/shared/utils/cn';
import { getRecordValue } from '@/shared/utils/recordLookup';
import { buildPublicAbsoluteUrl } from '@/shared/config/publicAppOrigin';
import { buildGoogleMapsSearchUrl } from '@/shared/utils/contactLinks';
import { useToast } from '@/shared/hooks/use-toast';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { useCanonicalBusinessFavorite } from '@/modules/business/hooks/useCanonicalBusinessFavorite';

import { useEducationDetail } from '../hooks/useEducationDetail';
import { useEducationEvents } from '../hooks/useEducationEvents';
import { useEducationPrograms } from '../hooks/useEducationPrograms';
import { getNicheByKey } from '../niches/registry';
import { useLabels } from '../hooks/useEducationLabels';
import { useEducationTracking } from '../hooks/useEducationTracking';
import { useEducationLeads } from '../hooks/useEducationLeads';
import { EducationUrlService } from '../services/EducationUrlService';
import { SCHOOL_EVENT_TYPE_LABELS } from '../constants';
import type { LeadFormData } from '../components/EducationLeadForm';
import {
  ACCESSIBILITY_LABELS,
  BASIC_RESOURCE_LABELS,
  EQUIPMENT_LABELS,
  FACILITY_LABELS,
  FALLBACK_FAQ,
  NICHE_GRADIENTS,
  NICHE_ICONS,
  buildWhatsAppHref,
  formatDate,
  getSections,
  sanitizePublicEducationText,
} from './EducationDetailPresentationData';
import {
  ModalityCard,
  ProgramCard,
  StickyTabs,
} from './EducationDetailPresentation';
import { EducationDetailSidebar } from './EducationDetailSidebar';
import {
  EducationDetailErrorState,
  EducationDetailLoadingState,
  EducationDetailNotFoundState,
} from './EducationDetailStateViews';

const surfaceCardClassName =
  'rounded-3xl border border-territory-border bg-territory-surface text-territory-ink shadow-sm';
const emptyStateClassName =
  'rounded-2xl border border-dashed border-territory-border bg-territory-raised/55 p-5 text-sm text-territory-muted';
const sectionTitleClassName = 'text-2xl font-bold text-territory-ink';
const sectionIconClassName = 'h-5 w-5 text-territory-brand';

export function EducationDetailPage() {
  const { state, city, district, slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { active } = usePublicBrowsingCity();
  const effectiveState = state ?? active.state;
  const effectiveCity = city ?? active.city;

  const { data: profile, isLoading, isError } = useEducationDetail({
    state,
    city,
    district,
    slug,
  });

  const { programs } = useEducationPrograms(profile?.id);
  const { events } = useEducationEvents(profile?.id, {
    isPublic: true,
    active: true,
  });
  const {
    isFavorite,
    toggleFavorite,
    loading: favoriteLoading,
  } = useCanonicalBusinessFavorite(profile?.business_data_id ?? undefined);

  const schoolNetworkLabel =
    profile?.school_network === 'municipal'
      ? 'Municipal'
      : profile?.school_network === 'state'
        ? 'Estadual'
        : profile?.school_network === 'federal'
          ? 'Federal'
          : profile?.school_network === 'private'
            ? 'Privada'
            : null;
  const schoolManagementLabel =
    profile?.school_network === 'municipal'
      ? 'Prefeitura'
      : profile?.school_network === 'state'
        ? 'Governo estadual'
        : profile?.school_network === 'federal'
          ? 'Governo federal'
          : profile?.school_network === 'private'
            ? 'Privada'
            : null;
  const stats = [
    schoolNetworkLabel ? { label: 'Rede', value: schoolNetworkLabel } : null,
    schoolManagementLabel
      ? { label: 'Gestão', value: schoolManagementLabel }
      : null,
    profile?.school_inep_code
      ? { label: 'INEP', value: profile.school_inep_code }
      : null,
    profile?.enrollment_open === true
      ? { label: 'Matrículas', value: 'Abertas' }
      : null,
    (profile?.education_levels ?? []).length > 0
      ? {
          label: 'Etapas',
          value: String(profile?.education_levels?.length ?? 0),
        }
      : null,
  ].filter((stat): stat is { label: string; value: string } => Boolean(stat));

  const nicheConfig = profile ? getNicheByKey(profile.niche_key) : null;
  const labels = useLabels(profile?.niche_key);
  const Icon = profile
    ? NICHE_ICONS[profile.niche_key] ?? GraduationCap
    : GraduationCap;
  const gradient = profile
    ? NICHE_GRADIENTS[profile.niche_key] ??
      'from-territory-brand via-territory-brand/90 to-territory-info'
    : 'from-territory-brand via-territory-brand/90 to-territory-info';

  const sections = getSections(labels);
  const prefersReducedMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState<string>('overview');

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };
  const {
    trackProfileView,
    trackProgramView,
    trackEventView,
    trackWhatsAppClick,
    trackEnrollmentCTAClick,
    trackLeadSubmitted,
  } = useEducationTracking({
    educationProfileId: profile?.id ?? '',
    nicheKey: profile?.niche_key ?? 'regular_school',
    businessDataId: profile?.business_data_id ?? undefined,
  });
  const { createPublic: createLead } = useEducationLeads(profile?.id ?? undefined);
  const trackedProgramViews = useRef(new Set<string>());
  const trackedEventViews = useRef(new Set<string>());

  const trackProgramImpression = (programId: string) => {
    if (trackedProgramViews.current.has(programId)) return;
    trackedProgramViews.current.add(programId);
    trackProgramView(programId);
  };

  const trackEventImpression = (eventId: string) => {
    if (trackedEventViews.current.has(eventId)) return;
    trackedEventViews.current.add(eventId);
    trackEventView(eventId);
  };

  const handleLeadSubmit = async (formData: LeadFormData) => {
    if (!profile?.id) return;

    const lead = await createLead({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      childName: formData.childName,
      childAge: formData.childAge,
      interestNote: formData.interestNote,
      guardianName: formData.guardianName,
      studentName: formData.studentName,
      studentAge: formData.studentAge,
      desiredGrade: formData.desiredGrade,
      desiredShift: formData.desiredShift,
    });

    if (lead.created) {
      trackLeadSubmitted(lead.id, {
        hasGuardian: Boolean(formData.guardianName),
        hasStudent: Boolean(formData.studentName),
        desiredGrade: formData.desiredGrade,
        desiredShift: formData.desiredShift,
      });
    }
  };

  useEffect(() => {
    if (profile?.id) {
      trackProfileView();
    }
  }, [profile?.id, trackProfileView]);

  const cityLabel = effectiveCity.replace(/-/g, ' ');
  const districtLabel = (district ?? '').replace(/-/g, ' ');
  const institutionName =
    profile?.business_name ??
    nicheConfig?.displayName ??
    'Instituição educacional';
  const showcasePath = EducationUrlService.buildListingUrl({
    state: effectiveState,
    city: effectiveCity,
  });
  const canonicalPath =
    state && city && district && slug
      ? EducationUrlService.buildDetailUrl({ state, city, district, slug })
      : showcasePath;
  const canonicalUrl = buildPublicAbsoluteUrl(canonicalPath);
  const whatsappHref = buildWhatsAppHref(profile?.whatsapp_number);

  const modalitiesPresent = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((program) => {
      if (program.modality) {
        set.add(
          program.modality
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''),
        );
      }
    });
    return set;
  }, [programs]);

  const basicResources = (profile?.school_basic_resources ?? [])
    .map((key) => getRecordValue(BASIC_RESOURCE_LABELS, key))
    .filter((label): label is string => Boolean(label));
  const accessibilityFeatures = (profile?.school_accessibility_features ?? [])
    .map((key) => getRecordValue(ACCESSIBILITY_LABELS, key))
    .filter((label): label is string => Boolean(label));
  const equipmentFeatures = (profile?.school_equipment_features ?? [])
    .map((key) => getRecordValue(EQUIPMENT_LABELS, key))
    .filter((label): label is string => Boolean(label));
  const facilityFeatures = (profile?.school_facility_features ?? [])
    .map((key) => getRecordValue(FACILITY_LABELS, key))
    .filter((label): label is string => Boolean(label));

  const goToShowcase = () => navigate(showcasePath);

  const handleShare = async () => {
    if (typeof navigator === 'undefined') return;

    try {
      if (navigator.share) {
        await navigator.share({ title: institutionName, url: canonicalUrl });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(canonicalUrl);
        toast({
          title: 'Link copiado',
          description: 'O link desta instituição foi copiado para a área de transferência.',
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast({
        title: 'Não foi possível compartilhar',
        description: 'Copie o endereço da página e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <EducationDetailLoadingState />;
  }

  if (isError) {
    return (
      <>
        <Helmet>
          <title>Erro ao carregar instituição | Acheguese</title>
          <meta name="robots" content="noindex,follow" />
          <link rel="canonical" href={buildPublicAbsoluteUrl(showcasePath)} />
        </Helmet>
        <EducationDetailErrorState
          onBack={() => navigate(-1)}
          onGoToShowcase={goToShowcase}
        />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Helmet>
          <title>Instituição não encontrada | Acheguese</title>
          <meta name="robots" content="noindex,follow" />
          <link rel="canonical" href={buildPublicAbsoluteUrl(showcasePath)} />
        </Helmet>
        <EducationDetailNotFoundState
          cityLabel={cityLabel}
          onGoToShowcase={goToShowcase}
        />
      </>
    );
  }

  const mapsHref = buildGoogleMapsSearchUrl(
    `${institutionName} ${districtLabel} ${cityLabel}`,
  );

  return (
    <div className="min-h-screen bg-territory-surface text-territory-ink">
      <Helmet>
        <title>
          {institutionName} - Educação em {cityLabel} | Acheguese
        </title>
        <meta
          name="description"
          content={
            sanitizePublicEducationText(profile.summary) ||
            `Conheça ${institutionName}, instituição educacional em ${districtLabel}, ${cityLabel}. Cursos, modalidades, equipe e contato direto.`
          }
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <section className="relative">
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br pb-16 pt-8 text-territory-on-image md:pb-24',
            gradient,
          )}
        >
          <div
            className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-territory-on-image/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-territory-on-image/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="container relative mx-auto px-4">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1 text-xs text-territory-on-image/80"
            >
              <Link
                to="/"
                className="rounded-sm hover:text-territory-on-image focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-on-image focus-visible:ring-offset-2 focus-visible:ring-offset-territory-brand"
              >
                Início
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <Link
                to={showcasePath}
                className="rounded-sm hover:text-territory-on-image focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-on-image focus-visible:ring-offset-2 focus-visible:ring-offset-territory-brand"
              >
                Educação
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <span className="capitalize">{districtLabel}</span>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <span className="font-medium text-territory-on-image">
                {institutionName}
              </span>
            </nav>

            <div className="mt-6 grid items-end gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-territory-on-image/30 bg-territory-on-image/15 text-territory-on-image backdrop-blur-sm">
                    <Icon className="mr-1 h-3 w-3" aria-hidden="true" />
                    {nicheConfig?.displayName ?? 'Instituição educacional'}
                  </Badge>
                  <Badge className="border-territory-on-image/30 bg-territory-on-image/15 text-territory-on-image backdrop-blur-sm">
                    <MapPin className="mr-1 h-3 w-3" aria-hidden="true" />
                    <span className="capitalize">
                      {districtLabel}, {cityLabel}
                    </span>
                  </Badge>
                  {profile.school_type === 'public' &&
                    profile.school_inep_code && (
                      <Badge className="border-territory-on-image/30 bg-territory-on-image/15 text-territory-on-image backdrop-blur-sm">
                        <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
                        INEP {profile.school_inep_code}
                      </Badge>
                    )}
                  {profile.enrollment_open === true && (
                    <Badge className="border-territory-sun/50 bg-territory-sun/25 text-territory-on-image backdrop-blur-sm">
                      <Star className="mr-1 h-3 w-3" aria-hidden="true" />
                      Matrículas abertas
                    </Badge>
                  )}
                </div>

                <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  {institutionName}
                </h1>

                {sanitizePublicEducationText(profile.summary) && (
                  <p className="mt-3 max-w-2xl text-balance text-base text-territory-on-image/90 md:text-lg">
                    {sanitizePublicEducationText(profile.summary)}
                  </p>
                )}

                {profile.school_source_updated_at && (
                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-territory-on-image/90">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      Referência atualizada em{' '}
                      {formatDate(profile.school_source_updated_at)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {profile.business_data_id && (
                  <button
                    type="button"
                    onClick={() => void toggleFavorite()}
                    disabled={favoriteLoading}
                    className={cn(
                      'inline-flex h-10 w-10 items-center justify-center rounded-full border border-territory-on-image/30 backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-on-image focus-visible:ring-offset-2 focus-visible:ring-offset-territory-brand disabled:cursor-not-allowed disabled:opacity-60',
                      isFavorite
                        ? 'bg-territory-on-image text-territory-brand'
                        : 'bg-territory-on-image/15 hover:bg-territory-on-image/25',
                    )}
                    aria-label={
                      isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
                    }
                    aria-pressed={isFavorite}
                  >
                    <Heart
                      className={cn(
                        'h-4 w-4',
                        isFavorite && 'fill-current',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-territory-on-image/30 bg-territory-on-image/15 backdrop-blur-sm transition hover:bg-territory-on-image/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-on-image focus-visible:ring-offset-2 focus-visible:ring-offset-territory-brand"
                  aria-label="Compartilhar"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {stats.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4">
                {stats.slice(0, 4).map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-territory-on-image/20 bg-territory-on-image/10 p-4 backdrop-blur-md"
                  >
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs uppercase tracking-wide text-territory-on-image/80">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <StickyTabs
        active={activeSection}
        onChange={handleSectionChange}
        sections={sections}
      />

      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-12">
            <section id="overview" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Compass className={sectionIconClassName} aria-hidden="true" />
                <h2 className={sectionTitleClassName}>Visão geral</h2>
              </header>
              <div className={`${surfaceCardClassName} p-6`}>
                <p className="text-base leading-relaxed text-territory-muted">
                  {sanitizePublicEducationText(profile.summary) ||
                    `Perfil de ${institutionName} em ${districtLabel}, ${cityLabel}. O Achegue-se exibe somente informações cadastradas ou sustentadas por fontes identificadas.`}
                </p>
              </div>
            </section>

            <section id="infrastructure" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Building2 className={sectionIconClassName} aria-hidden="true" />
                <h2 className={sectionTitleClassName}>Infraestrutura</h2>
              </header>
              <div className={`${surfaceCardClassName} space-y-5 p-6`}>
                {[
                  { title: 'Recursos básicos', items: basicResources },
                  { title: 'Acessibilidade', items: accessibilityFeatures },
                  { title: 'Equipamentos', items: equipmentFeatures },
                  { title: 'Instalações', items: facilityFeatures },
                ].map(({ title, items }) =>
                  items.length > 0 ? (
                    <div key={title}>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-territory-muted">
                        {title}
                      </h3>
                      <ul className="grid gap-2 md:grid-cols-2">
                        {items.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2 text-sm text-territory-ink"
                          >
                            <Check
                              className="h-4 w-4 text-territory-success"
                              aria-hidden="true"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null,
                )}
                {basicResources.length === 0 &&
                  accessibilityFeatures.length === 0 &&
                  equipmentFeatures.length === 0 &&
                  facilityFeatures.length === 0 && (
                    <div className={emptyStateClassName}>
                      Infraestrutura ainda não confirmada por fonte confiável. A
                      ausência de um item nesta página não significa que a unidade
                      não o possua.
                    </div>
                  )}
              </div>
            </section>

            <section id="programs" className="scroll-mt-24">
              <header className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className={sectionIconClassName} aria-hidden="true" />
                  <h2 className={sectionTitleClassName}>{labels.programPlural}</h2>
                </div>
                {programs.length > 0 && (
                  <Badge className="border-territory-border bg-territory-raised text-territory-ink">
                    {programs.length} disponíveis
                  </Badge>
                )}
              </header>
              {programs.length === 0 ? (
                <div className={`${emptyStateClassName} p-8 text-center`}>
                  <BookOpen
                    className="mx-auto h-8 w-8 text-territory-muted"
                    aria-hidden="true"
                  />
                  <p className="mt-3">
                    {labels.programEmptyState}. Entre em contato para mais informações.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {programs.map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      showPrice={profile.school_type !== 'public'}
                      onVisible={() => trackProgramImpression(program.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section id="modalities" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Globe className={sectionIconClassName} aria-hidden="true" />
                <h2 className={sectionTitleClassName}>Modalidades</h2>
              </header>
              {modalitiesPresent.size === 0 ? (
                <div className={emptyStateClassName}>
                  Modalidades ainda não informadas por fonte confiável.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {modalitiesPresent.has('presencial') && (
                    <ModalityCard
                      icon={Building2}
                      title="Presencial"
                      description="Modalidade presencial cadastrada para esta instituição."
                      highlight
                    />
                  )}
                  {modalitiesPresent.has('online') && (
                    <ModalityCard
                      icon={PlayCircle}
                      title="Online"
                      description="Modalidade online cadastrada para esta instituição."
                      highlight
                    />
                  )}
                  {modalitiesPresent.has('hibrido') && (
                    <ModalityCard
                      icon={Sparkles}
                      title="Híbrido"
                      description="Modalidade híbrida cadastrada para esta instituição."
                      highlight
                    />
                  )}
                </div>
              )}
            </section>

            <section id="team" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Users className={sectionIconClassName} aria-hidden="true" />
                <h2 className={sectionTitleClassName}>Equipe</h2>
              </header>
              <div className={emptyStateClassName}>
                Dados da equipe ainda não informados pela instituição.
              </div>
              <p className="mt-3 text-xs text-territory-muted">
                <Info className="mr-1 inline h-3 w-3" aria-hidden="true" />
                Esta página exibe somente informações declaradas pela instituição.
              </p>
            </section>

            <section id="gallery" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Camera className={sectionIconClassName} aria-hidden="true" />
                <h2 className={sectionTitleClassName}>Galeria</h2>
              </header>
              <div className={emptyStateClassName}>
                Nenhuma imagem oficial publicada por esta instituição até o momento.
              </div>
              <p className="mt-3 text-xs text-territory-muted">
                <Info className="mr-1 inline h-3 w-3" aria-hidden="true" />
                Imagens serão exibidas quando houver uma galeria institucional publicada.
              </p>
            </section>

            <section id="events" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Calendar className={sectionIconClassName} aria-hidden="true" />
                <h2 className={sectionTitleClassName}>{labels.eventPlural}</h2>
              </header>
              {events.length === 0 ? (
                <div className={`${emptyStateClassName} p-8 text-center`}>
                  <Calendar
                    className="mx-auto h-8 w-8 text-territory-muted"
                    aria-hidden="true"
                  />
                  <p className="mt-3">{labels.eventEmptyState}.</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {events.map((event) => (
                    <motion.article
                      key={event.id}
                      viewport={{ once: true, amount: 0.5 }}
                      onViewportEnter={() => trackEventImpression(event.id)}
                      className="rounded-2xl border border-territory-border bg-territory-surface p-5 text-territory-ink shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-territory-border bg-territory-raised text-[11px] text-territory-ink">
                          {formatDate(event.starts_at)}
                        </Badge>
                        {event.school_event_type &&
                          profile.niche_key === 'regular_school' && (
                            <Badge
                              variant="outline"
                              className="border-territory-brand/25 bg-territory-brand/10 text-[11px] text-territory-brand"
                            >
                              {SCHOOL_EVENT_TYPE_LABELS[event.school_event_type]}
                            </Badge>
                          )}
                      </div>
                      <h4 className="mt-2 text-base font-bold text-territory-ink">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="mt-1 line-clamp-3 text-sm text-territory-muted">
                          {event.description}
                        </p>
                      )}
                      {event.location && (
                        <div className="mt-3 inline-flex items-center gap-1 text-xs text-territory-muted">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {event.location}
                        </div>
                      )}
                    </motion.article>
                  ))}
                </div>
              )}
            </section>

            <section id="testimonials" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Quote className={sectionIconClassName} aria-hidden="true" />
                <h2 className={sectionTitleClassName}>Depoimentos</h2>
              </header>
              <div className={emptyStateClassName}>
                Sem depoimentos oficiais publicados.
              </div>
            </section>

            <section id="faq" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <HelpCircle className={sectionIconClassName} aria-hidden="true" />
                <h2 className={sectionTitleClassName}>Perguntas frequentes</h2>
              </header>
              <Accordion
                type="single"
                collapsible
                className="rounded-2xl border border-territory-border bg-territory-surface px-4 text-territory-ink shadow-sm"
              >
                {FALLBACK_FAQ.map((item, index) => (
                  <AccordionItem
                    key={item.q}
                    value={`faq-${index}`}
                    className="border-territory-border last:border-0"
                  >
                    <AccordionTrigger className="text-left text-sm font-semibold">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-territory-muted">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            <section id="location" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <MapIcon className={sectionIconClassName} aria-hidden="true" />
                <h2 className={sectionTitleClassName}>Localização</h2>
              </header>
              <div className={`${surfaceCardClassName} overflow-hidden`}>
                <div
                  className={cn(
                    'relative h-52 bg-gradient-to-br md:h-64',
                    gradient,
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin
                      className="h-12 w-12 text-territory-on-image/90"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold capitalize text-territory-ink">
                        {districtLabel}, {cityLabel}
                      </h3>
                      <p className="text-xs text-territory-muted">
                        Endereço completo disponível mediante contato.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="rounded-full border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
                    >
                      <a href={mapsHref} target="_blank" rel="noreferrer">
                        Abrir no Maps
                        <ExternalLink
                          className="ml-1 h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <EducationDetailSidebar
            handleLeadSubmit={handleLeadSubmit}
            profile={profile}
            showcaseHref={showcasePath}
            trackEnrollmentCTAClick={trackEnrollmentCTAClick}
            trackWhatsAppClick={trackWhatsAppClick}
            whatsappHref={whatsappHref}
          />
        </div>
      </section>
    </div>
  );
}

export default EducationDetailPage;
