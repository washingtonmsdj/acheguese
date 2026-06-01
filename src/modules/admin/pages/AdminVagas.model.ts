import type {
  VagaContrato,
  VagaModalidade,
  VagaStatus,
} from "@/core/admin/services/AdminVagasService";

export const STATUS_OPTIONS: { value: VagaStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "pending_review", label: "Aguardando revisão" },
  { value: "published", label: "Publicada" },
  { value: "paused", label: "Pausada" },
  { value: "closed", label: "Encerrada" },
  { value: "expired", label: "Expirada" },
  { value: "rejected", label: "Rejeitada" },
  { value: "removed", label: "Removida" },
];

export const CONTRATO_OPTIONS: { value: VagaContrato; label: string }[] = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" },
  { value: "temporario", label: "Temporario" },
  { value: "estagio", label: "Estágio" },
  { value: "freelancer", label: "Freelancer" },
  { value: "aprendiz", label: "Aprendiz" },
];

export const MODALIDADE_OPTIONS: { value: VagaModalidade; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Híbrido" },
];

export const ALL_STATUS_FILTER = "__all_status" as const;
export const ALL_CONTRATO_FILTER = "__all_contrato" as const;
export const ALL_MODALIDADE_FILTER = "__all_modalidade" as const;

export type StatusFilter = VagaStatus | typeof ALL_STATUS_FILTER;
export type ContratoFilter = VagaContrato | typeof ALL_CONTRATO_FILTER;
export type ModalidadeFilter = VagaModalidade | typeof ALL_MODALIDADE_FILTER;
