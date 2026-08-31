import { logger } from "@/shared/utils/logger";
import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase/types.generated";

export interface LocationRecord {
  id: string;
  name: string;
  type: "country" | "state" | "city" | "district" | "neighborhood";
  parent_id?: string;
  slug: string;
  created_at: string;
}

type LocationRow = Database["public"]["Tables"]["locations"]["Row"];

export type PublicRoutingLocationRecord = Pick<
  LocationRow,
  "id" | "type" | "status" | "geographic_path" | "metadata"
>;

type LocationWithChildren = LocationRecord & { children?: LocationWithChildren[] };

const COMPLETE_READ_PAGE_SIZE = 1000;
const PUBLIC_ROUTING_LOCATION_SELECT =
  "id,type,status,geographic_path,metadata" as const;

export class LocationsReadService {
  static async getAll(): Promise<LocationRecord[]> {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name");

    if (error) {
      logger.error("LocationsReadService.getAll", error);
      throw error;
    }

    return (data as LocationRecord[]) || [];
  }

  /**
   * Leitura exaustiva para tarefas offline/build que precisam do catálogo inteiro.
   *
   * Não usar em superfícies interativas: o projeto limita respostas PostgREST a
   * 1000 linhas por requisição e o catálogo territorial é muito maior que isso.
   * A paginação avança pelo número efetivamente retornado e usa count exato para
   * continuar correta mesmo se o limite remoto for reduzido no futuro.
   */
  static async getAllComplete(): Promise<LocationRecord[]> {
    const rows: LocationRecord[] = [];
    let offset = 0;
    let expectedTotal: number | null = null;

    while (expectedTotal === null || offset < expectedTotal) {
      const { data, error, count } = await supabase
        .from("locations")
        .select("*", { count: "exact" })
        .order("name")
        .order("id")
        .range(offset, offset + COMPLETE_READ_PAGE_SIZE - 1);

      if (error) {
        logger.error("LocationsReadService.getAllComplete", error, {
          offset,
          expectedTotal,
        });
        throw error;
      }

      if (count !== null) expectedTotal = count;
      const page = (data as LocationRecord[]) || [];

      if (page.length === 0) {
        if (expectedTotal !== null && offset < expectedTotal) {
          throw new Error(
            `LocationsReadService.getAllComplete stopped at ${offset}/${expectedTotal} rows.`,
          );
        }
        break;
      }

      rows.push(...page);
      offset += page.length;
    }

    return rows;
  }

  /**
   * Projeção exaustiva mínima para geração offline de rotas públicas/sitemap.
   *
   * Mantém a paginação fail-closed do catálogo completo, mas evita transferir
   * colunas pesadas e irrelevantes para SEO (por exemplo boundary e atributos
   * administrativos) em milhares de registros.
   */
  static async getAllCompleteForPublicRouting(): Promise<
    PublicRoutingLocationRecord[]
  > {
    const rows: PublicRoutingLocationRecord[] = [];
    let offset = 0;
    let expectedTotal: number | null = null;

    while (expectedTotal === null || offset < expectedTotal) {
      const { data, error, count } = await supabase
        .from("locations")
        .select(PUBLIC_ROUTING_LOCATION_SELECT, { count: "exact" })
        .in("type", ["city", "district"])
        .eq("status", "active")
        .order("geographic_path")
        .order("id")
        .range(offset, offset + COMPLETE_READ_PAGE_SIZE - 1);

      if (error) {
        logger.error(
          "LocationsReadService.getAllCompleteForPublicRouting",
          error,
          { offset, expectedTotal },
        );
        throw error;
      }

      if (count !== null) expectedTotal = count;
      const page = (data as PublicRoutingLocationRecord[]) || [];

      if (page.length === 0) {
        if (expectedTotal !== null && offset < expectedTotal) {
          throw new Error(
            `LocationsReadService.getAllCompleteForPublicRouting stopped at ${offset}/${expectedTotal} rows.`,
          );
        }
        break;
      }

      rows.push(...page);
      offset += page.length;
    }

    return rows;
  }

  static async getById(id: string): Promise<LocationRecord | null> {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logger.error("LocationsReadService.getById", error);
      throw error;
    }

    return (data as LocationRecord) || null;
  }

  static async getByType(type: LocationRecord["type"]): Promise<LocationRecord[]> {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("type", type)
      .order("name");

    if (error) {
      logger.error("LocationsReadService.getByType", error);
      throw error;
    }

    return (data as LocationRecord[]) || [];
  }

  static async getTree(): Promise<LocationWithChildren[]> {
    const locations = await this.getAll();
    const tree: LocationWithChildren[] = [];
    const map = new Map<string, LocationWithChildren>();

    for (const location of locations) {
      map.set(location.id, { ...location, children: [] });
    }

    for (const location of locations) {
      const node = map.get(location.id);
      if (!node) continue;

      if (location.parent_id) {
        const parent = map.get(location.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    }

    return tree;
  }
}
