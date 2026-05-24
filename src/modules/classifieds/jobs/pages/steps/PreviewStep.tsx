import React from "react";
import {
  Building2,
  Clock,
  Eye,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

interface PreviewCategory {
  id: string;
  label: string;
}

export interface PreviewStepProps {
  titulo: string;
  empresa: string;
  contratoLabel: string;
  modalidadeLabel: string;
  nivelLabel: string;
  urgente: boolean;
  categoria: string;
  formCategories: PreviewCategory[];
  activeLocationName: string;
  salaryDisplay: string;
  descricao: string;
  tags: string[];
  requisitos: string[];
  beneficios: string[];
  contatoEmail: string;
  contatoWhatsapp: string;
  contatoTelefone: string;
  linkExterno: string;
  vagasQtd: string;
}

export function PreviewStep({
  titulo,
  empresa,
  contratoLabel,
  modalidadeLabel,
  nivelLabel,
  urgente,
  categoria,
  formCategories,
  activeLocationName,
  salaryDisplay,
  descricao,
  tags,
  requisitos,
  beneficios,
  contatoEmail,
  contatoWhatsapp,
  contatoTelefone,
  linkExterno,
  vagasQtd,
}: PreviewStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="h-5 w-5 text-warning" />
        <h2 className="text-lg font-bold text-foreground">Revisão da Vaga</h2>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div>
          <h3 className="text-base font-bold text-foreground">{titulo || "Sem título"}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Building2 className="h-3.5 w-3.5" />
            {empresa || "Sem empresa"}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {contratoLabel}
          </span>
          <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
            {modalidadeLabel}
          </span>
          <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
            {nivelLabel}
          </span>
          {urgente && (
            <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" /> Urgente
            </span>
          )}
          {categoria && (
            <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
              {formCategories.find((c) => c.id === categoria)?.label}
            </span>
          )}
        </div>

        {activeLocationName && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {activeLocationName}
          </p>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Salário</p>
        <p className="text-sm text-primary font-bold">{salaryDisplay}</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Descrição</p>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{descricao || "—"}</p>
      </div>

      {tags.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {requisitos.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Requisitos</p>
          <ul className="space-y-1">
            {requisitos.map((r) => (
              <li key={r} className="text-sm text-muted-foreground">
                • {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {beneficios.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Benefícios</p>
          <div className="flex flex-wrap gap-1.5">
            {beneficios.map((b) => (
              <span key={b} className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Contato</p>
        <div className="space-y-1 text-sm text-muted-foreground">
          {contatoEmail && (
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> {contatoEmail}
            </p>
          )}
          {contatoWhatsapp && (
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> {contatoWhatsapp}
            </p>
          )}
          {contatoTelefone && (
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> {contatoTelefone}
            </p>
          )}
          {linkExterno && (
            <p className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5" /> {linkExterno}
            </p>
          )}
          {!contatoEmail && !contatoWhatsapp && !contatoTelefone && !linkExterno && (
            <p className="text-destructive text-xs">Atencao: nenhum contato informado</p>
          )}
        </div>
      </div>

      {vagasQtd && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Vagas disponíveis</p>
          <p className="text-sm text-foreground font-semibold">{vagasQtd} vaga(s)</p>
        </div>
      )}
    </div>
  );
}
