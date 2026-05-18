import type React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { EducationProgram } from "../types";
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
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
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

export function ProgramCard({
  program,
  onClick,
}: {
  program: EducationProgram;
  onClick?: () => void;
}) {
  const hasKnownSlots = program.available_slots !== null;
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
              {program.modality ?? "Presencial"}
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
        {hasKnownSlots ? (
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
            {program.available_slots} vagas
          </Badge>
        ) : vacancyRate !== null ? (
          <Badge className={vacancyRate >= 90 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}>
            {vacancyRate}% preenchido
          </Badge>
        ) : null}
      </div>
      {sanitizePublicEducationText(program.description) && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
          {sanitizePublicEducationText(program.description)}
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
        ) : null}
        <Button size="sm" variant="ghost" className="rounded-full text-primary">
          Ver detalhes <ChevronRight className="ml-1 h-4 w-4" />
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
        "rounded-2xl border p-5 transition-all",
        highlight
          ? "border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm"
          : "border-border bg-card hover:border-primary/30",
      )}
    >
      <div
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl",
          highlight ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="mt-3 font-bold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
