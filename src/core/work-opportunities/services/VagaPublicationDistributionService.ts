import { supabase } from "@/integrations/supabase";
import { postService } from "@/core/posts/services";
import { jobPublicRoutes } from "@/core/work-opportunities/routes/jobPublicRoutes";
import { logger } from "@/shared/utils/logger";

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null }>;

interface QueryBuilder<TRow> {
  select(columns?: string): QueryBuilder<TRow>;
  update(values: Partial<TRow>): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  maybeSingle(): QueryResult<TRow | null>;
  then<TResult1 = { data: TRow[]; error: { code?: string; message?: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: TRow[]; error: { code?: string; message?: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface JobsDistributionDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

interface VagaDistributionRow {
  id: string;
  slug: string | null;
  titulo: string;
  empresa_nome: string | null;
  empresa: string | null;
  categoria: string | null;
  contrato: string | null;
  location_id: string;
  owner_profile_id: string;
  status: string;
  feed_post_id: string | null;
  location: {
    geographic_path: string | null;
  } | null;
}

export class VagaPublicationDistributionService {
  private static readonly db = supabase as unknown as JobsDistributionDbClient;

  private static resolvePublicUrl(vaga: VagaDistributionRow): string | null {
    if (!vaga.slug || !vaga.location?.geographic_path) return null;

    try {
      return jobPublicRoutes.detailFromGeographicPath(vaga.location.geographic_path, vaga.slug);
    } catch (error) {
      logger.warn("[VagaPublicationDistributionService] URL publica de vaga invalida", {
        vagaId: vaga.id,
        error,
      });
      return null;
    }
  }

  private static async getVaga(vagaId: string): Promise<VagaDistributionRow | null> {
    const { data, error } = await this.db
      .from("vagas")
      .select(
        `
        id,
        slug,
        titulo,
        empresa_nome,
        empresa,
        categoria,
        contrato,
        location_id,
        owner_profile_id,
        status,
        feed_post_id,
        location:locations(
          geographic_path
        )
      `,
      )
      .eq("id", vagaId)
      .maybeSingle();

    if (error) {
      logger.error("[VagaPublicationDistributionService] Erro ao carregar vaga", error);
      throw error;
    }

    return (data as VagaDistributionRow | null) ?? null;
  }

  static async distributePublishedVaga(vagaId: string): Promise<void> {
    const vaga = await this.getVaga(vagaId);
    if (!vaga || vaga.status !== "published") return;

    const publicUrl = this.resolvePublicUrl(vaga);
    if (!publicUrl) return;

    const companyName = vaga.empresa_nome ?? vaga.empresa ?? "Empresa";
    const category = vaga.categoria || "outro";

    if (!vaga.feed_post_id) {
      const createdPost = await postService.createPost({
        author_profile_id: vaga.owner_profile_id,
        content: `Vaga aberta: ${vaga.titulo} - ${companyName}`,
        type: "favor",
        location_id: vaga.location_id,
        reach: "city",
        tags: [
          "format:opportunity",
          "intent:vaga",
          `category:${category}`,
          `contract:${vaga.contrato ?? "nao-informado"}`,
        ],
        content_intent: "vaga",
        display_format: "opportunity_card",
        distribution_channels: ["oportunidades", "empresas", "para_voce", "todos"],
        content_payload: {
          schema_version: "territorial-content.v3",
          intent: "vaga",
          structural_type: "favor",
          display_format: "opportunity_card",
          vaga: {
            id: vaga.id,
            slug: vaga.slug,
            title: vaga.titulo,
            company: companyName,
            category,
            location_id: vaga.location_id,
            target_url: publicUrl,
          },
        },
      });

      const { error: feedLinkError } = await this.db
        .from("vagas")
        .update({ feed_post_id: createdPost.id })
        .eq("id", vaga.id);

      if (feedLinkError) {
        throw feedLinkError;
      }
    }
  }
}

export const vagaPublicationDistributionService = VagaPublicationDistributionService;
