/**
 * 🏆 JOB CARD - Card de vaga de emprego
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Globe,
  MapPin,
  Users,
  ChevronDown,
  GraduationCap,
  Award,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { MODALITY_LABELS, type Job } from "../types/job.types";
import { formatSalary, timeAgo } from "../utils/job-helpers";

interface JobCardProps {
  job: Job;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function JobCard({ job, isExpanded, onToggleExpand }: JobCardProps) {
  return (
    <div
      className={`bg-card border rounded-2xl overflow-hidden transition-all hover:shadow-xl ${
        job.destaque
          ? "border-primary/30 shadow-lg shadow-primary/5"
          : "border-border hover:border-primary/20"
      }`}
    >
      {/* Main row */}
      <div className="p-5 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-start gap-4">
          {/* Company avatar */}
          <div
            className={`h-12 w-12 rounded-xl flex-shrink-0 flex items-center justify-center ${
              job.destaque ? "bg-primary/15" : "bg-muted"
            }`}
          >
            {job.empresa_logo ? (
              <img
                src={job.empresa_logo}
                alt={job.empresa}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <Building2
                className={`h-5 w-5 ${job.destaque ? "text-primary" : "text-muted-foreground"}`}
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm md:text-base font-bold text-foreground truncate">
                    {job.titulo}
                  </h3>
                  {job.destaque && (
                    <span className="text-[9px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0">
                      ⭐ Destaque
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {job.empresa}
                </p>
              </div>

              {/* Salary */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-primary">
                  {formatSalary(job)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {timeAgo(job.created_at)}
                </p>
              </div>
            </div>

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
                {job.contrato}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
                <Globe className="h-2.5 w-2.5" />
                {MODALITY_LABELS[job.modalidade]}
              </span>
              {job.bairro && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" />
                  {job.bairro}
                </span>
              )}
              {job.vagas_quantidade && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="h-2.5 w-2.5" />
                  {job.vagas_quantidade} vaga{job.vagas_quantidade > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] bg-primary/8 text-primary border border-primary/15 px-2 py-0.5 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
              {job.tags.length > 4 && (
                <span className="text-[10px] text-muted-foreground">
                  +{job.tags.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expand indicator */}
        <div className="flex justify-center mt-3">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-border space-y-4">
              {/* Description */}
              <div className="pt-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Descrição
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {job.descricao}
                </p>
              </div>

              {/* Requirements */}
              {job.requisitos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-accent" />
                    Requisitos
                  </h4>
                  <ul className="space-y-1">
                    {job.requisitos.map((req) => (
                      <li
                        key={req}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary mt-1">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {job.beneficios.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-success" />
                    Benefícios
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {job.beneficios.map((ben) => (
                      <span
                        key={ben}
                        className="text-xs bg-success/8 text-success border border-success/15 px-2.5 py-1 rounded-full font-medium"
                      >
                        {ben}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                {job.contato_whatsapp && (
                  <Button
                    size="sm"
                    className="rounded-xl bg-success text-success-foreground hover:bg-success/90 gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `https://wa.me/55${job.contato_whatsapp}?text=Olá! Vi a vaga "${job.titulo}" na plataforma e gostaria de mais informações.`,
                        "_blank"
                      );
                    }}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    WhatsApp
                  </Button>
                )}
                {job.contato_email && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `mailto:${job.contato_email}?subject=Candidatura: ${job.titulo}`,
                        "_blank"
                      );
                    }}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Button>
                )}
                {job.contato_telefone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${job.contato_telefone}`, "_blank");
                    }}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Ligar
                  </Button>
                )}
                {job.link_externo && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(job.link_externo!, "_blank");
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Site
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
