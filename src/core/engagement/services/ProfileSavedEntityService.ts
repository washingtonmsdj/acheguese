import { profileService } from "@/core/profiles/services/ProfileService";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export type ProfileSavedEntityKind =
  | "classified"
  | "event"
  | "tourist_point"
  | "vaga";

interface ProfileSavedEntityConfig {
  tableName:
    | "classified_favorites"
    | "event_favorites"
    | "tourist_point_saved_items"
    | "vaga_saved_items";
  entityIdColumn:
    | "classified_id"
    | "event_id"
    | "tourist_point_id"
    | "vaga_id";
}

const SAVED_ENTITY_CONFIGS = {
  classified: {
    tableName: "classified_favorites",
    entityIdColumn: "classified_id",
  },
  event: {
    tableName: "event_favorites",
    entityIdColumn: "event_id",
  },
  tourist_point: {
    tableName: "tourist_point_saved_items",
    entityIdColumn: "tourist_point_id",
  },
  vaga: {
    tableName: "vaga_saved_items",
    entityIdColumn: "vaga_id",
  },
} as const satisfies Record<ProfileSavedEntityKind, ProfileSavedEntityConfig>;

function configFor(kind: ProfileSavedEntityKind): ProfileSavedEntityConfig {
  return SAVED_ENTITY_CONFIGS[kind];
}

async function activeProfileId(): Promise<string> {
  const profile = await profileService.getRequiredActiveProfile();
  return profile.id;
}

export class ProfileSavedEntityService {
  static async getSavedEntityIds(
    kind: ProfileSavedEntityKind,
  ): Promise<string[]> {
    const config = configFor(kind);

    try {
      const profileId = await activeProfileId();
      const { data, error } = await supabase
        .from(config.tableName as never)
        .select(config.entityIdColumn)
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data ?? []) as unknown as Array<Record<string, unknown>>)
        .map((row) => row[config.entityIdColumn])
        .filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        );
    } catch (error) {
      logger.error(`ProfileSavedEntityService.getSavedEntityIds:${kind}`, error);
      return [];
    }
  }

  static async isSaved(
    kind: ProfileSavedEntityKind,
    entityId: string,
  ): Promise<boolean> {
    const config = configFor(kind);

    try {
      const profileId = await activeProfileId();
      const { data, error } = await supabase
        .from(config.tableName as never)
        .select(config.entityIdColumn)
        .eq(config.entityIdColumn, entityId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (error) throw error;
      return Boolean(data);
    } catch (error) {
      logger.error(`ProfileSavedEntityService.isSaved:${kind}`, error);
      return false;
    }
  }

  static async save(
    kind: ProfileSavedEntityKind,
    entityId: string,
  ): Promise<void> {
    const config = configFor(kind);
    const profileId = await activeProfileId();
    const { error } = await supabase.from(config.tableName as never).upsert(
      {
        [config.entityIdColumn]: entityId,
        profile_id: profileId,
      } as never,
      {
        onConflict: `${config.entityIdColumn},profile_id`,
        ignoreDuplicates: true,
      },
    );

    if (error) {
      logger.error(`ProfileSavedEntityService.save:${kind}`, error);
      throw new Error("Nao foi possivel salvar o item.");
    }
  }

  static async remove(
    kind: ProfileSavedEntityKind,
    entityId: string,
  ): Promise<void> {
    const config = configFor(kind);
    const profileId = await activeProfileId();
    const { error } = await supabase
      .from(config.tableName as never)
      .delete()
      .eq(config.entityIdColumn, entityId)
      .eq("profile_id", profileId);

    if (error) {
      logger.error(`ProfileSavedEntityService.remove:${kind}`, error);
      throw new Error("Nao foi possivel remover o item salvo.");
    }
  }

  static async clearProfileSavedEntities(
    kind: ProfileSavedEntityKind,
  ): Promise<void> {
    const config = configFor(kind);
    const profileId = await activeProfileId();
    const { error } = await supabase
      .from(config.tableName as never)
      .delete()
      .eq("profile_id", profileId);

    if (error) {
      logger.error(`ProfileSavedEntityService.clear:${kind}`, error);
      throw new Error("Nao foi possivel limpar os itens salvos.");
    }
  }
}
