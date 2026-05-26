import QRCode from 'qrcode';
import { logger } from '@/shared/utils/logger';
import { QrStyleVariant, type QrImageOptions, type QrPrintableAsset } from './types';

export class QrImageGenerator {
  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Nao foi possivel carregar a imagem do logo'));
      image.src = src;
    });
  }

  private static drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  private static getDefaultOptions(styleVariant: QrStyleVariant): Partial<QrImageOptions> {
    switch (styleVariant) {
      case QrStyleVariant.BASIC:
        return {
          size: 300,
          margin: 4,
          errorCorrectionLevel: 'M',
          foregroundColor: '#000000',
          backgroundColor: '#FFFFFF',
        };

      case QrStyleVariant.BRANDED:
        return {
          size: 400,
          margin: 4,
          errorCorrectionLevel: 'H',
          foregroundColor: '#000000',
          backgroundColor: '#FFFFFF',
        };

      case QrStyleVariant.CUSTOM:
        return {
          size: 400,
          margin: 4,
          errorCorrectionLevel: 'H',
        };

      case QrStyleVariant.PREMIUM:
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

  static async generatePNG(url: string, options: Partial<QrImageOptions> = {}): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: options.size || 300,
        margin: options.margin || 4,
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        color: {
          dark: options.foregroundColor || '#000000',
          light: options.backgroundColor || '#FFFFFF',
        },
      });
    } catch (error) {
      logger.error('[QrImageGenerator] Erro ao gerar PNG:', error);
      throw new Error('Erro ao gerar imagem QR Code');
    }
  }

  static async generateSVG(url: string, options: Partial<QrImageOptions> = {}): Promise<string> {
    try {
      return await QRCode.toString(url, {
        width: options.size || 300,
        margin: options.margin || 4,
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        color: {
          dark: options.foregroundColor || '#000000',
          light: options.backgroundColor || '#FFFFFF',
        },
        type: 'svg',
      });
    } catch (error) {
      logger.error('[QrImageGenerator] Erro ao gerar SVG:', error);
      throw new Error('Erro ao gerar SVG QR Code');
    }
  }

  static async generateWithLogo(
    url: string,
    logoUrl: string,
    options: Partial<QrImageOptions> = {},
  ): Promise<string> {
    try {
      if (typeof document === 'undefined') {
        throw new Error('Canvas indisponivel para compor QR Code com logo');
      }

      const size = options.size || 400;
      const qrDataUrl = await this.generatePNG(url, {
        ...options,
        size,
        errorCorrectionLevel: 'H',
      });

      const [qrImage, logoImage] = await Promise.all([
        this.loadImage(qrDataUrl),
        this.loadImage(logoUrl),
      ]);

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas 2D indisponivel para compor QR Code');
      }

      context.drawImage(qrImage, 0, 0, size, size);

      const logoSize = Math.round(size * 0.22);
      const padding = Math.round(size * 0.035);
      const backgroundSize = logoSize + padding * 2;
      const backgroundX = Math.round((size - backgroundSize) / 2);
      const backgroundY = backgroundX;
      const logoX = backgroundX + padding;
      const logoY = backgroundY + padding;
      const radius = Math.round(backgroundSize * 0.18);

      context.fillStyle = options.backgroundColor || '#FFFFFF';
      this.drawRoundedRect(context, backgroundX, backgroundY, backgroundSize, backgroundSize, radius);
      context.fill();

      const scale = Math.min(logoSize / logoImage.width, logoSize / logoImage.height);
      const drawWidth = Math.round(logoImage.width * scale);
      const drawHeight = Math.round(logoImage.height * scale);
      const drawX = logoX + Math.round((logoSize - drawWidth) / 2);
      const drawY = logoY + Math.round((logoSize - drawHeight) / 2);

      context.drawImage(logoImage, drawX, drawY, drawWidth, drawHeight);

      return canvas.toDataURL('image/png');
    } catch (error) {
      logger.error('[QrImageGenerator] Erro ao gerar QR com logo:', error);
      throw new Error('Erro ao gerar QR Code com logo');
    }
  }

  static async generatePrintableAsset(
    qrUrl: string,
    canonicalUrl: string,
    title: string,
    description?: string,
    styleVariant: QrStyleVariant = QrStyleVariant.BASIC,
  ): Promise<QrPrintableAsset> {
    try {
      const imageDataUrl = await this.generatePNG(qrUrl, this.getDefaultOptions(styleVariant));

      return {
        qr_code_url: qrUrl,
        image_data_url: imageDataUrl,
        canonical_url: canonicalUrl,
        title,
        description,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('[QrImageGenerator] Erro ao gerar asset para impressao:', error);
      throw new Error('Erro ao gerar asset para impressao');
    }
  }

  static downloadImage(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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

  static async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      logger.error('[QrImageGenerator] Erro ao copiar para clipboard:', error);
      throw new Error('Erro ao copiar link');
    }
  }
}
