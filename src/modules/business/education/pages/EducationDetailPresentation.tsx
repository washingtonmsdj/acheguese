import type React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { EducationProgram } from "@/core/education";
import {
  getEducationProgramModalityLabel,
  getEducationProgramShiftLabel,
} from "../constants";
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
    <nav
      aria-label="Seções da instituição"
      className="sticky top-0 z-30 -mx-4 border-b border-territory-border bg-territory-surface/90 px-4 text-territory-ink backdrop-blur-md md:-mx-6 md:px-6"
    >
      <div className="container mx-auto flex gap-1 overflow-x-auto py-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onChange(section.id)}
              aria-controls={section.id}
              aria-current={isActive ? 'location' : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand focus-visible:ring-offset-2",
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
    </nav>
  );
}

export function ProgramCard({
  program,
  onVisible,
  showPrice = true,
}: {
  program: EducationProgram;
  onVisible?: () => void;
  showPrice?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const hasKnownSlots = program.available_slots !== null;
  const isSchoolProgram = Boolean(program.grade || program.class_name);
  const vacancyRate =
    program.max_capacity != null &&
    program.max_capacity > 0 &&
    program.current_enrollment != null
      ? Math.round((program.current_enrollment / program.max_capacity) * 100)
      : null;
  const modalityLabel = getEducationProgramModalityLabel(program.modality);
  const shiftLabel = getEducationProgramShiftLabel(program.shift);

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={prefersReducedMotion ? { duration: 0 } : undefined}
      onViewportEnter={onVisible}
      className="flex flex-col rounded-2xl border border-territory-border bg-territory-surface p-5 text-territory-ink shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-1.5">
            {modalityLabel ? (
              <Badge
                variant="secondary"
                className="border-territory-border bg-territory-raised text-[11px] text-territory-ink"
              >
                {modalityLabel}
              </Badge>
            ) : null}
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
          <Badge
            className={
              program.available_slots === 0
                ? "border-territory-warning/30 bg-territory-warning/10 text-territory-warning"
                : "border-territory-success/25 bg-territory-success/10 text-territory-success"
            }
          >
            {program.available_slots === 0
              ? 'Sem vagas'
              : `${program.available_slots} vagas`}
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
        {shiftLabel ? (
          <div className="rounded-lg bg-territory-raised px-3 py-2">
            <dt className="text-territory-muted">Turno</dt>
            <dd className="font-semibold text-territory-ink">
              {shiftLabel}
            </dd>
          </div>
        ) : null}
        {isSchoolProgram && program.schedule && (
          <div className="rounded-lg bg-territory-raised px-3 py-2">
            <dt className="text-territory-muted">Horário</dt>
            <dd className="font-semibold text-territory-ink">
              {program.schedule}
            </dd>
          </div>
        )}
        {isSchoolProgram && program.max_capacity != null ? (
          <div className="rounded-lg bg-territory-raised px-3 py-2">
            <dt className="text-territory-muted">Capacidade</dt>
            <dd className="font-semibold text-territory-ink">
              {program.current_enrollment != null
                ? `${program.current_enrollment}/${program.max_capacity} alunos`
                : `${program.max_capacity} alunos`}
            </dd>
          </div>
        ) : null}
      </dl>

      {showPrice && program.price_from != null ? (
        <div className="mt-auto pt-4">
          <div className="text-[11px] text-territory-muted">
            {program.price_from === 0 ? 'Valor informado' : 'A partir de'}
          </div>
          <div className="text-base font-bold text-territory-ink">
            {program.price_from === 0
              ? 'Gratuito'
              : formatPrice(program.price_from)}
            {program.price_from > 0 ? (
              <span className="ml-1 text-xs font-normal text-territory-muted">
                /mês
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
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
