/**
 * EducationDetailPage
 *
 * Pagina de detalhes premium de instituicao educacional.
 * Layout magazine premium com hero imersivo, navegacao por secoes,
 * sidebar sticky de conversao (lead form + WhatsApp + visita).
 *
 * Foco: confianca, clareza e conversao.
 *
 * Rota: /educacao/:state/:city/:district/:slug
 *
 * Consome SSOT existente:
 *  - useEducationDetail (hook)
 *  - getNicheByKey (registry)
 *  - educationDetailPreviewMap (mocks de preview, isolados em /mocks)
 *  - EducationLeadForm (componente compartilhado)
 *
 * @module education
 * @version 3.0.0
 */

import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  MapPin,
  Phone,
  Clock,
  Users,
  Star,
  ChevronLeft,
  Share2,
  Heart,
  Calendar,
  Check,
  ChevronRight,
  ArrowRight,
  MessageCircle,
  Globe,
  Mail,
  FileText,
  Award,
  Lightbulb,
  Target,
  Shield,
  School,
  Baby,
  Languages,
  Calculator,
  Music,
  Dumbbell,
  Wrench,
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
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { cn } from '@/shared/utils/cn';

import { useEducationDetail } from '../hooks/useEducationDetail';
import { getNicheByKey } from '../niches/registry';
import { useLabels } from '../hooks/useEducationLabels';
import { useEducationTracking } from '../hooks/useEducationTracking';
import { useEducationLeads } from '../hooks/useEducationLeads';
import { EducationLeadForm } from '../components/EducationLeadForm';
import type { LeadFormData } from '../components/EducationLeadForm';
import {
  educationDetailPreviewMap,
  type EducationDetailPreview,
} from '../mocks/publicEducationPage.mock';
import type { EducationProgram, EducationEvent, EducationProfile } from '../types';

// ============================================================================
// MAPAS DE PRESENTACAO
// ============================================================================

const NICHE_ICONS: Record<string, React.ElementType> = {
  regular_school: School,
  daycare: Baby,
  language_school: Languages,
  prep_course: Calculator,
  technical_school: Wrench,
  tutoring_center: BookOpen,
  music_school: Music,
  sports_school: Dumbbell,
};

const NICHE_GRADIENTS: Record<string, string> = {
  regular_school: 'from-blue-600 via-blue-500 to-indigo-600',
  daycare: 'from-pink-500 via-rose-400 to-pink-600',
  language_school: 'from-emerald-500 via-teal-400 to-emerald-600',
  prep_course: 'from-orange-500 via-amber-400 to-orange-600',
  technical_school: 'from-violet-600 via-purple-500 to-violet-700',
  tutoring_center: 'from-cyan-500 via-blue-400 to-cyan-600',
  music_school: 'from-fuchsia-500 via-pink-400 to-fuchsia-600',
  sports_school: 'from-lime-500 via-green-400 to-emerald-600',
};

function getSections(labels: ReturnType<typeof useLabels>) {
  return [
    { id: 'overview', label: 'Visao geral', icon: Compass },
    { id: 'programs', label: labels.programPlural, icon: BookOpen },
    { id: 'modalities', label: 'Modalidades', icon: Globe },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'gallery', label: 'Galeria', icon: Camera },
    { id: 'events', label: labels.eventPlural, icon: Calendar },
    { id: 'testimonials', label: 'Depoimentos', icon: Quote },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'location', label: 'Localizacao', icon: MapIcon },
  ] as const;
}

const FALLBACK_TEAM = [
  { name: 'Coordenacao Pedagogica', role: 'Coordenacao', initials: 'CP' },
  { name: 'Equipe de Professores', role: 'Docentes', initials: 'EP' },
  { name: 'Equipe Multidisciplinar', role: 'Apoio', initials: 'EM' },
];

const FALLBACK_TESTIMONIALS = [
  {
    name: 'Familia Souza',
    role: 'Pais',
    quote:
      'O acompanhamento individual transformou a rotina dos nossos filhos. Comunicacao excelente.',
  },
  {
    name: 'Marina Lima',
    role: 'Aluna',
    quote: 'Aulas dinamicas, professores preparados e estrutura confortavel.',
  },
  {
    name: 'Carlos Mendes',
    role: 'Responsavel',
    quote: 'Recomendo. Equipe atenciosa e proposta pedagogica solida.',
  },
];

const FALLBACK_FAQ = [
  {
    q: 'Como agendar uma visita?',
    a: 'Voce pode solicitar uma visita pelo formulario de interesse ou diretamente pelo WhatsApp. A equipe entrara em contato em ate 24h para confirmar data e horario.',
  },
  {
    q: 'Quais documentos sao necessarios para matricula?',
    a: 'Os documentos variam por programa. Em geral, sao solicitados RG/Certidao, comprovante de residencia, historico escolar (quando aplicavel) e dados dos responsaveis.',
  },
  {
    q: 'Como funciona a aula experimental?',
    a: 'Quando disponivel para o programa, a aula experimental permite vivenciar uma aula completa antes de decidir pela matricula. Solicite via formulario.',
  },
  {
    q: 'Existe periodo de adaptacao?',
    a: 'Sim. Em programas infantis e creche, oferecemos periodo de adaptacao gradual com acompanhamento da equipe pedagogica.',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(value: number | null) {
  if (!value) return null;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

function StickyTabs({
  active,
  onChange,
  sections,
}: {
  active: string;
  onChange: (id: string) => void;
  sections: ReturnType<typeof getSections>;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-background/85 px-4 backdrop-blur-md md:-mx-6 md:px-6">
      <div className="container mx-auto flex gap-1 overflow-x-auto py-3">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgramCard({ program, onClick }: { program: EducationProgram; onClick?: () => void }) {
  const hasSlots = (program.available_slots ?? 0) > 0;
  const isSchoolProgram = Boolean(program.grade || program.class_name);
  const vacancyRate = program.max_capacity && program.current_enrollment
    ? Math.round((program.current_enrollment / program.max_capacity) * 100)
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[11px]">
              {program.modality ?? 'Presencial'}
            </Badge>
            {isSchoolProgram && program.grade && (
              <Badge variant="outline" className="text-[11px]">
                {program.grade}
              </Badge>
            )}
            {isSchoolProgram && program.class_name && (
              <Badge variant="outline" className="text-[11px]">
                Turma {program.class_name}
              </Badge>
            )}
          </div>
          <h4 className="mt-2 text-lg font-bold leading-tight">{program.name}</h4>
        </div>
        {hasSlots ? (
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
            {program.available_slots} vagas
          </Badge>
        ) : vacancyRate !== null ? (
          <Badge className={vacancyRate >= 90 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}>
            {vacancyRate}% preenchido
          </Badge>
        ) : (
          <Badge variant="outline">Lista de espera</Badge>
        )}
      </div>
      {program.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
          {program.description}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {program.age_group && (
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-muted-foreground">Idade</dt>
            <dd className="font-semibold text-foreground">{program.age_group}</dd>
          </div>
        )}
        {program.shift && (
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-muted-foreground">Turno</dt>
            <dd className="font-semibold text-foreground">{program.shift}</dd>
          </div>
        )}
        {isSchoolProgram && program.schedule && (
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-muted-foreground">Horario</dt>
            <dd className="font-semibold text-foreground">{program.schedule}</dd>
          </div>
        )}
        {isSchoolProgram && program.max_capacity && (
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-muted-foreground">Capacidade</dt>
            <dd className="font-semibold text-foreground">
              {program.current_enrollment ?? 0}/{program.max_capacity} alunos
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex items-end justify-between pt-4">
        {program.price_from ? (
          <div>
            <div className="text-[11px] text-muted-foreground">A partir de</div>
            <div className="text-base font-bold text-foreground">
              {formatPrice(program.price_from)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">/mes</span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Consultar valor</span>
        )}
        <Button size="sm" variant="ghost" className="rounded-full text-primary">
          Saber mais <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </motion.article>
  );
}

function ModalityCard({
  icon: Icon,
  title,
  description,
  highlight,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-all',
        highlight
          ? 'border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm'
          : 'border-border bg-card hover:border-primary/30'
      )}
    >
      <div
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-xl',
          highlight ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="mt-3 font-bold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// ============================================================================
// PAGINA PRINCIPAL
// ============================================================================

export function EducationDetailPage() {
  const { state, city, district, slug } = useParams();
  const navigate = useNavigate();

  const { data: realProfile, isLoading, isError } = useEducationDetail({
    state,
    city,
    district,
    slug,
  });

  const allowPreviewFallback = import.meta.env.DEV;

  const previewDetail: EducationDetailPreview | undefined = allowPreviewFallback && slug
    ? educationDetailPreviewMap[slug]
    : undefined;

  const isPreviewSource = !realProfile && Boolean(previewDetail);
  const profile: EducationProfile | null = realProfile ?? previewDetail?.profile ?? null;
  
  const programs: EducationProgram[] = useMemo(() => {
    return previewDetail?.programs ?? [];
  }, [previewDetail?.programs]);
  
  const events: EducationEvent[] = previewDetail?.events ?? [];
  const highlights: string[] = previewDetail?.highlights ?? [];
  const stats = previewDetail?.stats ?? [];

  const nicheConfig = profile ? getNicheByKey(profile.niche_key) : null;
  const labels = useLabels(profile?.niche_key);
  const Icon = profile ? NICHE_ICONS[profile.niche_key] ?? GraduationCap : GraduationCap;
  const gradient = profile
    ? NICHE_GRADIENTS[profile.niche_key] ?? 'from-primary via-primary to-primary/70'
    : 'from-primary via-primary to-primary/70';

  const SECTIONS = getSections(labels);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [favorited, setFavorited] = useState(false);

  // Tracking
  const { trackProfileView, trackProgramView, trackEventView, trackWhatsAppClick, trackEnrollmentCTAClick, trackLeadSubmitted } =
    useEducationTracking({
      educationProfileId: profile?.id ?? '',
      nicheKey: profile?.niche_key ?? 'regular_school',
      businessId: profile?.business_id,
    });

  // Lead creation for tracking
  const { create: createLead } = useEducationLeads(profile?.id ?? undefined);

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

  // Track page view once profile loads
  useEffect(() => {
    if (profile?.id && !isPreviewSource) {
      trackProfileView();
    }
  }, [profile?.id, isPreviewSource, trackProfileView]);

  const cityLabel = (city ?? '').replace(/-/g, ' ');
  const districtLabel = (district ?? '').replace(/-/g, ' ');

  const institutionName =
    previewDetail?.institutionName ?? profile?.institution_type ?? 'Instituicao';

  const whatsappHref = profile?.whatsapp_number
    ? `https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}`
    : null;

  const modalitiesPresent = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => {
      if (p.modality) set.add(p.modality.toLowerCase());
    });
    return set;
  }, [programs]);

  // ============================================================================
  // ESTADOS
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-10">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-6 h-64 w-full rounded-3xl" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
          <Shield className="h-12 w-12 text-rose-500" />
          <h1 className="mt-4 text-2xl font-bold">Nao conseguimos carregar esta pagina</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Houve um erro ao buscar os detalhes desta instituicao. Tente novamente em
            instantes ou volte para a vitrine.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)} className="rounded-full">
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            <Button
              onClick={() => navigate(`/educacao/${state}/${city}`)}
              className="rounded-full"
            >
              Ir para vitrine
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
          <Compass className="h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Instituicao nao encontrada</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Nao localizamos a instituicao buscada. Volte para a vitrine para descobrir
            outras opcoes em {cityLabel}.
          </p>
          <Button
            onClick={() => navigate(`/educacao/${state}/${city}`)}
            className="mt-6 rounded-full"
          >
            Ver vitrine educacional
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>
          {institutionName} â€” Educacao em {cityLabel} | Acheguese
        </title>
        <meta
          name="description"
          content={
            profile.summary ??
            `Conheca ${institutionName}, instituicao educacional em ${districtLabel}, ${cityLabel}. Cursos, modalidades, equipe e contato direto.`
          }
        />
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
              <Link to={`/educacao/${state}/${city}`} className="hover:text-white">
                Educacao
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
                  {profile.status === 'published' && (
                    <Badge className="border-emerald-300/40 bg-emerald-500/30 text-white backdrop-blur-sm">
                      <Check className="mr-1 h-3 w-3" />
                      Verificado
                    </Badge>
                  )}
                  {profile.enrollment_open === true && (
                    <Badge className="border-amber-300/40 bg-amber-500/30 text-white backdrop-blur-sm">
                      <Star className="mr-1 h-3 w-3" />
                      Matriculas Abertas
                    </Badge>
                  )}
                  {isPreviewSource && (
                    <Badge className="border-white/30 bg-white/15 text-white backdrop-blur-sm">
                      <Info className="mr-1 h-3 w-3" />
                      Preview
                    </Badge>
                  )}
                </div>

                <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  {institutionName}
                </h1>

                {profile.summary && (
                  <p className="mt-3 max-w-2xl text-balance text-base text-white/90 md:text-lg">
                    {profile.summary}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/90">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    <strong>4.8</strong> (126 avaliacoes)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Resposta em ate 24h
                  </span>
                  {profile.published_at && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Desde{' '}
                      {new Date(profile.published_at).getFullYear()}
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
                <h2 className="text-2xl font-bold">Visao geral</h2>
              </header>
              <div className="rounded-3xl border border-border bg-card p-6">
                <p className="text-base leading-relaxed text-muted-foreground">
                  {profile.summary ??
                    `${institutionName} e uma instituicao educacional em ${cityLabel}, focada em entregar uma experiencia de aprendizagem de alta qualidade.`}
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

            {/* PROGRAMS */}
            <section id="programs" className="scroll-mt-24">
              <header className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold">{labels.programPlural}</h2>
                </div>
                {programs.length > 0 && (
                  <Badge variant="secondary">{programs.length} disponiveis</Badge>
                )}
              </header>
              {programs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {labels.programEmptyState}. Entre em contato para mais informacoes.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {programs.map((p) => (
                    <ProgramCard 
                      key={p.id} 
                      program={p} 
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
              <div className="grid gap-4 md:grid-cols-3">
                <ModalityCard
                  icon={Building2}
                  title="Presencial"
                  description="Aulas na unidade com infraestrutura completa, equipe e ambiente preparado."
                  highlight={modalitiesPresent.has('presencial')}
                />
                <ModalityCard
                  icon={PlayCircle}
                  title="Online"
                  description="Aulas ao vivo ou conteudo digital com acompanhamento periodico."
                  highlight={modalitiesPresent.has('online')}
                />
                <ModalityCard
                  icon={Sparkles}
                  title="Hibrido"
                  description="Combinacao de encontros presenciais e atividades remotas."
                  highlight={modalitiesPresent.has('hibrido') || modalitiesPresent.has('hÃ­brido')}
                />
              </div>
            </section>

            {/* TEAM */}
            <section id="team" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Equipe</h2>
              </header>
              <div className="grid gap-3 sm:grid-cols-3">
                {FALLBACK_TEAM.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                  >
                    <div
                      className={cn(
                        'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white',
                        gradient
                      )}
                    >
                      {m.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <Info className="mr-1 inline h-3 w-3" />
                Apresentacao geral da equipe. Solicite o detalhamento por programa.
              </p>
            </section>

            {/* GALLERY */}
            <section id="gallery" className="scroll-mt-24">
              <header className="mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Galeria</h2>
              </header>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'aspect-square rounded-2xl bg-gradient-to-br',
                      gradient,
                      'opacity-70'
                    )}
                  >
                    <div className="flex h-full w-full items-center justify-center text-white/70">
                      <Camera className="h-6 w-6" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <Info className="mr-1 inline h-3 w-3" />
                Galeria ilustrativa. Imagens da instituicao serao exibidas quando enviadas.
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
                             ev.school_event_type === 'enrollment_fair' ? 'Feira de MatrÃ­cula' :
                             ev.school_event_type === 'parent_meeting' ? 'ReuniÃ£o de Pais' :
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
              <div className="grid gap-4 md:grid-cols-3">
                {FALLBACK_TESTIMONIALS.map((t, i) => (
                  <motion.blockquote
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <Quote className="h-5 w-5 text-primary/60" />
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      "{t.quote}"
                    </p>
                    <footer className="mt-4 text-xs text-muted-foreground">
                      <strong className="text-foreground">{t.name}</strong> Â· {t.role}
                    </footer>
                  </motion.blockquote>
                ))}
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
                <h2 className="text-2xl font-bold">Localizacao</h2>
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
                        Endereco completo disponivel mediante contato.
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

          {/* STICKY SIDEBAR */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="space-y-4">
              {/* CTAs principais */}
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Falar com a instituicao
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
                    onClick={() => trackEnrollmentCTAClick('Solicitar orcamento')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Solicitar orcamento
                  </Button>
                </div>
              </div>

              {/* Lead form */}
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <EducationLeadForm 
                  educationProfileId={profile.id} 
                  nicheKey={profile.niche_key}
                  onSubmit={handleLeadSubmit}
                />
              </div>

              {/* Confianca */}
              <div className="rounded-3xl border border-border bg-gradient-to-br from-muted/40 to-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4 text-emerald-500" /> Por que confiar
                </div>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" /> Perfil
                    verificado
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" /> Comunicacao
                    direta com a instituicao
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-emerald-500" /> Avaliacoes
                    autenticas de familias
                  </li>
                </ul>
              </div>

              {/* Voltar para vitrine */}
              <Link
                to={`/educacao/${state}/${city}`}
                className="block rounded-3xl border border-dashed border-border bg-card/40 p-4 text-center text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <ChevronLeft className="mr-1 inline h-4 w-4" /> Voltar para vitrine
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default EducationDetailPage;

