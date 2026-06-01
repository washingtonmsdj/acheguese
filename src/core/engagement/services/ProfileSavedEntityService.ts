import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface ProfileSavedEntityConfig {
  tableName: string;
  entityIdColumn: string;
  profileIdColumn?: string;
  logLabel: string;
}

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_]*$/;

function assertSafeIdentifier(value: string, label: string): string {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`${label} invalido para entidade salva.`);
  }
  return value;
}

function normalizeConfig(config: ProfileSavedEntityConfig): Required<ProfileSavedEntityConfig> {
  return {
    tableName: assertSafeIdentifier(config.tableName, "tabela"),
    entityIdColumn: assertSafeIdentifier(config.entityIdColumn, "coluna da entidade"),
    profileIdColumn: assertSafeIdentifier(config.profileIdColumn ?? "profile_id", "coluna do perfil"),
    logLabel: config.logLabel,
  };
}

export class ProfileSavedEntityService {
  static async getSavedEntityIds(
    config: ProfileSavedEntityConfig,
    profileId: string,
  ): Promise<string[]> {
    const normalized = normalizeConfig(config);

    try {
      const { data, error } = await supabase
        .from(normalized.tableName as never)
        .select(normalized.entityIdColumn)
        .eq(normalized.profileIdColumn, profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data ?? []) as unknown as Array<Record<string, unknown>>)
        .map((row) => row[normalized.entityIdColumn])
        .filter((value): value is string => typeof value === "string" && value.length > 0);
    } catch (error) {
      logger.error(`ProfileSavedEntityService.getSavedEntityIds:${normalized.logLabel}`, error);
      return [];
    }
  }

  static async isSaved(
    config: ProfileSavedEntityConfig,
    entityId: string,
    profileId: string,
  ): Promise<boolean> {
    const normalized = normalizeConfig(config);

    try {
      const { data, error } = await supabase
        .from(normalized.tableName as never)
        .select(normalized.entityIdColumn)
        .eq(normalized.entityIdColumn, entityId)
        .eq(normalized.profileIdColumn, profileId)
        .maybeSingle();

      if (error) throw error;
      return Boolean(data);
    } catch (error) {
      logger.error(`ProfileSavedEntityService.isSaved:${normalized.logLabel}`, error);
      return false;
    }
  }

  static async save(
    config: ProfileSavedEntityConfig,
    entityId: string,
    profileId: string,
  ): Promise<void> {
    const normalized = normalizeConfig(config);
    const { error } = await supabase
      .from(normalized.tableName as never)
      .upsert({
        [normalized.entityIdColumn]: entityId,
        [normalized.profileIdColumn]: profileId,
      } as never, {
        onConflict: `${normalized.entityIdColumn},${normalized.profileIdColumn}`,
        ignoreDuplicates: true,
      });

    if (error) {
      logger.error(`ProfileSavedEntityService.save:${normalized.logLabel}`, error);
      throw new Error("Nao foi possivel salvar o item.");
    }
  }

  static async remove(
    config: ProfileSavedEntityConfig,
    entityId: string,
    profileId: string,
  ): Promise<void> {
    const normalized = normalizeConfig(config);
    const { error } = await supabase
      .from(normalized.tableName as never)
      .delete()
      .eq(normalized.entityIdColumn, entityId)
      .eq(normalized.profileIdColumn, profileId);

    if (error) {
      logger.error(`ProfileSavedEntityService.remove:${normalized.logLabel}`, error);
      throw new Error("Nao foi possivel remover o item salvo.");
    }
  }

  static async clearProfileSavedEntities(
    config: ProfileSavedEntityConfig,
    profileId: string,
  ): Promise<void> {
    const normalized = normalizeConfig(config);
    const { error } = await supabase
      .from(normalized.tableName as never)
      .delete()
      .eq(normalized.profileIdColumn, profileId);

    if (error) {
      logger.error(`ProfileSavedEntityService.clearProfileSavedEntities:${normalized.logLabel}`, error);
      throw new Error("Nao foi possivel limpar os itens salvos.");
    }
  }
}
