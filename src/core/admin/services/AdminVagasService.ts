import { supabase } from "@/integrations/supabase";
import type { Tables, TablesUpdate } from "@/integrations/supabase";
import { VagaPublicationDistributionService } from "@/core/work-opportunities/services/VagaPublicationDistributionService";
import { logger } from "@/shared/utils/logger";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";

export type VagaStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "paused"
  | "closed"
  | "expired"
  | "rejected"
  | "removed";

export type VagaContrato = "CLT" | "PJ" | "estagio" | "temporario" | "freelancer" | "aprendiz";
export type VagaModalidade = "presencial" | "hibrido" | "remoto";
export type VagaNivel =
  | "junior"
  | "pleno"
  | "senior"
  | "especialista"
  | "gerente"
  | "diretor"
  | "estagio"
  | "auxiliar";
export type VagaUrgencia = "normal" | "urgente" | "extrema";
export type VagaHighlightType = "none" | "premium" | "sponsored" | "featured";

export interface VagaStats {
  total: number;
  draft: number;
  pendingReview: number;
  published: number;
  paused: number;
  closed: number;
  expired: number;
  rejected: number;
  removed: number;
  urgentes: number;
  destaques: number;
  byContrato: Record<string, number>;
  byModalidade: Record<string, number>;
  byNivel: Record<string, number>;
}

export interface AdminVaga {
  id: string;
  titulo: string;
  empresa: string;
  descricao: string;
  locationId: string;
  location?: {
    id: string;
    name: string;
    type: string;
  };
  contrato: VagaContrato;
  modalidade: VagaModalidade;
  nivel: VagaNivel;
  tags: string[];
  salarioTexto?: string;
  salarioMin?: number;
  salarioMax?: number;
  beneficios: string[];
  contatoEmail?: string;
  contatoWhatsapp?: string;
  contatoUrl?: string;
  status: VagaStatus;
  urgencia: VagaUrgencia;
  highlightType: VagaHighlightType;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
}

export interface GetVagasParams {
  page?: number;
  limit?: number;
  search?: string;
  contrato?: VagaContrato;
  modalidade?: VagaModalidade;
  nivel?: VagaNivel;
  status?: VagaStatus;
  urgente?: boolean;
  destaque?: boolean;
}

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  neq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  or(filters: string): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  not(column: string, operator: string, value: unknown): TableClient<TRow>;
  gte(column: string, value: unknown): TableClient<TRow>;
  lte(column: string, value: unknown): TableClient<TRow>;
};

type AdminVagasDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminVagasDbClient;

const VAGA_STATUSES = [
  "draft",
  "pending_review",
  "published",
  "paused",
  "closed",
  "expired",
  "rejected",
  "removed",
] as const;

const VAGA_CONTRATOS = [
  "CLT",
  "PJ",
  "estagio",
  "temporario",
  "freelancer",
  "aprendiz",
] as const;

const VAGA_MODALIDADES = ["presencial", "hibrido", "remoto"] as const;
const VAGA_NIVEIS = [
  "junior",
  "pleno",
  "senior",
  "especialista",
  "gerente",
  "diretor",
  "estagio",
  "auxiliar",
] as const;
const VAGA_URGENCIAS = ["normal", "urgente", "extrema"] as const;
const VAGA_HIGHLIGHT_TYPES = ["none", "premium", "sponsored", "featured"] as const;

type VagaRow = Tables<"vagas"> & {
  empresa_nome?: string | null;
  application_email?: string | null;
  application_whatsapp?: string | null;
  application_url?: string | null;
  closed_at?: string | null;
  location?: LocationSummaryRow | readonly LocationSummaryRow[] | null;
};

type VagaUpdateRow = Omit<
  TablesUpdate<"vagas">,
  "status" | "contrato" | "modalidade" | "nivel" | "urgencia" | "highlight_type"
> & {
  status?: VagaStatus;
  contrato?: VagaContrato;
  modalidade?: VagaModalidade;
  nivel?: VagaNivel;
  urgencia?: VagaUrgencia;
  highlight_type?: VagaHighlightType;
  empresa_nome?: string | null;
  application_email?: string | null;
  application_whatsapp?: string | null;
  application_url?: string | null;
  closed_at?: string | null;
};

type LocationSummaryRow = {
  id: string;
  name: string;
  type: string;
};

const vagaSelect = `
  *,
  location:locations(
    id,
    name,
    type
  )
`;

function isOneOf<TValue extends string>(
  value: string | null | undefined,
  options: readonly TValue[],
): value is TValue {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function normalizeStatus(value: string | null | undefined): VagaStatus {
  return isOneOf(value, VAGA_STATUSES) ? value : "draft";
}

function normalizeContrato(value: string | null | undefined): VagaContrato {
  return isOneOf(value, VAGA_CONTRATOS) ? value : "CLT";
}

function normalizeModalidade(value: string | null | undefined): VagaModalidade {
  return isOneOf(value, VAGA_MODALIDADES) ? value : "presencial";
}

function normalizeNivel(value: string | null | undefined): VagaNivel {
  return isOneOf(value, VAGA_NIVEIS) ? value : "junior";
}

function normalizeUrgencia(value: string | null | undefined): VagaUrgencia {
  return isOneOf(value, VAGA_URGENCIAS) ? value : "normal";
}

function normalizeHighlightType(value: string | null | undefined): VagaHighlightType {
  return isOneOf(value, VAGA_HIGHLIGHT_TYPES) ? value : "none";
}

function normalizeLocation(
  location: VagaRow["location"],
): AdminVaga["location"] | undefined {
  const resolved = Array.isArray(location) ? location[0] : location;
  if (!resolved) return undefined;
  return {
    id: resolved.id,
    name: resolved.name,
    type: resolved.type,
  };
}

function mapRowToAdminVaga(row: VagaRow): AdminVaga {
  return {
    id: row.id,
    titulo: row.titulo,
    empresa: row.empresa_nome ?? row.empresa ?? "Empresa nao informada",
    descricao: row.descricao,
    locationId: row.location_id,
    location: normalizeLocation(row.location),
    contrato: normalizeContrato(row.contrato),
    modalidade: normalizeModalidade(row.modalidade),
    nivel: normalizeNivel(row.nivel),
    tags: row.tags ?? [],
    salarioTexto: row.salario_texto ?? undefined,
    salarioMin: row.salario_min ?? undefined,
    salarioMax: row.salario_max ?? undefined,
    beneficios: row.beneficios ?? [],
    contatoEmail: row.application_email ?? row.contato_email ?? undefined,
    contatoWhatsapp: row.application_whatsapp ?? row.contato_whatsapp ?? undefined,
    contatoUrl: row.application_url ?? row.contato_url ?? undefined,
    status: normalizeStatus(row.status),
    urgencia: normalizeUrgencia(row.urgencia),
    highlightType: normalizeHighlightType(row.highlight_type ?? (row.destaque ? "premium" : "none")),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  };
}

export class AdminVagasService {
  static async getStats(): Promise<VagaStats> {
    try {
      const { data, error } = await db
        .from<Pick<VagaRow, "status" | "urgencia" | "highlight_type" | "contrato" | "modalidade" | "nivel">>(
          "vagas",
        )
        .select("status, urgencia, highlight_type, contrato, modalidade, nivel");

      if (error) throw error;

      const rows = data ?? [];
      const stats: VagaStats = {
        total: rows.length,
        draft: 0,
        pendingReview: 0,
        published: 0,
        paused: 0,
        closed: 0,
        expired: 0,
        rejected: 0,
        removed: 0,
        urgentes: 0,
        destaques: 0,
        byContrato: {},
        byModalidade: {},
        byNivel: {},
      };

      for (const row of rows) {
        switch (normalizeStatus(row.status)) {
          case "draft":
            stats.draft += 1;
            break;
          case "pending_review":
            stats.pendingReview += 1;
            break;
          case "published":
            stats.published += 1;
            break;
          case "paused":
            stats.paused += 1;
            break;
          case "closed":
            stats.closed += 1;
            break;
          case "expired":
            stats.expired += 1;
            break;
          case "rejected":
            stats.rejected += 1;
            break;
          case "removed":
            stats.removed += 1;
            break;
        }

        const urgencia = normalizeUrgencia(row.urgencia);
        if (urgencia === "urgente" || urgencia === "extrema") {
          stats.urgentes += 1;
        }

        if (normalizeHighlightType(row.highlight_type) !== "none") {
          stats.destaques += 1;
        }

        const contrato = normalizeContrato(row.contrato);
        stats.byContrato[contrato] = (stats.byContrato[contrato] ?? 0) + 1;

        const modalidade = normalizeModalidade(row.modalidade);
        stats.byModalidade[modalidade] = (stats.byModalidade[modalidade] ?? 0) + 1;

        const nivel = normalizeNivel(row.nivel);
        stats.byNivel[nivel] = (stats.byNivel[nivel] ?? 0) + 1;
      }

      return stats;
    } catch (error) {
      logger.error("AdminVagasService.getStats", error as Error);
      throw error;
    }
  }

  static async getAllVagas(params: GetVagasParams = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        contrato,
        modalidade,
        nivel,
        status,
        urgente,
        destaque,
      } = params;

      let query = db.from<VagaRow>("vagas").select(vagaSelect, { count: "exact" });

      if (search) {
        const searchFilter = buildSafeOrILikeFilter(["titulo", "empresa_nome", "descricao"], search);
        if (searchFilter) {
          query = query.or(searchFilter);
        }
      }

      if (contrato) query = query.eq("contrato", contrato);
      if (modalidade) query = query.eq("modalidade", modalidade);
      if (nivel) query = query.eq("nivel", nivel);
      if (status) query = query.eq("status", status);

      if (urgente !== undefined) {
        query = urgente
          ? query.in("urgencia", ["urgente", "extrema"])
          : query.eq("urgencia", "normal");
      }

      if (destaque !== undefined) {
        query = destaque
          ? query.neq("highlight_type", "none")
          : query.eq("highlight_type", "none");
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: (data ?? []).map(mapRowToAdminVaga),
        count: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      };
    } catch (error) {
      logger.error("AdminVagasService.getAllVagas", error as Error, params);
      throw error;
    }
  }

  static async updateStatus(vagaId: string, status: VagaStatus): Promise<boolean> {
    try {
      const updatePayload: Partial<VagaUpdateRow> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "published") {
        updatePayload.published_at = new Date().toISOString();
      }

      if (status === "closed" || status === "removed") {
        updatePayload.closed_at = new Date().toISOString();
      }

      const { error } = await db
        .from<VagaRow>("vagas")
        .update(updatePayload)
        .eq("id", vagaId);

      if (error) throw error;

      if (status === "published") {
        await this.distributePublishedVaga(vagaId);
      }

      return true;
    } catch (error) {
      logger.error("AdminVagasService.updateStatus", error as Error, { vagaId, status });
      return false;
    }
  }

  static async publicarVaga(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, "published");
  }

  static async rejeitarVaga(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, "rejected");
  }

  static async ativarVaga(vagaId: string): Promise<boolean> {
    return this.publicarVaga(vagaId);
  }

  static async pausarVaga(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, "paused");
  }

  static async encerrarVaga(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, "closed");
  }

  static async renovarVaga(vagaId: string, days = 30): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const patch: Partial<VagaUpdateRow> = {
        status: "published",
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await db
        .from<VagaRow>("vagas")
        .update(patch)
        .eq("id", vagaId);

      if (error) throw error;

      await this.distributePublishedVaga(vagaId);
      return true;
    } catch (error) {
      logger.error("AdminVagasService.renovarVaga", error as Error, { vagaId, days });
      return false;
    }
  }

  static async marcarPreenchida(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, "closed");
  }

  static async toggleDestaque(vagaId: string, destaque: boolean): Promise<boolean> {
    try {
      const patch: Partial<VagaUpdateRow> = {
        highlight_type: destaque ? "premium" : "none",
        updated_at: new Date().toISOString(),
      };

      const { error } = await db
        .from<VagaRow>("vagas")
        .update(patch)
        .eq("id", vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminVagasService.toggleDestaque", error as Error, { vagaId, destaque });
      return false;
    }
  }

  static async toggleUrgencia(vagaId: string, urgente: boolean): Promise<boolean> {
    try {
      const patch: Partial<VagaUpdateRow> = {
        urgencia: urgente ? "urgente" : "normal",
        updated_at: new Date().toISOString(),
      };

      const { error } = await db
        .from<VagaRow>("vagas")
        .update(patch)
        .eq("id", vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminVagasService.toggleUrgencia", error as Error, { vagaId, urgente });
      return false;
    }
  }

  static async deleteVaga(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, "removed");
  }

  static async getVagasExpirando(days = 7): Promise<AdminVaga[]> {
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const { data, error } = await db.from<VagaRow>("vagas").select(vagaSelect)
        .eq("status", "published")
        .not("expires_at", "is", null)
        .gte("expires_at", now.toISOString())
        .lte("expires_at", endDate.toISOString())
        .order("expires_at", { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapRowToAdminVaga);
    } catch (error) {
      logger.error("AdminVagasService.getVagasExpirando", error as Error, { days });
      return [];
    }
  }

  private static async distributePublishedVaga(vagaId: string): Promise<void> {
    try {
      await VagaPublicationDistributionService.distributePublishedVaga(vagaId);
    } catch (error) {
      logger.error("AdminVagasService.distributePublishedVaga", error as Error, { vagaId });
    }
  }
}

export const adminVagasService = AdminVagasService;
