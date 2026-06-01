import { supabase } from "@/integrations/supabase";
import { VagaPublicationDistributionService } from "@/core/verticals/jobs/services/VagaPublicationDistributionService";
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

export class AdminVagasService {
  private static readonly db = supabase as any;

  static async getStats(): Promise<VagaStats> {
    try {
      const { data, error } = await this.db
        .from("vagas")
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

      rows.forEach((row: any) => {
        switch (row.status) {
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
          default:
            break;
        }

        if (row.urgencia === "urgente" || row.urgencia === "extrema") {
          stats.urgentes += 1;
        }

        if ((row.highlight_type ?? "none") !== "none") {
          stats.destaques += 1;
        }

        if (row.contrato) {
          stats.byContrato[row.contrato] = (stats.byContrato[row.contrato] ?? 0) + 1;
        }
        if (row.modalidade) {
          stats.byModalidade[row.modalidade] = (stats.byModalidade[row.modalidade] ?? 0) + 1;
        }
        if (row.nivel) {
          stats.byNivel[row.nivel] = (stats.byNivel[row.nivel] ?? 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      logger.error("[AdminVagasService] Erro ao buscar estatísticas", error);
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

      let query = this.db
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
        data: (data ?? []).map((row: any) => this.mapRowToAdminVaga(row)),
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

      if (status === "published") {
        updatePayload.published_at = new Date().toISOString();
      }

      if (status === "closed" || status === "removed") {
        updatePayload.closed_at = new Date().toISOString();
      }

      const { error } = await this.db
        .from("vagas")
        .update(updatePayload)
        .eq("id", vagaId);

      if (error) throw error;

      if (status === "published") {
        await this.distributePublishedVaga(vagaId);
      }

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

  static async renovarVaga(vagaId: string, days = 30): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const { error } = await this.db
        .from("vagas")
        .update({
          status: "published",
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", vagaId);

      if (error) throw error;

      await this.distributePublishedVaga(vagaId);

      return true;
    } catch (error) {
      logger.error("[AdminVagasService] Erro ao renovar vaga", error);
      return false;
    }
  }

  static async marcarPreenchida(vagaId: string): Promise<boolean> {
    return this.updateStatus(vagaId, "closed");
  }

  static async toggleDestaque(vagaId: string, destaque: boolean): Promise<boolean> {
    try {
      const highlightType: VagaHighlightType = destaque ? "premium" : "none";

      const { error } = await this.db
        .from("vagas")
        .update({
          highlight_type: highlightType,
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
      const { error } = await this.db
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

      const { data, error } = await this.db
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

      return (data ?? []).map((row: any) => this.mapRowToAdminVaga(row));
    } catch (error) {
      logger.error("[AdminVagasService] Erro ao buscar vagas expirando", error);
      return [];
    }
  }

  private static mapRowToAdminVaga(row: any): AdminVaga {
    const location = row.location
      ? {
          id: row.location.id,
          name: row.location.name,
          type: row.location.type,
        }
      : undefined;

    return {
      id: row.id,
      titulo: row.titulo,
      empresa: row.empresa_nome ?? row.empresa ?? "Empresa não informada",
      descricao: row.descricao,
      locationId: row.location_id,
      location,
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

  private static async distributePublishedVaga(vagaId: string): Promise<void> {
    try {
      await VagaPublicationDistributionService.distributePublishedVaga(vagaId);
    } catch (error) {
      logger.error("[AdminVagasService] Erro ao distribuir vaga publicada", error);
    }
  }
}

export const adminVagasService = AdminVagasService;
