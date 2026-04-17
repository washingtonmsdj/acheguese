/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VAGA DETAIL PUBLIC PAGE — Página pública de detalhe de vaga (Nível AAA)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Rota canônica: /vagas/:uf/:cidade/:slug
 * 
 * Features:
 * - Cabeçalho forte com todas as informações principais
 * - Card lateral com CTA de candidatura
 * - Seções separadas (sobre, requisitos, benefícios, etc)
 * - Bloco da empresa com outras vagas
 * - Vagas relacionadas
 * - Tratamento para status especiais
 * - SEO otimizado
 * - Ações: salvar, compartilhar, denunciar
 * 
 * @version 3.0.0 - Página Completa AAA
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Briefcase, MapPin, Clock, Star, Share2,
  Heart, Zap, Building2, CalendarDays, DollarSign,
  GraduationCap, Monitor, CheckCircle2, AlertCircle,
  ExternalLink, MessageCircle, Mail, Phone, Send,
  ChevronRight, Flag, Bookmark,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { SEO } from '@/shared/components/seo/SEO';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';

import { useVagaDetail } from '../hooks/useVagaDetail';
import { VagaCardEnhanced } from '../components/VagaCardEnhanced';
import {
  formatSalary,
  isVagaActive,
  canApplyToVaga,
  CONTRATO_LABELS,
  MODALIDADE_LABELS,
  NIVEL_LABELS,
  URGENCIA_LABELS,
  APPLICATION_CHANNEL_LABELS,
  HIGHLIGHT_TYPE_LABELS,
  type Vaga,
} from '../types/vagas.types';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) return 'Hoje';
  if (diffInHours < 48) return 'Ontem';
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} dias atrás`;
  
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

function getStatusBadge(vaga: Vaga) {
  switch (vaga.status) {
    case 'closed':
      return { label: 'Encerrada', variant: 'secondary' as const, icon: AlertCircle };
    case 'expired':
      return { label: 'Expirada', variant: 'secondary' as const, icon: Clock };
    case 'paused':
      return { label: 'Pausada', variant: 'warning' as const, icon: AlertCircle };
    case 'published':
      if (!isVagaActive(vaga)) {
        return { label: 'Expirada', variant: 'secondary' as const, icon: Clock };
      }
      return null;
    default:
      return { label: 'Indisponível', variant: 'secondary' as const, icon: AlertCircle };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Botão de Candidatura
// ═══════════════════════════════════════════════════════════════════════════════

function ApplicationButton({ vaga, onApply, isLoading }: { vaga: Vaga; onApply: () => void; isLoading: boolean }) {
  const { toast } = useToast();
  
  if (!canApplyToVaga(vaga)) {
    const statusBadge = getStatusBadge(vaga);
    if (statusBadge) {
      const Icon = statusBadge.icon;
      return (
        <Button disabled className="w-full h-14 gap-2" size="lg" variant="secondary">
          <Icon className="h-5 w-5" />
          Vaga {statusBadge.label}
        </Button>
      );
    }
  }

  const channel = APPLICATION_CHANNEL_LABELS[vaga.applicationChannel];
  
  const handleClick = () => {
    try {
      onApply();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível candidatar-se',
        variant: 'destructive',
      });
    }
  };

  const icons: Record<string, React.ReactNode> = {
    Send: <Send className="h-5 w-5" />,
    MessageCircle: <MessageCircle className="h-5 w-5" />,
    Mail: <Mail className="h-5 w-5" />,
    ExternalLink: <ExternalLink className="h-5 w-5" />,
    Phone: <Phone className="h-5 w-5" />,
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full h-14 gap-2 bg-primary hover:bg-primary/90"
      size="lg"
    >
      {isLoading ? (
        <>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Processando...
        </>
      ) : (
        <>
          {icons[channel.icon] || <Send className="h-5 w-5" />}
          {channel.label}
        </>
      )}
    </Button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Card de Informação
// ═══════════════════════════════════════════════════════════════════════════════

function InfoCard({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Seção de Lista
// ═══════════════════════════════════════════════════════════════════════════════

function ListSection({ title, items, icon: Icon }: { title: string; items: string[]; icon: typeof CheckCircle2 }) {
  if (!items || items.length === 0) return null;
  
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function VagaDetailPublicPage() {
  const navigate = useNavigate();
  const { state, city, slug } = useParams<{ state: string; city: string; slug: string }>();
  const appUrls = useAppUrls();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isShareOpen, setIsShareOpen] = useState(false);

  const {
    vaga,
    vagasRelacionadas,
    vagasEmpresa,
    isLoading,
    isError,
    isCandidatando,
    candidatarSe,
    compartilhar,
    salvarVaga,
    isSaved,
  } = useVagaDetail({ slug: slug || '' });

  // SEO
  const pageTitle = vaga ? `${vaga.titulo} na ${vaga.empresaNome} | Vagas ${city}` : 'Vaga de Emprego';
  const pageDescription = vaga
    ? `Vaga de ${vaga.titulo} na ${vaga.empresaNome}. ${vaga.resumo || vaga.descricao.slice(0, 150)}... Candidate-se agora!`
    : 'Detalhes da vaga de emprego';

  // Handlers
  const handleShare = useCallback(async () => {
    try {
      await compartilhar();
      toast({
        title: 'Link copiado!',
        description: 'O link da vaga foi copiado para a área de transferência.',
      });
    } catch {
      // Silencioso
    }
  }, [compartilhar, toast]);

  const handleSave = useCallback(async () => {
    await salvarVaga();
    toast({
      title: isSaved ? 'Vaga removida' : 'Vaga salva!',
      description: isSaved ? 'A vaga foi removida dos seus favoritos.' : 'A vaga foi salva para você consultar depois.',
    });
  }, [salvarVaga, isSaved, toast]);

  const handleDenuncia = useCallback(() => {
    toast({
      title: 'Denúncia recebida',
      description: 'Obrigado por nos informar. Vamos analisar esta vaga.',
    });
  }, [toast]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !vaga) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Briefcase className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Vaga não encontrada</h1>
        <p className="text-muted-foreground mb-6 text-center">
          A vaga que você procura não existe, foi encerrada ou expirou.
        </p>
        <Button onClick={() => navigate(`/vagas/${state}/${city}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Ver todas as vagas
        </Button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(vaga);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <SEO title={pageTitle} description={pageDescription} />

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">Voltar</span>
            </button>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <button
              onClick={() => navigate(`/vagas/${state}/${city}`)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block"
            >
              Vagas
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </button>
            <button
              onClick={handleShare}
              className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleDenuncia}
              className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <Flag className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ── BREADCRUMB ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Início</button>
          <ChevronRight className="h-4 w-4" />
          <button onClick={() => navigate(`/vagas/${state}/${city}`)} className="hover:text-primary transition-colors">
            Vagas {city}
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{vaga.titulo}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── COLUNA PRINCIPAL ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6 relative overflow-hidden"
            >
              {/* Badges de destaque */}
              <div className="absolute top-0 right-0 flex flex-col items-end gap-1">
                {vaga.urgencia !== 'normal' && (
                  <Badge className="bg-destructive text-white rounded-bl-xl rounded-tr-none">
                    <Zap className="h-3 w-3 mr-1" />
                    {URGENCIA_LABELS[vaga.urgencia]}
                  </Badge>
                )}
                {vaga.highlightType !== 'none' && (
                  <Badge className={`${HIGHLIGHT_TYPE_LABELS[vaga.highlightType].bgColor} ${HIGHLIGHT_TYPE_LABELS[vaga.highlightType].color} rounded-bl-xl rounded-tr-none mt-1`}>
                    <Star className="h-3 w-3 mr-1" />
                    {HIGHLIGHT_TYPE_LABELS[vaga.highlightType].label}
                  </Badge>
                )}
                {statusBadge && (
                  <Badge variant={statusBadge.variant} className="rounded-bl-xl rounded-tr-none mt-1">
                    <statusBadge.icon className="h-3 w-3 mr-1" />
                    {statusBadge.label}
                  </Badge>
                )}
              </div>

              {/* Título e Empresa */}
              <div className="flex items-start gap-4 pr-24">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {vaga.empresaLogoUrl ? (
                    <img src={vaga.empresaLogoUrl} alt={vaga.empresaNome} className="h-12 w-12 object-contain" />
                  ) : (
                    <Building2 className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{vaga.titulo}</h1>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <Building2 className="h-4 w-4" />
                    {vaga.empresaNome}
                  </p>
                </div>
              </div>

              {/* Meta informações */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline">{CONTRATO_LABELS[vaga.contrato]}</Badge>
                <Badge variant="outline">{MODALIDADE_LABELS[vaga.modalidade]}</Badge>
                <Badge variant="outline">{NIVEL_LABELS[vaga.nivel]}</Badge>
                {vaga.categoria && <Badge variant="outline">{vaga.categoria}</Badge>}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                <InfoCard
                  icon={MapPin}
                  label="Localização"
                  value={vaga.bairroNome || city || 'Cidade'}
                />
                <InfoCard
                  icon={DollarSign}
                  label="Salário"
                  value={formatSalary(vaga)}
                />
                <InfoCard
                  icon={CalendarDays}
                  label="Publicada"
                  value={vaga.publishedAt ? formatRelativeDate(vaga.publishedAt) : 'Recente'}
                />
                <InfoCard
                  icon={Briefcase}
                  label="Vagas"
                  value={`${vaga.vagasQuantidade} vaga${vaga.vagasQuantidade !== 1 ? 's' : ''}`}
                />
              </div>
            </motion.div>

            {/* Descrição */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">Sobre a vaga</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                {vaga.descricao}
              </div>
            </motion.div>

            {/* Responsabilidades */}
            <ListSection title="Responsabilidades" items={vaga.responsabilidades} icon={Briefcase} />

            {/* Requisitos */}
            <ListSection title="Requisitos Obrigatórios" items={vaga.requisitos} icon={CheckCircle2} />

            {/* Diferenciais */}
            <ListSection title="Diferenciais Desejáveis" items={vaga.diferenciais} icon={Star} />

            {/* Benefícios */}
            {vaga.beneficios.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold text-foreground">Benefícios</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vaga.beneficios.map((beneficio, i) => (
                    <Badge key={i} variant="secondary">{beneficio}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Jornada */}
            {vaga.jornadaDescricao && (
              <section className="bg-muted rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Jornada de Trabalho</h3>
                </div>
                <p className="text-sm text-muted-foreground">{vaga.jornadaDescricao}</p>
              </section>
            )}

            {/* Tags */}
            {vaga.tags.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {vaga.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Vagas relacionadas */}
            {vagasRelacionadas.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="pt-6 border-t border-border"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4">Vagas semelhantes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vagasRelacionadas.map((vagaRel) => (
                    <VagaCardEnhanced
                      key={vagaRel.id}
                      vaga={vagaRel}
                      variant="compact"
                      onClick={() => navigate(`/vagas/${state}/${city}/${vagaRel.slug}`)}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* ── COLUNA LATERAL ───────────────────────────────── */}
          <div className="space-y-6">
            {/* CTA Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl p-6 sticky top-20"
            >
              <ApplicationButton vaga={vaga} onApply={candidatarSe} isLoading={isCandidatando} />
              
              {vaga.applicationInstructions && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {vaga.applicationInstructions}
                </p>
              )}

              <Separator className="my-4" />

              {/* Info da empresa */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Sobre a empresa</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    {vaga.empresaLogoUrl ? (
                      <img src={vaga.empresaLogoUrl} alt={vaga.empresaNome} className="h-8 w-8 object-contain" />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{vaga.empresaNome}</p>
                    {vaga.empresaId && (
                      <button
                        onClick={() => navigate(`/empresa/${vaga.empresaId}`)}
                        className="text-xs text-primary hover:underline"
                      >
                        Ver perfil da empresa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Outras vagas da empresa */}
              {vagasEmpresa.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Mais vagas desta empresa</p>
                    {vagasEmpresa.map((vagaEmp) => (
                      <button
                        key={vagaEmp.id}
                        onClick={() => navigate(`/vagas/${state}/${city}/${vagaEmp.slug}`)}
                        className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground line-clamp-1">{vagaEmp.titulo}</p>
                        <p className="text-xs text-muted-foreground">{formatSalary(vagaEmp)}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Stats */}
            <div className="bg-muted rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Visualizações</span>
                <span className="font-medium">{vaga.viewCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Candidaturas</span>
                <span className="font-medium">{vaga.applicationCount}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
