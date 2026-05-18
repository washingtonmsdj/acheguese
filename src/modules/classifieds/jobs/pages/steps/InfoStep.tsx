import React from "react";
import { Building2, Users } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";
import { JOB_FORM_LIMITS } from "../../constants/form-limits";
import type { VagaContrato, VagaModalidade, VagaNivel } from "../../types/vagas.types";
import { FormField, SelectionPills } from "./shared";

type FormCategory = { id: string; label: string; emoji: string };

export interface InfoStepProps {
  errors: Record<string, string>;
  titulo: string;
  setTitulo: (value: string) => void;
  empresa: string;
  setEmpresa: (value: string) => void;
  descricao: string;
  setDescricao: (value: string) => void;
  contrato: VagaContrato;
  setContrato: (value: VagaContrato) => void;
  contratoEntries: Array<[VagaContrato, string]>;
  modalidade: VagaModalidade;
  setModalidade: (value: VagaModalidade) => void;
  modalidadeEntries: Array<[VagaModalidade, string]>;
  nivel: VagaNivel;
  setNivel: (value: VagaNivel) => void;
  nivelEntries: Array<[VagaNivel, string]>;
  categoria: string;
  setCategoria: (value: string) => void;
  formCategories: FormCategory[];
  vagasQtd: string;
  setVagasQtd: (value: string) => void;
}

export function InfoStep(props: InfoStepProps) {
  const {
    errors,
    titulo,
    setTitulo,
    empresa,
    setEmpresa,
    descricao,
    setDescricao,
    contrato,
    setContrato,
    contratoEntries,
    modalidade,
    setModalidade,
    modalidadeEntries,
    nivel,
    setNivel,
    nivelEntries,
    categoria,
    setCategoria,
    formCategories,
    vagasQtd,
    setVagasQtd,
  } = props;

  return (
    <div className="space-y-5">
      <FormField label="Título da Vaga" error={errors.titulo} counter={`${titulo.length}/${JOB_FORM_LIMITS.MAX_TITLE}`} required>
        <Input
          placeholder="Ex: Desenvolvedor Full Stack, Vendedor Externo..."
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={JOB_FORM_LIMITS.MAX_TITLE}
          className={cn("h-12 text-sm rounded-xl", errors.titulo && "border-destructive")}
        />
      </FormField>

      <FormField label="Nome da Empresa" error={errors.empresa} required>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ex: TechBa Solutions"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            maxLength={100}
            className={cn("pl-10 h-12 text-sm rounded-xl", errors.empresa && "border-destructive")}
          />
        </div>
      </FormField>

      <FormField label="Descrição da Vaga" error={errors.descricao} counter={`${descricao.length}/${JOB_FORM_LIMITS.MAX_DESCRIPTION}`} required>
        <Textarea
          placeholder="Descreva as responsabilidades, ambiente de trabalho, diferenciais..."
          rows={5}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          maxLength={JOB_FORM_LIMITS.MAX_DESCRIPTION}
          className={cn("text-sm rounded-xl resize-none", errors.descricao && "border-destructive")}
        />
      </FormField>

      <div className="space-y-4">
        <SelectionPills
          label="Tipo de Contrato"
          selected={contrato}
          entries={contratoEntries}
          onSelect={(value) => setContrato(value as VagaContrato)}
          selectedClassName="bg-primary/15 border-primary/50 text-primary"
          defaultClassName="bg-card border-border text-muted-foreground hover:border-primary/30"
        />
        <SelectionPills
          label="Modalidade"
          selected={modalidade}
          entries={modalidadeEntries}
          onSelect={(value) => setModalidade(value as VagaModalidade)}
          selectedClassName="bg-accent/15 border-accent/50 text-accent"
          defaultClassName="bg-card border-border text-muted-foreground hover:border-accent/30"
        />
        <SelectionPills
          label="Nível"
          selected={nivel}
          entries={nivelEntries}
          onSelect={(value) => setNivel(value as VagaNivel)}
          selectedClassName="bg-success/15 border-success/50 text-success"
          defaultClassName="bg-card border-border text-muted-foreground hover:border-success/30"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Categoria</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {formCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoria(categoria === cat.id ? "" : cat.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all",
                categoria === cat.id
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "bg-card border-border text-foreground hover:border-primary/30",
              )}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-[10px] font-semibold leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <FormField label="Quantidade de vagas" optional>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            placeholder="Ex: 3"
            value={vagasQtd}
            onChange={(e) => setVagasQtd(e.target.value)}
            className="pl-10 h-12 text-sm rounded-xl"
            min={1}
          />
        </div>
      </FormField>
    </div>
  );
}
