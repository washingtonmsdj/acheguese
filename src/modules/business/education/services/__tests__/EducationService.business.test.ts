import { describe, it, expect, vi } from 'vitest';
import { EducationService } from '../EducationService';
import type { EducationProfile, EducationProgram, EducationLead } from '../../types';

describe('EducationService - Business Logic', () => {
  describe('Profile Operations', () => {
    const mockProfile: EducationProfile = {
      id: 'test-uuid',
      business_id: 'business-uuid',
      institution_type: 'school',
      niche_key: 'regular_school',
      support_level: 'basic_enabled',
      summary: 'Test School',
      whatsapp_number: '+5588999999999',
      status: 'draft',
      published_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    it('isProfileManageable returns true for active statuses', () => {
      expect(EducationService.isProfileManageable({ ...mockProfile, status: 'published' })).toBe(true);
      expect(EducationService.isProfileManageable({ ...mockProfile, status: 'draft' })).toBe(true);
    });

    it('isProfileManageable returns false for paused profiles', () => {
      expect(EducationService.isProfileManageable({ ...mockProfile, status: 'paused' })).toBe(false);
    });

    it('isProfilePublic returns true only for published status', () => {
      expect(EducationService.isProfilePublic({ ...mockProfile, status: 'published' })).toBe(true);
      expect(EducationService.isProfilePublic({ ...mockProfile, status: 'draft' })).toBe(false);
      expect(EducationService.isProfilePublic({ ...mockProfile, status: 'paused' })).toBe(false);
    });

    it('getProfileStatusLabel returns correct labels', () => {
      expect(EducationService.getProfileStatusLabel('published')).toBe('Publicado');
      expect(EducationService.getProfileStatusLabel('draft')).toBe('Rascunho');
      expect(EducationService.getProfileStatusLabel('paused')).toBe('Pausado');
    });

    it('getProfileStatusColor returns correct colors', () => {
      expect(EducationService.getProfileStatusColor('published')).toBe('green');
      expect(EducationService.getProfileStatusColor('draft')).toBe('gray');
      expect(EducationService.getProfileStatusColor('paused')).toBe('yellow');
    });
  });

  describe('Program Operations', () => {
    const mockProgram: EducationProgram = {
      id: 'prog-uuid',
      education_profile_id: 'profile-uuid',
      name: 'Programa Teste',
      description: 'Descricao',
      age_group: '3-5 anos',
      shift: 'Manha',
      modality: 'Presencial',
      available_slots: 10,
      price_from: 199.99,
      is_active: true,
      display_order: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    it('isProgramAvailable returns true for active programs with slots', () => {
      expect(EducationService.isProgramAvailable(mockProgram)).toBe(true);
    });

    it('isProgramAvailable returns false for inactive programs', () => {
      expect(EducationService.isProgramAvailable({ ...mockProgram, is_active: false })).toBe(false);
    });

    it('isProgramAvailable returns false when no slots available', () => {
      expect(EducationService.isProgramAvailable({ ...mockProgram, available_slots: 0 })).toBe(false);
    });

    it('formatProgramPrice returns formatted price', () => {
      expect(EducationService.formatProgramPrice(199.99)).toBe('R$ 199,99');
      expect(EducationService.formatProgramPrice(0)).toBe('Gratuito');
      expect(EducationService.formatProgramPrice(null)).toBe('Consultar');
    });

    it('sortProgramsByDisplayOrder sorts correctly', () => {
      const programs: EducationProgram[] = [
        { ...mockProgram, id: '1', display_order: 2 },
        { ...mockProgram, id: '2', display_order: 0 },
        { ...mockProgram, id: '3', display_order: 1 },
      ];
      const sorted = EducationService.sortProgramsByDisplayOrder(programs);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });
  });

  describe('Lead Operations', () => {
    const mockLead: EducationLead = {
      id: 'lead-uuid',
      education_profile_id: 'profile-uuid',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+5588999999999',
      child_name: 'Child',
      child_age: 5,
      interest_note: 'Interested',
      source_channel: 'website',
      status: 'new',
      owner_user_id: null,
      first_contact_at: null,
      lost_reason: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    it('getLeadStatusLabel returns correct labels', () => {
      expect(EducationService.getLeadStatusLabel('new')).toBe('Novo');
      expect(EducationService.getLeadStatusLabel('contacted')).toBe('Contactado');
      expect(EducationService.getLeadStatusLabel('visit_scheduled')).toBe('Visita Agendada');
      expect(EducationService.getLeadStatusLabel('proposal_sent')).toBe('Proposta Enviada');
      expect(EducationService.getLeadStatusLabel('enrolled')).toBe('Matriculado');
      expect(EducationService.getLeadStatusLabel('lost')).toBe('Perdido');
    });

    it('getLeadStatusColor returns correct colors', () => {
      expect(EducationService.getLeadStatusColor('new')).toBe('blue');
      expect(EducationService.getLeadStatusColor('enrolled')).toBe('green');
      expect(EducationService.getLeadStatusColor('lost')).toBe('red');
    });

    it('isLeadActive returns true for active statuses', () => {
      expect(EducationService.isLeadActive(mockLead)).toBe(true);
      expect(EducationService.isLeadActive({ ...mockLead, status: 'contacted' })).toBe(true);
      expect(EducationService.isLeadActive({ ...mockLead, status: 'proposal_sent' })).toBe(true);
    });

    it('isLeadActive returns false for terminal statuses', () => {
      expect(EducationService.isLeadActive({ ...mockLead, status: 'enrolled' })).toBe(false);
      expect(EducationService.isLeadActive({ ...mockLead, status: 'lost' })).toBe(false);
    });

    it('canMoveLeadToStatus validates transitions', () => {
      // Can move from new to contacted
      expect(EducationService.canMoveLeadToStatus('new', 'contacted')).toBe(true);
      // Can move from contacted to visit_scheduled
      expect(EducationService.canMoveLeadToStatus('contacted', 'visit_scheduled')).toBe(true);
      // Cannot skip steps
      expect(EducationService.canMoveLeadToStatus('new', 'enrolled')).toBe(false);
      // Can always move to lost
      expect(EducationService.canMoveLeadToStatus('new', 'lost')).toBe(true);
    });

    it('getNextPipelineSteps returns correct next steps', () => {
      const newSteps = EducationService.getNextPipelineSteps('new');
      expect(newSteps).toContain('contacted');
      expect(newSteps).toContain('lost');
      expect(newSteps).not.toContain('enrolled');

      const proposalSteps = EducationService.getNextPipelineSteps('proposal_sent');
      expect(proposalSteps).toContain('enrolled');
      expect(proposalSteps).toContain('lost');
    });

    it('formatLeadContactInfo returns formatted string', () => {
      expect(EducationService.formatLeadContactInfo(mockLead)).toBe('John Doe - john@example.com');
      const noEmail = { ...mockLead, email: null };
      expect(EducationService.formatLeadContactInfo(noEmail)).toBe('John Doe - +5588999999999');
    });

    it('calculateLeadConversionProbability returns percentage', () => {
      expect(EducationService.calculateLeadConversionProbability('new')).toBe(20);
      expect(EducationService.calculateLeadConversionProbability('contacted')).toBe(35);
      expect(EducationService.calculateLeadConversionProbability('proposal_sent')).toBe(75);
      expect(EducationService.calculateLeadConversionProbability('enrolled')).toBe(100);
      expect(EducationService.calculateLeadConversionProbability('lost')).toBe(0);
    });
  });

  describe('Pipeline Summary', () => {
    const leads: EducationLead[] = [
      { id: '1', status: 'new' } as EducationLead,
      { id: '2', status: 'new' } as EducationLead,
      { id: '3', status: 'contacted' } as EducationLead,
      { id: '4', status: 'enrolled' } as EducationLead,
      { id: '5', status: 'lost' } as EducationLead,
    ];

    it('calculatePipelineSummary calculates totals correctly', () => {
      const summary = EducationService.calculatePipelineSummary(leads);
      expect(summary.total).toBe(5);
      expect(summary.byStatus.new).toBe(2);
      expect(summary.byStatus.contacted).toBe(1);
      expect(summary.byStatus.enrolled).toBe(1);
      expect(summary.byStatus.lost).toBe(1);
    });

    it('calculatePipelineSummary calculates conversion rate', () => {
      const summary = EducationService.calculatePipelineSummary(leads);
      expect(summary.conversionRate).toBe(20); // 1 enrolled out of 5 total
    });

    it('calculatePipelineSummary calculates active leads', () => {
      const summary = EducationService.calculatePipelineSummary(leads);
      expect(summary.active).toBe(3); // new + contacted (excluding enrolled and lost)
    });
  });

  describe('Validation', () => {
    it('validateProfilePayload validates required fields', () => {
      const valid = {
        institution_type: 'school',
        niche_key: 'regular_school',
        summary: 'Test',
      };
      expect(EducationService.validateProfilePayload(valid).isValid).toBe(true);

      const invalid = {
        institution_type: '',
        niche_key: 'regular_school',
      };
      expect(EducationService.validateProfilePayload(invalid).isValid).toBe(false);
      expect(EducationService.validateProfilePayload(invalid).errors).toContain('institution_type is required');
    });

    it('validateProgramPayload validates required fields', () => {
      const valid = {
        name: 'Program Name',
        age_group: '3-5',
      };
      expect(EducationService.validateProgramPayload(valid).isValid).toBe(true);

      const invalid = {
        name: '',
      };
      expect(EducationService.validateProgramPayload(invalid).isValid).toBe(false);
    });

    it('validateLeadPayload validates email format', () => {
      const valid = {
        full_name: 'John',
        email: 'john@example.com',
        phone: '+5588999999999',
      };
      expect(EducationService.validateLeadPayload(valid).isValid).toBe(true);

      const invalidEmail = {
        full_name: 'John',
        email: 'invalid-email',
        phone: '+5588999999999',
      };
      expect(EducationService.validateLeadPayload(invalidEmail).isValid).toBe(false);
    });

    it('validateLeadPayload validates phone format', () => {
      const invalidPhone = {
        full_name: 'John',
        email: 'john@example.com',
        phone: '123',
      };
      expect(EducationService.validateLeadPayload(invalidPhone).isValid).toBe(false);
    });
  });

  describe('Event Operations', () => {
    it('isEventUpcoming returns true for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(EducationService.isEventUpcoming(futureDate.toISOString())).toBe(true);
    });

    it('isEventUpcoming returns false for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(EducationService.isEventUpcoming(pastDate.toISOString())).toBe(false);
    });

    it('formatEventDateTime returns formatted string', () => {
      const date = '2026-01-15T14:30:00Z';
      expect(EducationService.formatEventDateTime(date)).toContain('15/01/2026');
    });

    it('validateEventPayload validates required fields', () => {
      const valid = {
        title: 'Event Title',
        starts_at: '2026-01-01T10:00:00Z',
      };
      expect(EducationService.validateEventPayload(valid).isValid).toBe(true);

      const invalid = {
        title: '',
        starts_at: '2026-01-01T10:00:00Z',
      };
      expect(EducationService.validateEventPayload(invalid).isValid).toBe(false);

      const noDate = {
        title: 'Event',
      };
      expect(EducationService.validateEventPayload(noDate).isValid).toBe(false);
    });
  });
});
