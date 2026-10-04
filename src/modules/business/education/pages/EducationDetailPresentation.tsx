import type React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { EducationProgram } from "@/core/education";
import {
  formatPrice,
  getSections,
  sanitizePublicEducationText,
} from "./EducationDetailPresentationData";

export function StickyTabs({
  active,
  onChange,
  sections,
}: {
  active: string;
  onChange: (id: string) => void;
  sections: ReturnType<typeof getSections>;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-territory-border bg-territory-surface/90 px-4 text-territory-ink backdrop-blur-md md:-mx-6 md:px-6">
      <div className="container mx-auto flex gap-1 overflow-x-auto py-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onChange(section.id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-territory-brand text-territory-on-image shadow-sm"
                  : "text-territory-muted hover:bg-territory-raised hover:text-territory-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {section.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProgramCard({
  program,
  onClick,
  showPrice = true,
}: {
  program: EducationProgram;
  onClick?: () => void;
  showPrice?: boolean;
}) {
  const hasKnownSlots = program.available_slots !== null;
  const isSchoolProgram = Boolean(program.grade || program.class_name);
  const vacancyRate =
    program.max_capacity && program.current_enrollment
      ? Math.round((program.current_enrollment / program.max_capacity) * 100)
      : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex cursor-pointer flex-col rounded-2xl border border-territory-border bg-territory-surface p-5 text-territory-ink transition-all hover:-translate-y-0.5 hover:border-territory-brand/30 hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className="border-territory-border bg-territory-raised text-[11px] text-territory-ink"
            >
              {program.modality ?? "Presencial"}
            </Badge>
            {isSchoolProgram && program.grade && (
              <Badge
                variant="outline"
                className="border-territory-border text-[11px] text-territory-muted"
              >
                {program.grade}
              </Badge>
            )}
            {isSchoolProgram && program.class_name && (
              <Badge
                variant="outline"
                className="border-territory-border text-[11px] text-territory-muted"
              >
                Turma {program.class_name}
              </Badge>
            )}
          </div>
          <h4 className="mt-2 text-lg font-bold leading-tight text-territory-ink">
            {program.name}
          </h4>
        </div>
        {hasKnownSlots ? (
          <Badge className="border-territory-success/25 bg-territory-success/10 text-territory-success hover:bg-territory-success/15">
            {program.available_slots} vagas
          </Badge>
        ) : vacancyRate !== null ? (
          <Badge
            className={
              vacancyRate >= 90
                ? "border-territory-warning/30 bg-territory-warning/10 text-territory-warning"
                : "border-territory-success/25 bg-territory-success/10 text-territory-success"
            }
          >
            {vacancyRate}% preenchido
          </Badge>
        ) : null}
      </div>

      {sanitizePublicEducationText(program.description) && (
        <p className="mt-2 line-clamp-3 text-sm text-territory-muted">
          {sanitizePublicEducationText(program.description)}
        </p>
      )}

      {program.curriculum_topics && program.curriculum_topics.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-territory-muted">
            Disciplinas / conteúdos
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {program.curriculum_topics.slice(0, 8).map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className="border-territory-border text-[11px] text-territory-muted"
              >
                {topic}
              </Badge>
            ))}
            {program.curriculum_topics.length > 8 && (
              <Badge
                variant="secondary"
                className="border-territory-border bg-territory-raised text-[11px] text-territory-ink"
              >
                +{program.curriculum_topics.length - 8}
              </Badge>
            )}
          </div>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {program.age_group && (
          <div className="rounded-lg bg-territory-raised px-3 py-2">
            <dt className="text-territory-muted">Idade</dt>
            <dd className="font-semibold text-territory-ink">
              {program.age_group}
            </dd>
          </div>
        )}
        {program.shift && (
          <div className="rounded-lg bg-territory-raised px-3 py-2">
            <dt className="text-territory-muted">Turno</dt>
            <dd className="font-semibold text-territory-ink">
              {program.shift}
            </dd>
          </div>
        )}
        {isSchoolProgram && program.schedule && (
          <div className="rounded-lg bg-territory-raised px-3 py-2">
            <dt className="text-territory-muted">Horário</dt>
            <dd className="font-semibold text-territory-ink">
              {program.schedule}
            </dd>
          </div>
        )}
        {isSchoolProgram && program.max_capacity && (
          <div className="rounded-lg bg-territory-raised px-3 py-2">
            <dt className="text-territory-muted">Capacidade</dt>
            <dd className="font-semibold text-territory-ink">
              {program.current_enrollment ?? 0}/{program.max_capacity} alunos
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        {showPrice && program.price_from ? (
          <div>
            <div className="text-[11px] text-territory-muted">A partir de</div>
            <div className="text-base font-bold text-territory-ink">
              {formatPrice(program.price_from)}
              <span className="ml-1 text-xs font-normal text-territory-muted">
                /mês
              </span>
            </div>
          </div>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full text-territory-brand hover:bg-territory-raised hover:text-territory-brand"
        >
          Ver detalhes <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </motion.article>
  );
}

export function ModalityCard({
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
        "rounded-2xl border p-5 text-territory-ink transition-all",
        highlight
          ? "border-territory-brand/40 bg-territory-brand/10 shadow-sm"
          : "border-territory-border bg-territory-surface hover:border-territory-brand/30",
      )}
    >
      <div
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl",
          highlight
            ? "bg-territory-brand text-territory-on-image"
            : "bg-territory-raised text-territory-muted",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h4 className="mt-3 font-bold text-territory-ink">{title}</h4>
      <p className="mt-1 text-sm text-territory-muted">{description}</p>
    </div>
  );
}
