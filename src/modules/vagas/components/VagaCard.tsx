/**
 * VagaCard — Card de vaga para listagens
 * Estilo consistente com AdCard/ProfessionalCard do projeto
 */

import { motion } from "framer-motion";
import { MapPin, Clock, Briefcase, Zap, Star, Users } from "lucide-react";
import type { Vaga } from "../types/vagas.types";
import { CONTRATO_LABELS, MODALIDADE_LABELS, NIVEL_LABELS } from "../types/vagas.types";

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 7) return `${days} dias`;
  if (days < 30) return `${Math.floor(days / 7)} sem.`;
  return `${Math.floor(days / 30)} mês(es)`;
}

function formatSalary(vaga: Vaga): string {
  if (vaga.ocultar_salario) return "A combinar";
  if (vaga.salario_min && vaga.salario_max) {
    return `R$ ${vaga.salario_min.toLocaleString("pt-BR")} – ${vaga.salario_max.toLocaleString("pt-BR")}`;
  }
  if (vaga.salario_min) return `A partir de R$ ${vaga.salario_min.toLocaleString("pt-BR")}`;
  if (vaga.salario_max) return `Até R$ ${vaga.salario_max.toLocaleString("pt-BR")}`;
  return "A combinar";
}

interface VagaCardProps {
  vaga: Vaga;
  index?: number;
  onClick: () => void;
  compact?: boolean;
}

export function VagaCard({ vaga, index = 0, onClick, compact = false }: VagaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      onClick={onClick}
      className="bg-card border border-border rounded-2xl p-5 hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* Urgente badge */}
      {vaga.urgencia === "urgente" && (
        <div className="absolute top-0 right-0">
          <div className="bg-destructive text-destructive-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
            <Zap className="h-3 w-3" />
            URGENTE
          </div>
        </div>
      )}

      {/* Destaque badge */}
      {vaga.destaque && (
        <div className="absolute top-0 left-0">
          <div className="bg-warning text-warning-foreground text-[10px] font-bold px-3 py-1 rounded-br-xl flex items-center gap-1">
            <Star className="h-3 w-3" />
            DESTAQUE
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`${vaga.urgencia === "urgente" || vaga.destaque ? "mt-4" : ""}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {vaga.titulo}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">{vaga.empresa}</p>
          </div>
          {/* Company initial avatar */}
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">{vaga.empresa[0]}</span>
          </div>
        </div>

        {/* Salary */}
        <p className="text-base font-bold text-primary mb-3">{formatSalary(vaga)}</p>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <Briefcase className="h-2.5 w-2.5" />
            {CONTRATO_LABELS[vaga.contrato]}
          </span>
          <span className="inline-flex items-center bg-secondary text-secondary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {MODALIDADE_LABELS[vaga.modalidade]}
          </span>
          <span className="inline-flex items-center bg-secondary text-secondary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {NIVEL_LABELS[vaga.nivel]}
          </span>
        </div>

        {!compact && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {vaga.descricao}
          </p>
        )}

        {/* Footer meta */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            {/* TODO: Buscar location.name do SSOT quando integrado */}
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Salvador, BA
            </span>
            {vaga.vagas_quantidade && vaga.vagas_quantidade > 1 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {vaga.vagas_quantidade} vagas
              </span>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(vaga.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
