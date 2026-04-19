/**
 * QR IMAGE GENERATOR — Gerador de imagens QR Code
 *
 * SSOT: Serviço central para gerar imagens QR (PNG/SVG)
 * 
 * Usa qrcode library para geração de imagens
 */
import { logger } from '@/shared/utils/logger';
import QRCode from 'qrcode';
import type { QrImageOptions, QrPrintableAsset, QrStyleVariant } from './types';
// ══════════════════════════════════════════════════════════════════════════
// QR IMAGE GENERATOR
// ══════════════════════════════════════════════════════════════════════════

export class QrImageGenerator {
  
  /**
   * Opções padrão por variante de estilo
   */
  private static getDefaultOptions(styleVariant: QrStyleVariant): Partial<QrImageOptions> {
    switch (styleVariant) {
      case 'basic':
        return {
          size: 300,
          margin: 4,
          errorCorrectionLevel: 'M',
          foregroundColor: '#000000',
          backgroundColor: '#FFFFFF',
        };
      
      case 'branded':
        return {
          size: 400,
          margin: 4,
          errorCorrectionLevel: 'H', // High para suportar logo
          foregroundColor: '#000000',
          backgroundColor: '#FFFFFF',
        };
      
      case 'custom':
        return {
          size: 400,
          margin: 4,
          errorCorrectionLevel: 'H',
          // Cores customizadas serão passadas pelo usuário
        };
      
      case 'premium':
        return {
          size: 500,
          margin: 4,
          errorCorrectionLevel: 'H',
          foregroundColor: '#1a1a1a',
          backgroundColor: '#FFFFFF',
        };
      
      default:
        return {
          size: 300,
          margin: 4,
          errorCorrectionLevel: 'M',
        };
    }
  }
  
  /**
   * Gera QR Code como PNG (Data URL)
   */
  static async generatePNG(
    url: string,
    options: Partial<QrImageOptions> = {}
  ): Promise<string> {
    try {
      const opts = {
        width: options.size || 300,
        margin: options.margin || 4,
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        color: {
          dark: options.foregroundColor || '#000000',
          light: options.backgroundColor || '#FFFFFF',
        },
      };
      
      const dataUrl = await QRCode.toDataURL(url, opts);
      return dataUrl;
    } catch (error) {
      logger.error('[QrImageGenerator] Erro ao gerar PNG:', error);
      throw new Error('Erro ao gerar imagem QR Code');
    }
  }
  
  /**
   * Gera QR Code como SVG (string)
   */
  static async generateSVG(
    url: string,
    options: Partial<QrImageOptions> = {}
  ): Promise<string> {
    try {
      const opts = {
        width: options.size || 300,
        margin: options.margin || 4,
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        color: {
          dark: options.foregroundColor || '#000000',
          light: options.backgroundColor || '#FFFFFF',
        },
      };
      
      const svg = await QRCode.toString(url, { ...opts, type: 'svg' });
      return svg;
    } catch (error) {
      logger.error('[QrImageGenerator] Erro ao gerar SVG:', error);
      throw new Error('Erro ao gerar SVG QR Code');
    }
  }
  
  /**
   * Gera QR Code com logo (PNG)
   * 
   * Nota: Implementação básica. Para logos complexos, considerar usar canvas.
   */
  static async generateWithLogo(
    url: string,
    logoUrl: string,
    options: Partial<QrImageOptions> = {}
  ): Promise<string> {
    try {
      // Gerar QR base
      const qrDataUrl = await this.generatePNG(url, {
        ...options,
        errorCorrectionLevel: 'H', // High para suportar logo
      });
      
      // TODO: Implementar composição com logo usando canvas
      // Por enquanto, retorna apenas o QR base
      logger.warn('[QrImageGenerator] Logo não implementado ainda. Retornando QR base.');
      return qrDataUrl;
    } catch (error) {
      logger.error('[QrImageGenerator] Erro ao gerar QR com logo:', error);
      throw new Error('Erro ao gerar QR Code com logo');
    }
  }
  
  /**
   * Gera asset para impressão
   */
  static async generatePrintableAsset(
    qrUrl: string,
    canonicalUrl: string,
    title: string,
    description?: string,
    styleVariant: QrStyleVariant = 'basic'
  ): Promise<QrPrintableAsset> {
    try {
      const defaultOptions = this.getDefaultOptions(styleVariant);
      
      const imageDataUrl = await this.generatePNG(qrUrl, defaultOptions);
      
      return {
        qr_code_url: qrUrl,
        image_data_url: imageDataUrl,
        canonical_url: canonicalUrl,
        title,
        description,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('[QrImageGenerator] Erro ao gerar asset para impressão:', error);
      throw new Error('Erro ao gerar asset para impressão');
    }
  }
  
  /**
   * Download de imagem QR Code
   */
  static downloadImage(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Download de SVG
   */
  static downloadSVG(svgString: string, filename: string): void {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Copia URL para clipboard
   */
  static async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      logger.error('[QrImageGenerator] Erro ao copiar para clipboard:', error);
      throw new Error('Erro ao copiar link');
    }
  }
}
