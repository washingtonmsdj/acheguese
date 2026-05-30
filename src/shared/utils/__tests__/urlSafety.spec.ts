import { describe, expect, it } from 'vitest';
import { isSafeImageUrl, isSafeLinkUrl, resolveSafeImageUrl } from '../urlSafety';

describe('urlSafety', () => {
  it('allows safe link protocols from the security SSOT', () => {
    expect(isSafeLinkUrl('https://example.com')).toBe(true);
    expect(isSafeLinkUrl('mailto:contato@example.com')).toBe(true);
    expect(isSafeLinkUrl('tel:5571999999999')).toBe(true);
  });

  it('blocks executable and opaque link protocols', () => {
    expect(isSafeLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeLinkUrl('data:text/html,<h1>xss</h1>')).toBe(false);
    expect(isSafeLinkUrl('file:///etc/passwd')).toBe(false);
  });

  it('only allows relative links when explicitly requested', () => {
    expect(isSafeLinkUrl('/empresas/ba/salvador')).toBe(false);
    expect(isSafeLinkUrl('/empresas/ba/salvador', { allowInternal: true })).toBe(true);
    expect(isSafeLinkUrl('//evil.example.com', { allowInternal: true })).toBe(false);
  });

  it('allows raster image URLs and blocks active image formats', () => {
    expect(isSafeImageUrl('https://cdn.example.com/photo.webp')).toBe(true);
    expect(isSafeImageUrl('/assets/photo.png')).toBe(true);
    expect(isSafeImageUrl('https://cdn.example.com/vector.svg')).toBe(false);
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
  });

  it('restricts image data URLs to safe raster MIME types', () => {
    const pngPixel = 'data:image/png;base64,iVBORw0KGgo=';

    expect(resolveSafeImageUrl(pngPixel)).toBe(pngPixel);
    expect(isSafeImageUrl('data:image/svg+xml;base64,PHN2Zy8+')).toBe(false);
    expect(isSafeImageUrl('data:text/html;base64,PGgxPkJvb208L2gxPg==')).toBe(false);
  });
});
