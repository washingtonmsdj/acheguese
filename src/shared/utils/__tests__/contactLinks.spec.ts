import { describe, expect, it } from 'vitest';

import {
  buildMailtoShareUrl,
  buildMailtoUrl,
  buildTelUrl,
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
});
