/**
 * SiteSettingsService - Gerenciamento de Configurações do Site
 * 
 * Serviço para gerenciar configurações globais do site como:
 * - Logo principal
 * - Favicon
 * - Cores da marca
 * - Nome e tagline do site
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/utils/logger';

export interface SiteSetting {
  key: string;
  value: any;
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
  async getSetting(key: string): Promise<any> {
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
  async upsertSetting(key: string, value: any, description?: string): Promise<SiteSetting> {
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
      const timestamp = Date.now();
      const fileName = `logo-${timestamp}.${file.name.split('.').pop()}`;
      const path = `branding/${fileName}`;

      const { url } = await this.uploadFile('public-assets', path, file);

      // Atualizar configuração
      await this.upsertSetting('logo_url', url, 'URL da logo principal do site');

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
      const timestamp = Date.now();
      const fileName = `favicon-${timestamp}.${file.name.split('.').pop()}`;
      const path = `branding/${fileName}`;

      const { url } = await this.uploadFile('public-assets', path, file);

      // Atualizar configuração
      await this.upsertSetting('favicon_url', url, 'URL do favicon');

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
      await this.upsertSetting('primary_color', color, 'Cor primária da marca');
    } catch (error) {
      logger.error('Erro ao atualizar cor primária', error as Error);
      throw error;
    }
  }

  /**
   * Restaura configurações padrão
   */
  async restoreDefaults(): Promise<void> {
    try {
      const defaults = {
        logo_url: '',
        logo_mobile_url: '',
        favicon_url: '',
        primary_color: '#3b82f6',
        secondary_color: '#8b5cf6',
        site_name: 'Achegue-se',
        site_tagline: 'Super App de Bairro',
      };

      for (const [key, value] of Object.entries(defaults)) {
        await this.upsertSetting(key, value);
      }
    } catch (error) {
      logger.error('Erro ao restaurar configurações padrão', error as Error);
      throw error;
    }
  }
}

export const SiteSettingsService = new SiteSettingsServiceClass();
