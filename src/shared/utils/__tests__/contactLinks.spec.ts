import { describe, expect, it } from 'vitest';

import {
  buildFacebookUrl,
  buildInstagramUrl,
  buildLinkedInUrl,
  buildMailtoShareUrl,
  buildMailtoUrl,
  buildTelUrl,
  buildWebsiteUrl,
  buildWhatsAppUrl,
} from '@/shared/utils/contactLinks';

describe('contactLinks', () => {
  it('normaliza links de contato permitidos', () => {
    expect(buildTelUrl('(71) 99999-0000')).toBe('tel:71999990000');
    expect(buildWhatsAppUrl('(71) 99999-0000')).toBe('https://wa.me/5571999990000');
    expect(buildMailtoUrl('contato@example.com')).toBe('mailto:contato%40example.com');
  });

  it('monta mailto de compartilhamento sem interpolacao manual', () => {
    expect(buildMailtoShareUrl({ subject: 'Evento local', body: 'Confira o evento' })).toBe(
      'mailto:?subject=Evento+local&body=Confira+o+evento',
    );
  });

  it('rejeita email invalido', () => {
    expect(buildMailtoUrl('javascript:alert(1)')).toBeNull();
  });

  it('normaliza websites para HTTPS e bloqueia protocolos perigosos', () => {
    expect(buildWebsiteUrl('example.com/path')).toBe('https://example.com/path');
    expect(buildWebsiteUrl('http://example.com')).toBe('https://example.com/');
    expect(buildWebsiteUrl('javascript:alert(1)')).toBeNull();
    expect(buildWebsiteUrl('//example.com')).toBeNull();
  });

  it('normaliza redes sociais para dominios esperados', () => {
    expect(buildInstagramUrl('@achegue.se')).toBe('https://instagram.com/achegue.se');
    expect(buildFacebookUrl('https://www.facebook.com/acheguese')).toBe(
      'https://www.facebook.com/acheguese',
    );
    expect(buildLinkedInUrl('acheguese')).toBe('https://linkedin.com/in/acheguese');
  });

  it('bloqueia URL social em dominio falso', () => {
    expect(buildInstagramUrl('https://evil.example/acheguese')).toBeNull();
    expect(buildFacebookUrl('javascript:alert(1)')).toBeNull();
    expect(buildLinkedInUrl('//linkedin.com.evil.example/profile')).toBeNull();
  });
});
