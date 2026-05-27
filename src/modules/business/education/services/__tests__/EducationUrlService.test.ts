import { describe, it, expect } from 'vitest';
import { EducationUrlService } from '../EducationUrlService';

describe('EducationUrlService', () => {
  describe('buildListingUrl', () => {
    it('builds URL with state and city', () => {
      const url = EducationUrlService.buildListingUrl({ state: 'ba', city: 'salvador' });
      expect(url).toBe('/educacao/ba/salvador');
    });

    it('builds URL with state, city and district', () => {
      const url = EducationUrlService.buildListingUrl({
        state: 'ba',
        city: 'salvador',
        district: 'barra',
      });
      expect(url).toBe('/educacao/ba/salvador/barra');
    });
  });

  describe('buildDetailUrl', () => {
    it('builds detail URL', () => {
      const url = EducationUrlService.buildDetailUrl({
        state: 'ba',
        city: 'salvador',
        district: 'barra',
        slug: 'escola-exemplo',
      });
      expect(url).toBe('/educacao/ba/salvador/barra/escola-exemplo');
    });
  });

  describe('buildLaunchUrl', () => {
    it('returns launch territory URL', () => {
      const url = EducationUrlService.buildLaunchUrl();
      expect(url).toBe('/educacao/ba/salvador');
    });
  });

  describe('buildAdminDashboardUrl', () => {
    it('builds admin dashboard URL', () => {
      const url = EducationUrlService.buildAdminDashboardUrl('business-123');
      expect(url).toBe('/central/empresas/business-123/educacao');
    });
  });

  describe('buildAdminSetupUrl', () => {
    it('builds admin setup URL', () => {
      const url = EducationUrlService.buildAdminSetupUrl('business-123');
      expect(url).toBe('/central/empresas/business-123/educacao/setup');
    });
  });

  describe('buildAdminLeadsUrl', () => {
    it('builds admin leads URL', () => {
      const url = EducationUrlService.buildAdminLeadsUrl('business-123');
      expect(url).toBe('/central/empresas/business-123/educacao/leads');
    });
  });

  describe('buildAdminProgramsUrl', () => {
    it('builds admin programs URL', () => {
      const url = EducationUrlService.buildAdminProgramsUrl('business-123');
      expect(url).toBe('/central/empresas/business-123/educacao/programas');
    });
  });

  describe('buildAdminEventsUrl', () => {
    it('builds admin events URL', () => {
      const url = EducationUrlService.buildAdminEventsUrl('business-123');
      expect(url).toBe('/central/empresas/business-123/educacao/eventos');
    });
  });

  describe('buildAdminAnalyticsUrl', () => {
    it('builds admin analytics URL', () => {
      const url = EducationUrlService.buildAdminAnalyticsUrl('business-123');
      expect(url).toBe('/central/empresas/business-123/educacao/analytics');
    });
  });

  describe('buildAdminPlansUrl', () => {
    it('builds admin plans URL', () => {
      const url = EducationUrlService.buildAdminPlansUrl('business-123');
      expect(url).toBe('/central/empresas/business-123/educacao/planos');
    });
  });

  describe('buildWhatsAppLink', () => {
    it('builds WhatsApp link with default message', () => {
      const url = EducationUrlService.buildWhatsAppLink('+5588999999999');
      expect(url).toContain('https://wa.me/5588999999999');
      expect(url).toContain('Ola!');
    });

    it('builds WhatsApp link with custom message', () => {
      const url = EducationUrlService.buildWhatsAppLink('+5588999999999', {
        message: 'Teste',
      });
      expect(url).toContain('Teste');
    });

    it('builds WhatsApp link with institution name', () => {
      const url = EducationUrlService.buildWhatsAppLink('+5588999999999', {
        institutionName: 'Escola ABC',
      });
      expect(url).toContain('Escola%20ABC');
    });

    it('cleans non-digit characters from phone', () => {
      const url = EducationUrlService.buildWhatsAppLink('(88) 99999-9999');
      expect(url).toContain('wa.me/88999999999');
    });
  });
});
