import { supabase } from "@/integrations/supabase";
import { invokeNullableSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import { logger } from "@/shared/utils/logger";
import { mediaService } from "@/core/media/services/MediaService";
import type { Json } from "@/integrations/supabase";
import {
  SITE_SETTINGS_STORAGE,
  SITE_SETTING_KEYS,
  SITE_SETTINGS_DEFAULTS,
  type SiteSettingKey,
  validateFileSize,
  validateFileType,
  getFileExtension,
  generateFileName,
} from "../config/siteSettings.config";

export interface SiteSetting {
  key: string;
  value: unknown;
  description?: string;
  updated_at: string;
}

export interface SiteSettings {
  logo_url?: string;
  logo_mobile_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  site_name?: string;
  site_tagline?: string;
}

type SiteSettingsRpcClient = {
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<{
    data: T | null;
    error: { message?: string | null } | null;
  }>;
};

const siteSettingsRpc = supabase as unknown as SiteSettingsRpcClient;
const ADMIN_SITE_SETTINGS_RPC_FUNCTION = "admin-site-settings-rpc";
type AdminSiteSettingsAction = "getAllSettings" | "upsertSetting";

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function assignSiteSetting(settings: SiteSettings, setting: SiteSetting): void {
  switch (setting.key) {
    case SITE_SETTING_KEYS.LOGO_URL:
      settings.logo_url = readOptionalString(setting.value);
      return;
    case SITE_SETTING_KEYS.LOGO_MOBILE_URL:
      settings.logo_mobile_url = readOptionalString(setting.value);
      return;
    case SITE_SETTING_KEYS.FAVICON_URL:
      settings.favicon_url = readOptionalString(setting.value);
      return;
    case SITE_SETTING_KEYS.PRIMARY_COLOR:
      settings.primary_color = readOptionalString(setting.value);
      return;
    case SITE_SETTING_KEYS.SECONDARY_COLOR:
      settings.secondary_color = readOptionalString(setting.value);
      return;
    case SITE_SETTING_KEYS.SITE_NAME:
      settings.site_name = readOptionalString(setting.value);
      return;
    case SITE_SETTING_KEYS.SITE_TAGLINE:
      settings.site_tagline = readOptionalString(setting.value);
      return;
    default:
      return;
  }
}

async function invokeAdminSiteSettingsRpc<T>(
  action: AdminSiteSettingsAction,
  params: Record<string, unknown> = {},
): Promise<T | null> {
  return invokeNullableSupabaseBroker<T, AdminSiteSettingsAction>({
    action,
    functionName: ADMIN_SITE_SETTINGS_RPC_FUNCTION,
    params,
    serviceName: "SiteSettingsService",
  });
}

class SiteSettingsServiceClass {
  async getAllSettings(): Promise<SiteSettings> {
    try {
      const data = await invokeAdminSiteSettingsRpc<SiteSetting[]>("getAllSettings");

      const settings: SiteSettings = {};
      for (const setting of data ?? []) {
        assignSiteSetting(settings, setting);
      }

      return settings;
    } catch (error) {
      logger.error("Erro ao obter configuracoes do site", error as Error);
      throw error;
    }
  }

  async getSetting(key: string): Promise<unknown> {
    try {
      const { data, error } = await siteSettingsRpc.rpc<unknown>("get_site_setting", {
        p_key: key,
      });

      if (error) {
        logger.error(`Erro ao buscar configuracao ${key}`, error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error(`Erro ao obter configuracao ${key}`, error as Error);
      throw error;
    }
  }

  async upsertSetting(
    key: SiteSettingKey,
    value: unknown,
    description?: string,
  ): Promise<SiteSetting> {
    try {
      const data = await invokeAdminSiteSettingsRpc<SiteSetting>("upsertSetting", {
        key,
        value: value as Json,
        description,
      });

      if (!data) {
        throw new Error(`Configuracao ${key} nao retornou payload apos upsert`);
      }

      return data;
    } catch (error) {
      logger.error(`Erro ao upsert configuracao ${key}`, error as Error);
      throw error;
    }
  }

  async uploadFile(
    bucket: string,
    path: string,
    file: File,
  ): Promise<{ url: string; path: string }> {
    try {
      const upload = await mediaService.uploadToBucket(file, {
        bucket: bucket === "banners" ? "banners" : "business-images",
        pathPrefix: path.split("/").slice(0, -1).join("/"),
        preset: "site_asset",
        upsert: true,
      });
      return upload;
    } catch (error) {
      logger.error("Erro ao fazer upload de arquivo", error as Error);
      throw error;
    }
  }

  async uploadLogo(file: File): Promise<string> {
    try {
      if (!validateFileSize(file, SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.LOGO)) {
        throw new Error(
          `Arquivo muito grande. Tamanho maximo: ${SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.LOGO / 1024 / 1024}MB`,
        );
      }

      if (!validateFileType(file, SITE_SETTINGS_STORAGE.ALLOWED_TYPES.LOGO)) {
        throw new Error("Tipo de arquivo nao permitido. Use PNG, JPG ou SVG");
      }

      const extension = getFileExtension(file.name);
      const fileName = generateFileName("logo", extension);
      const path = `${SITE_SETTINGS_STORAGE.PATHS.LOGOS}/${fileName}`;
      const { url } = await this.uploadFile(SITE_SETTINGS_STORAGE.BUCKET, path, file);

      await this.upsertSetting(
        SITE_SETTING_KEYS.LOGO_URL,
        url,
        "URL da logo principal do site",
      );

      return url;
    } catch (error) {
      logger.error("Erro ao fazer upload da logo", error as Error);
      throw error;
    }
  }

  async uploadFavicon(file: File): Promise<string> {
    try {
      if (!validateFileSize(file, SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.FAVICON)) {
        throw new Error(
          `Arquivo muito grande. Tamanho maximo: ${SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.FAVICON / 1024}KB`,
        );
      }

      if (!validateFileType(file, SITE_SETTINGS_STORAGE.ALLOWED_TYPES.FAVICON)) {
        throw new Error("Tipo de arquivo nao permitido. Use PNG ou ICO");
      }

      const extension = getFileExtension(file.name);
      const fileName = generateFileName("favicon", extension);
      const path = `${SITE_SETTINGS_STORAGE.PATHS.FAVICONS}/${fileName}`;
      const { url } = await this.uploadFile(SITE_SETTINGS_STORAGE.BUCKET, path, file);

      await this.upsertSetting(
        SITE_SETTING_KEYS.FAVICON_URL,
        url,
        "URL do favicon",
      );

      return url;
    } catch (error) {
      logger.error("Erro ao fazer upload do favicon", error as Error);
      throw error;
    }
  }

  async updatePrimaryColor(color: string): Promise<void> {
    try {
      await this.upsertSetting(
        SITE_SETTING_KEYS.PRIMARY_COLOR,
        color,
        "Cor primaria da marca",
      );
    } catch (error) {
      logger.error("Erro ao atualizar cor primaria", error as Error);
      throw error;
    }
  }

  async restoreDefaults(): Promise<void> {
    try {
      for (const [key, value] of Object.entries(SITE_SETTINGS_DEFAULTS)) {
        await this.upsertSetting(key as SiteSettingKey, value);
      }
    } catch (error) {
      logger.error("Erro ao restaurar configuracoes padrao", error as Error);
      throw error;
    }
  }
}

export const SiteSettingsService = new SiteSettingsServiceClass();
