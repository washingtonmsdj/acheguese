/**
 * SiteSettingsService - Gerenciamento de Configurações do Site
 * 
 * SSOT: Todas as configurações vêm de siteSettings.config.ts
 * Sem hardcoded values, sem gambiarras
 * 
 * Responsabilidades:
 * - CRUD de configurações via RPC functions
 * - Upload de arquivos para Supabase Storage
 * - Validação de arquivos
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/utils/logger';
import {
  SITE_SETTINGS_STORAGE,
  SITE_SETTING_KEYS,
  SITE_SETTINGS_DEFAULTS,
  type SiteSettingKey,
  validateFileSize,
  validateFileType,
  getFileExtension,
  generateFileName,
} from '../config/siteSettings.config';

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

class SiteSettingsServiceClass {
  /**
   * Obtém todas as configurações do site
   */
  async getAllSettings(): Promise<SiteSettings> {
    try {
      const { data, error } = await supabase.rpc('get_all_site_settings');

      if (error) {
        logger.error('Erro ao buscar configurações do site', error);
        throw error;
      }

      // Converter array de settings para objeto
      const settings: SiteSettings = {};
      if (data) {
        data.forEach((setting: SiteSetting) => {
          settings[setting.key as keyof SiteSettings] = setting.value;
        });
      }

      return settings;
    } catch (error) {
      logger.error('Erro ao obter configurações do site', error as Error);
      throw error;
    }
  }

  /**
   * Obtém uma configuração específica por chave
   */
  async getSetting(key: string): Promise<unknown> {
    try {
      const { data, error } = await supabase.rpc('get_site_setting', { p_key: key });

      if (error) {
        logger.error(`Erro ao buscar configuração ${key}`, error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error(`Erro ao obter configuração ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * Atualiza ou insere uma configuração
   */
  async upsertSetting(key: SiteSettingKey, value: unknown, description?: string): Promise<SiteSetting> {
    try {
      const { data, error } = await supabase.rpc('upsert_site_setting', {
        p_key: key,
        p_value: value,
        p_description: description,
      });

      if (error) {
        logger.error(`Erro ao salvar configuração ${key}`, error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error(`Erro ao upsert configuração ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * Upload de arquivo para o Supabase Storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    try {
      // Upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        logger.error('Erro ao fazer upload do arquivo', uploadError);
        throw uploadError;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);

      return {
        url: urlData.publicUrl,
        path: uploadData.path,
      };
    } catch (error) {
      logger.error('Erro ao fazer upload de arquivo', error as Error);
      throw error;
    }
  }

  /**
   * Upload de logo e atualização da configuração
   */
  async uploadLogo(file: File): Promise<string> {
    try {
      // Validar arquivo
      if (!validateFileSize(file, SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.LOGO)) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.LOGO / 1024 / 1024}MB`);
      }

      if (!validateFileType(file, SITE_SETTINGS_STORAGE.ALLOWED_TYPES.LOGO)) {
        throw new Error('Tipo de arquivo não permitido. Use PNG, JPG ou SVG');
      }

      const extension = getFileExtension(file.name);
      const fileName = generateFileName('logo', extension);
      const path = `${SITE_SETTINGS_STORAGE.PATHS.LOGOS}/${fileName}`;

      const { url } = await this.uploadFile(SITE_SETTINGS_STORAGE.BUCKET, path, file);

      // Atualizar configuração usando SSOT key
      await this.upsertSetting(
        SITE_SETTING_KEYS.LOGO_URL,
        url,
        'URL da logo principal do site'
      );

      return url;
    } catch (error) {
      logger.error('Erro ao fazer upload da logo', error as Error);
      throw error;
    }
  }

  /**
   * Upload de favicon e atualização da configuração
   */
  async uploadFavicon(file: File): Promise<string> {
    try {
      // Validar arquivo
      if (!validateFileSize(file, SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.FAVICON)) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${SITE_SETTINGS_STORAGE.MAX_FILE_SIZE.FAVICON / 1024}KB`);
      }

      if (!validateFileType(file, SITE_SETTINGS_STORAGE.ALLOWED_TYPES.FAVICON)) {
        throw new Error('Tipo de arquivo não permitido. Use PNG ou ICO');
      }

      const extension = getFileExtension(file.name);
      const fileName = generateFileName('favicon', extension);
      const path = `${SITE_SETTINGS_STORAGE.PATHS.FAVICONS}/${fileName}`;

      const { url } = await this.uploadFile(SITE_SETTINGS_STORAGE.BUCKET, path, file);

      // Atualizar configuração usando SSOT key
      await this.upsertSetting(
        SITE_SETTING_KEYS.FAVICON_URL,
        url,
        'URL do favicon'
      );

      return url;
    } catch (error) {
      logger.error('Erro ao fazer upload do favicon', error as Error);
      throw error;
    }
  }

  /**
   * Atualiza a cor primária
   */
  async updatePrimaryColor(color: string): Promise<void> {
    try {
      await this.upsertSetting(
        SITE_SETTING_KEYS.PRIMARY_COLOR,
        color,
        'Cor primária da marca'
      );
    } catch (error) {
      logger.error('Erro ao atualizar cor primária', error as Error);
      throw error;
    }
  }

  /**
   * Restaura configurações padrão
   * SSOT: Valores vêm de SITE_SETTINGS_DEFAULTS
   */
  async restoreDefaults(): Promise<void> {
    try {
      for (const [key, value] of Object.entries(SITE_SETTINGS_DEFAULTS)) {
        await this.upsertSetting(key as SiteSettingKey, value);
      }
    } catch (error) {
      logger.error('Erro ao restaurar configurações padrão', error as Error);
      throw error;
    }
  }
}

export const SiteSettingsService = new SiteSettingsServiceClass();
