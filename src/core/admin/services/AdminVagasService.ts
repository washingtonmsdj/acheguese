import { supabase } from "@/integrations/supabase/supabase";
import { logger } from "@/shared/utils/logger";

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

type VagaRow = {
  id: string;
  titulo: string;
  empresa_nome?: string | null;
  empresa?: string | null;
  descricao: string;
  location_id: string;
  location?: { id: string; name: string; type: string } | null;
  contrato: VagaContrato;
  modalidade: VagaModalidade;
  nivel: VagaNivel;
  tags?: string[] | null;
  salario_texto?: string | null;
  salario_min?: number | null;
  salario_max?: number | null;
  beneficios?: string[] | null;
  application_email?: string | null;
  contato_email?: string | null;
  application_whatsapp?: string | null;
  contato_whatsapp?: string | null;
  application_url?: string | null;
  contato_url?: string | null;
  status: VagaStatus;
  urgencia?: VagaUrgencia | null;
  highlight_type?: VagaHighlightType | null;
  destaque?: boolean | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  expires_at?: string | null;
};

type VagaStatsRow = {
  status: VagaStatus | "pending_review";
  urgencia?: VagaUrgencia | null;
  highlight_type?: VagaHighlightType | null;
  contrato?: string | null;
  modalidade?: string | null;
  nivel?: string | null;
};

export class AdminVagasService {
  static async getStats(): Promise<VagaStats> {
    try {
      const { data, error } = await supabase
        .from("vagas")
        .select("status, urgencia, highlight_type, contrato, modalidade, nivel");

      if (error) throw error;

      const stats: VagaStats = {
        total: data?.length || 0,
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

      ((data as VagaStatsRow[] | null) || []).forEach((row) => {
        if (row.status === "pending_review") stats.pendingReview += 1;
        else if (row.status in stats) (stats as unknown as Record<string, number>)[row.status] += 1;
        if (row.urgencia === "urgente" || row.urgencia === "extrema") stats.urgentes += 1;
        if ((row.highlight_type ?? "none") !== "none") stats.destaques += 1;
        if (row.contrato) stats.byContrato[row.contrato] = (stats.byContrato[row.contrato] ?? 0) + 1;
        if (row.modalidade) stats.byModalidade[row.modalidade] = (stats.byModalidade[row.modalidade] ?? 0) + 1;
        if (row.nivel) stats.byNivel[row.nivel] = (stats.byNivel[row.nivel] ?? 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error("[AdminVagasService] Erro ao buscar estatísticas", error);
      throw error;
    }
  }

  static async getAllVagas(params: GetVagasParams = {}) {
    try {
      const { page = 1, limit = 20, search, contrato, modalidade, nivel, status, urgente, destaque } = params;
      let query = supabase
        .from("vagas")
        .select(
          `
          *,
          location:locations(
            id,
            name,
            type
          )
        `,
          { count: "exact" },
        );

      if (search) query = query.or(`titulo.ilike.%${search}%,empresa_nome.ilike.%${search}%,descricao.ilike.%${search}%`);
      if (contrato) query = query.eq("contrato", contrato);
      if (modalidade) query = query.eq("modalidade", modalidade);
      if (nivel) query = query.eq("nivel", nivel);
      if (status) query = query.eq("status", status);
      if (urgente !== undefined) query = urgente ? query.in("urgencia", ["urgente", "extrema"]) : query.eq("urgencia", "normal");
      if (destaque !== undefined) query = destaque ? query.neq("highlight_type", "none") : query.eq("highlight_type", "none");

      const from = (page - 1) * limit;
      const { data, error, count } = await query
        .range(from, from + limit - 1)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: ((data as VagaRow[] | null) ?? []).map((row) => this.mapRowToAdminVaga(row)),
        count: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      };
    } catch (error) {
      logger.error("[AdminVagasService] Erro ao buscar vagas", error);
      throw error;
    }
  }

  static async updateStatus(vagaId: string, status: VagaStatus): Promise<boolean> {
    try {
      const updatePayload: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "published") updatePayload.published_at = new Date().toISOString();
      if (status === "closed" || status === "removed") updatePayload.closed_at = new Date().toISOString();

      const { error } = await supabase
        .from("vagas")
        .update(updatePayload)
        .eq("id", vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("[AdminVagasService] Erro ao atualizar status da vaga", error);
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

  static async marcarPreenchida(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, "closed");
  }

  static async toggleDestaque(vagaId: string, destaque: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("vagas")
        .update({
          highlight_type: destaque ? "premium" : "none",
          updated_at: new Date().toISOString(),
        })
        .eq("id", vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("[AdminVagasService] Erro ao alterar destaque", error);
      return false;
    }
  }

  static async toggleUrgencia(vagaId: string, urgente: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("vagas")
        .update({
          urgencia: urgente ? "urgente" : "normal",
          updated_at: new Date().toISOString(),
        })
        .eq("id", vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("[AdminVagasService] Erro ao alterar urgência", error);
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

      const { data, error } = await supabase
        .from("vagas")
        .select(
          `
          *,
          location:locations(
            id,
            name,
            type
          )
        `,
        )
        .eq("status", "published")
        .not("expires_at", "is", null)
        .gte("expires_at", now.toISOString())
        .lte("expires_at", endDate.toISOString())
        .order("expires_at", { ascending: true });

      if (error) throw error;

      return ((data as VagaRow[] | null) ?? []).map((row) => this.mapRowToAdminVaga(row));
    } catch (error) {
      logger.error("[AdminVagasService] Erro ao buscar vagas expirando", error);
      return [];
    }
  }

  private static mapRowToAdminVaga(row: VagaRow): AdminVaga {
    return {
      id: row.id,
      titulo: row.titulo,
      empresa: row.empresa_nome ?? row.empresa ?? "Empresa não informada",
      descricao: row.descricao,
      locationId: row.location_id,
      location: row.location
        ? {
            id: row.location.id,
            name: row.location.name,
            type: row.location.type,
          }
        : undefined,
      contrato: row.contrato,
      modalidade: row.modalidade,
      nivel: row.nivel,
      tags: row.tags ?? [],
      salarioTexto: row.salario_texto ?? undefined,
      salarioMin: row.salario_min ?? undefined,
      salarioMax: row.salario_max ?? undefined,
      beneficios: row.beneficios ?? [],
      contatoEmail: row.application_email ?? row.contato_email ?? undefined,
      contatoWhatsapp: row.application_whatsapp ?? row.contato_whatsapp ?? undefined,
      contatoUrl: row.application_url ?? row.contato_url ?? undefined,
      status: row.status,
      urgencia: row.urgencia ?? "normal",
      highlightType: row.highlight_type ?? (row.destaque ? "premium" : "none"),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    };
  }
}

export const adminVagasService = AdminVagasService;
