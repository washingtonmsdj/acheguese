import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";

/**
 * @deprecated
 * AdminCrudService is deprecated. Use domain-specific admin services instead:
 * - AdminClassifiedsService for classifieds
 * - AdminEventsService for events
 * - AdminCouponsService for coupons
 * - AdminMessagingService for messaging
 * 
 * This generic CRUD service violates SSOT principles by accessing database directly.
 * Migration to domain services is in progress.
 */

class AdminCrudError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "AdminCrudError";
  }
}

/** @deprecated Use domain-specific admin services instead */
export class AdminCrudService {
  /**
   * Lista todos os registros de uma tabela
   */
  async list(
    table: string,
    options?: {
      select?: string;
      orderBy?: string;
      ascending?: boolean;
    },
  ): Promise<any[]> {
    try {
      const select = options?.select || "*";
      const orderBy = options?.orderBy ?? "created_at";
      const ascending = options?.ascending ?? false;
      const query = (supabase as any).from(table).select(select);

      // Tentar ordenar por created_at se a coluna existir
      try {
        const { data, error } = await query.order(orderBy, { ascending });

        if (error) {
          // Se erro for de coluna não existente, buscar sem ordenação
          if (
            error.code === "42703" ||
            error.message?.includes("does not exist")
          ) {
            logger.info(
              `Table '${table}' does not have '${orderBy}' column, fetching without ordering`,
            );
            const { data: unorderedData, error: unorderedError } = await (
              supabase as any
            )
              .from(table)
              .select(select);

            if (unorderedError) throw unorderedError;
            return unorderedData || [];
          }
          throw error;
        }

        return data || [];
      } catch (orderError) {
        const error = orderError as { code?: string; message?: string };
        // Se falhar ao ordenar, buscar sem ordenação
        if (
          error.code === "42703" ||
          error.message?.includes("does not exist")
        ) {
          logger.info(
            `Table '${table}' does not have '${orderBy}' column, fetching without ordering`,
          );
          const { data: unorderedData, error: unorderedError } = await (
            supabase as any
          )
            .from(table)
            .select(select);

          if (unorderedError) throw unorderedError;
          return unorderedData || [];
        }
        throw orderError;
      }
    } catch (error) {
      const err = error as { code?: string; message?: string };
      // Se a tabela não existe, retornar array vazio
      if (
        err.code === "PGRST205" ||
        err.message?.includes("Could not find the table")
      ) {
        logger.info(
          `Table '${table}' does not exist in database, returning empty array`,
        );
        return [];
      }
      trackError(error as Error, {
        component: "AdminCrudService",
        action: "list",
      });
      return [];
    }
  }

  /**
   * Obtém um registro específico por ID
   */
  async get(table: string, id: string): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        trackError(error, { component: "AdminCrudService", action: "get" });
        throw new AdminCrudError(
          `Failed to get record from ${table}`,
          "GET_FAILED",
          404,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AdminCrudError) throw error;
      trackError(error as Error, {
        component: "AdminCrudService",
        action: "get",
      });
      throw new AdminCrudError(
        "Unexpected error getting record",
        "UNEXPECTED_ERROR",
        500,
      );
    }
  }

  /**
   * Cria um novo registro
   */
  async create(table: string, data: Record<string, unknown>): Promise<any> {
    try {
      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        trackError(error, { component: "AdminCrudService", action: "create" });
        throw new AdminCrudError(
          `Failed to create record in ${table}`,
          "CREATE_FAILED",
          400,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof AdminCrudError) throw error;
      trackError(error as Error, {
        component: "AdminCrudService",
        action: "create",
      });
      throw new AdminCrudError(
        "Unexpected error creating record",
        "UNEXPECTED_ERROR",
        500,
      );
    }
  }

  /**
   * Atualiza um registro existente
   */
  async update(
    table: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<any> {
    try {
      // Primeiro fazer o update sem select
      const { error: updateError } = await (supabase as any)
        .from(table)
        .update(data)
        .eq("id", id);

      if (updateError) {
        trackError(updateError, {
          component: "AdminCrudService",
          action: "update",
        });
        throw new AdminCrudError(
          `Failed to update record in ${table}`,
          "UPDATE_FAILED",
          400,
        );
      }

      // Depois buscar o registro atualizado
      const { data: result, error: selectError } = await (supabase as any)
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      if (selectError) {
        trackError(selectError, {
          component: "AdminCrudService",
          action: "update",
        });
        throw new AdminCrudError(
          `Failed to fetch updated record from ${table}`,
          "FETCH_FAILED",
          404,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof AdminCrudError) throw error;
      trackError(error as Error, {
        component: "AdminCrudService",
        action: "update",
      });
      throw new AdminCrudError(
        "Unexpected error updating record",
        "UNEXPECTED_ERROR",
        500,
      );
    }
  }

  /**
   * Deleta um registro
   */
  async delete(table: string, id: string): Promise<{ success: boolean }> {
    try {
      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .eq("id", id);

      if (error) {
        trackError(error, { component: "AdminCrudService", action: "delete" });
        throw new AdminCrudError(
          `Failed to delete record from ${table}`,
          "DELETE_FAILED",
          400,
        );
      }

      return { success: true };
    } catch (error) {
      if (error instanceof AdminCrudError) throw error;
      trackError(error as Error, {
        component: "AdminCrudService",
        action: "delete",
      });
      throw new AdminCrudError(
        "Unexpected error deleting record",
        "UNEXPECTED_ERROR",
        500,
      );
    }
  }
}

export const adminCrudService = new AdminCrudService();
