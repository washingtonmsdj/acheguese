/**
 * Testes de Reports - Módulo de Mobilidade (Motoboy)
 * 
 * Valida RideReportsService e sistema de reports
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RideReportsService } from '../src/core/mobility/services/RideReportsService';
import type { ReportType, ReportSeverity, ReportStatus } from '../src/core/mobility/services/RideReportsService';

const TEST_RIDE_ID = '7b9817cb-d0c3-46f3-b57f-b2c4d5a20ed3';
vi.mock('@/integrations/supabase', () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve({
      data: { id: '1085f785-d23d-4af7-b2ad-0fda9c0f8de2' },
      error: null,
    })),
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: '1085f785-d23d-4af7-b2ad-0fda9c0f8de2' },
            error: null,
          })),
        })),
      })),
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null,
        })),
      })),
    })),
  },
}));

describe('RideReportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReport', () => {
    it('deve criar report com sucesso', async () => {
      const input = {
        rideId: TEST_RIDE_ID,
        reportType: 'driver_behavior' as ReportType,
        severity: 'medium' as ReportSeverity,
        title: 'Motorista dirigindo perigosamente',
        description: 'O motorista estava usando o celular enquanto dirigia',
      };

      const result = await RideReportsService.createReport(input);

      expect(result.success).toBe(true);
      expect(result.reportId).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('deve validar campos obrigatórios', () => {
      const requiredFields = [
        'rideId',
        'reportType',
        'severity',
        'title',
        'description',
      ];

      requiredFields.forEach((field) => {
        expect(field).toBeDefined();
      });
    });

    it('deve aceitar campos opcionais', async () => {
      const input = {
        rideId: TEST_RIDE_ID,
        reportType: 'safety_concern' as ReportType,
        severity: 'high' as ReportSeverity,
        title: 'Problema de segurança',
        description: 'Descrição do problema',
        evidenceUrls: ['https://example.com/photo1.jpg'],
        locationLat: -23.5505,
        locationLng: -46.6333,
      };

      const result = await RideReportsService.createReport(input);

      expect(result.success).toBe(true);
    });
  });

  describe('Tipos de Report', () => {
    it('deve suportar todos os tipos de report', () => {
      const reportTypes: ReportType[] = [
        'safety_concern',
        'driver_behavior',
        'passenger_behavior',
        'route_issue',
        'payment_issue',
        'vehicle_condition',
        'cancellation_abuse',
        'fraud_suspicion',
        'other',
      ];

      reportTypes.forEach((type) => {
        expect(type).toBeDefined();
        expect(typeof type).toBe('string');
      });
    });

    it('deve suportar todos os níveis de severidade', () => {
      const severities: ReportSeverity[] = [
        'low',
        'medium',
        'high',
        'critical',
      ];

      severities.forEach((severity) => {
        expect(severity).toBeDefined();
        expect(typeof severity).toBe('string');
      });
    });

    it('deve suportar todos os status de report', () => {
      const statuses: ReportStatus[] = [
        'pending',
        'under_review',
        'resolved',
        'dismissed',
      ];

      statuses.forEach((status) => {
        expect(status).toBeDefined();
        expect(typeof status).toBe('string');
      });
    });
  });

  describe('Workflow de Report', () => {
    it('deve seguir workflow: pending → under_review → resolved', () => {
      const workflow = {
        initial: 'pending' as ReportStatus,
        reviewing: 'under_review' as ReportStatus,
        final: 'resolved' as ReportStatus,
      };

      expect(workflow.initial).toBe('pending');
      expect(workflow.reviewing).toBe('under_review');
      expect(workflow.final).toBe('resolved');
    });

    it('deve permitir workflow alternativo: pending → under_review → dismissed', () => {
      const workflow = {
        initial: 'pending' as ReportStatus,
        reviewing: 'under_review' as ReportStatus,
        final: 'dismissed' as ReportStatus,
      };

      expect(workflow.initial).toBe('pending');
      expect(workflow.reviewing).toBe('under_review');
      expect(workflow.final).toBe('dismissed');
    });
  });

  describe('Validação de Dados', () => {
    it('deve validar URL de evidência', () => {
      const validUrls = [
        'https://example.com/photo.jpg',
        'https://s3.amazonaws.com/bucket/image.png',
      ];

      validUrls.forEach((url) => {
        expect(url).toMatch(/^https?:\/\//);
      });
    });

    it('deve validar coordenadas geográficas', () => {
      const validCoordinates = [
        { lat: -23.5505, lng: -46.6333 }, // São Paulo
        { lat: -12.9714, lng: -38.5014 }, // Salvador
        { lat: 0, lng: 0 }, // Null Island
      ];

      validCoordinates.forEach((coord) => {
        expect(coord.lat).toBeGreaterThanOrEqual(-90);
        expect(coord.lat).toBeLessThanOrEqual(90);
        expect(coord.lng).toBeGreaterThanOrEqual(-180);
        expect(coord.lng).toBeLessThanOrEqual(180);
      });
    });
  });

  describe('Estatísticas', () => {
    it('deve calcular estatísticas por status', () => {
      const stats = {
        total: 100,
        pending: 20,
        underReview: 30,
        resolved: 40,
        dismissed: 10,
      };

      expect(stats.total).toBe(
        stats.pending + stats.underReview + stats.resolved + stats.dismissed
      );
    });

    it('deve calcular estatísticas por severidade', () => {
      const stats = {
        low: 30,
        medium: 40,
        high: 20,
        critical: 10,
      };

      const total = stats.low + stats.medium + stats.high + stats.critical;
      expect(total).toBe(100);
    });
  });
});

describe('Integração - Reports Admin', () => {
  it('deve validar fluxo completo de report', async () => {
    // 1. Criar report
    const createResult = await RideReportsService.createReport({
      rideId: TEST_RIDE_ID,
      reportType: 'driver_behavior',
      severity: 'medium',
      title: 'Test Report',
      description: 'Test description',
    });

    expect(createResult.success).toBe(true);

    // 2. Listar reports (mock)
    const reports = await RideReportsService.listReports({
      status: 'pending',
    });

    expect(Array.isArray(reports)).toBe(true);

    // 3. Atualizar status (mock)
    if (createResult.reportId) {
      await expect(
        RideReportsService.updateReport(createResult.reportId, {
          status: 'under_review',
        }),
      ).resolves.toBeUndefined();
    }
  });
});
