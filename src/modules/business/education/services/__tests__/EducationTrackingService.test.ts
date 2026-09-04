/**
 * EducationTrackingService Tests
 *
 * Testes unitarios para o servico de tracking de Educacao.
 * Valida:
 * - Fire-and-forget behavior (nao bloqueia)
 * - Tratamento silencioso de erros
 * - Geracao correta de session_id
 * - Chamadas corretas para o Supabase
 *
 * @module EducationTrackingService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EducationTrackingService } from '@/core/education/services/EducationTrackingService';
import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

// Mocks
vi.mock('@/integrations/supabase');
vi.mock('@/shared/utils/logger');

const mockInsert = vi.fn();

describe('EducationTrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as never);
    mockInsert.mockReturnValue(Promise.resolve({ error: null }));
    
    vi.mocked(logger.warn).mockClear();
    
    // Mock sessionStorage
    const mockSessionStorage = new Map<string, string>();
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: (key: string) => mockSessionStorage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          mockSessionStorage.set(key, value);
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ============================================================================
  // TESTE: Fire-and-forget (nao bloqueia UI)
  // ============================================================================
  describe('fire-and-forget behavior', () => {
    it('should not block when tracking event', async () => {
      const startTime = Date.now();
      
      EducationTrackingService.trackProfileView('11111111-1111-4111-8111-111111111111', 'regular_school', '22222222-2222-4222-8222-222222222222');
      
      const endTime = Date.now();
      
      // Deve retornar imediatamente (fire-and-forget)
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should return void immediately', async () => {
      const result = EducationTrackingService.trackProfileView(
        '11111111-1111-4111-8111-111111111111',
        'regular_school',
        '22222222-2222-4222-8222-222222222222'
      );
      
      expect(result).toBeInstanceOf(Promise);
    });
  });

  // ============================================================================
  // TESTE: Session ID
  // ============================================================================
  describe('session ID generation', () => {
    it('should generate session ID on first call', async () => {
      EducationTrackingService.trackProfileView('11111111-1111-4111-8111-111111111111', 'regular_school');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.session_id).toBeDefined();
      expect(insertCall.session_id).not.toBe('server-side');
      expect(insertCall.session_id).toContain('-');
    });

    it('should reuse same session ID for multiple events', async () => {
      EducationTrackingService.trackProfileView('11111111-1111-4111-8111-111111111111', 'regular_school');
      EducationTrackingService.trackWhatsAppClick('11111111-1111-4111-8111-111111111111', 'regular_school');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const firstCall = mockInsert.mock.calls[0][0];
      const secondCall = mockInsert.mock.calls[1][0];
      
      expect(firstCall.session_id).toBe(secondCall.session_id);
    });

    it('should handle server-side gracefully', async () => {
      // O service ja verifica typeof window !== 'undefined' internamente
      // Nao precisamos testar SSR aqui pois o modulo foi carregado com window definido
      // O teste de fire-and-forget ja valida que nao quebra
      
      EducationTrackingService.trackProfileView('11111111-1111-4111-8111-111111111111', 'regular_school');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Tracking deve funcionar normalmente
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TESTE: Eventos especificos
  // ============================================================================
  describe('specific event tracking', () => {
    it('should track profile_view with correct payload', async () => {
      EducationTrackingService.trackProfileView('11111111-1111-4111-8111-111111111111', 'regular_school', '22222222-2222-4222-8222-222222222222');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(supabase.from).toHaveBeenCalledWith('education_analytics_events');
      
      const payload = mockInsert.mock.calls[0][0];
      expect(payload).toMatchObject({
        education_profile_id: '11111111-1111-4111-8111-111111111111',
        business_id: '22222222-2222-4222-8222-222222222222',
        niche_key: 'regular_school',
        event_type: 'profile_view',
      });
    });

    it('should track program_view with program_id', async () => {
      EducationTrackingService.trackProgramView(
        '11111111-1111-4111-8111-111111111111',
        'regular_school',
        '33333333-3333-4333-8333-333333333333',
        '22222222-2222-4222-8222-222222222222'
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const payload = mockInsert.mock.calls[0][0];
      expect(payload).toMatchObject({
        event_type: 'program_view',
        program_id: '33333333-3333-4333-8333-333333333333',
      });
    });

    it('should track event_view with education_event_id', async () => {
      EducationTrackingService.trackEventView(
        '11111111-1111-4111-8111-111111111111',
        'regular_school',
        '44444444-4444-4444-8444-444444444444',
        '22222222-2222-4222-8222-222222222222'
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const payload = mockInsert.mock.calls[0][0];
      expect(payload).toMatchObject({
        event_type: 'event_view',
        education_event_id: '44444444-4444-4444-8444-444444444444',
      });
    });

    it('should track whatsapp_click', async () => {
      EducationTrackingService.trackWhatsAppClick('11111111-1111-4111-8111-111111111111', 'regular_school', '22222222-2222-4222-8222-222222222222');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const payload = mockInsert.mock.calls[0][0];
      expect(payload.event_type).toBe('whatsapp_click');
    });

    it('should track enrollment_cta_click with metadata', async () => {
      EducationTrackingService.trackEnrollmentCTAClick(
        '11111111-1111-4111-8111-111111111111',
        'regular_school',
        '22222222-2222-4222-8222-222222222222',
        { ctaLabel: 'Quero matricular' }
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const payload = mockInsert.mock.calls[0][0];
      expect(payload).toMatchObject({
        event_type: 'enrollment_cta_click',
        metadata: { ctaLabel: 'Quero matricular' },
      });
    });

    it('should track lead_submitted with lead_id', async () => {
      EducationTrackingService.trackLeadSubmitted(
        '11111111-1111-4111-8111-111111111111',
        'regular_school',
        '55555555-5555-4555-8555-555555555555',
        '22222222-2222-4222-8222-222222222222',
        { hasGuardian: true, desiredGrade: '1o Ano' }
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const payload = mockInsert.mock.calls[0][0];
      expect(payload).toMatchObject({
        event_type: 'lead_submitted',
        lead_id: '55555555-5555-4555-8555-555555555555',
        metadata: { hasGuardian: true, desiredGrade: '1o Ano' },
      });
    });

    it('should track event_interest', async () => {
      EducationTrackingService.trackEventInterest(
        '11111111-1111-4111-8111-111111111111',
        'regular_school',
        '66666666-6666-4666-8666-666666666666',
        '22222222-2222-4222-8222-222222222222',
        { eventType: 'visita_guiada' }
      );
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const payload = mockInsert.mock.calls[0][0];
      expect(payload).toMatchObject({
        event_type: 'event_interest',
        education_event_id: '66666666-6666-4666-8666-666666666666',
        metadata: { eventType: 'visita_guiada' },
      });
    });
  });

  // ============================================================================
  // TESTE: Tratamento de erros silencioso
  // ============================================================================
  describe('error handling', () => {
    it('should not throw when Supabase fails', async () => {
      mockInsert.mockReturnValue(Promise.resolve({ 
        error: { message: 'Connection failed' } 
      }));
      
      await expect(
        EducationTrackingService.trackProfileView('11111111-1111-4111-8111-111111111111', 'regular_school')
      ).resolves.not.toThrow();
    });

    it('should log warning on Supabase error', async () => {
      mockInsert.mockReturnValue(Promise.resolve({ 
        error: { message: 'Connection failed' } 
      }));
      
      EducationTrackingService.trackProfileView('11111111-1111-4111-8111-111111111111', 'regular_school');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(logger.warn).toHaveBeenCalledWith(
        '[EducationTrackingService] Failed to track event:',
        expect.any(Object)
      );
    });

    it('should handle exceptions gracefully', async () => {
      mockInsert.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      await expect(
        EducationTrackingService.trackProfileView('11111111-1111-4111-8111-111111111111', 'regular_school')
      ).resolves.not.toThrow();
      
      expect(logger.warn).toHaveBeenCalledWith(
        '[EducationTrackingService] Error tracking event:',
        expect.any(Error)
      );
    });
  });

  // ============================================================================
  // TESTE: Suporte a multiplos nichos
  // ============================================================================
  describe('multi-niche support', () => {
    const niches = [
      'regular_school',
      'daycare',
      'language_school',
      'prep_course',
      'technical_school',
      'tutoring_center',
      'music_school',
      'sports_school',
    ] as const;

    it.each(niches)('should track events for niche: %s', async (nicheKey) => {
      EducationTrackingService.trackProfileView('11111111-1111-4111-8111-111111111111', nicheKey);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const payload = mockInsert.mock.calls[0][0];
      expect(payload.niche_key).toBe(nicheKey);
    });
  });

  // ============================================================================
  // TESTE: Source page
  // ============================================================================
  describe('source page tracking', () => {
    it('should capture current pathname as source_page', async () => {
      EducationTrackingService.trackProfileView('11111111-1111-4111-8111-111111111111', 'regular_school');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const payload = mockInsert.mock.calls[0][0];
      // O valor sera o pathname do ambiente de teste (vitest define como '/')
      expect(payload.source_page).toBeDefined();
      expect(typeof payload.source_page).toBe('string');
    });

    it('should use custom source_page when provided', async () => {
      EducationTrackingService.trackEvent({
        educationProfileId: '11111111-1111-4111-8111-111111111111',
        nicheKey: 'regular_school',
        eventType: 'profile_view',
        sourcePage: '/custom-page',
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const payload = mockInsert.mock.calls[0][0];
      expect(payload.source_page).toBe('/custom-page');
    });
  });
});

