import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  MapPin,
  Phone,
  Users,
  Star,
  ChevronLeft,
  Share2,
  Heart,
  Calendar,
  Check,
  ChevronRight,
  ArrowRight,
  Globe,
  Mail,
  Award,
  Lightbulb,
  Target,
  Shield,
  BookOpen,
  ExternalLink,
  Map as MapIcon,
  Building2,
  Sparkles,
  ChevronDown,
  Compass,
  Quote,
  PlayCircle,
  HelpCircle,
  Info,
  Camera,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { cn } from '@/shared/utils/cn';
import { getRecordValue } from '@/shared/utils/recordLookup';
import { buildPublicAbsoluteUrl } from '@/shared/config/publicAppOrigin';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';

import { useEducationDetail } from '../hooks/useEducationDetail';
import { useEducationEvents } from '../hooks/useEducationEvents';
import { useEducationPrograms } from '../hooks/useEducationPrograms';
import { getNicheByKey } from '../niches/registry';
import { useLabels } from '../hooks/useEducationLabels';
import { useEducationTracking } from '../hooks/useEducationTracking';
import { useEducationLeads } from '../hooks/useEducationLeads';
import { EducationUrlService } from '../services/EducationUrlService';
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

export function EducationDetailPage() {
  const { state, city, district, slug } = useParams();
  const navigate = useNavigate();
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
  const { events } = useEducationEvents(profile?.id, { isPublic: true, upcoming: true });
  const highlights: string[] = [];
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
    schoolManagementLabel ? { label: 'Gestão', value: schoolManagementLabel } : null,
    profile?.school_inep_code ? { label: 'INEP', value: profile.school_inep_code } : null,
    profile?.enrollment_open === true ? { label: 'Matrículas', value: 'Abertas' } : null,
    (profile?.education_levels ?? []).length > 0
      ? { label: 'Etapas', value: String(profile?.education_levels?.length ?? 0) }
      : null,
  ].filter((stat): stat is { label: string; value: string } => Boolean(stat));

  const nicheConfig = profile ? getNicheByKey(profile.niche_key) : null;
  const labels = useLabels(profile?.niche_key);
  const Icon = profile ? NICHE_ICONS[profile.niche_key] ?? GraduationCap : GraduationCap;
  const gradient = profile
    ? NICHE_GRADIENTS[profile.niche_key] ?? 'from-primary via-primary to-primary/70'
    : 'from-primary via-primary to-primary/70';

  const SECTIONS = getSections(labels);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [favorited, setFavorited] = useState(false);
  const { trackProfileView, trackProgramView, trackEventView, trackWhatsAppClick, trackEnrollmentCTAClick, trackLeadSubmitted } =
    useEducationTracking({
      educationProfileId: profile?.id ?? '',
      nicheKey: profile?.niche_key ?? 'regular_school',
      businessDataId: profile?.business_data_id ?? undefined,
    });
  const { createPublic: createLead } = useEducationLeads(profile?.id ?? undefined);

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

    if (lead) {
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

  const cityLabel = (city ?? '').replace(/-/g, ' ');
  const districtLabel = (district ?? '').replace(/-/g, ' ');

  const institutionName =
    profile?.business_name ?? profile?.institution_type ?? 'Instituição';
  const showcasePath = EducationUrlService.buildListingUrl({
    state: effectiveState,
    city: effectiveCity,
  });
  const canonicalPath =
    state && city && district && slug
      ? EducationUrlService.buildDetailUrl({ state, city, district, slug })
      : showcasePath;

  const whatsappHref = buildWhatsAppHref(profile?.whatsapp_number);

  const modalitiesPresent = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => {
      if (p.modality) {
        set.add(p.modality.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      }
    });
    return set;
  }, [programs]);

  const basicResources = (profile.school_basic_resources ?? [])
    .map((key) => getRecordValue(BASIC_RESOURCE_LABELS, key))
    .filter((label): label is string => Boolean(label));
  const accessibilityFeatures = (profile.school_accessibility_features ?? [])
    .map((key) => getRecordValue(ACCESSIBILITY_LABELS, key))
    .filter((label): label is string => Boolean(label));
  const equipmentFeatures = (profile.school_equipment_features ?? [])
    .map((key) => getRecordValue(EQUIPMENT_LABELS, key))
    .filter((label): label is string => Boolean(label));
  const facilityFeatures = (profile.school_facility_features ?? [])
    .map((key) => getRecordValue(FACILITY_LABELS, key))
    .filter((label): label is string => Boolean(label));

  const goToShowcase = () => navigate(showcasePath);

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
        <EducationDetailErrorState onBack={() => navigate(-1)} onGoToShowcase={goToShowcase} />
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
        <EducationDetailNotFoundState cityLabel={cityLabel} onGoToShowcase={goToShowcase} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
        <link rel="canonical" href={buildPublicAbsoluteUrl(canonicalPath)} />
      </Helmet>

      {/* HERO */}
      <section className="relative">
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br pb-16 pt-8 text-white md:pb-24',
            gradient
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, white 0%, transparent 30%), radial-gradient(circle at 80% 70%, white 0%, transparent 30%)',
            }}
          />
          <div className="container relative mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="flex flex-wrap items-center gap-1 text-xs text-white/80">
              <Link to="/" className="hover:text-white">
                Inicio
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link to={showcasePath} className="hover:text-white">
                Educação
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="capitalize">{districtLabel}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-white">{institutionName}</span>
            </nav>

            <div className="mt-6 grid items-end gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-white/30 bg-white/15 text-white backdrop-blur-sm">
                    <Icon className="mr-1 h-3 w-3" />
                    {nicheConfig?.displayName ?? profile.niche_key}
                  </Badge>
                  <Badge className="border-white/30 bg-white/15 text-white backdrop-blur-sm">
                    <MapPin className="mr-1 h-3 w-3" />
                    <span className="capitalize">{districtLabel}, {cityLabel}</span>
                  </Badge>
                  {profile.school_type === 'public' && profile.school_inep_code && (
                    <Badge className="border-white/30 bg-white/15 text-white backdrop-blur-sm">
                      <Shield className="mr-1 h-3 w-3" />
                      Cadastro público · INEP {profile.school_inep_code}
                    </Badge>
                  )}
                  {profile.enrollment_open === true && (
                    <Badge className="border-amber-300/40 bg-amber-500/30 text-white backdrop-blur-sm">
                      <Star className="mr-1 h-3 w-3" />
                      Matrículas Abertas
                    </Badge>
                  )}
                </div>

                <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  {institutionName}
                </h1>

                {sanitizePublicEducationText(profile.summary) && (
                  <p className="mt-3 max-w-2xl text-balance text-base text-white/90 md:text-lg">
                    {sanitizePublicEducationText(profile.summary)}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/90">
                  {profile.school_source_updated_at && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Fonte revisada em {formatDate(profile.school_source_updated_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFavorited((v) => !v)}
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 backdrop-blur-sm transition',
                    favorited ? 'bg-white text-primary' : 'bg-white/15 hover:bg-white/25'
                  )}
                  aria-label="Favoritar"
                >
                  <Heart
                    className={cn('h-4 w-4', favorited && 'fill-current')}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      navigator.share({ title: institutionName, url: window.location.href });
                    }
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm transition hover:bg-white/25"
                  aria-label="Compartilhar"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Stats strip */}
            {stats.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4">
                {stats.slice(0, 4).map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
                  >
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs uppercase tracking-wide text-white/80">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* STICKY TAB NAV */}
      <StickyTabs active={activeSection} onChange={setActiveSection} sections={SECTIONS} />

      {/* MAIN GRID */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main column */}
          <div className="space-y-12">
            {/* OVERVIEW */}
            <section id="overview" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Visão geral</h2>
              </header>
              <div className="rounded-3xl border border-border bg-card p-6">
                <p className="text-base leading-relaxed text-muted-foreground">
                  {sanitizePublicEducationText(profile.summary) ||
                    `Perfil de ${institutionName} em ${districtLabel}, ${cityLabel}. O Achegue-se exibe somente informações cadastradas ou sustentadas por fontes identificadas.`}
                </p>
                {highlights.length > 0 && (
                  <>
                    <Separator className="my-5" />
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Diferenciais
                    </h3>
                    <ul className="grid gap-2 md:grid-cols-2">
                      {highlights.map((h, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>

            <section id="infrastructure" className="scroll-mt-24">
                <header className="mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold">Infraestrutura</h2>
                </header>
                <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                  {basicResources.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Recursos básicos
                      </h3>
                      <ul className="grid gap-2 md:grid-cols-2">
                        {basicResources.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {accessibilityFeatures.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Acessibilidade
                      </h3>
                      <ul className="grid gap-2 md:grid-cols-2">
                        {accessibilityFeatures.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {equipmentFeatures.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Equipamentos
                      </h3>
                      <ul className="grid gap-2 md:grid-cols-2">
                        {equipmentFeatures.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {facilityFeatures.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Instalações
                      </h3>
                      <ul className="grid gap-2 md:grid-cols-2">
                        {facilityFeatures.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {basicResources.length === 0 &&
                    accessibilityFeatures.length === 0 &&
                    equipmentFeatures.length === 0 &&
                    facilityFeatures.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        Infraestrutura ainda não confirmada por fonte confiável. A ausência de um
                        item nesta página não significa que a unidade não o possua.
                      </div>
                    )}
                </div>
              </section>

            {/* PROGRAMS */}
            <section id="programs" className="scroll-mt-24">
              <header className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold">{labels.programPlural}</h2>
                </div>
                {programs.length > 0 && (
                  <Badge variant="secondary">{programs.length} disponíveis</Badge>
                )}
              </header>
              {programs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {labels.programEmptyState}. Entre em contato para mais informações.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {programs.map((p) => (
                    <ProgramCard
                      key={p.id}
                      program={p}
                      showPrice={profile.school_type !== 'public'}
                      onClick={() => trackProgramView(p.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* MODALITIES */}
            <section id="modalities" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Modalidades</h2>
              </header>
              {modalitiesPresent.size === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
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

            {/* TEAM */}
            <section id="team" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Equipe</h2>
              </header>
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
                Dados da equipe ainda não informados pela instituição.
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <Info className="mr-1 inline h-3 w-3" />
                Este módulo exibe somente informações declaradas pela instituição.
              </p>
            </section>

            {/* GALLERY */}
            <section id="gallery" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Galeria</h2>
              </header>
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
                Nenhuma imagem oficial publicada por esta instituição até o momento.
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <Info className="mr-1 inline h-3 w-3" />
                As imagens serão exibidas automaticamente quando a instituição enviar a galeria.
              </p>
            </section>

            {/* EVENTS */}
            <section id="events" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">{labels.eventPlural}</h2>
              </header>
              {events.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {labels.eventEmptyState}.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {events.map((ev) => (
                    <article
                      key={ev.id}
                      className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/30 cursor-pointer"
                      onClick={() => trackEventView(ev.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[11px]">
                          {formatDate(ev.starts_at)}
                        </Badge>
                        {ev.school_event_type && profile?.niche_key === 'regular_school' && (
                          <Badge variant="outline" className="text-[11px] border-indigo-200 text-indigo-700 bg-indigo-50">
                            {ev.school_event_type === 'open_house' ? 'Portas Abertas' :
                             ev.school_event_type === 'enrollment_fair' ? 'Feira de Matrícula' :
                             ev.school_event_type === 'parent_meeting' ? 'Reunião de Pais' :
                             ev.school_event_type === 'trial_class' ? 'Aula Experimental' :
                             ev.school_event_type === 'school_tour' ? 'Visita Escolar' :
                             ev.school_event_type === 'cultural_event' ? 'Evento Cultural' :
                             ev.school_event_type === 'sports_event' ? 'Evento Esportivo' :
                             'Outro'}
                          </Badge>
                        )}
                      </div>
                      <h4 className="mt-2 text-base font-bold">{ev.title}</h4>
                      {ev.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                          {ev.description}
                        </p>
                      )}
                      {ev.location && (
                        <div className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {ev.location}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* TESTIMONIALS */}
            <section id="testimonials" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Quote className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Depoimentos</h2>
              </header>
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
                Sem depoimentos oficiais publicados.
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Perguntas frequentes</h2>
              </header>
              <Accordion
                type="single"
                collapsible
                className="rounded-2xl border border-border bg-card px-4"
              >
                {FALLBACK_FAQ.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-b last:border-0">
                    <AccordionTrigger className="text-left text-sm font-semibold">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* LOCATION */}
            <section id="location" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Localização</h2>
              </header>
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <div
                  className={cn(
                    'relative h-52 bg-gradient-to-br md:h-64',
                    gradient,
                    'opacity-90'
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-white/90" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold capitalize">
                        {districtLabel}, {cityLabel}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Endereço completo disponível mediante contato.
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(
                        `${institutionName} ${districtLabel} ${cityLabel}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="outline" size="sm" className="rounded-full">
                        Abrir no Maps <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </a>
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
