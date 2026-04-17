/**
 * VagaDetailPage — Página pública de detalhe de vaga
 * Estilo consistente com ClassificadoDetailLandingPage
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Briefcase, MapPin, Clock, Star, Share2,
  Heart, ChevronRight, Zap, Users, Mail, Phone,
  ExternalLink, BadgeCheck, Shield, CheckCircle2,
  Building2, CalendarDays, DollarSign, GraduationCap,
  Monitor, FileText,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useVagas } from "../hooks/useVagas";
import { VagaCardEnhanced } from "../components/VagaCardEnhanced";
import { useVagasLocation } from "../hooks/useVagasLocation";
import { CONTRATO_LABELS, MODALIDADE_LABELS, NIVEL_LABELS } from "../types/vagas.types";

// ── Helpers ──────────────────────────────────────────────────────────

function formatSalary(vaga: any): string {
  // Nova estrutura: salarioTexto, salarioMin, salarioMax (em centavos)
  if (vaga.salarioTexto) return vaga.salarioTexto;
  if (vaga.salarioMin && vaga.salarioMax) {
    const min = (vaga.salarioMin / 100).toLocaleString("pt-BR");
    const max = (vaga.salarioMax / 100).toLocaleString("pt-BR");
    return `R$ ${min} – R$ ${max}`;
  }
  if (vaga.salarioMin) {
    const min = (vaga.salarioMin / 100).toLocaleString("pt-BR");
    return `A partir de R$ ${min}`;
  }
  if (vaga.salarioMax) {
    const max = (vaga.salarioMax / 100).toLocaleString("pt-BR");
    return `Até R$ ${max}`;
  }
  return "A combinar";
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Publicada hoje";
  if (days === 1) return "Publicada ontem";
  if (days < 7) return `Publicada há ${days} dias`;
  return `Publicada em ${date.toLocaleDateString("pt-BR")}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ── Page ─────────────────────────────────────────────────────────────

export default function VagaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const appUrls = useAppUrls();
  const { getVagaById, getRelatedVagas, isLoading } = useVagas();
  const { activeLocationName } = useVagasLocation();
  const [isFavorite, setIsFavorite] = useState(false);

  const vaga = id ? getVagaById(id) : undefined;
  const relatedVagas = vaga ? getRelatedVagas(vaga) : [];

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── NOT FOUND ──
  if (!vaga) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center h-14">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <Briefcase className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2 font-heading">Vaga não encontrada</h1>
          <p className="text-muted-foreground mb-6">A vaga que você procura não existe ou já foi encerrada.</p>
          <Button onClick={() => navigate(appUrls.jobs)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ver todas as vagas
          </Button>
        </div>
      </div>
    );
  }

  // ── Derived data ──
  const whatsappUrl = vaga.contatoWhatsapp
    ? `https://wa.me/55${vaga.contatoWhatsapp}?text=${encodeURIComponent(`Olá! Vi a vaga "${vaga.titulo}" e tenho interesse. Podemos conversar?`)}`
    : null;

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">Voltar</span>
            </button>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <button onClick={() => navigate(appUrls.jobs)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block">
              Vagas
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsFavorite(!isFavorite)} className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <Heart className={`h-4 w-4 transition-all ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
            <button onClick={() => navigator.share?.({ title: vaga.titulo, url: window.location.href }).catch(() => {})} className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HEADER BANNER ──────────────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-5">
          <div className="bg-gradient-to-br from-primary/15 via-accent/10 to-secondary rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Urgente */}
            {vaga.urgencia === "urgente" && (
              <div className="absolute top-0 right-0">
                <div className="bg-destructive text-destructive-foreground text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl flex items-center gap-1">
                  <Zap className="h-3 w-3" /> URGENTE
                </div>
              </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <button onClick={() => navigate(appUrls.jobs)} className="hover:text-primary transition-colors">Vagas</button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium truncate">{vaga.titulo}</span>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-card border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary">{vaga.empresa[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading leading-tight mb-1">{vaga.titulo}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {vaga.empresa}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="bg-primary/15 text-primary border-primary/30 font-semibold">
                <Briefcase className="h-3 w-3 mr-1" />
                {CONTRATO_LABELS[vaga.contrato]}
              </Badge>
              <Badge className="bg-secondary text-secondary-foreground border-border font-semibold">
                <Monitor className="h-3 w-3 mr-1" />
                {MODALIDADE_LABELS[vaga.modalidade]}
              </Badge>
              <Badge className="bg-secondary text-secondary-foreground border-border font-semibold">
                <GraduationCap className="h-3 w-3 mr-1" />
                {NIVEL_LABELS[vaga.nivel]}
              </Badge>
              {vaga.destaque && (
                <Badge className="bg-warning/15 text-warning border-warning/30 font-semibold">
                  <Star className="h-3 w-3 mr-1" /> Destaque
                </Badge>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-5 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── LEFT COLUMN ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Salary + Meta */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Remuneração</p>
                  <p className="text-2xl font-bold text-primary">{formatSalary(vaga)}</p>
                </div>
                {vaga.vagasQuantidade && vaga.vagasQuantidade > 1 && (
                  <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                    <Users className="h-3.5 w-3.5" />
                    {vaga.vagasQuantidade} vagas
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {activeLocationName && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {activeLocationName}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {timeAgo(vaga.createdAt)}
                </span>
                {vaga.expiresAt && (
                  <span className="flex items-center gap-1.5 text-warning">
                    <Clock className="h-3.5 w-3.5" />
                    Expira em {formatDate(vaga.expiresAt)}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Descrição */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-5 sm:p-6">
              <h2 className="text-base font-bold text-foreground mb-3 font-heading flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Descrição da Vaga
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{vaga.descricao}</p>
            </motion.div>

            {/* Requisitos */}
            {vaga.tags && vaga.tags.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                <h2 className="text-base font-bold text-foreground mb-3 font-heading flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Requisitos e Habilidades
                </h2>
                <div className="flex flex-wrap gap-2">
                  {vaga.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Benefícios */}
            {vaga.beneficios.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                <h2 className="text-base font-bold text-foreground mb-3 font-heading flex items-center gap-2">
                  <Star className="h-4 w-4 text-warning" /> Benefícios
                </h2>
                <div className="flex flex-wrap gap-2">
                  {vaga.beneficios.map((ben, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-semibold px-3 py-1.5 rounded-full border border-success/20">
                      <CheckCircle2 className="h-3 w-3" />
                      {ben}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tags */}
            {vaga.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vaga.tags.map((tag) => (
                  <span key={tag} className="text-[11px] bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN (Sidebar) ───────────────────── */}
          <div className="space-y-4">
            {/* CTA Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-5 shadow-xl sticky top-20">
              <h3 className="text-base font-bold text-foreground mb-4 font-heading">Candidate-se agora</h3>

              <div className="space-y-3">
                {whatsappUrl && (
                  <Button
                    onClick={() => window.open(whatsappUrl, "_blank")}
                    className="w-full bg-success hover:bg-success/90 text-success-foreground font-bold rounded-xl h-11"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}

                {vaga.contatoEmail && (
                  <Button
                    onClick={() => window.open(`mailto:${vaga.contatoEmail}?subject=Interesse na vaga: ${vaga.titulo}`, "_blank")}
                    variant="outline"
                    className="w-full border-primary/30 text-primary hover:bg-primary/10 font-bold rounded-xl h-11"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar E-mail
                  </Button>
                )}

                {vaga.contatoUrl && (
                  <Button
                    onClick={() => window.open(vaga.contatoUrl!, "_blank")}
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-secondary font-bold rounded-xl h-11"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Site da Empresa
                  </Button>
                )}
              </div>

              {/* Company info */}
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{vaga.empresa[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{vaga.empresa}</p>
                    {activeLocationName && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activeLocationName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Safety tips */}
              <div className="mt-4 bg-warning/5 border border-warning/20 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-foreground mb-1">Dica de segurança</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Nunca pague para se candidatar a uma vaga. Empresas legítimas não cobram taxas de candidatos.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VAGAS RELACIONADAS ─────────────────────────────── */}
      {relatedVagas.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 w-full">
          <h2 className="text-lg font-bold text-foreground mb-4 font-heading">Vagas Relacionadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedVagas.map((v, i) => (
              <VagaCardEnhanced 
                key={v.id} 
                vaga={v} 
                variant="compact"
                index={i} 
                onClick={() => navigate(`/vagas/detalhe/${v.id}`)}
                locationName={activeLocationName}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-border bg-card/50 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Vagas Locais</span>
          </div>
          <button onClick={() => navigate(appUrls.jobs)} className="hover:text-primary transition-colors">
            Ver todas as vagas
          </button>
        </div>
      </footer>
    </div>
  );
}
